import * as ts from 'typescript';

export function processNewLines(sourceText: string): string {
    sourceText = sourceText.replace(/\nexport/gm, '\n$&');
    sourceText = sourceText.replace(/\s*\/\/NEWLINE$/gm, '\n');
    return sourceText;
}

export function newLineAbove<T extends ts.Node>(node: T): T {
    return ts.addSyntheticLeadingComment(
        node,
        ts.SyntaxKind.SingleLineCommentTrivia,
        'NEWLINE',
        true,
    );
}

