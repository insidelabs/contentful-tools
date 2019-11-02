import * as c from 'contentful-management';
import { every, find } from 'lodash';
import * as ts from 'typescript';
import { Config } from '../config';
import { resolvedType } from '../common/aliases';
import { tsFile } from '../common/files';
import { extendsExpression } from '../common/heritage';
import { storeImportDecl } from '../common/imports';
import { ref } from '../common/refs';
import { string } from '../common/scalars';
import { interfaceDecl, propertySignature } from '../common/types';
import { contentTypeIdImportDecl } from './Typename';

export function generateEntry(contentTypes: c.ContentType[], config: Config): ts.SourceFile | null {
    const { generate, fileExtension, resolvedType: resolved } = config;

    const interfaceName = generate.entryType;
    if (!interfaceName) return null;

    return tsFile(interfaceName + fileExtension, [
        storeImportDecl('Content', resolved && 'Resolved'),
        contentTypeIdImportDecl(),
        resolved && resolvedType(interfaceName, resolved.prefix, resolved.suffix),
        commonEntryInterfaceDecl(interfaceName, contentTypes),
    ]);
}

function commonEntryInterfaceDecl(
    interfaceName: string,
    contentTypes: c.ContentType[],
): ts.InterfaceDeclaration {
    const fields = commonFieldsFromContentTypes(contentTypes);
    return interfaceDecl(
        interfaceName,
        undefined,
        [extendsExpression('Content', 'Entry', ref('ContentTypeId'))],
        { fields },
    );
}

function commonFieldsFromContentTypes(contentTypes: c.ContentType[]): ts.TypeNode {
    if (contentTypes.length === 0) {
        return ts.createTypeLiteralNode([]);
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

    const signatures = commonFields.map(field => {
        return propertySignature(field.id, field.required, string());
    });

    return ts.createTypeLiteralNode(signatures);
}

function isSymbolField(field: c.ContentTypeField): field is c.SymbolField {
    return field.type === 'Symbol';
}
