import * as ts from 'typescript';

export function arrayLiteral(expressions: ts.Expression[]): ts.ArrayLiteralExpression {
    return ts.createArrayLiteral(expressions);
}

export function stringLiteral(value: string): ts.LiteralExpression {
    return ts.createStringLiteral(value);
}
