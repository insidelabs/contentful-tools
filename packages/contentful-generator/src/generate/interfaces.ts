import * as c from 'contentful-management';
import * as ts from 'typescript';
import { flatMap } from 'lodash';
import { Field, FieldType, FileName, LinkType, Namespace, Type } from '../types';
import { array } from '../common/arrays';
import { enumFromValidation } from '../common/enums';
import { tsFile } from '../common/files';
import { importDecl, importSpec } from '../common/imports';
import { qualifiedTypeRef, ref } from '../common/refs';
import { boolean, number, string } from '../common/scalars';
import { extendsExpression, interfaceDecl, propertySignature, union } from '../common/types';
import { contentTypeIdImportDecl } from './contentTypeId';

export function generateInterface(
    contentType: c.ContentType,
    contentTypeNameMap: Map<string, string>,
): ts.SourceFile {
    const interfaceName = contentTypeNameMap.get(contentType.sys.id) as string;

    const { declarations, storeImports, interfaceImports, fields } = fieldsFromContentType(
        contentType,
        interfaceName,
        contentTypeNameMap,
    );

    return tsFile(interfaceName, [
        storeImportDecl(Namespace.Content, ...storeImports),
        contentTypeIdImportDecl(),
        ...interfaceImportDecls(interfaceImports),
        contentTypeInterfaceDecl(interfaceName, fields),
        ...(declarations as ts.DeclarationStatement[]),
    ]);
}

function storeImportDecl(...namespaces: Namespace[]): ts.ImportDeclaration {
    return importDecl(namespaces.sort().map(importSpec), FileName.store, '', false);
}

function interfaceImportDecls(imports: string[]): ts.ImportDeclaration[] {
    return imports.map(interfaceName =>
        importDecl([importSpec(interfaceName)], `./${interfaceName}`),
    );
}

function contentTypeInterfaceDecl(interfaceName: string, fields: ts.TypeNode) {
    return interfaceDecl(interfaceName, { fields }, undefined, [
        extendsExpression(Namespace.Content, Type.Entry, ref(Type.ContentTypeId, interfaceName)),
    ]);
}

function fieldsFromContentType(
    contentType: c.ContentType,
    interfaceName: string,
    contentTypeNameMap: Map<string, string>,
): {
    declarations: ts.Declaration[];
    storeImports: Namespace[];
    interfaceImports: string[];
    fields: ts.TypeNode;
} {
    const allDeclarations: ts.Declaration[] = [];
    const allNamespaceImports: Set<Namespace> = new Set();
    const allInterfaceImports: Set<string> = new Set();

    const members = contentType.fields.map(field => {
        const { declarations, storeImports, interfaceImports, signature } = contentTypeField(
            field,
            interfaceName,
            contentTypeNameMap,
        );

        for (const d of declarations) allDeclarations.push(d);
        for (const i of storeImports) allNamespaceImports.add(i);
        for (const i of interfaceImports) allInterfaceImports.add(i);

        return signature;
    });

    return {
        declarations: allDeclarations,
        storeImports: Array.from(allNamespaceImports).sort(),
        interfaceImports: Array.from(allInterfaceImports).sort(),
        fields: ts.createTypeLiteralNode(members),
    };
}

function contentTypeField(
    field: c.ContentTypeField,
    interfaceName: string,
    contentTypeNameMap: Map<string, string>,
): {
    declarations: ts.Declaration[];
    storeImports: Set<Namespace>;
    interfaceImports: Set<string>;
    signature: ts.PropertySignature;
} {
    const declarations: ts.Declaration[] = [];
    const storeImports: Set<Namespace> = new Set();
    const interfaceImports: Set<string> = new Set();

    const typeNode = createFieldTypeNode();
    const signature = propertySignature(field.id, field.required, typeNode);

    return {
        declarations,
        storeImports,
        interfaceImports,
        signature,
    };

    function createFieldTypeNode(): ts.TypeNode {
        switch (field.type) {
            case FieldType.Boolean:
                return boolean();

            case FieldType.Date:
                return string();

            case FieldType.Integer:
            case FieldType.Number:
                return number();

            case FieldType.Symbol:
            case FieldType.Text:
                return textWithEnums(field.validations);

            case FieldType.Location:
                storeImports.add(Namespace.Field);
                return ref(Namespace.Field, Field.Location);

            case FieldType.Object:
                storeImports.add(Namespace.Field);
                return ref(Namespace.Field, Field.JSON);

            case FieldType.RichText:
                return ref(Namespace.Field, Field.RichText);

            case FieldType.Link:
                return linkWithImports(field.linkType, field.validations);

            case FieldType.Array:
                switch (field.items.type) {
                    case FieldType.Link:
                        return array(
                            linkWithImports(field.items.linkType, field.items.validations),
                        );

                    case FieldType.Symbol:
                        return array(textWithEnums(field.items.validations));

                    default:
                        return throwBadArrayNode();
                }

            default:
                return throwBadTypeNode();
        }

        function throwBadArrayNode(): never {
            throw Error(
                `Failed to resolve array type for field ${field.name} on interface ${interfaceName}`,
            );
        }

        function throwBadTypeNode(): never {
            throw Error(
                `Failed to resolve node type for field ${field.name} on interface ${interfaceName}`,
            );
        }
    }

    function textWithEnums(validations: c.TextValidation[]): ts.TypeNode {
        const validation = validations.find(v => v.hasOwnProperty('in')) as
            | c.EnumStringValidation
            | undefined;

        if (validation) {
            const declaration = enumFromValidation(interfaceName, field.id, validation.in);
            declarations.push(declaration);
            return ref(ts.idText(declaration.name));
        } else {
            return string();
        }
    }

    function linkWithImports(
        linkType: LinkType,
        validations: c.LinkedEntryValidation[] | c.LinkedAssetValidation[],
    ): ts.TypeNode {
        switch (linkType) {
            case LinkType.Asset:
                return assetLink(validations as c.LinkedAssetValidation[]);
            case LinkType.Entry:
                return entryLink(validations as c.LinkedEntryValidation[]);
        }
    }

    function assetLink(validations: c.LinkedAssetValidation[]): ts.TypeNode {
        storeImports.add(Namespace.Link);
        return ref(Namespace.Link, Type.Asset);
    }

    function entryLink(validations: c.LinkedEntryValidation[]): ts.TypeNode {
        storeImports.add(Namespace.Link);
        if (validations.length > 0) {
            const linkedContentTypes = flatMap(
                validations,
                validation => validation.linkContentType,
            );

            if (linkedContentTypes.length > 0) {
                return qualifiedTypeRef(
                    Namespace.Link,
                    Type.Entry,
                    union(
                        linkedContentTypes.map(contentTypeId => {
                            const interfaceName = contentTypeNameMap.get(contentTypeId) as string;
                            interfaceImports.add(interfaceName);
                            return ref(interfaceName);
                        }),
                    ),
                );
            }
        }

        return ref(Namespace.Link, Type.Entry);
    }
}
