import { Asset as ContentfulAsset, Entry as ContentfulEntry } from 'contentful';
import { LinkType, SysType } from './enums';
import { PlainObject } from './utils';

export type Asset = PlainObject<ContentfulAsset>;

export interface Entry<ContentTypeId extends string> extends PlainObject<ContentfulEntry<{}>> {
    sys: ContentfulEntry<{}>['sys'] & { contentType: ContentTypeLink<ContentTypeId> };
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

interface ContentTypeLink<ContentTypeId extends string> {
    sys: {
        type: 'Link';
        linkType: 'ContentType';
        id: ContentTypeId;
    };
}

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
