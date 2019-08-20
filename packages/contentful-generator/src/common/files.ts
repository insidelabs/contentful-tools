import { flatten } from 'lodash';
import * as ts from 'typescript';

export function tsFile(
    fileName: string,
    statements: Array<ts.Statement | ts.Statement[]>,
): ts.SourceFile {
    const sourceFile = ts.createSourceFile(
        fileName + '.ts',
        '',
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
    );
    return ts.updateSourceFileNode(sourceFile, flatten(statements));
}
