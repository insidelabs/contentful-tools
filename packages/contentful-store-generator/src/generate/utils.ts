import { CommonType, FileName, UtilType } from '../schema/types';
import * as ts from 'typescript';
import { arrayOf } from '../common/arrays';
import { tsFile } from '../common/files';
import { ref } from '../common/refs';
import {
    conditional,
    indexed,
    infer,
    keyof,
    mapped,
    parens,
    typeAlias,
    typeLiteral,
    typeParameter,
} from '../common/types';
import { commonImportDecl } from './common';
import { contentTypeIdImportDecl } from './contentTypeId';

export function generateUtils(): ts.SourceFile {
    return tsFile(FileName.utils, [
        commonImportDecl(
            CommonType.Asset,
            CommonType.AssetLink,
            CommonType.Entry,
            CommonType.EntryLink,
        ),
        contentTypeIdImportDecl(),
        resolvedType(),
        fullyResolvedType(),
    ]);
}

export function resolvedType(
    typeName: string = UtilType.Resolved,
    trueType: ts.TypeNode = ref('L'),
) {
    const E = ref('E');
    const Efields = indexed(E, 'fields');
    const EfieldsK = indexed(E, 'fields', ref('K'));
    const EntryLinkL = ref(CommonType.EntryLink, infer('L'));
    const EntryLinkLArray = arrayOf(EntryLinkL);
    const AssetLink = ref(CommonType.AssetLink);
    const AssetLinkArray = arrayOf(AssetLink);
    const Asset = ref(CommonType.Asset);

    return typeAlias(
        typeName,
        typeLiteral({
            sys: indexed(E, 'sys'),
            fields: mapped(
                typeParameter('K', keyof(Efields)),
                conditional(
                    EfieldsK,
                    EntryLinkLArray,
                    arrayOf(trueType),
                    conditional(
                        EfieldsK,
                        EntryLinkL,
                        trueType,
                        conditional(
                            EfieldsK,
                            AssetLinkArray,
                            arrayOf(Asset),
                            conditional(EfieldsK, AssetLink, Asset, EfieldsK),
                        ),
                    ),
                ),
            ),
        }),
        typeParameter('E', ref(CommonType.Entry, ref(CommonType.ContentTypeId))),
    );
}

export function fullyResolvedType(): ts.TypeAliasDeclaration {
    const L = ref('L');
    return resolvedType(
        UtilType.FullyResolved,
        parens(
            conditional(
                L,
                ref(CommonType.Entry, ref(CommonType.ContentTypeId)),
                ref(UtilType.FullyResolved, L),
                L,
            ),
        ),
    );
}
