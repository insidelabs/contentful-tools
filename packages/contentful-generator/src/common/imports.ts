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

export function exportModifiers(): ts.Modifier[] {
    return [ts.createModifier(ts.SyntaxKind.ExportKeyword)];
}

export function storeImportDecl(...namespaces: Namespace[]): ts.ImportDeclaration {
    return importDecl(namespaces.sort().map(importSpec), FileName.store, '', false);
}
