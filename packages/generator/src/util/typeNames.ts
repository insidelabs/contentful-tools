import { ContentType } from 'contentful-management';
import camelCase from 'camelcase';
import { Config } from '../config';

export type ContentTypeNameMap = Map<string, string>;
export type ContentTypeWhitelist = string[];

export function resolveTypeNames(
    contentTypes: ContentType[],
    config: Config,
): {
    contentTypeNameMap: ContentTypeNameMap;
    contentTypeWhitelist: ContentTypeWhitelist;
} {
    let whitelist = contentTypes.map(contentType => contentType.sys.id);
    if (config.whitelist) whitelist = whitelist.filter(sysId => config.contentTypeNameMap[sysId]);

    return {
        contentTypeNameMap: new Map(whitelist.map(sysId => [sysId, formatTypeName(sysId)])),
        contentTypeWhitelist: whitelist,
    };

    function formatTypeName(sysId: string): string {
        return camelCase(config.contentTypeNameMap[sysId] || sysId, { pascalCase: true });
    }
}
