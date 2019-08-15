import { ContentfulStore } from '../ContentfulStore';
import { Content } from '../types/Content';
import { Link } from '../types/Link';
import { Resolved } from '../types/Resolved';
import { client } from './__stubs__/contentful.stub';
import SpyInstance = jest.SpyInstance;

type BaseLocale = 'en';
type ExtraLocales = 'de';

interface Widget extends Content.Entry<'Widget'> {
    fields: {
        name: string;
        description?: string;
        child: Link.Entry<Widget>;
        relatives?: Link.Entry<Widget>[];
        image: Link.Asset;
        images?: Link.Asset[];
    };
}

describe('ContentfulStore', () => {
    const autoSyncMinInterval = 10000;
    let store: ContentfulStore<BaseLocale, ExtraLocales>;

    function createStore(config: Partial<ContentfulStore.Config<BaseLocale, ExtraLocales>> = {}) {
        return new ContentfulStore({
            ...config,
            client,
            spaceId: 'widget-space',
            locales: ['en', 'de'],
            autoSyncMinInterval,
        });
    }

    describe('store', () => {
        beforeEach(() => {
            store = createStore();
        });

        it('should load', async () => {
            await store.sync();
            expect(store.getEntries()).toMatchSnapshot();
            expect(store.getAssets()).toMatchSnapshot();
        });

        it('should sync', async () => {
            await store.sync();
            await store.sync();
            expect(store.getEntries()).toMatchSnapshot();
            expect(store.getAssets()).toMatchSnapshot();
        });
    });

    describe('auto-sync', () => {
        let spy: SpyInstance<typeof client.sync>;

        beforeAll(() => {
            jest.useFakeTimers();
        });

        beforeEach(async () => {
            store = createStore({ autoSync: true });
            await store.sync();
            spy = (jest.spyOn(client, 'sync') as unknown) as SpyInstance<typeof client.sync>;
        });

        afterEach(() => {
            spy.mockRestore();
            jest.clearAllTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it('should auto-sync on getting an asset', () => {
            store.getAsset('bargis');
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should auto-sync on getting assets', () => {
            store.getAssets();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should auto-sync on getting an entry', () => {
            store.getEntry('foo');
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should auto-sync on getting entries', () => {
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should throttle auto-sync', () => {
            store.getEntries();
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('should auto-sync on leading & trailing edge of interval', () => {
            store.getEntries();
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);
            jest.advanceTimersByTime(autoSyncMinInterval);
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('should release auto-sync throttle after interval', () => {
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(autoSyncMinInterval);

            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(2);
        });
    });

    describe('content', () => {
        beforeAll(async () => {
            store = createStore();
            await store.sync();
        });

        it('should return an asset', () => {
            const asset = store.getAsset('bargis');
            expect(asset!.sys.id).toMatchInlineSnapshot(`"bargis"`);
        });

        it('should return an entry', () => {
            const entry = store.getEntry<Widget>('foo');
            expect(entry!.sys.id).toMatchInlineSnapshot(`"foo"`);
        });

        it('should return entries of a specific content type', () => {
            const entries = store.getEntries('Gadget');
            expect(entries).toHaveLength(1);
            expect(entries[0].sys.id).toMatchInlineSnapshot(`"doodah"`);
        });
    });

    describe('links', () => {
        let foo: Resolved.Entry<Widget>;

        beforeAll(async () => {
            store = await createStore();
            await store.sync();
        });

        beforeEach(() => {
            foo = store.getEntry<Widget>('foo')!;
        });

        it('should resolve a linked asset', () => {
            const asset = foo.fields.image;
            expect(asset.sys.id).toMatchInlineSnapshot(`"bargis"`);
        });

        it('should resolve a linked entry', () => {
            const child = foo.fields.child;
            expect(child.sys.id).toMatchInlineSnapshot(`"bar"`);
        });

        it('should resolve a deeply-linked entry', () => {
            const grandchild = foo.fields.child.fields.child;
            expect(grandchild.sys.id).toMatchInlineSnapshot(`"baz"`);
        });

        it('should resolve a circularly-linked entry', () => {
            const qux = store.getEntry<Widget>('qux')!;
            const self = qux.fields.child;
            expect(self.sys.id).toMatchInlineSnapshot(`"qux"`);
        });

        it('should resolve an array of linked assets', () => {
            const assets = foo.fields.images!;
            expect(assets.map(asset => asset.sys.id)).toMatchInlineSnapshot(`
                Array [
                  "bargis",
                  "padasjoki",
                ]
            `);
        });

        it('should resolve an array of linked entries', () => {
            const entries = foo.fields.relatives!;
            expect(entries.map(entry => entry.sys.id)).toMatchInlineSnapshot(`
                Array [
                  "baz",
                  "qux",
                ]
            `);
        });
    });

    describe('errors', () => {
        it('should log error on content access if not yet loaded', () => {
            const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
            store = createStore();
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
                Array [
                  "Error in ContentfulStore (widget-space)",
                  [Error: Content accessed without initial sync],
                ]
            `);
        });

        it('should pass error to a custom handler', () => {
            const spy = jest.fn();
            store = createStore({ handleError: spy });
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);
            spy.mockRestore();
        });
    });
});
