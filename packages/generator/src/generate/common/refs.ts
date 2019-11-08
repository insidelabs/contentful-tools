import * as ts from 'typescript';

export function ref(name: string, qualifier?: string): ts.TypeReferenceNode;
export function ref(name: string, ...typeArguments: ts.TypeNode[]): ts.TypeReferenceNode;

export function ref(
    name: string,
    qualifierOrTypeArgument?: string | ts.TypeNode,
    ...typeArguments: ts.TypeNode[]
): ts.TypeReferenceNode {
    if (typeof qualifierOrTypeArgument === 'undefined') {
        return typeRef(name);
    } else if (typeof qualifierOrTypeArgument === 'string') {
        return qualifiedTypeRef(name, qualifierOrTypeArgument);
    } else {
        return typeRef(name, [qualifierOrTypeArgument, ...typeArguments]);
    }
}

export function qualifiedTypeRef(
    name: string,
    qualifier: string,
    ...typeArguments: ts.TypeNode[]
): ts.TypeReferenceNode {
    return ts.createTypeReferenceNode(
        ts.createQualifiedName(ts.createIdentifier(name), qualifier),
        typeArguments,
    );
}

export function typeRef(name: string, typeArguments?: ts.TypeNode[]): ts.TypeReferenceNode {
    return ts.createTypeReferenceNode(ts.createIdentifier(name), typeArguments);
}

export function typeParameter(
    name: string,
    constraint?: ts.TypeNode,
    defaultType?: ts.TypeNode,
): ts.TypeParameterDeclaration {
    return ts.createTypeParameterDeclaration(ts.createIdentifier(name), constraint, defaultType);
}
