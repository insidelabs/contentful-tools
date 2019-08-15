import * as ts from 'typescript';

export function any(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
}

export function boolean(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
}

export function number(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
}

export function string(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
}

export function stringLiteral(text: string): ts.LiteralTypeNode {
    return ts.createLiteralTypeNode(ts.createStringLiteral(text));
}
