import createDebugger, { Debugger } from 'debug';
import { ContentfulClientApi, createClient } from 'contentful';
import { Content } from '../types/Content';
import { Resolved } from '../types/Resolved';
import { Sync } from '../types/Sync';
import { Util } from '../types/Util';
import { isAssetLink, isAssetLinkArray, isEntryLink, isEntryLinkArray } from './guards';

namespace ContentfulStore {
    export type Assets = LocaleMapped<AssetMap>;
    export type Entries = LocaleMapped<EntryMap>;

    type AssetMap = Map<string, Content.Asset>;
    type EntryMap = Map<string, Resolved.Entry>;

    type LocaleMapped<T> = { [locale in string]: T };
}

export class ContentfulStore<
    ContentTypeId extends string,
    BaseLocale extends string,
    ExtraLocales extends string
> {
    private readonly spaceId: string;
    private readonly client: ContentfulClientApi;

    private readonly baseLocale: BaseLocale;
    private readonly locales: (BaseLocale | ExtraLocales)[];

    private readonly debug: Debugger;
    private readonly handleSyncError: (error: Error) => void;

    private readonly syncTimeout: number;

    private syncToken: string = '';
    private syncRequestCount: number;

    private readonly assets: ContentfulStore.Assets = {};
    private readonly entries: ContentfulStore.Entries = {};

    private defaultSyncErrorHandler = (error: Error) => {
        console.error(`Error syncing ContentfulStore (${this.spaceId})`);
        console.error(error);
    };

    constructor({
        accessToken,
        spaceId,
        baseLocale,
        extraLocales,
        syncTimeout = 5 * 60 * 1000,
        handleSyncError,
    }: {
        accessToken: string;
        spaceId: string;
        baseLocale: BaseLocale;
        extraLocales: ExtraLocales[];
        syncTimeout?: number;
        handleSyncError?: () => void;
    }) {
        this.spaceId = spaceId;
        this.client = createClient({ accessToken, space: spaceId });

        this.baseLocale = baseLocale;
        this.locales = [baseLocale, ...extraLocales];

        this.syncTimeout = syncTimeout;
        this.syncRequestCount = 0;

        this.debug = createDebugger(`contentful-store:${spaceId}`);
        this.handleSyncError = handleSyncError || this.defaultSyncErrorHandler;
    }

    public getAsset(id: string, locale = this.baseLocale): Content.Asset | null {
        this.triggerSync();
        return this.assets[locale].get(id) || null;
    }

    public getAssets(locale = this.baseLocale): Content.Asset[] {
        this.triggerSync();
        return Array.from(this.assets[locale].values());
    }

    public getEntry<E extends Content.Entry = Content.Entry>(
        id: string,
        contentTypeId?: Util.GetContentTypeId<E>,
        locale = this.baseLocale,
    ): Resolved.Entry<E> | null {
        this.triggerSync();
        const entry = this.entries[locale].get(id);
        return entry && (entry.sys.contentType.sys.id === contentTypeId || !contentTypeId)
            ? (entry as Resolved.Entry<E>)
            : null;
    }

    public getEntries<E extends Content.Entry = Content.Entry>(
        contentTypeId?: Util.GetContentTypeId<E>,
        locale = this.baseLocale,
    ): Resolved.Entry<E>[] {
        this.triggerSync();
        const entries = Array.from(this.entries[locale].values());
        return (contentTypeId
            ? entries.filter(entry => entry.sys.contentType.sys.id === contentTypeId)
            : entries) as Resolved.Entry<E>[];
    }

    public async sync(): Promise<void> {
        return this.syncToken ? this.reSync() : this.initialSync();
    }

    private triggerSync() {
        this.syncRequestCount++;
        if (this.syncRequestCount > 1) return;

        this.sync().catch(this.handleSyncError);

        setTimeout(() => {
            if (this.syncRequestCount > 1) this.sync().catch(this.handleSyncError);
            this.syncRequestCount = 0;
        }, this.syncTimeout);
    }

    private async initialSync(): Promise<void> {
        const query: Sync.Query = {
            initial: true,
            resolveLinks: false,
        };

        const result = (await this.client.sync(query)).toPlainObject();
        const { assets, entries, nextSyncToken } = result as Sync.Result<BaseLocale, ExtraLocales>;

        this.debug('Synced with Contentful');
        this.debug(`Assets: +${assets.length}`);
        this.debug(`Entries: +${entries.length}`);

        this.syncToken = nextSyncToken;

        for (const locale of this.locales) {
            this.assets[locale] = new Map(
                assets.map(asset => [asset.sys.id, this.processSyncAsset(asset, locale)]),
            );

            this.entries[locale] = new Map(
                entries.map(entry => [entry.sys.id, this.processSyncEntry(entry, locale)]),
            );
        }
    }

    private async reSync(): Promise<void> {
        const query: Sync.Query = {
            nextSyncToken: this.syncToken,
            resolveLinks: false,
        };

        const result = (await this.client.sync(query)).toPlainObject();
        const {
            assets,
            entries,
            deletedAssets,
            deletedEntries,
            nextSyncToken,
        } = result as Sync.Result<BaseLocale, ExtraLocales>;

        this.debug('Synced with Contentful');
        this.debug(`Assets: +${assets.length} −${deletedAssets.length}`);
        this.debug(`Entries: +${entries.length} −${deletedEntries.length}`);

        this.syncToken = nextSyncToken;

        for (const locale of this.locales) {
            for (const asset of assets) {
                this.assets[locale].set(asset.sys.id, this.processSyncAsset(asset, locale));
            }

            for (const entry of entries) {
                this.entries[locale].set(entry.sys.id, this.processSyncEntry(entry, locale));
            }

            for (const asset of deletedAssets) {
                this.assets[locale].delete(asset.sys.id);
            }

            for (const entry of deletedEntries) {
                this.entries[locale].delete(entry.sys.id);
            }
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
}
