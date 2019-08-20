import { flatMap, upperFirst } from 'lodash';
import * as c from 'contentful-management';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { Config } from '../config';
import { Field, FieldType, LinkType, StoreExport, Type } from '../types';
import { resolvedType, typeAlias } from '../common/aliases';
import { array } from '../common/arrays';
import { enumFromValidation } from '../common/enums';
import { tsFile } from '../common/files';
import { interfaceImportDecls, storeImportDecl } from '../common/imports';
import { extendsExpression } from '../common/heritage';
import { qualifiedTypeRef, ref } from '../common/refs';
import { boolean, number, string } from '../common/scalars';
import { interfaceDecl, propertySignature, union } from '../common/types';
import { sortedArray } from '../util/arrays';
import { contentTypeIdImportDecl } from './ContentTypeId';
import { removeLineAbove } from '../common/whitespace';

export function generateInterface(
    contentType: c.ContentType,
    contentTypeNameMap: Map<string, string>,
    config: Config,
): ts.SourceFile {
    const { fileExtension, resolvedType: resolved } = config;

    const interfaceName = contentTypeNameMap.get(contentType.sys.id) as string;

    const aliases: ts.TypeAliasDeclaration[] = [];
    const enums: ts.EnumDeclaration[] = [];
    const storeImports: Set<StoreExport> = new Set();
    const interfaceImports: Set<string> = new Set();

    const interfaceDeclaration = contentTypeInterfaceDecl();

    return tsFile(interfaceName + fileExtension, [
        storeImportDecl(
            StoreExport.Content,
            resolved && StoreExport.Resolved,
            sortedArray(storeImports),
        ),
        contentTypeIdImportDecl(),
        interfaceImportDecls(sortedArray(interfaceImports), fileExtension),
        resolved && resolvedType(interfaceName, resolved.prefix, resolved.suffix),
        aliases,
        interfaceDeclaration,
        enums,
    ]);

    function contentTypeInterfaceDecl(): ts.InterfaceDeclaration {
        return interfaceDecl(
            interfaceName,
            undefined,
            [
                extendsExpression(
                    StoreExport.Content,
                    Type.Entry,
                    ref(Type.ContentTypeId, interfaceName),
                ),
            ],
            {
                fields: fieldsFromContentType(),
            },
        );
    }

    function fieldsFromContentType(): ts.TypeNode {
        return ts.createTypeLiteralNode(
            contentType.fields.map(field => {
                return contentTypeField(field);
            }),
        );
    }

    function contentTypeField(field: c.ContentTypeField): ts.PropertySignature {
        const typeNode = createFieldTypeNode(field);
        return propertySignature(field.id, field.required, typeNode);
    }

    function createFieldTypeNode(field: c.ContentTypeField): ts.TypeNode {
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
                return textWithEnums(field.id, field.validations);

            case FieldType.Location:
                storeImports.add(StoreExport.Field);
                return ref(StoreExport.Field, Field.Location);

            case FieldType.Object:
                storeImports.add(StoreExport.Field);
                return ref(StoreExport.Field, Field.JSON);

            case FieldType.RichText:
                return ref(StoreExport.Field, Field.RichText);

            case FieldType.Link:
                return linkWithImports(field.id, field.linkType, field.validations);

            case FieldType.Array:
                switch (field.items.type) {
                    case FieldType.Link:
                        return array(
                            linkWithImports(
                                field.id,
                                field.items.linkType,
                                field.items.validations,
                            ),
                        );

                    case FieldType.Symbol:
                        return array(textWithEnums(field.id, field.items.validations));

                    default:
                        throw Error(`${interfaceName}.${field.name}: unknown array type`);
                }

            default:
                throw Error(`${interfaceName}.${field.name}: unknown type`);
        }
    }

    function textWithEnums(id: string, validations: c.TextValidation[]): ts.TypeNode {
        const validation = validations.find(v => v.hasOwnProperty('in')) as
            | c.EnumStringValidation
            | undefined;

        if (validation) {
            const declaration = enumFromValidation(interfaceName, id, validation.in);
            enums.push(declaration);
            return ref(ts.idText(declaration.name));
        } else {
            return string();
        }
    }

    function linkWithImports(
        id: string,
        linkType: LinkType,
        validations: c.LinkedEntryValidation[] | c.LinkedAssetValidation[],
    ): ts.TypeNode {
        switch (linkType) {
            case LinkType.Asset:
                return assetLink(/* validations as c.LinkedAssetValidation[] */);
            case LinkType.Entry:
                return entryLink(id, validations as c.LinkedEntryValidation[]);
        }
    }

    function assetLink(/* validations: c.LinkedAssetValidation[] */): ts.TypeNode {
        storeImports.add(StoreExport.Link);
        return ref(StoreExport.Link, Type.Asset);
    }

    function entryLink(id: string, validations: c.LinkedEntryValidation[]): ts.TypeNode {
        storeImports.add(StoreExport.Link);

        if (validations.length > 0) {
            const linkedContentTypes = flatMap(
                validations,
                validation => validation.linkContentType,
            );

            if (linkedContentTypes.length > 0) {
                const unionType = union(
                    linkedContentTypes.map(contentTypeId => {
                        const interfaceName = contentTypeNameMap.get(contentTypeId) as string;
                        interfaceImports.add(interfaceName);
                        return ref(interfaceName);
                    }),
                );

                if (linkedContentTypes.length > 1) {
                    const alias = interfaceName + upperFirst(pluralize.singular(id));
                    aliases.push(typeAlias(alias, unionType));

                    if (resolved) {
                        const resolvedAlias = resolvedType(alias, resolved.prefix, resolved.suffix);
                        aliases.push(removeLineAbove(resolvedAlias));
                    }

                    return qualifiedTypeRef(StoreExport.Link, Type.Entry, ref(alias));
                } else {
                    return qualifiedTypeRef(StoreExport.Link, Type.Entry, unionType);
                }
            }
        }

        return ref(StoreExport.Link, Type.Entry);
    }
}
