import { Environment, Space } from 'contentful-management';
import { Config } from './Config';

export interface Context {
    configs: Config[];
    token: string;
    environment: string;
    space: Space<string>;
    env: Environment<string>;
}
