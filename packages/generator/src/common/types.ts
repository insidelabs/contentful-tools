import * as ts from 'typescript';
import { exportModifiers } from './modifiers';
import { extendsClause } from './heritage';
import camelCase from 'camelcase';
import * as pluralize from 'pluralize';
import { typeAlias } from './aliases';
import { stringLiteralType } from './scalars';

export function interfaceDecl(
    interfaceName: string,
    typeParameters?: ts.TypeParameterDeclaration[],
    extendsExpressions?: ts.ExpressionWithTypeArguments[],
    members?: TypeMembers | ts.PropertySignature[],
) {
    return ts.createInterfaceDeclaration(
        undefined,
        exportModifiers(),
        interfaceName,
        typeParameters,
        extendsClause(extendsExpressions),
        Array.isArray(members) ? members : typeMembers(members),
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

export function mappedType(typeParameter: string, indexType: ts.TypeNode, objectType: ts.TypeNode) {
    return ts.createMappedTypeNode(
        undefined,
        ts.createTypeParameterDeclaration(typeParameter, indexType),
        undefined,
        objectType,
    );
}

export function stringLiteralTypeUnionFromValidation(
    interfaceName: string,
    fieldName: string,
    values: string[],
): ts.TypeAliasDeclaration {
    const name = camelCase([interfaceName, pluralize.singular(fieldName)], {
        pascalCase: true,
    });

    return typeAlias(name, union(values.map(stringLiteralType)));
}
