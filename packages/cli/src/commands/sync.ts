import { writeFileSync } from 'fs';
import { resolve } from 'path';
import Listr from 'listr';
import { flatMap } from 'lodash';
import { sync as mkdirSync } from 'mkdirp';
import { getDescription } from '../common/getDescription';
import { BaseCommand } from '../common/BaseCommand';
import { Context } from '../common/Context';
import { Config } from '../common/Config';
import { ContentfulClientApi, createClient } from 'contentful';

interface SyncContext extends Context {
    client: ContentfulClientApi;
}

const description = getDescription(`
Synchronizes Contentful assets and entries to use as initial state for ContentfulStore.
`);

class Sync extends BaseCommand {
    static description = description.trim();

    getTitle() {
        return 'Sync';
    }

    runJobs(context: SyncContext) {
        return new Listr(
            context.configs.filter(config => config.sync).map(config => ({
                title: config.job,
                task: () =>
                    new Listr([
                        {
                            title: 'Load environment',
                            task: () => this.loadEnvironment(context, config),
                        },
                        {
                            title: 'Load delivery client',
                            task: () => this.loadDeliveryClient(context, config),
                        },
                        {
                            title: 'Sync',
                            task: () => this.sync(context, config),
                        },
                    ]),
            })),
        );
    }

    async loadDeliveryClient(context: SyncContext, config: Config) {
        const { items } = await context.space.getApiKeys();

        const key = items[0];
        if (!key) throw Error(`Must create a delivery API key for space: ${config.space}!`);

        context.client = createClient({
            space: config.space,
            environment: config.environment,
            accessToken: key.accessToken,
        });
    }

    async sync(context: SyncContext, config: Config) {
        const result = await context.client.sync({
            initial: true,
            include: 0,
            resolveLinks: false,
        });

        const json = result.stringifySafe();
        const outDir = resolve(config.outDir, 'content');
        const outFile = resolve(outDir, `${config.job}.json`);

        mkdirSync(outDir);
        writeFileSync(outFile, json);
    }
}

export = Sync;
