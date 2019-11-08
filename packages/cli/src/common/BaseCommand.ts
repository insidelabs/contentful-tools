import { Command } from '@oclif/command';
import { config as loadDotEnv } from 'dotenv';
import Listr from 'listr';
import { getConfigs } from './getConfigs';
import { Context } from './Context';
import { getContentfulEnvironment } from './getContentfulEnvironment';
import { Config } from './Config';
import { commonFlags } from './CommonFlags';

export abstract class BaseCommand extends Command {
    abstract getTitle(): string;
    abstract runJobs(context: Context): void;

    tasks = new Listr<Context>([
        {
            title: 'Load configuration',
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

        const { space, env } = await getContentfulEnvironment(
            context.token,
            config.space,
            config.environment,
        );

        context.space = space;
        context.env = env;
    }
}
