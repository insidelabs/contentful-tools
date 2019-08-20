import * as ts from 'typescript';
import { stringLiteral } from './literals';

export function boolean(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
}

export function number(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
}

export function string(): ts.KeywordTypeNode {
    return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
}

export function stringLiteralType(value: string): ts.LiteralTypeNode {
    return ts.createLiteralTypeNode(stringLiteral(value));
}

export function nullType(): ts.KeywordTypeNode {
    return ts.createNull();
}
