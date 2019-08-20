import { flatMap } from 'lodash';
import * as pluralize from 'pluralize';
import * as ts from 'typescript';
import { Config } from '../config';
import { StoreExport, Type } from '../types';
import { arrayOf } from '../common/arrays';
import { block, classDecl, constructor, method, parameter } from '../common/classes';
import { tsFile } from '../common/files';
import { interfaceImportDecls, storeImportDecl } from '../common/imports';
import { priv, readonly } from '../common/modifiers';
import { prop } from '../common/props';
import { qualifiedTypeRef, ref, typeParameter } from '../common/refs';
import { nullType, string } from '../common/scalars';
import { union } from '../common/types';
import { newLineAbove } from '../common/whitespace';
import { isNonNullable, Nullable } from '../util/Nullable';

export function generateContentStore(
    contentTypeNameMap: Map<string, string>,
    config: Config,
): ts.SourceFile | null {
    const { commonEntryType, contentStoreClass: className } = config.generate;
    if (!className) return null;

    const typeNames = Array.from(contentTypeNameMap.values()).sort();
    const interfaceImports = commonEntryType
        ? [Type.ContentTypeId, commonEntryType, ...typeNames]
        : [Type.ContentTypeId, ...typeNames];

    return tsFile(className, [
        storeImportDecl(StoreExport.ContentfulStore, StoreExport.Content, StoreExport.Resolved),
        ...interfaceImportDecls(interfaceImports),
        storeClass(className, typeNames, config),
    ]);
}

function storeClass(className: string, typeNames: string[], config: Config) {
    const typeParam = typeParameter('L', string());
    const L = ref('L');

    const classConstructor = constructor([
        parameter(
            'store',
            ref(StoreExport.ContentfulStore, L, L),
            false,
            priv(),
            readonly(),
        ),
    ]);

    let methods: ts.MethodDeclaration[] = [];

    const { assetType, commonEntryType } = config.generate;
    if (assetType) methods = methods.concat(assetGetters(assetType));
    if (commonEntryType) methods = methods.concat(entryGetters(commonEntryType));

    methods = methods.concat(
        flatMap(typeNames, typeName => {
            return entryGetters(typeName, prop(Type.ContentTypeId, typeName));
        }),
    );

    return classDecl(className, [typeParam], undefined, [
        classConstructor,
        ...methods.map(newLineAbove),
    ]);
}

const params = {
    id: parameter('id', string()),
    locale: parameter('locale', ref('L'), true),
};

const args = {
    id: prop('id'),
    locale: prop('locale'),
};

function assetGetters(typeName: string): [ts.MethodDeclaration, ts.MethodDeclaration] {
    const returnType = ref(StoreExport.Content, Type.Asset);

    const getAsset = method(
        'get' + typeName,
        [params.id, params.locale],
        union(returnType, nullType()),
        getterBlock('getAsset', undefined, [args.id, args.locale]),
    );

    const getAssets = method(
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
): [ts.MethodDeclaration, ts.MethodDeclaration] {
    const typeArg = ref(typeName);
    const returnType = qualifiedTypeRef(StoreExport.Resolved, Type.Entry, typeArg);

    const getEntry = method(
        'get' + typeName,
        [params.id, params.locale],
        union(returnType, nullType()),
        getterBlock('getEntry', [typeArg], [args.id, args.locale, contentTypeId]),
    );

    const getEntries = method(
        'getAll' + pluralize.plural(typeName),
        [params.locale],
        arrayOf(returnType),
        getterBlock('getEntries', [typeArg], [args.locale, contentTypeId]),
    );

    return [getEntry, getEntries];
}

function getterBlock(
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
