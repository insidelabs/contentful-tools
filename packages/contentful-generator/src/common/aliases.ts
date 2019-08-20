import * as ts from 'typescript';
import { StoreExport, Type } from '../types';
import { exportModifiers } from './modifiers';
import { qualifiedTypeRef, ref } from './refs';

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

export function resolvedType(
    interfaceName: string,
    prefix: string,
    suffix: string,
): ts.TypeAliasDeclaration {
    return typeAlias(
        prefix + interfaceName + suffix,
        qualifiedTypeRef(StoreExport.Resolved, Type.Entry, ref(interfaceName)),
    );
}
