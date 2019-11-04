import { ContentType } from 'contentful-management';
import camelCase from 'camelcase';
import { Config } from '../config';

export function resolveTypeNames(contentTypes: ContentType[], config: Config): Map<string, string> {
    return new Map(
        contentTypes.map(contentType => [contentType.sys.id, formatTypeName(contentType.sys.id)]),
    );

    function formatTypeName(sysId: string): string {
        return (
            config.baseType.prefix +
            camelCase(config.contentTypeNameMap[sysId] || sysId, { pascalCase: true }) +
            config.baseType.suffix
        );
    }
}
