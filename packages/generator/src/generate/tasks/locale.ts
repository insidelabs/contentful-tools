import { Config } from '../../config';
import * as ts from 'typescript';
import { typeAlias } from '../common/aliases';
import { stringLiteralType } from '../common/scalars';
import { union } from '../common/types';
import { ref } from '../common/refs';
import { arrayOf } from '../common/arrays';
import { assign } from '../common/vars';
import { arrayLiteral, stringLiteral } from '../common/literals';
import { prop } from '../common/props';

export function localeTypeDecls(config: Config): ts.DeclarationStatement[] {
    const { base, extra } = config.locales;
    return [
        typeAlias('BaseLocale', stringLiteralType(base)),
        typeAlias('ExtraLocale', union(extra.map(stringLiteralType))),
        typeAlias('Locale', union(ref('BaseLocale'), ref('ExtraLocale'))),
    ];
}

export function localeConstDecls(config: Config): ts.VariableStatement[] {
    const { base, extra } = config.locales;

    const localesType = ts.createTupleTypeNode([
        ref('BaseLocale'),
        ts.createRestTypeNode(arrayOf(ref('ExtraLocale'))),
    ]);

    return [
        assign('baseLocale', ref('BaseLocale'), stringLiteral(base)),
        assign('extraLocales', arrayOf(ref('ExtraLocale')), arrayLiteral(extra.map(stringLiteral))),
        assign(
            'locales',
            localesType,
            arrayLiteral([prop('baseLocale'), ts.createSpread(prop('extraLocales'))]),
        ),
    ];
}
