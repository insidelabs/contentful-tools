import { Content } from './Content';
import { Link } from './Link';
import { SysType } from './SysType';

export namespace Sync {
    export type Query = ({ initial: true } | { nextSyncToken: string }) & {
        locale?: string;
        resolveLinks?: boolean;
        nextSyncToken?: string;
    };

    export interface Result<BaseLocale extends string, ExtraLocales extends string> {
        assets: Asset<BaseLocale, ExtraLocales>[];
        entries: Entry<BaseLocale, ExtraLocales>[];
        deletedAssets: DeletedAsset[];
        deletedEntries: DeletedEntry[];
        nextSyncToken: string;
    }

    export interface Asset<BaseLocale extends string, ExtraLocales extends string> {
        sys: Content.Asset['sys'];
        fields: Fields<Content.Asset['fields'], BaseLocale, ExtraLocales>;
    }

    export interface Entry<BaseLocale extends string, ExtraLocales extends string> {
        sys: Content.Entry['sys'];
        fields: Fields<Content.Entry['fields'], BaseLocale, ExtraLocales>;
    }

    export interface DeletedAsset {
        sys: {
            id: string;
            type: SysType.DeletedAsset;
            space: Link.Space;
            environment: Link.Environment;
            createdAt: string;
            updatedAt: string;
            deletedAt: string;
            revision: number;
        };
    }

    export interface DeletedEntry {
        sys: {
            id: string;
            type: SysType.DeletedEntry;
            space: Link.Space;
            environment: Link.Environment;
            createdAt: string;
            updatedAt: string;
            deletedAt: string;
            revision: number;
        };
    }

    export type Fields<
        F extends { [key: string]: any },
        BaseLocale extends string,
        ExtraLocales extends string
    > = {
        [K in keyof F]: { [B in BaseLocale]: F[K] } & { [L in ExtraLocales]?: F[K] };
    };
}
