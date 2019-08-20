import * as ts from 'typescript';

export function exportModifier(): ts.Modifier {
    return ts.createModifier(ts.SyntaxKind.ExportKeyword);
}

export function exportModifiers(): ts.Modifier[] {
    return [exportModifier()];
}

export function priv(): ts.Modifier {
    return ts.createModifier(ts.SyntaxKind.PrivateKeyword);
}

export function readonly(): ts.Modifier {
    return ts.createModifier(ts.SyntaxKind.ReadonlyKeyword);
}
