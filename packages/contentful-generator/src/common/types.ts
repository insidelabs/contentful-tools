import * as ts from 'typescript';
import { exportModifiers } from './modifiers';
import { extendsClause } from './heritage';

export function interfaceDecl(
    interfaceName: string,
    typeParameters?: ts.TypeParameterDeclaration[],
    extendsExpressions?: ts.ExpressionWithTypeArguments[],
    members?: TypeMembers,
) {
    return ts.createInterfaceDeclaration(
        undefined,
        exportModifiers(),
        interfaceName,
        typeParameters,
        extendsClause(extendsExpressions),
        typeMembers(members),
    );
}

export function typeLiteral(members: TypeMembers): ts.TypeLiteralNode {
    return ts.createTypeLiteralNode(typeMembers(members));
}

export function typeMembers(members?: TypeMembers): ts.PropertySignature[] {
    if (!members) return [];

    return Object.keys(members).map(key => {
        const value = members[key];

        const type = isOptional(value) ? value.type : value;

        const typeNode = ts.isTypeNode(type as ts.Node)
            ? (type as ts.TypeNode)
            : typeLiteral(type as TypeMembers);

        return propertySignature(key, !isOptional(value), typeNode);
    });
}

type TypeMembers = {
    [key: string]: ts.TypeNode | Optional | TypeMembers;
};

class Optional {
    constructor(readonly type: ts.TypeNode | TypeMembers) {}
}

function isOptional(value: unknown): value is Optional {
    return value instanceof Optional;
}

export function optional(type: ts.TypeNode | TypeMembers) {
    return new Optional(type);
}

export function propertySignature(
    name: string,
    required: boolean,
    type: ts.TypeNode,
): ts.PropertySignature {
    const questionToken = !required ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined;
    return ts.createPropertySignature(undefined, name, questionToken, type, undefined);
}

export function union(...types: ts.TypeNode[]): ts.TypeNode;
export function union(types: ts.TypeNode[]): ts.TypeNode;
export function union(
    typeOrTypes: ts.TypeNode | ts.TypeNode[],
    ...restTypes: ts.TypeNode[]
): ts.TypeNode {
    return Array.isArray(typeOrTypes)
        ? ts.createUnionTypeNode(typeOrTypes)
        : ts.createUnionTypeNode([typeOrTypes, ...restTypes]);
}
