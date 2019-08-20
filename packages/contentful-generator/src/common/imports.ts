import { join } from 'path';
import * as ts from 'typescript';
import { FileName, StoreExport } from '../types';
import { isNonNullable, Nullable } from '../util/Nullable';

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

export function storeImportDecl(...exports: Nullable<StoreExport>[]): ts.ImportDeclaration {
    const specs = exports
        .filter(isNonNullable)
        .sort()
        .map(importSpec);

    return importDecl(specs, FileName.store, '', false);
}

export function interfaceImportDecls(imports: string[]): ts.ImportDeclaration[] {
    return imports.map(interfaceName =>
        importDecl([importSpec(interfaceName)], `./${interfaceName}`),
    );
}
