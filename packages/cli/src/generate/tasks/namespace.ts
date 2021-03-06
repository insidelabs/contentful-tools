import { sortBy } from 'lodash';
import * as ts from 'typescript';
import { tsFile } from '../common/files';
import { commonEntryInterfaceDecl } from './entry';
import * as c from 'contentful-management';
import { isNonNullable } from '../../util/Nullable';
import { generateInterface } from './interfaces';
import { collapse, spaceAbove } from '../common/whitespace';
import { typenameMapStatement, typenameTypeAlias } from './typename';
import { importDecl, importSpec, storeImportDecl } from '../common/imports';
import { exportModifiers } from '../common/modifiers';
import { localeConstDecls, localeTypeDecls } from './locale';
import { assign } from '../common/vars';
import { stringLiteral } from '../common/literals';
import { ContentTypeNameMap, ContentTypeWhitelist } from '../util/typeNames';
import { whitelistStatement } from './whitelist';
import { Config } from '../../common/Config';

export function generateNamespace(
    config: Config,
    namespace: string,
    contentTypes: c.ContentType[],
    contentTypeNameMap: ContentTypeNameMap,
    contentTypeWhitelist: ContentTypeWhitelist,
) {
    const sortedContentTypes = sortBy(contentTypes, contentType =>
        contentTypeNameMap.get(contentType.sys.id),
    );

    const allStoreImports = new Set<string>();
    const allTypeOverridesMap: Map<string, Set<string>> = new Map();
    let allInterfaceDecls: ts.DeclarationStatement[] = [];

    for (const contentType of sortedContentTypes) {
        const { storeImports, typeOverrideMap, declarations } = generateInterface(
            config,
            contentTypeNameMap,
            contentType,
            'DECLARATIONS',
        );

        for (const [path, types] of typeOverrideMap) {
            const typeSet = allTypeOverridesMap.get(path);
            if (typeSet) {
                for (const type of types) typeSet.add(type);
            } else {
                allTypeOverridesMap.set(path, new Set(types));
            }
        }

        for (const storeImport of storeImports) allStoreImports.add(storeImport);
        allInterfaceDecls = allInterfaceDecls.concat(declarations);
    }

    const allTypeOverrideImports = Array.from(allTypeOverridesMap).map(
        ([path, typeSet]: [string, Set<string>]) =>
            importDecl(
                Array.from(typeSet)
                    .sort()
                    .map(type => importSpec(type)),
                path,
            ),
    );

    const statements = [
        assign('space', undefined, stringLiteral(config.space)),
        ...collapse(localeTypeDecls(config)),
        ...collapse(localeConstDecls(config)),
        commonEntryInterfaceDecl(contentTypes, true),
        ...allInterfaceDecls,
        typenameTypeAlias(contentTypeNameMap),
        typenameMapStatement(contentTypeNameMap),
        config.whitelist ? whitelistStatement(contentTypeWhitelist) : null,
    ];

    return tsFile(namespace, [
        storeImportDecl(Array.from(allStoreImports)),
        allTypeOverrideImports,
        ts.createModuleDeclaration(
            undefined,
            exportModifiers(),
            ts.createIdentifier(namespace),
            ts.createModuleBlock(
                statements
                    .filter(isNonNullable)
                    .map((statement, i) => (i === 0 ? statement : spaceAbove(statement))),
            ),
            ts.NodeFlags.Namespace,
        ),
    ]);
}
