import { join } from 'path';
import * as ts from 'typescript';
import { FileName, Namespace } from '../types';

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

export function storeImportDecl(...namespaces: Nullable<Namespace>[]): ts.ImportDeclaration {
    const specs = namespaces
        .filter(isNonNullable)
        .sort()
        .map(importSpec);

    return importDecl(specs, FileName.store, '', false);
}

type Nullable<T> = T | null | undefined;

function isNonNullable<T>(value: Nullable<T>): value is T {
    return value != null;
}
