import * as ts from 'typescript';

export function arrayLiteral(expressions: ts.Expression[]): ts.ArrayLiteralExpression {
    return ts.createArrayLiteral(expressions);
}

export function objectLiteral(
    properties: ts.ObjectLiteralElementLike[],
): ts.ObjectLiteralExpression {
    return ts.createObjectLiteral(properties, true);
}

export function stringLiteral(value: string): ts.LiteralExpression {
    return ts.createStringLiteral(value);
}
