import * as ts from 'typescript';
import { exportModifiers } from './modifiers';

export function fn(
    name: string,
    parameters: ts.ParameterDeclaration[],
    returnType: ts.TypeNode,
    body: ts.Block,
): ts.FunctionDeclaration {
    return ts.createFunctionDeclaration(
        undefined,
        exportModifiers(),
        undefined,
        name,
        undefined,
        parameters,
        returnType,
        body,
    );
}

export function parameter(
    name: string,
    type: ts.TypeNode,
    optional: boolean = false,
    ...modifiers: ts.Modifier[]
): ts.ParameterDeclaration {
    const questionToken = optional ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined;
    return ts.createParameter(
        undefined,
        modifiers,
        undefined,
        name,
        questionToken,
        type,
        undefined,
    );
}

export function block(...statements: ts.Statement[]): ts.Block {
    return ts.createBlock(statements, true);
}
