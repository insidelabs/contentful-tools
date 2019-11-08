import { Environment } from 'contentful-management';
import { Config } from './Config';

export interface Context {
    configs: Config[];
    token: string;
    environment: string;
    env: Environment<string>;
}
