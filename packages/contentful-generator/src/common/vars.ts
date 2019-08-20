import * as ts from 'typescript';
import { exportModifiers } from './modifiers';

export function assignConst(
    name: string,
    type: ts.TypeNode,
    value: ts.Expression,
): ts.VariableStatement {
    return ts.createVariableStatement(
        exportModifiers(),
        ts.createVariableDeclarationList(
            [ts.createVariableDeclaration(name, type, value)],
            ts.NodeFlags.Const,
        ),
    );
}
