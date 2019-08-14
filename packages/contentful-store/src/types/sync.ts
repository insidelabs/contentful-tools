import { Asset, Entry } from './content';

export interface SyncResult<BaseLocale extends string, ExtraLocales extends string> {
    assets: SyncAsset<BaseLocale, ExtraLocales>[];
    entries: SyncEntry<BaseLocale, ExtraLocales>[];
    deletedAssets: DeletedAsset[];
    deletedEntries: DeletedEntry[];
    nextSyncToken: string;
}

export interface SyncAsset<BaseLocale extends string, ExtraLocales extends string> {
    sys: Asset['sys'];
    fields: WithLocales<Asset['fields'], BaseLocale, ExtraLocales>;
}

export interface SyncEntry<BaseLocale extends string, ExtraLocales extends string> {
    sys: Entry<string>['sys'];
    fields: WithLocales<Entry<string>['fields'], BaseLocale, ExtraLocales>;
}

export interface DeletedAsset {
    sys: Asset['sys'];
}

export interface DeletedEntry {
    sys: Entry<string>['sys'];
}

export type WithLocales<
    F extends { [key: string]: any },
    BaseLocale extends string,
    ExtraLocales extends string
> = {
    [K in keyof F]: { [B in BaseLocale]: F[K] } & { [L in ExtraLocales]?: F[K] };
};
