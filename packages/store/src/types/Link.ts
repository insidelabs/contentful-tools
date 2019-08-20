import { Content } from './Content';
import { SysType } from './SysType';

export namespace Link {
    export interface Asset {
        sys: {
            type: SysType.Link;
            linkType: SysType.Asset;
            id: string;
        };
    }

    export interface Entry<E extends Content.Entry = Content.Entry> {
        sys: {
            type: SysType.Link;
            linkType: SysType.Entry;
            id: string;
        };
    }

    export interface Space {
        sys: {
            type: SysType.Link;
            linkType: SysType.Space;
            id: string;
        };
    }

    export interface Environment {
        sys: {
            type: SysType.Link;
            linkType: SysType.Environment;
            id: string;
        };
    }

    export interface ContentType<ContentTypeId extends string> {
        sys: {
            type: SysType.Link;
            linkType: SysType.ContentType;
            id: ContentTypeId;
        };
    }

    export interface Link {
        sys: {
            type: SysType.Link;
            linkType: SysType;
            id: string;
        };
    }
}
