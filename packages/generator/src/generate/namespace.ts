import { sortBy } from 'lodash';
import * as ts from 'typescript';
import { tsFile } from '../common/files';
import { Config } from '../config';
import { commonEntryInterfaceDecl } from './entry';
import * as c from 'contentful-management';
import { isNonNullable } from '../util/Nullable';
import { generateInterface } from './interfaces';
import { collapse, spaceAbove } from '../common/whitespace';
import { typenameMapStatement, typenameTypeAlias } from './typename';
import { storeImportDecl } from '../common/imports';
import { exportModifiers } from '../common/modifiers';
import { localeConstDecls, localeTypeDecls } from './locale';

export function generateNamespace(
    config: Config,
    namespace: string,
    contentTypes: c.ContentType[],
    typenameMap: Map<string, string>,
) {
    const sortedContentTypes = sortBy(contentTypes, contentType =>
        typenameMap.get(contentType.sys.id),
    );

    const allStoreImports = new Set<string>();
    let allInterfaceDecls: ts.DeclarationStatement[] = [];

    for (const contentType of sortedContentTypes) {
        const { storeImports, declarations } = generateInterface(
            config,
            typenameMap,
            contentType,
            'DECLARATIONS',
        );

        for (const storeImport of storeImports) allStoreImports.add(storeImport);
        allInterfaceDecls = allInterfaceDecls.concat(declarations);
    }

    const statements = [
        ...collapse(localeTypeDecls(config)),
        ...collapse(localeConstDecls(config)),
        commonEntryInterfaceDecl(contentTypes, true),
        ...allInterfaceDecls,
        typenameTypeAlias(typenameMap),
        typenameMapStatement(typenameMap),
    ];

    return tsFile(namespace, [
        storeImportDecl(Array.from(allStoreImports)),
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
