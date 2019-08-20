import * as ts from 'typescript';
import { Config } from '../config';
import { StoreExport, Type } from '../types';
import { typeAlias } from '../common/aliases';
import { tsFile } from '../common/files';
import { storeImportDecl } from '../common/imports';
import { ref } from '../common/refs';
import { collapse } from '../common/whitespace';

export function generateAsset(config: Config): ts.SourceFile | null {
    const typeName = config.generate.assetType;
    if (!typeName) return null;

    const typeAliases = [typeAlias(typeName, ref(StoreExport.Content, Type.Asset))];

    if (config.resolvedType) {
        typeAliases.push(
            typeAlias(
                config.resolvedType.prefix + typeName + config.resolvedType.suffix,
                ref(StoreExport.Content, Type.Asset),
            ),
        );
    }

    return tsFile(config.generate.assetType, [
        storeImportDecl(StoreExport.Content),
        collapse(typeAliases),
    ]);
}