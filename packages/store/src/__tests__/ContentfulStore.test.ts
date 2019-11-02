import { ContentfulStore, ContentfulStoreConfig } from '../ContentfulStore';
import { client } from './__stubs__/contentful.stub';
import { Asset } from '../types/Asset';
import SpyInstance = jest.SpyInstance;

type BaseLocale = 'en';
type ExtraLocales = 'de';

interface Widget {
    __typename: 'Widget';
    __id: string;
    name: string;
    description?: string;
    child: Widget;
    relatives?: Widget[];
    image: Asset;
    images?: Asset[];
}

describe('ContentfulStore', () => {
    const autoSync = { minInterval: 10000 };
    let store: ContentfulStore<BaseLocale, ExtraLocales>;

    function createStore(config: Partial<ContentfulStoreConfig<BaseLocale, ExtraLocales>> = {}) {
        return new ContentfulStore({
            ...config,
            client,
            spaceId: 'widget-space',
            locales: ['en', 'de'],
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
            store = createStore({ autoSync });
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

        it('should auto-sync on getting an entry by field value', () => {
            store.getEntryByFieldValue<Widget>('name', 'Foo');
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
            jest.advanceTimersByTime(autoSync.minInterval);
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('should release auto-sync throttle after interval', () => {
            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(autoSync.minInterval);

            store.getEntries();
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('should only auto-sync if enabled', async () => {
            store = createStore();
            await store.sync();
            spy.mockReset();
            store.getAsset('bargis');
            expect(spy).not.toBeCalled();
        });
    });

    describe('content', () => {
        beforeAll(async () => {
            store = createStore();
            await store.sync();
        });

        it('should return an asset', () => {
            const asset = store.getAsset('bargis');
            expect(asset!.__id).toMatchInlineSnapshot(`"bargis"`);
        });

        it('should return null for a missing asset', () => {
            const asset = store.getAsset('missing');
            expect(asset).toBeNull();
        });

        it('should return an entry', () => {
            const entry = store.getEntry<Widget>('foo');
            expect(entry!.__id).toMatchInlineSnapshot(`"foo"`);
        });

        it('should return an entry by field value', () => {
            const entry = store.getEntryByFieldValue<Widget, 'name'>('name', 'Foo');
            expect(entry!.__id).toMatchInlineSnapshot(`"foo"`);
        });

        it('should return null for a missing entry', () => {
            const entry = store.getEntry('missing');
            expect(entry).toBeNull();
        });

        it('should return entries of a specific content type', () => {
            const entries = store.getEntries('en', 'Gadget');
            expect(entries).toHaveLength(1);
            expect(entries[0].__id).toMatchInlineSnapshot(`"doodah"`);
        });
    });

    describe('links', () => {
        let foo: Widget;

        beforeAll(async () => {
            store = await createStore();
            await store.sync();
        });

        beforeEach(() => {
            foo = store.getEntry<Widget>('foo')!;
        });

        it('should resolve a linked asset', () => {
            const asset = foo.image;
            expect(asset.__id).toMatchInlineSnapshot(`"bargis"`);
        });

        it('should resolve a linked entry', () => {
            const child = foo.child;
            expect(child.__id).toMatchInlineSnapshot(`"bar"`);
        });

        it('should resolve a deeply-linked entry', () => {
            const grandchild = foo.child.child;
            expect(grandchild.__id).toMatchInlineSnapshot(`"baz"`);
        });

        it('should resolve a circularly-linked entry', () => {
            const qux = store.getEntry<Widget>('qux')!;
            const self = qux.child;
            expect(self.__id).toMatchInlineSnapshot(`"qux"`);
        });

        it('should resolve an array of linked assets', () => {
            const assets = foo.images!;
            expect(assets.map(asset => asset.__id)).toMatchInlineSnapshot(`
                Array [
                  "bargis",
                  "padasjoki",
                ]
            `);
        });

        it('should resolve an array of linked entries', () => {
            const entries = foo.relatives!;
            expect(entries.map(entry => entry.__id)).toMatchInlineSnapshot(`
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
