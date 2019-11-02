import * as c from 'contentful-management';
import { every, find } from 'lodash';
import * as ts from 'typescript';
import { Config } from '../config';
import { tsFile } from '../common/files';
import { string } from '../common/scalars';
import { propertySignature, typeMembers } from '../common/types';
import { typenameImportDecl } from './Typename';
import { typeRef } from '../common/refs';
import { exportModifiers } from '../common/modifiers';

export function generateEntry(contentTypes: c.ContentType[], config: Config): ts.SourceFile | null {
    const { generate, fileExtension } = config;

    const interfaceName = generate.entryType;
    if (!interfaceName) return null;

    return tsFile(interfaceName + fileExtension, [
        typenameImportDecl(),
        commonEntryInterfaceDecl(interfaceName, contentTypes),
    ]);
}

function commonEntryInterfaceDecl(
    interfaceName: string,
    contentTypes: c.ContentType[],
): ts.InterfaceDeclaration {
    const commonFields = commonFieldsFromContentTypes(contentTypes);

    const metaFields = typeMembers({
        __typename: typeRef('Typename'),
        __id: string(),
    });

    return ts.createInterfaceDeclaration(
        undefined,
        exportModifiers(),
        interfaceName,
        undefined,
        undefined,
        [...metaFields, ...commonFields],
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
