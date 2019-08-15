import * as ts from 'typescript';
import { Type } from '../types';
import { enumDecl } from '../common/enums';
import { tsFile } from '../common/files';
import { importDecl, importSpec } from '../common/imports';

export function generateContentTypeId(contentTypeNameMap: Map<string, string>): ts.SourceFile {
    return tsFile(Type.ContentTypeId, [contentTypeIdEnum(contentTypeNameMap)]);
}

export function contentTypeIdImportDecl(): ts.ImportDeclaration {
    return importDecl([importSpec(Type.ContentTypeId)], Type.ContentTypeId);
}

function contentTypeIdEnum(contentTypeNameMap: Map<string, string>): ts.EnumDeclaration {
    const valuesMap = new Map(
        Array.from(contentTypeNameMap.keys())
            .sort()
            .map(contentTypeId => {
                const interfaceName = contentTypeNameMap.get(contentTypeId) as string;
                return [interfaceName, contentTypeId];
            }),
    );
    return enumDecl(Type.ContentTypeId, valuesMap);
}
