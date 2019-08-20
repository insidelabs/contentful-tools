import { Config } from '../config';
import * as ts from 'typescript';
import { Namespace, Type } from '../types';
import { exportModifiers } from './exports';
import { qualifiedTypeRef, ref } from './refs';

export function typeAlias(
    name: string,
    type: ts.TypeNode,
    ...typeParameters: ts.TypeParameterDeclaration[]
): ts.TypeAliasDeclaration {
    return ts.createTypeAliasDeclaration(undefined, exportModifiers(), name, typeParameters, type);
}

export function resolvedContentType(interfaceName: string, config: Config): ts.Statement {
    if (!config.resolvedType) return ts.createEmptyStatement();
    return typeAlias(
        config.resolvedType.prefix + interfaceName + config.resolvedType.suffix,
        qualifiedTypeRef(Namespace.Resolved, Type.Entry, ref(interfaceName)),
    );
}
