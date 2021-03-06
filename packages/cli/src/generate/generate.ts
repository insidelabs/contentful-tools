import { Environment } from 'contentful-management';
import { writeFileSync } from 'fs';
import { sync as mkdirSync } from 'mkdirp';
import { resolve } from 'path';
import * as prettier from 'prettier';
import * as rimraf from 'rimraf';
import { Observer } from 'rxjs';
import * as ts from 'typescript';

import { resolveTypeNames } from './util/typeNames';

import { processNewLines } from './common/whitespace';
import { generateTypename } from './tasks/typename';
import { generateEntry } from './tasks/entry';
import { generateInterface } from './tasks/interfaces';
import { generateStoreClass } from './tasks/storeClass';
import { generateNamespace } from './tasks/namespace';
import { generateWhitelist } from './tasks/whitelist';
import { Config } from '../common/Config';

type Logger = (s: string) => void;
const defaultLogger: Logger = (s: string) => console.log(s);

export async function generate(
    env: Environment<string>,
    config: Config,
    log: Logger = defaultLogger,
): Promise<void> {
    if (config.clean) rimraf.sync(config.outDir);
    mkdirSync(config.outDir);

    let contentTypes = (await env.getContentTypes()).items;
    const { contentTypeNameMap, contentTypeWhitelist } = resolveTypeNames(contentTypes, config);

    contentTypes = contentTypes.filter(contentType =>
        contentTypeWhitelist.includes(contentType.sys.id),
    );

    let allFiles = [generateStoreClass(config, contentTypeNameMap)];

    if (config.namespace) {
        allFiles.push(
            generateNamespace(
                config,
                config.namespace,
                contentTypes,
                contentTypeNameMap,
                contentTypeWhitelist,
            ),
        );
    } else {
        allFiles.push(generateTypename(config, contentTypeNameMap));
        if (config.whitelist) allFiles.push(generateWhitelist(config, contentTypeWhitelist));
        allFiles.push(generateEntry(config, contentTypes));
        allFiles = allFiles.concat(
            contentTypes.map(contentType =>
                generateInterface(config, contentTypeNameMap, contentType, 'FILE'),
            ),
        );
    }

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
