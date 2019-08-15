import { ContentType } from 'contentful-management';
import camelCase from 'camelcase';
import { Config } from './config';

export function resolveTypeNames(contentTypes: ContentType[], config: Config): Map<string, string> {
    return new Map(
        contentTypes.map(contentType => [
            contentType.sys.id,
            formatInterfaceName(contentType.sys.id),
        ]),
    );

    function formatInterfaceName(sysId: string): string {
        return (
            config.interfaceNamePrefix +
            camelCase(config.contentTypeNameMap[sysId] || sysId, { pascalCase: true }) +
            config.interfaceNameSuffix
        );
    }
}
