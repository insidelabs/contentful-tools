import createDebugger, { Debugger } from 'debug';
import { ContentfulClientApi } from 'contentful';
import { Content } from './types/Content';
import { Resolved } from './types/Resolved';
import { Sync } from './types/Sync';
import { Util } from './types/Util';
import { isAssetLink, isAssetLinkArray, isEntryLink, isEntryLinkArray } from './guards';

export namespace ContentfulStore {
    export interface Config<BaseLocale extends string, ExtraLocales extends string> {
        client: ContentfulClientApi;
        spaceId: string;
        locales: [BaseLocale, ...ExtraLocales[]];
        handleError?: ErrorHandler;
        autoSync?: {
            minInterval: number;
        };
    }

    export type ErrorHandler = (error: Error) => void;
}

namespace Internals {
    export interface AutoSync {
        readonly enabled: boolean;
        readonly minInterval: number;
        requestCount: number;
        timeout: NodeJS.Timeout | null;
    }

    export type Assets = LocaleMapped<AssetMap>;
    export type Entries = LocaleMapped<EntryMap>;

    type AssetMap = Map<string, Content.Asset>;
    type EntryMap = Map<string, Resolved.Entry>;

    type LocaleMapped<T> = { [locale in string]: T };
}

export class ContentfulStore<BaseLocale extends string, ExtraLocales extends string> {
    private readonly client: ContentfulClientApi;
    private readonly locales: [BaseLocale, ...ExtraLocales[]];

    private readonly debug: Debugger;
    private readonly handleError: ContentfulStore.ErrorHandler;

    private readonly autoSync: Internals.AutoSync;

    private readonly assets: Internals.Assets = {};
    private readonly entries: Internals.Entries = {};

    private syncToken?: string;

    constructor({
        client,
        spaceId,
        locales,
        handleError,
        autoSync,
    }: ContentfulStore.Config<BaseLocale, ExtraLocales>) {
        this.client = client;
        this.locales = locales;

        this.debug = createDebugger(`@contentful-tools/store:${spaceId}`);

        this.handleError =
            handleError ||
            ((error: Error) => {
                console.error(`Error in ContentfulStore (${spaceId})`, error);
            });

        this.autoSync = {
            enabled: autoSync != null,
            minInterval: autoSync ? autoSync.minInterval : 0,
            requestCount: 0,
            timeout: null,
        };

        for (const locale of locales) {
            this.assets[locale] = new Map();
            this.entries[locale] = new Map();
        }
    }

    private get baseLocale(): BaseLocale {
        return this.locales[0];
    }

    public getAsset(
        id: string,
        locale: BaseLocale | ExtraLocales = this.baseLocale,
    ): Content.Asset | null {
        this.onContentAccess();
        return this.assets[locale].get(id) || null;
    }

    public getAssets(locale: BaseLocale | ExtraLocales = this.baseLocale): Content.Asset[] {
        this.onContentAccess();
        return Array.from(this.assets[locale].values());
    }

    public getEntry<E extends Content.Entry = Content.Entry>(
        id: string,
        locale: BaseLocale | ExtraLocales = this.baseLocale,
        contentTypeId?: Util.GetContentTypeId<E>,
    ): Resolved.Entry<E> | null {
        this.onContentAccess();
        const entry = this.entries[locale].get(id);
        return entry && (entry.sys.contentType.sys.id === contentTypeId || !contentTypeId)
            ? (entry as Resolved.Entry<E>)
            : null;
    }

    public getEntryByFieldValue<
        E extends Content.Entry,
        F extends keyof E['fields'] = keyof E['fields'],
        V extends E['fields'][F] = E['fields'][F],
    >(
        field: F,
        value: V,
        locale: BaseLocale | ExtraLocales = this.baseLocale,
        contentTypeId?: Util.GetContentTypeId<E>,
    ): Resolved.Entry<E> | null {
        this.onContentAccess();
        const entries = this.getEntries<E>(locale, contentTypeId);
        const entry = entries.find(e => (e.fields as any)[field] === value);
        return entry || null;
    }

