import { Content } from './Content';
import { Link } from './Link';

export namespace Resolved {
    export type Asset<A extends Content.Asset = Content.Asset> = A['fields'] & {
        __id: A['sys']['id'];
    };

    export type Entry<E extends Content.Entry = Content.Entry> = EntryFields<E['fields']> & {
        __typename: E['sys']['contentType']['sys']['id'];
        __id: E['sys']['id'];
    };

    type EntryFields<F extends Content.EntryFields> = RequiredFields<F> & OptionalFields<F>;

    type RequiredFields<F extends Content.EntryFields> = {
        readonly [K in RequiredKeys<F>]-?: F[K] extends Link.Asset
            ? Asset<Content.Asset>
            : F[K] extends Link.Asset[]
            ? Asset<Content.Asset>[]
            : F[K] extends Link.Entry<infer L>
            ? Entry<L>
            : F[K] extends Link.Entry<infer L>[]
            ? Entry<L>[]
            : F[K];
    };

    type OptionalFields<F extends Content.EntryFields> = {
        readonly [K in OptionalKeys<F>]+?: NonOptional<F[K]> extends Link.Asset
            ? Asset<Content.Asset>
            : NonOptional<F[K]> extends Link.Asset[]
            ? Asset<Content.Asset>[]
            : NonOptional<F[K]> extends Link.Entry<infer L>
            ? Entry<L>
            : NonOptional<F[K]> extends Link.Entry<infer L>[]
            ? Entry<L>[]
            : F[K];
    };

    type RequiredKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];
    type OptionalKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? K : never }[keyof T];

    type NonOptional<T> = T extends undefined ? never : T;
}
