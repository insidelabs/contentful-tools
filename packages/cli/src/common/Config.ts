import * as t from 'io-ts';
import { getConfigs } from './getConfigs';

export type Config = Promised<ReturnType<typeof getConfigs>>[0];

type Promised<T> = T extends Promise<infer R> ? R : never;

export const required = t.interface({
    space: t.string,
    outDir: t.string,
    locales: t.interface({
        base: t.string,
        extra: t.array(t.string),
    }),
    storeClass: t.string,
});

export const options = t.partial({
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

export const config = t.interface({
    jobs: t.record(t.string, t.intersection([required, options])),
});
