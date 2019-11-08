import { Command } from '@oclif/command';
import { Environment } from 'contentful-management';
import { config as loadDotEnv } from 'dotenv';
import Listr from 'listr';
import { flatMap } from 'lodash';
import { Observable } from 'rxjs';
import { getContentfulEnvironment } from '../contentful';
import { Config, getConfigs } from '../config';
import { generateWithObserver } from '../generate/generate';
import { commonFlags } from '../common/flags';
import { commonDescription } from '../common/description';

const description = `
Generates a type-safe Contentful content delivery client.

${commonDescription}
`;

interface Context {
    configs: Config[];
    token: string;
    environment: string;
    env: Environment<string>;
}

class Generate extends Command {
    static description = description.trim();
    static flags = commonFlags;

    async run() {
        loadDotEnv();
        try {
            await this.tasks.run();
        } catch (error) {
            process.exit(1);
        }
    }

    tasks = new Listr<Context>([
        {
            title: 'Loading configuration',
            task: context => this.loadConfig(context),
        },
        {
            title: 'Running',
            task: context => this.runJobs(context),
        },
    ]);

    loadConfig = async (context: Context) => {
        const { flags } = this.parse(Generate);

        context.configs = await getConfigs(flags);

        if (!flags.token)
            throw Error(
                'Must provide a management API access token (with -t | --token | CONTENTFUL_MANAGEMENT_ACCESS_TOKEN)',
            );

        context.token = flags.token;
    };

    runJobs(context: Context) {
        return new Listr(
            flatMap(context.configs, config => [
                {
                    title: `[${config.job}] Loading Contentful environment`,
                    task: () => this.loadEnvironment(context, config),
                },
                {
                    title: `[${config.job}] Generating`,
                    task: () => this.generate(context, config),
                },
            ]),
        );
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

    generate(context: Context, config: Config) {
        return new Observable<string>(observer => {
            generateWithObserver(context.env, config, observer);
        });
    }
}

export = Generate;
