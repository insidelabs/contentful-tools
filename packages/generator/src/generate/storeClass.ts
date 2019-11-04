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
        config.namespace ? moduleImportDecl(config.namespace) : interfaceImportDecls(typenames),
        ...(!config.namespace
            ? [collapse(localeTypeDecls(config)), collapse(localeConstDecls(config))]
            : [spaceAbove(storeTypeAlias(config))]),
        storeClassDecl(config, config.storeClass, typenames),
    ]);
}

function storeTypeAlias(config: Config): ts.Statement {
    const moduleName = config.namespace;
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
    return parameter(
        'locale',
        config.namespace ? ref(config.namespace, 'Locale') : ref('Locale'),
        config.localeOptional,
    );
}

function assetMethods(config: Config): ts.MethodDeclaration[] {
    const returnType = ref('Asset');

    const getAsset = method(
        'getAsset',
        [parameter('__id', string()), localeParam(config)],
        union(returnType, nullType()),
        storeGetterBlock('getAsset', undefined, [prop('__id'), prop('locale')]),
    );

    const getAssets = method(
        'getAssets',
        [localeParam(config)],
        arrayOf(returnType),
        storeGetterBlock('getAssets', undefined, [prop('locale')]),
    );

    return [getAsset, getAssets];
}

function entryMethods(config: Config, typename: string): ts.MethodDeclaration[] {
    const moduleName = config.namespace;

    const returnType = moduleName ? qualifiedTypeRef(moduleName, typename) : typeRef(typename);
    const typeArg = moduleName ? ref(moduleName, typename) : ref(typename);

    if (config.singletons.includes(typename)) {
        const getSingletonEntry = method(
            'get' + typename,
            [localeParam(config)],
            returnType,
            block(
                ts.createReturn(
                    ts.createElementAccess(
                        ts.createCall(
                            prop('this', 'store', 'getEntries'),
                            [typeArg],
                            [prop('locale'), stringLiteral(typename)],
                        ),
                        0,
                    ),
                ),
            ),
        );

        return [getSingletonEntry];
    }

    const getEntry = config.idField
        ? method(
              'get' + typename,
              [parameter(config.idField, string()), localeParam(config)],
              union(returnType, nullType()),
              storeGetterBlock(
                  'getEntryByFieldValue',
                  [typeArg],
                  [
                      stringLiteral(config.idField),
                      prop(config.idField),
                      prop('locale'),
                      stringLiteral(typename),
                  ],
              ),
          )
        : method(
              'get' + typename,
              [parameter('__id', string()), localeParam(config)],
              union(returnType, nullType()),
              storeGetterBlock(
                  'getEntry',
                  [typeArg],
                  [prop('__id'), prop('locale'), stringLiteral(typename)],
              ),
          );

    const getEntryByFieldValues = config.fieldGetters.map(fieldName =>
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
