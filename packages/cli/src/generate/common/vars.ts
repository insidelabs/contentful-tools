import * as ts from 'typescript';
import { exportModifiers } from './modifiers';

export function assign(
    name: string,
    type: ts.TypeNode | undefined,
    value: ts.Expression | undefined,
    nodeFlags: ts.NodeFlags = ts.NodeFlags.Const,
    exported: boolean = true,
): ts.VariableStatement {
    return ts.createVariableStatement(
        exported ? exportModifiers() : undefined,
        ts.createVariableDeclarationList(
            [ts.createVariableDeclaration(name, type, value)],
            nodeFlags,
        ),
    );
}
