import { AssetLink, EntryLink, Link } from './types/Link';

export function isAssetLink(value: unknown): value is AssetLink {
    return isLink(value) && value.sys.linkType === 'Asset';
}

export function isAssetLinkArray(value: unknown): value is AssetLink[] {
    return Array.isArray(value) && value.length > 0 && isAssetLink(value[0]);
}

export function isEntryLink(value: unknown): value is EntryLink {
    return isLink(value) && value.sys.linkType === 'Entry';
}

export function isEntryLinkArray(value: unknown): value is EntryLink[] {
    return Array.isArray(value) && value.length > 0 && isEntryLink(value[0]);
}

function isLink(value: unknown): value is Link {
    return (
        isRecord(value) &&
        isRecord(value.sys) &&
        typeof value.sys.type === 'string' &&
        value.sys.type === 'Link' &&
        typeof value.sys.linkType === 'string'
    );
}

function isRecord(value: unknown): value is { [key in string]: unknown } {
    return value != null && typeof value === 'object';
}
