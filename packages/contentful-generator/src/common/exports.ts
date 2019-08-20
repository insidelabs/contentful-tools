import * as ts from 'typescript';

export function exportModifiers(): ts.Modifier[] {
    return [ts.createModifier(ts.SyntaxKind.ExportKeyword)];
}
