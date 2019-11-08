import { flags } from '@oclif/command';

export interface CommonFlags {
    help: void;
    version: void;
    config?: string;
    token?: string;
    environment: string;
}

export const commonFlags = {
    help: flags.help({ char: 'h' }),
    version: flags.version({ char: 'v' }),

    config: flags.string({
        char: 'c',
        description: 'Path to JSON or YAML configuration file',
    }),

    token: flags.string({
        char: 't',
        description: 'Contentful management API access token',
        env: 'CONTENTFUL_MANAGEMENT_ACCESS_TOKEN',
    }),

    environment: flags.string({
        char: 'e',
        description: 'Contentful environment name',
        env: 'CONTENTFUL_ENVIRONMENT',
        default: 'master',
    }),
};
