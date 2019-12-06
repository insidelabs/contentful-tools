import { flatMap, groupBy, mapValues, uniqBy, upperFirst } from 'lodash';
import * as c from 'contentful-management';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { typeAlias } from '../common/aliases';
import { array } from '../common/arrays';
import { tsFile } from '../common/files';
import {
    commonEntryImportDecl,
    importDecl,
    importSpec,
    interfaceImportDecls,
    storeImportDecl,
} from '../common/imports';
import { extendsExpression } from '../common/heritage';
import { ref, typeRef } from '../common/refs';
import { boolean, number, string, stringLiteralType } from '../common/scalars';
import {
    interfaceDecl,
    propertySignature,
    stringLiteralTypeUnionFromValidation,
    typeMembers,
    union,
} from '../common/types';
import { sortedArray } from '../../util/arrays';
import { ContentTypeNameMap } from '../util/typeNames';
import { Config } from '../../common/Config';

export function generateInterface(
    config: Config,
    contentTypeNameMap: ContentTypeNameMap,
    contentType: c.ContentType,
    type: 'FILE',
): ts.SourceFile;

export function generateInterface(
    config: Config,
    contentTypeNameMap: Map<string, string>,
    contentType: c.ContentType,
    type: 'DECLARATIONS',
): {
    storeImports: Set<string>;
    typeOverrideMap: Map<string, Set<string>>;
    declarations: ts.DeclarationStatement[];
};

export function generateInterface(
    config: Config,
    contentTypeNameMap: Map<string, string>,
    contentType: c.ContentType,
    type: 'FILE' | 'DECLARATIONS',
):
    | ts.SourceFile
    | {
          storeImports: Set<string>;
          typeOverrideMap: Map<string, Set<string>>;
          declarations: ts.DeclarationStatement[];
      }
    | undefined {
    const interfaceName = contentTypeNameMap.get(contentType.sys.id) as string;

    const aliases: ts.TypeAliasDeclaration[] = [];
    const stringTypeAliases: ts.TypeAliasDeclaration[] = [];
    const storeImports: Set<string> = new Set();
    const interfaceImports: Set<string> = new Set();

    const typeOverrides = config.typeOverrides[interfaceName] || {};
    const groupedTypeOverrides = groupBy(typeOverrides, ({ path }) => path);
    const deduplicatedTypeOverrides = mapValues(groupedTypeOverrides, overrides =>
        uniqBy(overrides, ({ type }) => type).map(({ type }) => type),
    );

    const interfaceDeclaration = contentTypeInterfaceDecl();

    if (type === 'FILE') {
        const typeOverrideImports = Object.entries(deduplicatedTypeOverrides).map(([path, types]) =>
            importDecl(types.map(type => importSpec(type)), path),
        );

        return tsFile(interfaceName, [
            storeImports.size > 0 ? storeImportDecl(sortedArray(storeImports)) : null,
            commonEntryImportDecl(),
            interfaceImportDecls(sortedArray(interfaceImports)),
            typeOverrideImports,
            interfaceDeclaration,
            aliases,
            stringTypeAliases,
        ]);
    }

    if (type === 'DECLARATIONS') {
        const typeOverrideMap = new Map(
            Object.entries(deduplicatedTypeOverrides).map(([path, types]) => [
                path,
                new Set(types),
            ]),
        );

        return {
            storeImports,
            typeOverrideMap,
            declarations: [interfaceDeclaration, ...aliases, ...stringTypeAliases],
        };
    }

    function contentTypeInterfaceDecl(): ts.InterfaceDeclaration {
        return interfaceDecl(
            true,
            interfaceName,
            undefined,
            [extendsExpression('Entry')],
            metaFields().concat(fieldsFromContentType()),
        );
    }

    function metaFields(): ts.PropertySignature[] {
        return typeMembers({
            __typename: stringLiteralType(interfaceName),
            __id: string(),
        });
    }

    function fieldsFromContentType(): ts.PropertySignature[] {
        return contentType.fields.map(field => contentTypeField(field));
    }

    function contentTypeField(field: c.ContentTypeField): ts.PropertySignature {
        const typeNode = createFieldTypeNode(field);
        return propertySignature(field.id, field.required, typeNode);
    }

    function createFieldTypeNode(field: c.ContentTypeField): ts.TypeNode {
        if (typeOverrides[field.id]) {
            return ref(typeOverrides[field.id].type);
        }

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
                return textWithValidations(field.id, field.validations);

            case 'Location':
                storeImports.add('Location');
                return ref('Location');

            case 'Object':
                storeImports.add('JSON');
                return ref('JSON');

            case 'RichText':
                storeImports.add('RichText');
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
                        return array(textWithValidations(field.id, field.items.validations));

                    default:
                        throw Error(`${interfaceName}.${field.name}: unknown array type`);
                }

            default:
                throw Error(`${interfaceName}.${field.name}: unknown type`);
        }
    }

    function textWithValidations(id: string, validations: c.TextValidation[]): ts.TypeNode {
        const validation = validations.find(v => v.hasOwnProperty('in')) as
            | c.EnumStringValidation
            | undefined;

        if (validation) {
            const declaration = stringLiteralTypeUnionFromValidation(
                interfaceName,
                id,
                validation.in,
            );
            stringTypeAliases.push(declaration);
            return ref(ts.idText(declaration.name));
        } else {
            return string();
        }
    }

    function linkWithImports(
        id: string,
        linkType: 'Asset' | 'Entry',
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
        storeImports.add('Asset');
        return typeRef('Asset');
    }

    function entryLink(id: string, validations: c.LinkedEntryValidation[]): ts.TypeNode {
        if (validations.length > 0) {
            const linkedContentTypes = flatMap(
                validations,
                validation => validation.linkContentType,
            );

            if (linkedContentTypes.length === 1) {
                const interfaceName = contentTypeNameMap.get(linkedContentTypes[0]) as string;
                interfaceImports.add(interfaceName);
                return typeRef(interfaceName);
            }

            if (linkedContentTypes.length > 1) {
                const unionType = union(
                    linkedContentTypes.map(contentTypeId => {
                        const interfaceName = contentTypeNameMap.get(contentTypeId) as string;
                        interfaceImports.add(interfaceName);
                        return typeRef(interfaceName);
                    }),
                );

                const alias = interfaceName + upperFirst(pluralize.singular(id));
                aliases.push(typeAlias(alias, unionType));
                return typeRef(alias);
            }
        }

        return ref('Entry');
    }
}
