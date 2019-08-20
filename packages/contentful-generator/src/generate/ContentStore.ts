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
import { isNonNullable } from '../util/Nullable';

export function generateContentStore(
    contentTypeNameMap: Map<string, string>,
    config: Config,
): ts.SourceFile | null {
    const className = config.generate.contentStore;
    if (!className) return null;

    const typeNames = Array.from(contentTypeNameMap.values()).sort();
    const interfaceImports = config.generate.commonEntry
        ? [Type.ContentTypeId, config.generate.commonEntry, ...typeNames]
        : [Type.ContentTypeId, ...typeNames];

    return tsFile(className, [
        storeImportDecl(StoreExport.ContentfulStore, StoreExport.Content, StoreExport.Resolved),
        ...interfaceImportDecls(interfaceImports),
        storeClass(className, typeNames, config),
    ]);
}

function storeClass(className: string, typeNames: string[], config: Config) {
    const LParam = typeParameter('L', string());
    const L = ref('L');

    const commonEntryGetters = config.generate.commonEntry
        ? getEntryAndEntries(config.generate.commonEntry, undefined)
        : [];

    return classDecl(className, [LParam], undefined, [
        constructor([
            parameter('store', ref(StoreExport.ContentfulStore, L, L), false, priv(), readonly()),
        ]),
        ...commonEntryGetters,
        ...flatMap(typeNames, typeName => {
            return getEntryAndEntries(typeName, prop(Type.ContentTypeId, typeName));
        }),
    ]);
}

function getEntryAndEntries(
    typeName: string,
    contentTypeId?: ts.Expression,
): [ts.ClassElement, ts.ClassElement] {
    const params = {
        id: parameter('id', string()),
        locale: parameter('locale', ref('L'), true),
    };

    const props = {
        id: prop('id'),
        locale: prop('locale'),
    };

    const typeRef = ref(typeName);
    const resolvedType = qualifiedTypeRef(StoreExport.Resolved, Type.Entry, typeRef);

    const getEntry = method(
        'get' + typeName,
        [params.id, params.locale],
        union(resolvedType, nullType()),
        block(
            ts.createReturn(
                ts.createCall(
                    prop('this', 'store', 'getEntry'),
                    [typeRef],
                    [props.id, props.locale, contentTypeId].filter(isNonNullable),
                ),
            ),
        ),
    );

    const getEntries = method(
        'getAll' + pluralize.plural(typeName),
        [params.locale],
        arrayOf(resolvedType),
        block(
            ts.createReturn(
                ts.createCall(
                    prop('this', 'store', 'getEntries'),
                    [typeRef],
                    [props.locale, contentTypeId].filter(isNonNullable),
                ),
            ),
        ),
    );

    return [newLineAbove(getEntry), newLineAbove(getEntries)];
}
