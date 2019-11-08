import Listr from 'listr';
import { flatMap } from 'lodash';
import { Observable } from 'rxjs';
import { generateWithObserver } from '../generate/generate';
import { getDescription } from '../common/getDescription';
import { BaseCommand } from '../common/BaseCommand';
import { Context } from '../common/Context';
import { Config } from '../common/Config';

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

    generate(context: Context, config: Config) {
        return new Observable<string>(observer => {
            generateWithObserver(context.env, config, observer);
        });
    }
}

export = Generate;
