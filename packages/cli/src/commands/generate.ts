import { Command, flags } from '@oclif/command';
import { Environment } from 'contentful-management';
import createDebugger from 'debug';
import { config as loadDotEnv } from 'dotenv';
import Listr from 'listr';
import { flatMap } from 'lodash';
import { Observable } from 'rxjs';
import { getContentfulEnvironment } from '../contentful';
import { Config, getConfigs } from '../config';
import { generateWithObserver } from '../generate/generate';

const debug = createDebugger('@contentful-tools/cli');

const description = `Generates a type-safe Contentful content delivery client.

Requires a management API access token and environment name, which may be
specified with the following environment variable:

    CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
    CONTENTFUL_ENVIRONMENT
    
This may also be sourced from a .env file, located in the working directory.
`;

class Generate extends Command {
    static description = description;

    static flags = {
        help: flags.help({ char: 'h' }),
        version: flags.version({ char: 'v' }),

        config: flags.string({
            char: 'c',
            description: 'Path to JSON configuration file',
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

    async run() {
        loadDotEnv();
        const { flags } = this.parse(Generate);

        debug('Config file: %s', flags.config);
        debug('Access token: %s', flags.token);
        debug('Environment: %s', flags.environment);

        const tasks = new Listr<{
            configs: Config[];
            token: string;
        }>([
            {
                title: 'Loading configuration',
                task: async context => {
                    context.configs = await getConfigs(flags);
                },
            },
            {
                title: 'Verifying',
                task: async context => {
                    if (!flags.token) {
                        throw Error(
                            'Must provide a management API access token (with -t | --token | CONTENTFUL_MANAGEMENT_ACCESS_TOKEN)',
                        );
                    }

                    context.token = flags.token;
                },
            },
            {
                title: 'Running',
                task: async context => {
                    const tasks = flatMap(context.configs, config => {
                        let env: Environment<string>;
                        return [
                            {
                                title: `[${config.job}] Loading Contentful environment`,
                                task: async () => {
                                    if (!config.space) {
                                        throw Error('Must provide a space ID in the configuration');
                                    }

                                    env = await getContentfulEnvironment(
                                        context.token,
                                        config.space,
                                        config.environment,
                                    );
                                },
                            },
                            {
                                title: `[${config.job}] Generating`,
                                task: () => {
                                    return new Observable<string>(observer => {
                                        generateWithObserver(env, config, observer);
                                    });
                                },
                            },
                        ];
                    });

                    return new Listr(tasks);
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

export = Generate;
