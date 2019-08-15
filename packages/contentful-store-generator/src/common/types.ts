import * as ts from 'typescript';
import { exportModifiers } from './imports';

export function interfaceDecl(
    interfaceName: string,
    members: TypeMembers,
    typeParameters?: ts.TypeParameterDeclaration[],
    extendsExpressions?: ts.ExpressionWithTypeArguments[],
) {
    return ts.createInterfaceDeclaration(
        undefined,
        exportModifiers(),
        interfaceName,
        typeParameters,
        extendsExpressions ? extendsClause(extendsExpressions) : undefined,
        typeMembers(members),
    );
}

export function extendsClause(
    extendsExpressions: ts.ExpressionWithTypeArguments[],
): ts.HeritageClause[] {
    return [ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, extendsExpressions)];
}

export function extendsExpression(
    name: string,
    qualifier: string,
    ...typeArguments: ts.TypeNode[]
): ts.ExpressionWithTypeArguments {
    return ts.createExpressionWithTypeArguments(
        typeArguments,
        ts.createPropertyAccess(ts.createIdentifier(name), qualifier),
    );
}

export function typeLiteral(members: TypeMembers): ts.TypeLiteralNode {
    return ts.createTypeLiteralNode(typeMembers(members));
}

export function typeMembers(members: TypeMembers): ts.PropertySignature[] {
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
