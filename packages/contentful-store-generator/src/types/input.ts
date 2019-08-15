export enum FileName {
    store = '@insidelabs/contentful-store',
    common = 'common',
    utils = 'utils',
}

export enum CommonType {
    Asset = 'Asset',
    AssetLink = 'AssetLink',
    ContentTypeId = 'ContentTypeId',
    Entry = 'Entry',
    EntryLink = 'EntryLink',
    EntrySys = 'EntrySys',
    JSON = 'ContentfulJSON',
    LinkType = 'LinkType',
    Location = 'ContentfulLocation',
    SysType = 'SysType',
}

export enum FieldType {
    Array = 'Array',
    Boolean = 'Boolean',
    Date = 'Date',
    Integer = 'Integer',
    Link = 'Link',
    Location = 'Location',
    Number = 'Number',
    Object = 'Object',
    RichText = 'RichText',
    Symbol = 'Symbol',
    Text = 'Text',
}

export enum SysType {
    Asset = 'Asset',
    Entry = 'Entry',
    Link = 'Link',
}

export enum LinkType {
    Asset = 'Asset',
    Entry = 'Entry',
}
