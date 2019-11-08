import { getConfigs } from './getConfigs';

export type Config = Promised<ReturnType<typeof getConfigs>>[0];

type Promised<T> = T extends Promise<infer R> ? R : never;
