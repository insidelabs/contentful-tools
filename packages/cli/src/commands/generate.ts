import Listr from 'listr';
import { flatMap } from 'lodash';
import { Observable } from 'rxjs';
import { getContentfulEnvironment } from '../contentful';
import { Config } from '../config';
import { generateWithObserver } from '../generate/generate';
import { getDescription } from '../common/description';
import { BaseCommand } from '../common/BaseCommand';
import { Context } from '../common/Context';

const description = getDescription(`
Generates a type-safe Contentful content delivery client.
`);

class Generate extends BaseCommand {
    static description = description.trim();

    getTitle() {
        return 'Generating';
    }

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
