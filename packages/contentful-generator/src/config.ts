import createDebugger from 'debug';
import { existsSync, readFileSync } from 'fs';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';

export type Config = ReturnType<typeof getConfig>;

const required = t.interface({
    outDir: t.string,
});

const options = t.partial({
    clean: t.boolean,
    contentTypeNameMap: t.record(t.string, t.string),
    generate: t.partial({
        commonEntry: t.string,
    }),
    interfaceName: t.partial({
        prefix: t.string,
        suffix: t.string,
    }),
    prettier: t.record(t.string, t.unknown),
    resolvedType: t.partial({
        prefix: t.string,
        suffix: t.string,
    }),
});

const config = t.intersection([required, options]);

const debug = createDebugger('contentful-generator:config');

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

    return {
        clean: parsed.clean || false,
        contentTypeNameMap: parsed.contentTypeNameMap || {},
        generate: {
            commonEntry: '',
            ...parsed.generate,
        },
        interfaceName: {
            prefix: '',
            suffix: '',
            ...parsed.interfaceName,
        },
        outDir: parsed.outDir,
        prettier: parsed.prettier || {},
        resolvedType: parsed.resolvedType && {
            prefix: '',
            suffix: '',
            ...parsed.resolvedType,
        },
    };

    function isValidConfig(value: unknown): value is t.TypeOf<typeof config> {
        return isRight(validation);
    }
}
