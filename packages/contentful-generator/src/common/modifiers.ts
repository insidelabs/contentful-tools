import * as ts from 'typescript';

export function priv(): ts.Modifier {
    return ts.createModifier(ts.SyntaxKind.PrivateKeyword);
}

export function readonly(): ts.Modifier {
    return ts.createModifier(ts.SyntaxKind.ReadonlyKeyword);
}
