import { Link } from './Link';
import { SysType } from './SysType';

export namespace Content {
    export interface Asset {
        sys: {
            id: string;
            type: SysType.Asset;
            space: Link.Space;
            environment: Link.Environment;
            createdAt: string;
            updatedAt: string;
            revision: number;
        };
        fields: AssetFields;
    }

    export interface AssetFields {
        title?: string;
        description?: string;
        file: {
            url: string;
            details: {
                size: number;
                image?: {
                    width: number;
                    height: number;
                };
            };
            fileName: string;
            contentType: string;
        };
    }

    export interface Entry<ContentTypeId extends string = string> {
        sys: {
            id: string;
            type: SysType.Entry;
            space: Link.Space;
            environment: Link.Environment;
            contentType: Link.ContentType<ContentTypeId>;
            createdAt: string;
            updatedAt: string;
            revision: number;
        };
        fields: EntryFields;
    }

    export type EntryFields = {
        [key: string]: Link.Asset | Link.Asset[] | Link.Entry | Link.Entry[] | unknown;
    };
}
