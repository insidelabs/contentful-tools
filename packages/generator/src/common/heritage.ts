import * as ts from 'typescript';

export function extendsClause(
    extendsExpressions?: ts.ExpressionWithTypeArguments[],
): ts.HeritageClause[] | undefined {
    return extendsExpressions
        ? [ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, extendsExpressions)]
        : undefined;
}

export function extendsExpression(
    name: string,
    qualifier?: string,
    ...typeArguments: ts.TypeNode[]
): ts.ExpressionWithTypeArguments {
    return ts.createExpressionWithTypeArguments(
        typeArguments,
        qualifier ? ts.createPropertyAccess(ts.createIdentifier(name), qualifier) : ts.createIdentifier(name),
    );
}
