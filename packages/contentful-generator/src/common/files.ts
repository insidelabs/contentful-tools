import { flatten } from 'lodash';
import * as ts from 'typescript';
import { isNonNullable, Nullable } from '../util/Nullable';

export function tsFile(
    fileName: string,
    statements: Array<Nullable<ts.Statement> | ts.Statement[]>,
): ts.SourceFile {
    const sourceFile = ts.createSourceFile(
        fileName + '.ts',
        '',
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
    );
    return ts.updateSourceFileNode(sourceFile, flatten(statements.filter(isNonNullable)));
}
