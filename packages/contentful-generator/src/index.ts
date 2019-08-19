import { Environment } from 'contentful-management';
import { writeFileSync } from 'fs';
import { sync as mkdirSync } from 'mkdirp';
import { resolve } from 'path';
import { format } from 'prettier';
import * as rimraf from 'rimraf';
import { Observer } from 'rxjs';
import * as ts from 'typescript';

import { Config } from './config';
import { resolveTypeNames } from './typeNames';

import { generateInterface } from './generate/interfaces';
import { generateContentTypeId } from './generate/ContentTypeId';

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
        ...contentTypes.map(contentType => generateInterface(contentType, resolvedNameMap)),
    ];

    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    });

    for (const sourceFile of allFiles) {
        let result = printer.printFile(sourceFile);

        result = format(result, { parser: 'typescript', ...config.prettier });
        result = result.replace(/\nexport/gm, '\n$&');

        writeFileSync(resolve(config.outDir, sourceFile.fileName), result);
        log(`Generated ${sourceFile.fileName}`);
    }
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
