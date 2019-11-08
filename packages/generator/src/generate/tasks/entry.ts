import * as c from 'contentful-management';
import { every, find } from 'lodash';
import * as ts from 'typescript';
import { Config } from '../../config';
import { tsFile } from '../common/files';
import { string } from '../common/scalars';
import { interfaceDecl, propertySignature, typeMembers } from '../common/types';
import { typeRef } from '../common/refs';
import { typenameImportDecl } from '../common/imports';

export function generateEntry(config: Config, contentTypes: c.ContentType[]): ts.SourceFile | null {
    return tsFile('Entry', [typenameImportDecl(), commonEntryInterfaceDecl(contentTypes, true)]);
}

export function commonEntryInterfaceDecl(
    contentTypes: c.ContentType[],
    exported: boolean,
): ts.InterfaceDeclaration {
    const metaFields = typeMembers({
        __typename: typeRef('Typename'),
        __id: string(),
    });

    return interfaceDecl(
        exported,
        'Entry',
        undefined,
        undefined,
        metaFields.concat(commonFieldsFromContentTypes(contentTypes)),
    );
}

function commonFieldsFromContentTypes(contentTypes: c.ContentType[]): ts.PropertySignature[] {
    if (contentTypes.length === 0) {
        return [];
    }

    const baseType = contentTypes[0];

    const commonFields = baseType.fields.filter(baseField => {
        return every(contentTypes.slice(1), contentType => {
            return find(contentType.fields, field => {
                return (
                    isSymbolField(field) &&
                    field.id === baseField.id &&
                    field.required === baseField.required &&
                    field.localized === baseField.localized &&
                    field.type === baseField.type &&
                    field.disabled === false &&
                    field.omitted === false
                );
            });
        });
    });

    return commonFields.map(field => propertySignature(field.id, field.required, string()));
}

function isSymbolField(field: c.ContentTypeField): field is c.SymbolField {
    return field.type === 'Symbol';
}
