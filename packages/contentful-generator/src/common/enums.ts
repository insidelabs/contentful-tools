import camelCase from 'camelcase';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { exportModifiers } from './exports';

export function enumFromValidation(
    interfaceName: string,
    fieldName: string,
    values: string[],
): ts.EnumDeclaration {
    const name = camelCase([interfaceName, pluralize.singular(fieldName)], {
        pascalCase: true,
    });

    return enumDecl(
        name,
        new Map(
            values.map(value => {
                const safeName = camelCase(
                    value
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^A-Za-z ]/g, ' '),
                );
                return [safeName, value];
            }),
        ),
    );
}

export function enumDecl(
    name: string,
    values: Array<string> | Map<string, string>,
): ts.EnumDeclaration {
    return ts.createEnumDeclaration(
        undefined,
        exportModifiers(),
        name,
        Array.isArray(values)
            ? values.map(value => enumMember(value, value))
            : Array.from(values).map(([name, value]) => enumMember(name, value)),
    );
}

function enumMember(name: string | ts.PropertyName, value: string): ts.EnumMember {
    return ts.createEnumMember(name, ts.createStringLiteral(value));
}
