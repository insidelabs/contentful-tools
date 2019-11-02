import * as ts from 'typescript';
import { sortBy } from 'lodash';
import { tsFile } from '../common/files';
import { importDecl, importSpec } from '../common/imports';
import { typeAlias } from '../common/aliases';
import { mappedType, union } from '../common/types';
import { string, stringLiteralType } from '../common/scalars';
import { assign } from '../common/vars';
import { typeRef } from '../common/refs';
import { objectLiteral, stringLiteral } from '../common/literals';

export function generateTypename(contentTypeNameMap: Map<string, string>): ts.SourceFile {
    return tsFile('Typename', [
        typenameTypeAlias(contentTypeNameMap),
        typenameMap(contentTypeNameMap),
    ]);
}

export function typenameImportDecl(): ts.ImportDeclaration {
    return importDecl([importSpec('Typename')], 'Typename');
}

function typenameTypeAlias(contentTypeNameMap: Map<string, string>): ts.TypeAliasDeclaration {
    return typeAlias(
        'Typename',
        union(
            Array.from(contentTypeNameMap.values())
                .sort()
                .map(stringLiteralType),
        ),
    );
}

function typenameMap(contentTypeNameMap: Map<string, string>): ts.VariableStatement {
    return assign(
        'typenameMap',
        mappedType('K', string(), typeRef('Typename')),
        objectLiteral(
            sortBy(Array.from(contentTypeNameMap.entries()), '1').map(([key, value]) =>
                ts.createPropertyAssignment(key, stringLiteral(value)),
            ),
        ),
    );
}
