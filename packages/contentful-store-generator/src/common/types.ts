import * as ts from 'typescript';
import { exportModifiers } from './imports';
import { stringLiteral } from './scalars';

export function typeAlias(
    name: string,
    type: ts.TypeNode,
    ...typeParameters: ts.TypeParameterDeclaration[]
): ts.TypeAliasDeclaration {
    return ts.createTypeAliasDeclaration(undefined, exportModifiers(), name, typeParameters, type);
}

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
    ...typeArguments: ts.TypeNode[]
): ts.ExpressionWithTypeArguments {
    return ts.createExpressionWithTypeArguments(typeArguments, ts.createIdentifier(name));
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

export function infer(name: string | ts.Identifier): ts.InferTypeNode {
    return ts.createInferTypeNode(typeParameter(name));
}

export function conditional(
    checkType: ts.TypeNode,
    extendsType: ts.TypeNode,
    trueType: ts.TypeNode,
    falseType: ts.TypeNode,
): ts.ConditionalTypeNode {
    return ts.createConditionalTypeNode(checkType, extendsType, trueType, falseType);
}

export function parens(type: ts.TypeNode) {
    return ts.createParenthesizedType(type);
}

export function typeParameter(
    name: string | ts.Identifier,
    constraint?: ts.TypeNode,
    defaultType?: ts.TypeNode,
) {
    return ts.createTypeParameterDeclaration(name, constraint, defaultType);
}

export function mapped(
    typeParameter: ts.TypeParameterDeclaration,
    type: ts.TypeNode,
): ts.MappedTypeNode {
    return ts.createMappedTypeNode(undefined, typeParameter, undefined, type);
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

export function indexed(...types: Array<string | ts.TypeNode>): ts.TypeNode {
    if (types.length >= 2) {
        return ts.createIndexedAccessTypeNode(
            indexed(...types.slice(0, -1)),
            resolve(types.slice(-1)[0]),
        );
    } else {
        return resolve(types[0]);
    }

    function resolve(stringOrTypeNode: string | ts.TypeNode): ts.TypeNode {
        return typeof stringOrTypeNode === 'string'
            ? stringLiteral(stringOrTypeNode)
            : stringOrTypeNode;
    }
}

export function keyof(type: ts.TypeNode): ts.TypeOperatorNode {
    return ts.createTypeOperatorNode(ts.SyntaxKind.KeyOfKeyword, type);
}
