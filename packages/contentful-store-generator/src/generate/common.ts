import * as ts from 'typescript';
import { CommonType, FileName, LinkType, SysType } from '../types/input';
import { arrayOf } from '../common/arrays';
import { enumDecl } from '../common/enums';
import { tsFile } from '../common/files';
import { importDecl, importSpec } from '../common/imports';
import { ref } from '../common/refs';
import { any, boolean, number, string, unknown } from '../common/scalars';
import { interfaceDecl, mapped, optional, typeAlias, typeParameter, union } from '../common/types';
import { contentTypeIdImportDecl } from './contentTypeId';

export function generateCommon(): ts.SourceFile {
    return tsFile(FileName.common, [
        contentTypeIdImportDecl(),
        enumDecl(CommonType.SysType, Object.keys(SysType)),
        enumDecl(CommonType.LinkType, Object.keys(LinkType)),
        assetLinkInterface(),
        assetInterface(),
        entryLinkInterface(),
        entryInterface(),
        entrySysInterface(),
        locationInterface(),
        jsonType(),
    ]);
}

export function commonImportDecl(...types: CommonType[]): ts.ImportDeclaration {
    return importDecl(types.sort().map(importSpec), FileName.common);
}

function assetLinkInterface(): ts.InterfaceDeclaration {
    return interfaceDecl(CommonType.AssetLink, {
        sys: {
            type: ref(CommonType.SysType, SysType.Link),
            linkType: ref(CommonType.LinkType, LinkType.Asset),
            id: string(),
        },
    });
}

function assetInterface(): ts.InterfaceDeclaration {
    return interfaceDecl(CommonType.Asset, {
        sys: {
            type: ref(CommonType.SysType, CommonType.Asset),
            id: string(),
        },
        fields: {
            title: optional(string()),
            description: optional(string()),
            file: {
                contentType: string(),
                fileName: string(),
                url: string(),
                details: {
                    size: number(),
                    image: optional({
                        width: number(),
                        height: number(),
                    }),
                },
            },
        },
    });
}

function entryLinkInterface(): ts.InterfaceDeclaration {
    return interfaceDecl(
        CommonType.EntryLink,
        {
            sys: {
                type: ref(CommonType.SysType, SysType.Link),
                linkType: ref(CommonType.LinkType, LinkType.Entry),
                id: string(),
            },
        },
        [typeParameter('E', ref(CommonType.Entry, ref(CommonType.ContentTypeId)))],
    );
}

function entryInterface(): ts.InterfaceDeclaration {
    const entryLink = ref(
        CommonType.EntryLink,
        ref(CommonType.Entry, ref(CommonType.ContentTypeId)),
    );
    const assetLink = ref(CommonType.AssetLink);
    return interfaceDecl(
        CommonType.Entry,
        {
            sys: ref(CommonType.EntrySys, ref('C')),
            fields: mapped(
                typeParameter('K', string()),
                union(
                    entryLink,
                    arrayOf(entryLink),
                    assetLink,
                    arrayOf(assetLink),
                    string(),
                    arrayOf(string()),
                    number(),
                    boolean(),
                    ref(CommonType.Location),
                    ref(CommonType.JSON),
                    unknown(),
                ),
            ),
        },
        [typeParameter('C', ref(CommonType.ContentTypeId))],
    );
}

function entrySysInterface(): ts.InterfaceDeclaration {
    return interfaceDecl(
        CommonType.EntrySys,
        {
            id: string(),
            type: ref(CommonType.SysType, SysType.Entry),
            contentType: { sys: { id: ref('C') } },
        },
        [typeParameter('C', ref(CommonType.ContentTypeId))],
    );
}

function locationInterface(): ts.InterfaceDeclaration {
    return interfaceDecl(CommonType.Location, {
        lon: number(),
        lat: number(),
    });
}

function jsonType(): ts.TypeAliasDeclaration {
    const anyObject = mapped(typeParameter('key', string()), any());
    return typeAlias(CommonType.JSON, union(anyObject, arrayOf(any())));
}
