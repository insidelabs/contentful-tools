import { flatMap, upperFirst } from 'lodash';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { Config } from '../config';
import { StoreExport, Type } from '../types';
import { localTypeAlias, typeAlias } from '../common/aliases';
import { arrayOf } from '../common/arrays';
import { tsFile } from '../common/files';
import { block, fn, parameter } from '../common/functions';
import { interfaceImportDecls, storeImportDecl } from '../common/imports';
import { arrayLiteral, stringLiteral } from '../common/literals';
import { prop } from '../common/props';
import { ref, qualifiedTypeRef } from '../common/refs';
import { stringLiteralType, voidType, string, nullType } from '../common/scalars';
import { union } from '../common/types';
import { assign } from '../common/vars';
import { collapse, spaceAbove } from '../common/whitespace';
import { Nullable, isNonNullable } from '../util/Nullable';

export function generateGetters(
    contentTypeNameMap: Map<string, string>,
    config: Config,
): ts.SourceFile | null {
    const { fileExtension, generate } = config;
    const { assetType, entryType, getters: fileName, fieldGetters } = generate;

    if (!fileName) return null;

    const typeNames = Array.from(contentTypeNameMap.values()).sort();
    const interfaceImports = entryType ? [entryType, ...typeNames] : typeNames;

    return tsFile(fileName, [
        storeImportDecl(StoreExport.ContentfulStore, StoreExport.Content, StoreExport.Resolved),
        interfaceImportDecls([Type.ContentTypeId]),
        interfaceImportDecls(interfaceImports, fileExtension),
        collapse(localeTypeDecls(config)),
        collapse(localeConstDecls(config)),
        store(),
        storeSetter(),
        assetGetters(assetType),
        entryType ? entryGetters(entryType) : null,
        flatMap(typeNames, typeName => {
            return entryGetters(typeName, prop(Type.ContentTypeId, typeName), fieldGetters);
        }),
    ]);
}

enum TypeAlias {
    BaseLocale = 'BaseLocale',
    ExtraLocales = 'ExtraLocales',
    Locales = 'Locales',
}

enum Const {
    baseLocale = 'baseLocale',
    extraLocales = 'extraLocales',
    locales = 'locales',
}

const BaseLocale = ref(TypeAlias.BaseLocale);
const ExtraLocales = ref(TypeAlias.ExtraLocales);
const Locales = ref(TypeAlias.Locales);

function localeTypeDecls(config: Config): ts.DeclarationStatement[] {
    const { base, extra } = config.locales;
    return [
        typeAlias(TypeAlias.BaseLocale, stringLiteralType(base)),
        typeAlias(TypeAlias.ExtraLocales, union(extra.map(stringLiteralType))),
        typeAlias(TypeAlias.Locales, union(ref(TypeAlias.BaseLocale), ref(TypeAlias.ExtraLocales))),
    ];
}

function localeConstDecls(config: Config): ts.VariableStatement[] {
    const { base, extra } = config.locales;
    const baseLiteral = stringLiteral(base);
    const extraLiterals = extra.map(stringLiteral);

    const localesType = ts.createTupleTypeNode([
        BaseLocale,
        ts.createRestTypeNode(arrayOf(ExtraLocales)),
    ]);

    return [
        assign(Const.baseLocale, BaseLocale, baseLiteral),
        assign(Const.extraLocales, arrayOf(ExtraLocales), arrayLiteral(extraLiterals)),
        assign(
            Const.locales,
            localesType,
            arrayLiteral([prop(Const.baseLocale), ts.createSpread(prop(Const.extraLocales))]),
        ),
    ];
}

const Store = ref('Store');

function store(): ts.Statement[] {
    return [
        localTypeAlias('Store', ref(StoreExport.ContentfulStore, BaseLocale, ExtraLocales)),
        assign('store', Store, undefined, ts.NodeFlags.Let, false),
    ].map(spaceAbove);
}

function storeSetter(): ts.FunctionDeclaration {
    return fn(
        'setStore',
        [parameter('contentfulStore', Store)],
        voidType(),
        block(
            ts.createExpressionStatement(
                ts.createBinary(prop('store'), ts.SyntaxKind.EqualsToken, prop('contentfulStore')),
            ),
        ),
    );
}

const params = {
    id: parameter('id', string()),
    locale: parameter('locale', Locales, true),
};

const args = {
    id: prop('id'),
    locale: prop('locale'),
};

function assetGetters(typeName: string): ts.FunctionDeclaration[] {
    const returnType = ref(StoreExport.Content, Type.Asset);

    const getAsset = fn(
        'get' + typeName,
        [params.id, params.locale],
        union(returnType, nullType()),
        getterBlock('getAsset', undefined, [args.id, args.locale]),
    );

    const getAssets = fn(
        'get' + pluralize.plural(typeName),
        [params.locale],
        arrayOf(returnType),
        getterBlock('getAssets', undefined, [args.locale]),
    );

    return [getAsset, getAssets];
}

function entryGetters(
    typeName: string,
    contentTypeId?: ts.Expression,
    fieldGetters: string[] = [],
): ts.FunctionDeclaration[] {
    const typeArg = ref(typeName);
    const returnType = qualifiedTypeRef(StoreExport.Resolved, Type.Entry, typeArg);

    const getEntry = fn(
        'get' + typeName,
        [params.id, params.locale],
        union(returnType, nullType()),
        getterBlock('getEntry', [typeArg], [args.id, args.locale, contentTypeId]),
    );

    const getEntryByFieldValues = fieldGetters.map(fieldName =>
        fn(
            'get' + typeName + 'By' + upperFirst(fieldName),
            [parameter(fieldName, string()), params.locale],
            union(returnType, nullType()),
            getterBlock(
                'getEntryByFieldValue',
                [typeArg],
                [stringLiteral(fieldName), prop(fieldName), args.locale, contentTypeId],
            ),
        ),
    );

    const getEntries = fn(
        'getAll' + pluralize.plural(typeName),
        [params.locale],
        arrayOf(returnType),
        getterBlock('getEntries', [typeArg], [args.locale, contentTypeId]),
    );

    return [getEntry, ...getEntryByFieldValues, getEntries];
}

function getterBlock(
    methodName: string,
    typeArgs: ts.TypeNode[] | undefined,
    args: Nullable<ts.Expression>[],
): ts.Block {
    return block(
        ts.createReturn(
            ts.createCall(prop('store', methodName), typeArgs, args.filter(isNonNullable)),
        ),
    );
}
