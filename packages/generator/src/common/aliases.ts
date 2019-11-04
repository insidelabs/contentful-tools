import * as ts from 'typescript';
import { exportModifiers } from './modifiers';

export function typeAlias(
    name: string,
    type: ts.TypeNode,
    ...typeParameters: ts.TypeParameterDeclaration[]
): ts.TypeAliasDeclaration {
    return ts.createTypeAliasDeclaration(undefined, exportModifiers(), name, typeParameters, type);
}

export function localTypeAlias(
    name: string,
    type: ts.TypeNode,
    ...typeParameters: ts.TypeParameterDeclaration[]
): ts.TypeAliasDeclaration {
    return ts.createTypeAliasDeclaration(undefined, undefined, name, typeParameters, type);
}
