import createDebugger from 'debug';
import { createClient, Environment, Space } from 'contentful-management';

const debug = createDebugger('@contentful-tools/cli:contentful');

export async function getContentfulEnvironment(
    accessToken: string,
    spaceId: string,
    environment: string,
): Promise<{
    space: Space<string>;
    env: Environment<string>;
}> {
    const client = createClient({ accessToken });

    const space = await client.getSpace(spaceId);
    debug('Got Contentful space: %s', space.name);

    const env = await space.getEnvironment(environment);
    debug('Got Contentful environment: %s', env.name);

    return {
        space,
        env,
    };
}
