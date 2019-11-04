import { map } from 'lodash';
import createDebugger from 'debug';
import { existsSync, readFileSync } from 'fs';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';

export type Config = ReturnType<typeof getConfigs>[0];

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
    typeOverrides: t.record(
        t.string,
        t.record(
            t.string,
            t.interface({
                path: t.string,
                type: t.string,
            }),
        ),
    ),
});

const config = t.interface({
    jobs: t.record(t.string, t.intersection([required, options])),
});

t.intersection([required, options]);

const debug = createDebugger('@contentful-tools/generator:config');

export function getConfigs(configFilePath: string, flags: { space?: string; environment: string }) {
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

    return map(parsed.jobs, (config, job) => ({
        job,
        clean: config.clean ?? false,
        outDir: config.outDir,
        space: config.space || flags.space,
        environment: config.environment || flags.environment,
        locales: config.locales,
        namespace: config.namespace,
        storeClass: config.storeClass,
        localeOptional: config.localeOptional ?? false,
        fieldGetters: config.fieldGetters || [],
        contentTypeNameMap: config.contentTypeNameMap || {},
        typeOverrides: config.typeOverrides || {},
    }));

    function isValidConfig(value: unknown): value is t.TypeOf<typeof config> {
        return isRight(validation);
    }
}
