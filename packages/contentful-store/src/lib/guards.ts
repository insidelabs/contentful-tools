import { Asset, AssetLink, Entry, LinkType, SysType, EntryLink } from '../types';

export function isAsset(value: unknown): value is Asset {
    return isEntity(value) && value.sys.type === SysType.Asset;
}

export function isAssetLink(value: unknown): value is AssetLink {
    return isLink(value) && value.sys.linkType === LinkType.Asset;
}

export function isAssetLinkArray(value: unknown): value is AssetLink[] {
    return Array.isArray(value) && value.length > 0 && isAssetLink(value[0]);
}

export function isEntry(value: unknown): value is Entry<string> {
    return isEntity(value) && value.sys.type === SysType.Entry;
}

export function isEntryLink(value: unknown): value is EntryLink<Entry<string>> {
    return isLink(value) && value.sys.linkType === LinkType.Entry;
}

export function isEntryLinkArray(value: unknown): value is EntryLink<Entry<string>>[] {
    return Array.isArray(value) && value.length > 0 && isEntryLink(value[0]);
}

function isEntity(value: unknown): value is { sys: { type: string } } {
    return isRecord(value) && isRecord(value.sys) && typeof value.sys.type === 'string';
}

function isLink<L extends LinkType>(
    value: unknown,
): value is { sys: { type: SysType.Link; linkType: string } } {
    return (
        isRecord(value) &&
        isRecord(value.sys) &&
        typeof value.sys.type === 'string' &&
        value.sys.type === SysType.Link &&
        typeof value.sys.linkType === 'string'
    );
}

function isRecord(value: unknown): value is { [key in string]: unknown } {
    return value != null && typeof value === 'object';
}
