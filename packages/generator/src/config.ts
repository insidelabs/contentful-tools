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
    storeClass: t.string,
});

const options = t.partial({
    clean: t.boolean,
    space: t.string,
    environment: t.string,
    namespace: t.string,
    localeOptional: t.boolean,
    fieldGetters: t.array(t.string),
    contentTypeNameMap: t.record(t.string, t.string),
});

const config = t.intersection([required, options]);

const debug = createDebugger('@contentful-tools/generator:config');

export function getConfig(configFilePath: string, flags: { space?: string; environment: string }) {
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
        outDir,
        space,
        environment,
        locales,
        namespace,
        storeClass,
        localeOptional,
        fieldGetters,
        contentTypeNameMap = {},
    } = parsed;

    return {
        clean,
        outDir,
        space: space || flags.space,
        environment: environment || flags.environment,
        locales,
        namespace,
        storeClass,
        localeOptional: localeOptional || false,
        fieldGetters: fieldGetters || [],
        contentTypeNameMap,
    };

    function isValidConfig(value: unknown): value is t.TypeOf<typeof config> {
        return isRight(validation);
    }
}
