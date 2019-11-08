import { map } from 'lodash';
import { cosmiconfig } from 'cosmiconfig';
import createDebugger from 'debug';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';
import { CommonFlags } from './BaseCommand';
import { config } from './Config';

const debug = createDebugger('@contentful-tools/cli:config');

export async function getConfigs(flags: CommonFlags) {
    const moduleName = 'contentful-tools';

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
