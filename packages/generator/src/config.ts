import { map } from 'lodash';
import { cosmiconfig } from 'cosmiconfig';
import createDebugger from 'debug';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';

type Promised<T> = T extends Promise<infer R> ? R : never;
export type Config = Promised<ReturnType<typeof getConfigs>>[0];

const required = t.interface({
    space: t.string,
    outDir: t.string,
    locales: t.interface({
        base: t.string,
        extra: t.array(t.string),
    }),
    storeClass: t.string,
});

const options = t.partial({
    clean: t.boolean,
    namespace: t.string,
    localeOptional: t.boolean,
    fieldGetters: t.array(t.string),
    idField: t.string,
    whitelist: t.boolean,
    contentTypeNameMap: t.record(t.string, t.string),
    singletons: t.array(t.string),
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

export async function getConfigs(flags: { environment: string; config?: string }) {
    const moduleName = 'contentful-generator';

    const explorer = cosmiconfig(moduleName, {
        searchPlaces: [
            'package.json',
            `${moduleName}.json`,
            `${moduleName}.yaml`,
            `.${moduleName}.json`,
            `.${moduleName}.yaml`,
        ],
    });

    const result = await (flags.config ? explorer.load(flags.config) : explorer.search());
    if (!result || !result.config) throw Error(`Config not found`);
    debug('Configuration loaded');

    const validation = config.decode(result.config);
    if (!isValidConfig(result.config)) {
        throw Error(JSON.stringify(PathReporter.report(validation), null, 4));
    }
    debug('Configuration validated');

    return map(result.config.jobs, (config, job) => ({
        job,
        clean: config.clean || false,
        outDir: config.outDir,
        space: config.space,
        environment: flags.environment,
        locales: config.locales,
        namespace: config.namespace,
        storeClass: config.storeClass,
        localeOptional: config.localeOptional || false,
        fieldGetters: config.fieldGetters || [],
        idField: config.idField,
        whitelist: config.whitelist || false,
        contentTypeNameMap: config.contentTypeNameMap || {},
        singletons: config.singletons || [],
        typeOverrides: config.typeOverrides || {},
    }));

    function isValidConfig(value: unknown): value is t.TypeOf<typeof config> {
        return isRight(validation);
    }
}