    public getEntries<E extends Content.Entry = Content.Entry>(
        locale: BaseLocale | ExtraLocales = this.baseLocale,
        contentTypeId?: Util.GetContentTypeId<E>,
    ): Resolved.Entry<E>[] {
        this.onContentAccess();
        const entries = Array.from(this.entries[locale].values());
        return (contentTypeId
            ? entries.filter(entry => entry.sys.contentType.sys.id === contentTypeId)
            : entries) as Resolved.Entry<E>[];
    }

    public async sync(): Promise<void> {
        const query: Sync.Query = { resolveLinks: false };

        if (this.syncToken) query.nextSyncToken = this.syncToken;
        else query.initial = true;

        const result = await this.client.sync(query);

        const {
            assets,
            entries,
            deletedAssets,
            deletedEntries,
            nextSyncToken,
        } = result.toPlainObject() as Sync.Result<BaseLocale, ExtraLocales>;

        this.debug(`Synced ${assets.length} assets`);
        this.debug(`Synced ${entries.length} entries`);
        this.debug(`Deleted ${deletedAssets.length} assets`);
        this.debug(`Deleted ${deletedEntries.length} entries`);

        this.syncToken = nextSyncToken;

        for (const locale of this.locales) {
            for (const asset of assets) {
                this.assets[locale].set(asset.sys.id, this.processSyncAsset(asset, locale));
            }

            for (const entry of entries) {
                this.entries[locale].set(entry.sys.id, this.processSyncEntry(entry, locale));
            }

            for (const asset of deletedAssets) this.assets[locale].delete(asset.sys.id);
            for (const entry of deletedEntries) this.entries[locale].delete(entry.sys.id);
        }
    }

    private processSyncAsset(
        asset: Sync.Asset<BaseLocale, ExtraLocales>,
        locale: BaseLocale | ExtraLocales,
    ): Content.Asset {
        return {
            sys: asset.sys,
            fields: this.processFieldsForLocale(locale, asset.fields),
        };
    }

    private processSyncEntry(
        entry: Sync.Entry<BaseLocale, ExtraLocales>,
        locale: BaseLocale | ExtraLocales,
    ): Resolved.Entry {
        return this.createResolvedEntry(locale, {
            sys: entry.sys,
            fields: this.processFieldsForLocale(locale, entry.fields),
        });
    }

    private processFieldsForLocale<F extends { [key: string]: any }>(
        locale: BaseLocale | ExtraLocales,
        fields: Sync.Fields<F, BaseLocale, ExtraLocales>,
    ): F {
        return Object.assign(
            {},
            ...Object.keys(fields).map(key => ({
                [key]: fields[key][locale] || fields[key][this.baseLocale],
            })),
        );
    }

    private createResolvedEntry<E extends Content.Entry>(
        locale: BaseLocale | ExtraLocales,
        entry: E,
    ): Resolved.Entry<E> {
        const fields: { [key: string]: unknown } = {};

        for (const [key, value] of Object.entries(entry.fields)) {
            const descriptor: PropertyDescriptor = {
                enumerable: true,
                configurable: false,
            };

            if (isAssetLink(value)) {
                descriptor.get = () => this.assets[locale].get(value.sys.id);
            } else if (isAssetLinkArray(value)) {
                descriptor.get = () => value.map(link => this.assets[locale].get(link.sys.id));
            } else if (isEntryLink(value)) {
                descriptor.get = () => this.entries[locale].get(value.sys.id);
            } else if (isEntryLinkArray(value)) {
                descriptor.get = () => value.map(link => this.entries[locale].get(link.sys.id));
            } else {
                descriptor.value = value;
                descriptor.writable = false;
            }

            Object.defineProperty(fields, key, descriptor);
        }

        return {
            sys: entry.sys,
            fields: fields,
        } as Resolved.Entry<E>;
    }

    private onContentAccess() {
        if (!this.syncToken) {
            this.handleError(Error('Content accessed without initial sync'));
        }

        if (!this.autoSync.enabled) return;

        this.autoSync.requestCount++;
        if (this.autoSync.requestCount > 1) return;

        this.sync().catch(this.handleError);

        this.autoSync.timeout = setTimeout(() => {
            if (this.autoSync.requestCount > 1) this.sync().catch(this.handleError);
            this.autoSync.requestCount = 0;
        }, this.autoSync.minInterval);
    }
}
