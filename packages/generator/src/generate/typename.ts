import * as ts from 'typescript';
import { sortBy } from 'lodash';
import { tsFile } from '../common/files';
import { typeAlias } from '../common/aliases';
import { mappedType, union } from '../common/types';
import { string, stringLiteralType } from '../common/scalars';
import { assign } from '../common/vars';
import { typeRef } from '../common/refs';
import { objectLiteral, stringLiteral } from '../common/literals';
import { Config } from '../config';

export function generateTypename(
    config: Config,
    typenameMap: Map<string, string>,
): ts.SourceFile {
    const { fileExtension } = config;
    return tsFile('Typename' + fileExtension, [
        typenameTypeAlias(typenameMap),
        typenameMapStatement(typenameMap),
    ]);
}

export function typenameTypeAlias(typenameMap: Map<string, string>): ts.TypeAliasDeclaration {
    return typeAlias(
        'Typename',
        union(
            Array.from(typenameMap.values())
                .sort()
                .map(stringLiteralType),
        ),
    );
}

export function typenameMapStatement(typenameMap: Map<string, string>): ts.VariableStatement {
    return assign(
        'typenameMap',
        mappedType('K', string(), typeRef('Typename')),
        objectLiteral(
            sortBy(Array.from(typenameMap.entries()), '1').map(([key, value]) =>
                ts.createPropertyAssignment(key, stringLiteral(value)),
            ),
        ),
    );
}