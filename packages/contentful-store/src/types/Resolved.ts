import { Content } from './Content';
import { Link } from './Link';

export namespace Resolved {
    export interface Entry<E extends Content.Entry = Content.Entry> {
        sys: E['sys'];
        fields: EntryFields<E['fields']>;
    }

    type EntryFields<F extends Content.EntryFields> = {
        readonly [K in keyof F]: F[K] extends Link.Asset
            ? Content.Asset
            : F[K] extends Link.Asset[]
            ? Content.Asset[]
            : F[K] extends Link.Entry<infer L>
            ? Entry<L>
            : F[K] extends Link.Entry<infer L>[]
            ? Entry<L>[]
            : F[K];
    };
}
