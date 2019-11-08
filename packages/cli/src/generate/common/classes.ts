import * as ts from 'typescript';
import { exportModifiers } from './modifiers';
import { extendsClause } from './heritage';
import { isNonNullable, Nullable } from '../../util/Nullable';
import { spaceAbove } from './whitespace';

export function classDecl(
    className: string,
    typeParameters?: ts.TypeParameterDeclaration[],
    extendsExpressions?: ts.ExpressionWithTypeArguments[],
    classElements: Nullable<ts.ClassElement>[] = [],
): ts.ClassDeclaration {
    return ts.createClassDeclaration(
        undefined,
        exportModifiers(),
        className,
        typeParameters,
        extendsClause(extendsExpressions),
        classElements
            .filter(isNonNullable)
            .map((element, i) => (i === 0 ? element : spaceAbove(element))),
    );
}

export function field(
    modifiers: ts.Modifier[],
    name: string,
    type: ts.TypeNode,
    initializer?: ts.Expression,
): ts.PropertyDeclaration {
    return ts.createProperty(undefined, modifiers, name, undefined, type, initializer);
}

export function constructor(parameters: ts.ParameterDeclaration[], body: ts.Block = block()) {
    return ts.createMethod(
        undefined,
        undefined,
        undefined,
        'constructor',
        undefined,
        undefined,
        parameters,
        undefined,
        body,
    );
}

export function assignThis(name: string, value: ts.Expression): ts.ExpressionStatement {
    return ts.createExpressionStatement(
        ts.createBinary(
            ts.createPropertyAccess(ts.createThis(), name),
            ts.SyntaxKind.EqualsToken,
            value,
        ),
    );
}

export function method(
    name: string,
    parameters: ts.ParameterDeclaration[],
    returnType: ts.TypeNode,
    body: ts.Block,
): ts.MethodDeclaration {
    return ts.createMethod(
        undefined,
        undefined,
        undefined,
        name,
        undefined,
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
