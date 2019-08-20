import * as ts from 'typescript';

export function processNewLines(sourceText: string): string {
    sourceText = sourceText.replace(/\nexport/gm, '\n$&');
    sourceText = sourceText.replace(/\s*\/\/NEWLINE$/gm, '\n');
    sourceText = sourceText.replace(/\s*\/\/REMOVE-NEWLINE$\n/gm, '');
    return sourceText;
}

export function spaceAbove<T extends ts.Node>(node: T): T {
    return ts.addSyntheticLeadingComment(
        node,
        ts.SyntaxKind.SingleLineCommentTrivia,
        'NEWLINE',
        true,
    );
}

export function collapse<T extends ts.Node>(nodes: T[]): T[] {
    if (nodes.length === 0) return [];
    return [nodes[0], ...nodes.slice(1).map(removeLineAbove)];
}

export function removeLineAbove<T extends ts.Node>(node: T): T {
    return ts.addSyntheticLeadingComment(
        node,
        ts.SyntaxKind.SingleLineCommentTrivia,
        'REMOVE-NEWLINE',
    );
}
