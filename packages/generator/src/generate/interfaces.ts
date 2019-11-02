import { flatMap, upperFirst } from 'lodash';
import * as c from 'contentful-management';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { Config } from '../config';
import { LinkType } from '../types';
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
import { typenameImportDecl } from './Typename';
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
    const storeImports: Set<string> = new Set();
    const interfaceImports: Set<string> = new Set();

    const interfaceDeclaration = contentTypeInterfaceDecl();

    return tsFile(interfaceName + fileExtension, [
        storeImportDecl(sortedArray(storeImports)),
        typenameImportDecl(),
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
            [extendsExpression('Content', 'Entry', ref('ContentTypeId', interfaceName))],
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
            case 'Boolean':
                return boolean();

            case 'Date':
                return string();

            case 'Integer':
            case 'Number':
                return number();

            case 'Symbol':
            case 'Text':
                return textWithEnums(field.id, field.validations);

            case 'Location':
                storeImports.add('Location');
                return ref('Location');

            case 'Object':
                storeImports.add('JSON');
                return ref('JSON');

            case 'RichText':
                return ref('RichText');

            case 'Link':
                return linkWithImports(field.id, field.linkType, field.validations);

            case 'Array':
                switch (field.items.type) {
                    case 'Link':
                        return array(
                            linkWithImports(
                                field.id,
                                field.items.linkType,
                                field.items.validations,
                            ),
                        );

                    case 'Symbol':
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
            case 'Asset':
                return assetLink(/* validations as c.LinkedAssetValidation[] */);
            case 'Entry':
                return entryLink(id, validations as c.LinkedEntryValidation[]);
        }
    }

    function assetLink(/* validations: c.LinkedAssetValidation[] */): ts.TypeNode {
        storeImports.add('Link');
        return ref('Link', 'Asset');
    }

    function entryLink(id: string, validations: c.LinkedEntryValidation[]): ts.TypeNode {
        storeImports.add('Link');

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

                    return qualifiedTypeRef('Link', 'Entry', ref(alias));
                } else {
                    return qualifiedTypeRef('Link', 'Entry', unionType);
                }
            }
        }

        return ref('Link', 'Entry');
    }
}
