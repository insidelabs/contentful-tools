import { Asset, AssetLink, Entry, EntryFields, EntryLink } from './content';

export interface Resolved<E extends Entry<string>> {
    sys: E['sys'];
    fields: ResolvedFields<E['fields']>;
}

export type ResolvedFields<F extends EntryFields> = {
    readonly [K in keyof F]: F[K] extends AssetLink
        ? Asset
        : F[K] extends AssetLink[]
        ? Asset[]
        : F[K] extends EntryLink<infer L>
        ? Resolved<L>
        : F[K] extends EntryLink<infer L>[]
        ? Resolved<L>[]
        : F[K];
};
