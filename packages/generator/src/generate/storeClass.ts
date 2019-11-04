import { flatMap, upperFirst } from 'lodash';
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
import { qualifiedTypeRef, ref, typeRef } from '../common/refs';
import { interfaceImportDecls, moduleImportDecl, storeImportDecl } from '../common/imports';
import { localTypeAlias } from '../common/aliases';
import { union } from '../common/types';
import { nullType, string } from '../common/scalars';
import * as pluralize from 'pluralize';
import { arrayOf } from '../common/arrays';
import { prop } from '../common/props';
import { isNonNullable, Nullable } from '../util/Nullable';
import { stringLiteral } from '../common/literals';

export function generateStoreClass(
    config: Config,
    contentTypeNameMap: Map<string, string>,
): ts.SourceFile | null {
    const typenames = Array.from(contentTypeNameMap.values()).sort();

    return tsFile(config.storeClass, [
        storeImportDecl('Asset', 'ContentfulStore'),
        config.generate.moduleName
            ? moduleImportDecl(config.generate.moduleName)
            : interfaceImportDecls(typenames, config.fileExtension),
        ...(!config.generate.moduleName
            ? [collapse(localeTypeDecls(config)), collapse(localeConstDecls(config))]
            : [spaceAbove(storeTypeAlias(config))]),
        storeClassDecl(config, config.storeClass, typenames),
    ]);
}

function storeTypeAlias(config: Config): ts.Statement {
    const moduleName = config.generate.moduleName;
    return moduleName
        ? localTypeAlias(
              'Store',
              ref('ContentfulStore', ref(moduleName, 'BaseLocale'), ref(moduleName, 'ExtraLocale')),
          )
        : localTypeAlias('Store', ref('ContentfulStore', ref('BaseLocale'), ref('ExtraLocale')));
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

function localeParam(config: Config): ts.ParameterDeclaration {
    const { moduleName, localeOptional } = config.generate;
    return parameter(
        'locale',
        moduleName ? ref(moduleName, 'Locale') : ref('Locale'),
        localeOptional,
    );
}

function assetMethods(config: Config): ts.MethodDeclaration[] {
    const returnType = ref('Asset');

    const getAsset = method(
        'get' + config.generate.assetType,
        [parameter('__id', string()), localeParam(config)],
        union(returnType, nullType()),
        storeGetterBlock('getAsset', undefined, [prop('__id'), prop('locale')]),
    );

    const getAssets = method(
        'get' + pluralize.plural(config.generate.assetType),
        [localeParam(config)],
        arrayOf(returnType),
        storeGetterBlock('getAssets', undefined, [prop('locale')]),
    );

    return [getAsset, getAssets];
}

function entryMethods(config: Config, typename: string): ts.MethodDeclaration[] {
    const moduleName = config.generate.moduleName;

    const returnType = moduleName ? qualifiedTypeRef(moduleName, typename) : typeRef(typename);
    const typeArg = moduleName ? ref(moduleName, typename) : ref(typename);

    const getEntry = method(
        'get' + typename,
        [parameter('__id', string()), localeParam(config)],
        union(returnType, nullType()),
        storeGetterBlock(
            'getEntry',
            [typeArg],
            [prop('__id'), prop('locale'), stringLiteral(typename)],
        ),
    );

    const getEntryByFieldValues = config.generate.fieldGetters.map(fieldName =>
        method(
            'get' + typename + 'By' + upperFirst(fieldName),
            [parameter(fieldName, string()), localeParam(config)],
            union(returnType, nullType()),
            storeGetterBlock(
                'getEntryByFieldValue',
                [typeArg],
                [
                    stringLiteral(fieldName),
                    prop(fieldName),
                    prop('locale'),
                    stringLiteral(typename),
                ],
            ),
        ),
    );

    const getEntries = method(
        'getAll' + pluralize.plural(typename),
        [localeParam(config)],
        arrayOf(returnType),
        storeGetterBlock('getEntries', [typeArg], [prop('locale'), stringLiteral(typename)]),
    );

    return [getEntry, ...getEntryByFieldValues, getEntries];
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
