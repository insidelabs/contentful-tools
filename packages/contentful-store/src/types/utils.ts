import { Entry } from './content';

export type GetContentTypeId<E extends Entry<string>> = E['sys']['contentType']['sys']['id'];

export type PlainObject<O extends { [key: string]: any }> = {
    [K in PlainObjectKeys<O>]: O[K];
};

type PlainObjectKeys<O extends { [key: string]: any }> = {
    [K in keyof O]: O[K] extends Function ? never : K;
}[keyof O];

