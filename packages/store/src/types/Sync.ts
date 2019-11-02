import { ContentTypeLink, EnvironmentLink, SpaceLink } from './Link';
import { Asset } from './Asset';
import { Entry } from './Entry';

export interface SyncQuery {
    initial?: boolean;
    locale?: string;
    resolveLinks?: boolean;
    nextSyncToken?: string;
}

export interface SyncResult<BaseLocale extends string, ExtraLocales extends string> {
    assets: SyncAsset<BaseLocale, ExtraLocales>[];
    entries: SyncEntry<BaseLocale, ExtraLocales>[];
    deletedAssets: DeletedAsset[];
    deletedEntries: DeletedEntry[];
    nextSyncToken: string;
}

export interface SyncAsset<BaseLocale extends string, ExtraLocales extends string> {
    sys: {
        id: string;
        type: 'Asset';
        space: SpaceLink;
        environment: EnvironmentLink;
        createdAt: string;
        updatedAt: string;
        revision: number;
    };
    fields: LocalizedFieldsOf<Asset, BaseLocale, ExtraLocales>;
}

export interface SyncEntry<BaseLocale extends string, ExtraLocales extends string> {
    sys: {
        id: string;
        type: 'Entry';
        space: SpaceLink;
        environment: EnvironmentLink;
        contentType: ContentTypeLink;
        createdAt: string;
        updatedAt: string;
        revision: number;
    };
    fields: LocalizedFieldsOf<Entry, BaseLocale, ExtraLocales>;
}

export interface DeletedAsset {
    sys: {
        id: string;
        type: 'DeletedAsset';
        space: SpaceLink;
        environment: EnvironmentLink;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
        revision: number;
    };
}

export interface DeletedEntry {
    sys: {
        id: string;
        type: 'DeletedEntry';
        space: SpaceLink;
        environment: EnvironmentLink;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
        revision: number;
    };
}

export type LocalizedFieldsOf<
    T extends { [key: string]: any },
    BaseLocale extends string,
    ExtraLocales extends string
> = {
    [K in keyof Omit<T, SysField>]: { [B in BaseLocale]: T[K] } & { [L in ExtraLocales]?: T[K] };
};

export type SysField = '__typename' | '__id';
