import { Command, flags } from '@oclif/command';
import { config as loadDotEnv } from 'dotenv';
import createDebugger from 'debug';
import Listr from 'listr';
import { Environment } from 'contentful-management';
import { Observable } from 'rxjs';
import { getContentfulEnvironment } from './contentful';
import { Config, getConfig } from './config';
import { generateWithObserver } from './index';

const debug = createDebugger('cli');

const description = `Generates a type-safe Contentful content delivery client.

Requires a management API access token, space ID, and environment name. These
may be specified with the following environment variables:

    CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
    CONTENTFUL_SPACE_ID
    CONTENTFUL_ENVIRONMENT
    
These may also be sourced from a .env file, located in the working directory.
`;

class ContentfulClientGenerator extends Command {
    static description = description;

    static flags = {
        help: flags.help({ char: 'h' }),
        version: flags.version({ char: 'v' }),

        config: flags.string({
            char: 'c',
            description: 'Path to JSON configuration file',
            default: 'contentful.config.json',
        }),

        token: flags.string({
            char: 't',
            description: 'Contentful management API access token',
            env: 'CONTENTFUL_MANAGEMENT_ACCESS_TOKEN',
        }),

        space: flags.string({
            char: 's',
            description: 'Contentful space ID',
            env: 'CONTENTFUL_SPACE_ID',
        }),

        environment: flags.string({
            char: 'e',
            description: 'Contentful environment name',
            env: 'CONTENTFUL_ENVIRONMENT',
            default: 'master',
        }),
    };

    async run() {
        loadDotEnv();
        const { flags } = this.parse(ContentfulClientGenerator);

        debug('Config file: %s', flags.config);
        debug('Access token: %s', flags.token);
        debug('Space ID: %s', flags.space);
        debug('Environment: %s', flags.environment);

        const tasks = new Listr<{
            env: Environment<string>;
            config: Config;
        }>([
            {
                title: 'Getting Contentful environment',
                task: async context => {
                    if (!flags.token) {
                        throw Error(
                            'Must provide a management API access token (with -t | --token | CONTENTFUL_MANAGEMENT_ACCESS_TOKEN)',
                        );
                    }

                    if (!flags.space) {
                        throw Error(
                            'Must provide a space ID (with -s | --space | CONTENTFUL_SPACE_ID)',
                        );
                    }

                    context.env = await getContentfulEnvironment(
                        flags.token,
                        flags.space,
                        flags.environment,
                    );
                },
            },
            {
                title: 'Loading configuration',
                task: async context => {
                    context.config = await getConfig(flags.config);
                },
            },
            {
                title: 'Generating type declarations',
                task: context => {
                    return new Observable<string>(observer => {
                        generateWithObserver(context.env, context.config, observer);
                    });
                },
            },
        ]);

        try {
            await tasks.run();
        } catch (error) {
            process.exit(1);
        }
    }
}

export = ContentfulClientGenerator;
