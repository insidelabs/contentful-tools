import { LinkType, SysType } from './enums';

export interface Asset {
    sys: {
        id: string;
        type: SysType.Asset;
        createdAt: string;
        updatedAt: string;
        revision: number;
    };
    fields: {
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
}

export interface Entry<ContentTypeId extends string> {
    sys: {
        id: string;
        type: SysType.Entry;
        createdAt: string;
        updatedAt: string;
        revision: number;
        contentType: {
            sys: {
                type: SysType.Link;
                linkType: LinkType.ContentType;
                id: ContentTypeId;
            },
        },
    },
    fields: EntryFields;
}

export type EntryFields = {
    [key: string]:
        | AssetLink
        | AssetLink[]
        | EntryLink<Entry<string>>
        | EntryLink<Entry<string>>[]
        | unknown;
};

export interface AssetLink {
    sys: {
        type: SysType.Link;
        linkType: LinkType.Asset;
        id: string;
    };
}

export interface EntryLink<E extends Entry<string>> {
    sys: {
        type: SysType.Link;
        linkType: LinkType.Entry;
        id: string;
    };
}

export type GetContentTypeId<E extends Entry<string>> = E['sys']['contentType']['sys']['id'];
