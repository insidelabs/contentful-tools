import { Link } from '../types/Link';
import { SysType } from '../types/SysType';

export function isAssetLink(value: unknown): value is Link.Asset {
    return isLink(value) && value.sys.linkType === SysType.Asset;
}

export function isAssetLinkArray(value: unknown): value is Link.Asset[] {
    return Array.isArray(value) && value.length > 0 && isAssetLink(value[0]);
}

export function isEntryLink(value: unknown): value is Link.Entry {
    return isLink(value) && value.sys.linkType === SysType.Entry;
}

export function isEntryLinkArray(value: unknown): value is Link.Entry[] {
    return Array.isArray(value) && value.length > 0 && isEntryLink(value[0]);
}

function isLink(value: unknown): value is Link.Link<SysType> {
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
