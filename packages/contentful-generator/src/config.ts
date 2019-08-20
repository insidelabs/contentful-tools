import createDebugger from 'debug';
import { existsSync, readFileSync } from 'fs';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isRight } from 'fp-ts/lib/Either';

export type Config = Required<t.TypeOf<typeof config>>;
type Options = t.TypeOf<typeof options>;

const required = t.interface({
    outDir: t.string,
});

const options = t.partial({
    clean: t.boolean,
    interfaceNamePrefix: t.string,
    interfaceNameSuffix: t.string,
    contentTypeNameMap: t.record(t.string, t.string),
    prettier: t.record(t.string, t.unknown),
    generate: t.partial({
        commonEntry: t.string,
    }),
});

const defaults: Required<Options> = {
    clean: false,
    interfaceNamePrefix: '',
    interfaceNameSuffix: '',
    contentTypeNameMap: {},
    prettier: {},
    generate: {
        commonEntry: '',
    },
};

const config = t.intersection([required, options]);

const debug = createDebugger('contentful-generator:config');

export function getConfig(configFilePath: string): Config {
    if (!existsSync(configFilePath)) {
        throw Error(`Config file not found (${configFilePath})`);
    }

    const json: string = readFileSync(configFilePath, 'utf-8');
    const parsed: unknown = JSON.parse(json);
    const result = config.decode(parsed);

    debug('Configuration loaded');

    if (!isConfig(parsed)) {
        throw Error(JSON.stringify(PathReporter.report(result), null, 4));
    }

    debug('Configuration validated');

    const generate = {
        ...defaults.generate,
        ...parsed.generate,
    };

    return {
        ...defaults,
        ...parsed,
        generate,
    };

    function isConfig(config: unknown): config is Config {
        return isRight(result);
    }
}
