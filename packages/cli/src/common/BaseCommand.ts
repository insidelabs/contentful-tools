import { Command, flags } from '@oclif/command';
import { config as loadDotEnv } from 'dotenv';
import Listr from 'listr';
import { getConfigs } from './getConfigs';
import { Context } from './Context';
import { getContentfulEnvironment } from './getContentfulEnvironment';
import { Config } from './Config';

export interface CommonFlags {
    help: void;
    version: void;
    config?: string;
    token?: string;
    environment: string;
}

export abstract class BaseCommand extends Command {
    abstract getTitle(): string;
    abstract runJobs(context: Context): void;

    tasks = new Listr<Context>([
        {
            title: 'Loading configuration',
            task: context => this.loadConfig(context),
        },
        {
            title: this.getTitle(),
            task: context => this.runJobs(context),
        },
    ]);

    async run() {
        loadDotEnv();
        try {
            await this.tasks.run();
        } catch (error) {
            process.exit(1);
        }
    }

    async loadConfig(context: Context) {
        const { flags } = this.parse({ flags: commonFlags });

        context.configs = await getConfigs(flags);

        if (!flags.token)
            throw Error(
                'Must provide a management API access token (with -t | --token | CONTENTFUL_MANAGEMENT_ACCESS_TOKEN)',
            );

        context.token = flags.token;
    }

    async loadEnvironment(context: Context, config: Config) {
        if (!config.space) {
            throw Error('Must provide a space ID in the configuration');
        }

        context.env = await getContentfulEnvironment(
            context.token,
            config.space,
            config.environment,
        );
    }
}

const commonFlags = {
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
