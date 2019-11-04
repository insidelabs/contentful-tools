import { flatMap } from 'lodash';
import { Config } from '../config';
import * as ts from 'typescript';
import { tsFile } from '../common/files';
import { localeConstDecls, localeTypeDecls } from './locale';
import { collapse, spaceAbove } from '../common/whitespace';
import {
    assignThis,
    block,
    classDecl,
    constructor,
    field,
    method,
    parameter,
} from '../common/classes';
import { ref, typeRef } from '../common/refs';
import { interfaceImportDecls, storeImportDecl } from '../common/imports';
import { localTypeAlias } from '../common/aliases';
import { union } from '../common/types';
import { nullType, string } from '../common/scalars';
import * as pluralize from 'pluralize';
import { arrayOf } from '../common/arrays';
import { prop } from '../common/props';
import { isNonNullable, Nullable } from '../util/Nullable';
import { stringLiteral } from '../common/literals';

export function generateStoreClass(
    contentTypeNameMap: Map<string, string>,
    config: Config,
): ts.SourceFile | null {
    if (!config.generate.storeClass) return null;

    const typenames = Array.from(contentTypeNameMap.values()).sort();

    return tsFile(config.generate.storeClass, [
        storeImportDecl('Asset', 'ContentfulStore'),
        interfaceImportDecls(typenames, config.fileExtension),
        collapse(localeTypeDecls(config)),
        collapse(localeConstDecls(config)),
        spaceAbove(storeTypeAlias()),
        storeClassDecl(config, config.generate.storeClass, typenames),
    ]);
}

function storeTypeAlias(): ts.Statement {
    return localTypeAlias('Store', ref('ContentfulStore', ref('BaseLocale'), ref('ExtraLocale')));
}

function storeClassDecl(config: Config, className: string, typenames: string[]) {
    return classDecl(className, undefined, undefined, [
        field(
            [
                ts.createModifier(ts.SyntaxKind.PrivateKeyword),
                ts.createModifier(ts.SyntaxKind.ReadonlyKeyword),
            ],
            'store',
            typeRef('Store'),
        ),
        constructor(
            [parameter('contentfulStore', typeRef('Store'))],
            block(assignThis('store', ts.createIdentifier('contentfulStore'))),
        ),
        ...assetMethods(config),
        ...flatMap(typenames, typename => entryMethods(config, typename)),
    ]);
}

function params(config: Config) {
    return {
        id: parameter('id', string()),
        locale: parameter('locale', ref('Locale'), config.generate.localeOptional),
    };
}

const args = {
    id: prop('id'),
    locale: prop('locale'),
};

function assetMethods(config: Config): ts.MethodDeclaration[] {
    const returnType = ref('Asset');

    const { id, locale } = params(config);

    const getAsset = method(
        'get' + config.generate.assetType,
        [id, locale],
        union(returnType, nullType()),
        storeGetterBlock('getAsset', undefined, [args.id, args.locale]),
    );

    const getAssets = method(
        'get' + pluralize.plural(config.generate.assetType),
        [locale],
        arrayOf(returnType),
        storeGetterBlock('getAssets', undefined, [args.locale]),
    );

    return [getAsset, getAssets];
}

function entryMethods(config: Config, typename: string): ts.MethodDeclaration[] {
    const returnType = typeRef(typename);
    const typeArg = ref(typename);

    const { id, locale } = params(config);

    const getEntry = method(
        'get' + typename,
        [id, locale],
        union(returnType, nullType()),
        storeGetterBlock('getEntry', [typeArg], [args.id, args.locale, stringLiteral(typename)]),
    );

    // const getEntryByFieldValues = fieldGetters.map(fieldName =>
    //     fn(
    //         'get' + typename + 'By' + upperFirst(fieldName),
    //         [parameter(fieldName, string()), locale],
    //         union(returnType, nullType()),
    //         storeGetterBlock(
    //             'getEntryByFieldValue',
    //             [typeArg],
    //             [stringLiteral(fieldName), prop(fieldName), args.locale, contentTypeId],
    //         ),
    //     ),
    // );

    const getEntries = method(
        'getAll' + pluralize.plural(typename),
        [locale],
        arrayOf(returnType),
        storeGetterBlock('getEntries', [typeArg], [args.locale, stringLiteral(typename)]),
    );

    return [getEntry, /*...getEntryByFieldValues,*/ getEntries];
}

function storeGetterBlock(
    methodName: string,
    typeArgs: ts.TypeNode[] | undefined,
    args: Nullable<ts.Expression>[],
): ts.Block {
    return block(
        ts.createReturn(
            ts.createCall(prop('this', 'store', methodName), typeArgs, args.filter(isNonNullable)),
        ),
    );
}
