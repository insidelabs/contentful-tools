import { Environment } from 'contentful-management';
import { writeFileSync } from 'fs';
import { sync as mkdirSync } from 'mkdirp';
import { resolve } from 'path';
import * as prettier from 'prettier';
import * as rimraf from 'rimraf';
import { Observer } from 'rxjs';
import * as ts from 'typescript';

import { Config } from './config';
import { resolveTypeNames } from './typeNames';

import { processNewLines } from './common/whitespace';
import { generateContentTypeId } from './generate/ContentTypeId';
import { generateEntry } from './generate/Entry';
import { generateGetters } from './generate/getters';
import { generateInterface } from './generate/interfaces';

type Logger = (s: string) => void;
const defaultLogger: Logger = (s: string) => console.log(s);

export async function generate(
    env: Environment<string>,
    config: Config,
    log: Logger = defaultLogger,
): Promise<void> {
    const contentTypes = (await env.getContentTypes()).items;
    if (config.clean) rimraf.sync(config.outDir);
    mkdirSync(config.outDir);

    const resolvedNameMap = resolveTypeNames(contentTypes, config);
    const allFiles = [
        generateContentTypeId(resolvedNameMap),
        generateEntry(contentTypes, config),
        generateGetters(resolvedNameMap, config),
        ...contentTypes.map(contentType => generateInterface(contentType, resolvedNameMap, config)),
    ];

    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    });

    const format = await getFormatter(config.outDir);

    for (const sourceFile of allFiles) {
        if (!sourceFile) continue;
        let result = printer.printFile(sourceFile);

        result = format(result);
        result = processNewLines(result);

        writeFileSync(resolve(config.outDir, sourceFile.fileName), result);
        log(`Generated ${sourceFile.fileName}`);
    }
}

async function getFormatter(outDir: string) {
    const resolved = await prettier.resolveConfig(outDir);
    const options = { ...resolved, parser: 'typescript' as 'typescript' };
    return (source: string) => prettier.format(source, options);
}

export function generateWithObserver(
    env: Environment<string>,
    config: Config,
    observer: Observer<string>,
): void {
    const logger = (s: string) => observer.next(s);
    generate(env, config, logger)
        .then(() => observer.complete())
        .catch(error => observer.error(error));
}
