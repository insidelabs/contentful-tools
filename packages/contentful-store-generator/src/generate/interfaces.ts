import * as c from 'contentful-management';
import * as ts from 'typescript';
import { flatMap } from 'lodash';
import { CommonType, FieldType, LinkType } from '../schema/types';
import { array } from '../common/arrays';
import { enumFromValidation } from '../common/enums';
import { tsFile } from '../common/files';
import { importDecl, importSpec } from '../common/imports';
import { ref } from '../common/refs';
import { any, boolean, number, string } from '../common/scalars';
import { extendsExpression, interfaceDecl, propertySignature, union } from '../common/types';
import { commonImportDecl } from './common';
import { contentTypeIdImportDecl } from './contentTypeId';

export function generateInterface(
    contentType: c.ContentType,
    contentTypeNameMap: Map<string, string>,
): ts.SourceFile {
    const interfaceName = contentTypeNameMap.get(contentType.sys.id) as string;

    const { declarations, commonImports, interfaceImports, fields } = fieldsFromContentType(
        contentType,
        interfaceName,
        contentTypeNameMap,
    );

    return tsFile(interfaceName, [
        commonImportDecl(CommonType.Entry, ...commonImports),
        contentTypeIdImportDecl(),
        ...interfaceImportDecls(interfaceImports),
        contentTypeInterfaceDecl(interfaceName, fields),
        ...(declarations as ts.DeclarationStatement[]),
    ]);
}

function interfaceImportDecls(imports: string[]): ts.ImportDeclaration[] {
    return imports.map(interfaceName =>
        importDecl([importSpec(interfaceName)], `./${interfaceName}`),
    );
}

function contentTypeInterfaceDecl(interfaceName: string, fields: ts.TypeNode) {
    return interfaceDecl(interfaceName, { fields }, undefined, [
        extendsExpression(CommonType.Entry, ref(CommonType.ContentTypeId, interfaceName)),
    ]);
}

function fieldsFromContentType(
    contentType: c.ContentType,
    interfaceName: string,
    contentTypeNameMap: Map<string, string>,
): {
    declarations: ts.Declaration[];
    commonImports: CommonType[];
    interfaceImports: string[];
    fields: ts.TypeNode;
} {
    const allDeclarations: ts.Declaration[] = [];
    const allCommonImports: Set<CommonType> = new Set();
    const allInterfaceImports: Set<string> = new Set();

    const members = contentType.fields.map(field => {
        const { declarations, commonImports, interfaceImports, signature } = contentTypeField(
            field,
            interfaceName,
            contentTypeNameMap,
        );

        for (const d of declarations) allDeclarations.push(d);
        for (const i of commonImports) allCommonImports.add(i);
        for (const i of interfaceImports) allInterfaceImports.add(i);

        return signature;
    });

    return {
        declarations: allDeclarations,
        commonImports: Array.from(allCommonImports).sort(),
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
    commonImports: Set<CommonType>;
    interfaceImports: Set<string>;
    signature: ts.PropertySignature;
} {
    const declarations: ts.Declaration[] = [];
    const commonImports: Set<CommonType> = new Set();
    const interfaceImports: Set<string> = new Set();

    const typeNode = createFieldTypeNode();
    const signature = propertySignature(field.id, field.required, typeNode);

    return {
        declarations,
        commonImports,
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
                commonImports.add(CommonType.Location);
                return ref(CommonType.Location);

            case FieldType.Object:
                commonImports.add(CommonType.JSON);
                return ref(CommonType.JSON);

            case FieldType.RichText:
                return any();

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
        commonImports.add(CommonType.AssetLink);
        return ref(CommonType.AssetLink);
    }

    function entryLink(validations: c.LinkedEntryValidation[]): ts.TypeNode {
        commonImports.add(CommonType.EntryLink);
        if (validations.length > 0) {
            const linkedContentTypes = flatMap(
                validations,
                validation => validation.linkContentType,
            );

            if (linkedContentTypes.length > 0) {
                return ref(
                    CommonType.EntryLink,
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

        return ref(CommonType.EntryLink, ref(CommonType.Entry, ref(CommonType.ContentTypeId)));
    }
}
