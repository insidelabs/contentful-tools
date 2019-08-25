import createDebugger from 'debug';
import { existsSync, readFileSync } from 'fs';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';

export type Config = ReturnType<typeof getConfig>;

const required = t.interface({
    outDir: t.string,
    locales: t.interface({
        base: t.string,
        extra: t.array(t.string),
    }),
});

const options = t.partial({
    clean: t.boolean,
    contentTypeNameMap: t.record(t.string, t.string),
    fileExtension: t.string,
    generate: t.partial({
        assetType: t.string,
        entryType: t.string,
        getters: t.union([t.string, t.boolean]),
    }),
    baseType: t.partial({
        prefix: t.string,
        suffix: t.string,
    }),
    resolvedType: t.partial({
        prefix: t.string,
        suffix: t.string,
    }),
});

const config = t.intersection([required, options]);

const debug = createDebugger('@contentful-tools/generator:config');

export function getConfig(configFilePath: string) {
    if (!existsSync(configFilePath)) {
        throw Error(`Config file not found (${configFilePath})`);
    }

    const json: string = readFileSync(configFilePath, 'utf-8');
    const parsed: unknown = JSON.parse(json);
    const validation = config.decode(parsed);

    debug('Configuration loaded');

    if (!isValidConfig(parsed)) {
        throw Error(JSON.stringify(PathReporter.report(validation), null, 4));
    }

    debug('Configuration validated');

    const {
        clean = false,
        contentTypeNameMap = {},
        fileExtension = '',
        locales,
        outDir,
        generate = {},
        baseType = {},
        resolvedType,
    } = parsed;

    return {
        clean,
        contentTypeNameMap,
        fileExtension,
        locales,
        outDir,
        generate: {
            assetType: generate.assetType || 'Asset',
            entryType: generate.entryType || 'Entry',
            getters: (generate.getters === true ? 'index' : generate.getters) || '',
        },
        baseType: {
            prefix: baseType.prefix || '',
            suffix: baseType.suffix || '',
        },
        resolvedType: resolvedType && {
            prefix: resolvedType.prefix || resolvedType.suffix ? '' : 'Resolved',
            suffix: resolvedType.suffix || '',
        },
    };

    function isValidConfig(value: unknown): value is t.TypeOf<typeof config> {
        return isRight(validation);
    }
}