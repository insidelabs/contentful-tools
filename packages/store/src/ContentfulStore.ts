import createDebugger, { Debugger } from 'debug';
import { ContentfulClientApi } from 'contentful';
import { LocalizedFieldsOf, SyncAsset, SyncEntry, SyncQuery, SyncResult } from './types/Sync';
import { isAssetLink, isAssetLinkArray, isEntryLink, isEntryLinkArray } from './guards';
import { Asset } from './types/Asset';
import { Entry } from './types/Entry';

export interface ContentfulStoreConfig<BaseLocale extends string, ExtraLocales extends string> {
    client: ContentfulClientApi;
    spaceId: string;
    locales: [BaseLocale, ...ExtraLocales[]];
    typenameMap: { [K in string]: string };
    handleError?: (error: Error) => void;
    autoSync?: {
        minInterval: number;
    };
}

export class ContentfulStore<BaseLocale extends string, ExtraLocales extends string> {
    private readonly client: ContentfulClientApi;
    private readonly locales: [BaseLocale, ...ExtraLocales[]];
    private readonly typenameMap: { [K in string]: string };

    private readonly debug: Debugger;
    private readonly handleError: (error: Error) => void;

    private readonly autoSync: {
        readonly enabled: boolean;
        readonly minInterval: number;
        requestCount: number;
        timeout: NodeJS.Timeout | null;
    };

    private readonly assets: { [locale in string]: Map<string, Asset> } = {};
    private readonly entries: { [locale in string]: Map<string, Entry> } = {};

    private syncToken?: string;

    constructor({
        client,
        spaceId,
        locales,
        typenameMap,
        handleError,
        autoSync,
    }: ContentfulStoreConfig<BaseLocale, ExtraLocales>) {
        this.client = client;
        this.locales = locales;
        this.typenameMap = typenameMap;

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

    public getAsset(id: string, locale: BaseLocale | ExtraLocales = this.baseLocale): Asset | null {
        this.onContentAccess();
        return this.assets[locale].get(id) || null;
    }

    public getAssets(locale: BaseLocale | ExtraLocales = this.baseLocale): Asset[] {
        this.onContentAccess();
        return Array.from(this.assets[locale].values());
    }

    public getEntry<E extends Entry>(
        id: string,
        locale: BaseLocale | ExtraLocales = this.baseLocale,
        typename?: E['__typename'],
    ): E | null {
        this.onContentAccess();
        const entry = this.entries[locale].get(id);
        return entry && (entry.__typename === typename || !typename) ? (entry as E) : null;
    }

    public getEntryByFieldValue<
        E extends Entry,
        F extends keyof E = keyof E,
        V extends E[F] = E[F]
    >(
        field: F,
        value: V,
        locale: BaseLocale | ExtraLocales = this.baseLocale,
        typename?: E['__typename'],
    ): E | null {
        this.onContentAccess();
        const entries = this.getEntries<E>(locale, typename);
        const entry = entries.find(entry => entry[field] === value);
        return entry || null;
    }

    public getEntries<E extends Entry>(
        locale: BaseLocale | ExtraLocales = this.baseLocale,
        typename?: E['__typename'],
    ): E[] {
        this.onContentAccess();
        const entries = Array.from(this.entries[locale].values());
        return (typename ? entries.filter(entry => entry.__typename === typename) : entries) as E[];
    }

    public async sync(): Promise<void> {
        const query: SyncQuery = { resolveLinks: false };

        if (this.syncToken) query.nextSyncToken = this.syncToken;
        else query.initial = true;

        const result = await this.client.sync(query);

        const {
            assets,
            entries,
            deletedAssets,
            deletedEntries,
            nextSyncToken,
        } = result.toPlainObject() as SyncResult<BaseLocale, ExtraLocales>;

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
        asset: SyncAsset<BaseLocale, ExtraLocales>,
        locale: BaseLocale | ExtraLocales,
    ): Asset {
        return {
            __typename: 'Asset',
            __id: asset.sys.id,
            ...this.processFieldsForLocale(locale, asset.fields),
        };
    }

    private processSyncEntry(
        entry: SyncEntry<BaseLocale, ExtraLocales>,
        locale: BaseLocale | ExtraLocales,
    ): Entry {
        const contentTypeId = entry.sys.contentType.sys.id;

        const resolved: Entry = {
            __typename: this.typenameMap[contentTypeId] || contentTypeId,
            __id: entry.sys.id,
        };

        const fields = this.processFieldsForLocale(locale, entry.fields);

        for (const [key, value] of Object.entries(fields)) {
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

            Object.defineProperty(resolved, key, descriptor);
        }

        return resolved as Entry;
    }

    private processFieldsForLocale<F extends { [key: string]: any }>(
        locale: BaseLocale | ExtraLocales,
        fields: LocalizedFieldsOf<F, BaseLocale, ExtraLocales>,
    ): F {
        return Object.assign(
            {},
            ...Object.keys(fields).map(key => ({
                [key]: fields[key][locale] || fields[key][this.baseLocale],
            })),
        );
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
