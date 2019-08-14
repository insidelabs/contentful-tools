import { Content } from './Content';
import { SysType } from './SysType';

export namespace Link {
    export type Asset = Link<SysType.Asset>;
    export type Entry<E extends Content.Entry = Content.Entry> = Link<SysType.Entry>;

    export type Space = Link<SysType.Space>;
    export type Environment = Link<SysType.Environment>;

    export type ContentType<ContentTypeId extends string> = Link<
        SysType.ContentType,
        ContentTypeId
    >;

    export interface Link<L extends SysType, I = string> {
        sys: {
            type: SysType.Link;
            linkType: L;
            id: I;
        };
    }
}
