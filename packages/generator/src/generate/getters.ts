import { flatMap, upperFirst } from 'lodash';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { Config } from '../config';
import { localTypeAlias, typeAlias } from '../common/aliases';
import { arrayOf } from '../common/arrays';
import { tsFile } from '../common/files';
import { block, fn, parameter } from '../common/functions';
import { interfaceImportDecls, storeImportDecl } from '../common/imports';
import { arrayLiteral, stringLiteral } from '../common/literals';
import { prop } from '../common/props';
import { ref, typeRef } from '../common/refs';
import { nullType, string, stringLiteralType, voidType } from '../common/scalars';
import { union } from '../common/types';
import { assign } from '../common/vars';
import { collapse, spaceAbove } from '../common/whitespace';
import { isNonNullable, Nullable } from '../util/Nullable';

export function generateGetters(
    contentTypeNameMap: Map<string, string>,
    config: Config,
): ts.SourceFile | null {
    const { fileExtension, generate } = config;
    const { entryType, getters: fileName, fieldGetters } = generate;

    if (!fileName) return null;

    const typeNames = Array.from(contentTypeNameMap.values()).sort();
    const interfaceImports = entryType ? [entryType, ...typeNames] : typeNames;

    return tsFile(fileName, [
        storeImportDecl('Asset', 'ContentfulStore'),
        interfaceImportDecls(interfaceImports, fileExtension),
        collapse(localeTypeDecls(config)),
        collapse(localeConstDecls(config)),
        store(),
        storeSetter(),
        assetGetters(config),
        entryType ? entryGetters(config, entryType) : null,
        flatMap(typeNames, typeName => {
            return entryGetters(config, typeName, stringLiteral(typeName), fieldGetters);
        }),
    ]);
}

function localeTypeDecls(config: Config): ts.DeclarationStatement[] {
    const { base, extra } = config.locales;
    return [
        typeAlias('BaseLocale', stringLiteralType(base)),
        typeAlias('ExtraLocale', union(extra.map(stringLiteralType))),
        typeAlias('Locale', union(ref('BaseLocale'), ref('ExtraLocale'))),
    ];
}

function localeConstDecls(config: Config): ts.VariableStatement[] {
    const { base, extra } = config.locales;

    const localesType = ts.createTupleTypeNode([
        ref('BaseLocale'),
        ts.createRestTypeNode(arrayOf(ref('ExtraLocale'))),
    ]);

    return [
        assign('baseLocale', ref('BaseLocale'), stringLiteral(base)),
        assign(
            'extraLocales',
            arrayOf(ref('ExtraLocale')),
            arrayLiteral(extra.map(stringLiteral)),
        ),
        assign(
            'locales',
            localesType,
            arrayLiteral([prop('baseLocale'), ts.createSpread(prop('extraLocales'))]),
        ),
    ];
}

const Store = ref('Store');

function store(): ts.Statement[] {
    return [
        localTypeAlias(
            'Store',
            ref('ContentfulStore', ref('BaseLocale'), ref('ExtraLocale')),
        ),
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

function assetGetters(config: Config): ts.FunctionDeclaration[] {
    const returnType = ref('Asset');

    const { id, locale } = params(config);

    const getAsset = fn(
        'get' + config.generate.assetType,
        [id, locale],
        union(returnType, nullType()),
        getterBlock('getAsset', undefined, [args.id, args.locale]),
    );

    const getAssets = fn(
        'get' + pluralize.plural(config.generate.assetType),
        [locale],
        arrayOf(returnType),
        getterBlock('getAssets', undefined, [args.locale]),
    );

    return [getAsset, getAssets];
}

function entryGetters(
    config: Config,
    typeName: string,
    contentTypeId?: ts.Expression,
    fieldGetters: string[] = [],
): ts.FunctionDeclaration[] {
    const returnType = typeRef(typeName);
    const typeArg = ref(typeName);

    const { id, locale } = params(config);

    const getEntry = fn(
        'get' + typeName,
        [id, locale],
        union(returnType, nullType()),
        getterBlock('getEntry', [typeArg], [args.id, args.locale, contentTypeId]),
    );

    const getEntryByFieldValues = fieldGetters.map(fieldName =>
        fn(
            'get' + typeName + 'By' + upperFirst(fieldName),
            [parameter(fieldName, string()), locale],
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
        [locale],
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
