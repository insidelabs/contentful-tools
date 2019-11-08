import * as ts from 'typescript';
import { Config } from '../config';
import { ContentTypeWhitelist } from '../util/typeNames';
import { tsFile } from '../common/files';
import { string } from '../common/scalars';
import { assign } from '../common/vars';
import { arrayLiteral, stringLiteral } from '../common/literals';
import { arrayOf } from '../common/arrays';

export function generateWhitelist(
    config: Config,
    contentTypeWhitelist: ContentTypeWhitelist,
): ts.SourceFile {
    return tsFile('ContentTypeWhitelist', [whitelistStatement(contentTypeWhitelist)]);
}

export function whitelistStatement(whitelist: ContentTypeWhitelist): ts.VariableStatement {
    return assign(
        'contentTypeWhitelist',
        arrayOf(string()),
        arrayLiteral(whitelist.map(stringLiteral)),
    );
}
