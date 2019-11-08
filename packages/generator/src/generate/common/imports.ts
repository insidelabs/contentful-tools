import { flatten } from 'lodash';
import { join } from 'path';
import * as ts from 'typescript';
import { isNonNullable, Nullable } from '../../util/Nullable';

export function importSpec(name: string) {
    return ts.createImportSpecifier(undefined, ts.createIdentifier(name));
}

export function importDecl(
    namedImportSpecs: ts.ImportSpecifier[],
    fileName: string,
    path: string = '.',
    relative: boolean = true,
) {
    const joinedPath = join(path, fileName);
    const filePath =
        relative === true && !joinedPath.startsWith('.') ? './' + joinedPath : joinedPath;
    return ts.createImportDeclaration(
        undefined,
        undefined,
        ts.createImportClause(undefined, ts.createNamedImports(namedImportSpecs)),
        ts.createStringLiteral(filePath),
    );
}

export function storeImportDecl(
    ...exports: Array<Nullable<string> | string[]>
): ts.ImportDeclaration {
    const specs = flatten(exports.filter(isNonNullable))
        .sort()
        .map(importSpec);

    return importDecl(specs, '@contentful-tools/store', '', false);
}

export function interfaceImportDecls(imports: string[]): ts.ImportDeclaration[] {
    return imports.map(interfaceName =>
        importDecl([importSpec(interfaceName)], `./${interfaceName}`),
    );
}

export function moduleImportDecl(moduleName: string): ts.ImportDeclaration {
    return importDecl([importSpec(moduleName)], moduleName);
}

export function typenameImportDecl(): ts.ImportDeclaration {
    return importDecl([importSpec('Typename')], 'Typename');
}

export function commonEntryImportDecl(): ts.ImportDeclaration {
    return importDecl([importSpec('Entry')], 'Entry');
}
