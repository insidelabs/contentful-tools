import * as ts from 'typescript';
import { ref } from './refs';

export function array(childType: ts.TypeNode): ts.TypeNode {
    switch (childType.kind) {
        case ts.SyntaxKind.AnyKeyword:
        case ts.SyntaxKind.BooleanKeyword:
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.StringKeyword:
        case ts.SyntaxKind.TypeReference:
            return arrayOf(childType);

        default:
            return ref('Array', childType);
    }
}

export function arrayOf(type: ts.TypeNode): ts.ArrayTypeNode {
    return ts.createArrayTypeNode(type);
}
