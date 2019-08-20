import * as ts from 'typescript';

export function prop(p0: string, ...ps: string[]): ts.Expression {
    const root = p0 === 'this' ? ts.createThis() : ts.createIdentifier(p0);
    if (ps.length === 0) return root;

    return ps.slice(1).reduce((expression: ts.PropertyAccessExpression, part: string) => {
        if (part) return ts.createPropertyAccess(expression, part);
        else return expression;
    }, ts.createPropertyAccess(root, ps[0]));
}
