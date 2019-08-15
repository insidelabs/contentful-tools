import { ContentfulClientApi } from 'contentful';
import { Sync } from '../../src';

class ClientStub {
    sync({ initial }: Sync.Query): Sync.Result<'en', 'de'> {
        return initial ? load : sync;
    }
}

const load = {
    entries: [
        {
            sys: {
                id: 'foo',
                type: 'Entry',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                contentType: {
                    sys: {
                        type: 'Link',
                        linkType: 'ContentType',
                        id: 'Widget',
                    },
                },
                createdAt: '2019-08-14T16:46:21.338Z',
                updatedAt: '2019-08-14T16:58:32.573Z',
                revision: 6,
            },
            fields: {
                name: {
                    en: 'Foo',
                },
                description: {
                    de: 'Ein deutscher Foo',
                    en: 'An English Foo',
                },
                child: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: 'bar',
                        },
                    },
                },
                relatives: {
                    en: [
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Entry',
                                id: 'baz',
                            },
                        },
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Entry',
                                id: 'qux',
                            },
                        },
                    ],
                },
                image: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Asset',
                            id: 'bargis',
                        },
                    },
                },
                images: {
                    en: [
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Asset',
                                id: 'bargis',
                            },
                        },
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Asset',
                                id: 'padasjoki',
                            },
                        },
                    ],
                },
            },
        },
        {
            sys: {
                id: 'bar',
                type: 'Entry',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                contentType: {
                    sys: {
                        type: 'Link',
                        linkType: 'ContentType',
                        id: 'Widget',
                    },
                },
                createdAt: '2019-08-14T16:46:30.644Z',
                updatedAt: '2019-08-14T16:48:00.450Z',
                revision: 2,
            },
            fields: {
                name: {
                    en: 'Bar',
                },
                child: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: 'baz',
                        },
                    },
                },
                relatives: {
                    en: [
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Entry',
                                id: 'foo',
                            },
                        },
                    ],
                },
                image: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Asset',
                            id: 'padasjoki',
                        },
                    },
                },
            },
        },
        {
            sys: {
                id: 'baz',
                type: 'Entry',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                contentType: {
                    sys: {
                        type: 'Link',
                        linkType: 'ContentType',
                        id: 'Widget',
                    },
                },
                createdAt: '2019-08-14T16:46:37.241Z',
                updatedAt: '2019-08-14T16:47:39.548Z',
                revision: 2,
            },
            fields: {
                name: {
                    en: 'Baz',
                },
                child: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: 'qux',
                        },
                    },
                },
                image: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Asset',
                            id: 'bargis',
                        },
                    },
                },
            },
        },
        {
            sys: {
                id: 'qux',
                type: 'Entry',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                contentType: {
                    sys: {
                        type: 'Link',
                        linkType: 'ContentType',
                        id: 'Widget',
                    },
                },
                createdAt: '2019-08-14T16:47:00.889Z',
                updatedAt: '2019-08-14T16:47:48.358Z',
                revision: 2,
            },
            fields: {
                name: {
                    en: 'Qux',
                },
                child: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: 'qux',
                        },
                    },
                },
                image: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Asset',
                            id: 'bargis',
                        },
                    },
                },
            },
        },
    ],
    assets: [
        {
            sys: {
                id: 'bargis',
                type: 'Asset',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                createdAt: '2019-08-14T16:51:29.168Z',
                updatedAt: '2019-08-14T16:51:29.168Z',
                revision: 1,
            },
            fields: {
                title: {
                    en: 'Bargis',
                },
                file: {
                    en: {
                        url: '//images.ctfassets.net/abc/bargis/456/bargis.jpg',
                        details: {
                            size: 3996687,
                            image: {
                                width: 4242,
                                height: 2828,
                            },
                        },
                        fileName: 'bargis.jpg',
                        contentType: 'image/jpeg',
                    },
                },
            },
        },
        {
            sys: {
                id: 'padasjoki',
                type: 'Asset',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                createdAt: '2019-08-14T16:58:20.971Z',
                updatedAt: '2019-08-14T16:58:20.971Z',
                revision: 1,
            },
            fields: {
                title: {
                    en: 'padasjoki',
                },
                file: {
                    en: {
                        url: '//images.ctfassets.net/abc/padasjoki/123/padasjoki.jpg',
                        details: {
                            size: 5080466,
                            image: {
                                width: 4000,
                                height: 3000,
                            },
                        },
                        fileName: 'padasjoki.jpg',
                        contentType: 'image/jpeg',
                    },
                },
            },
        },
    ],
    deletedEntries: [],
    deletedAssets: [],
    nextSyncToken: 'initial-sync-token',
    toPlainObject() {
        return this;
    },
} as Sync.Result<'en', 'de'>;

const sync = {
    entries: [
        {
            sys: {
                id: 'foo',
                type: 'Entry',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                    },
                },
                contentType: {
                    sys: {
                        type: 'Link',
                        linkType: 'ContentType',
                        id: 'Widget',
                    },
                },
                createdAt: '2019-08-14T16:46:21.338Z',
                updatedAt: '2019-08-14T16:58:32.573Z',
                revision: 6,
            },
            fields: {
                name: {
                    en: 'Foo',
                },
                description: {
                    de: 'Ein aktualisierter Foo',
                    en: 'An updated Foo',
                },
                child: {
                    en: {
                        sys: {
                            type: 'Link',
                            linkType: 'Entry',
                            id: 'qux',
                        },
                    },
                },
                relatives: {
                    en: [
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Entry',
                                id: 'baz',
                            },
                        },
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Entry',
                                id: 'qux',
                            },
                        },
                    ],
                },
                images: {
                    en: [
                        {
                            sys: {
                                type: 'Link',
                                linkType: 'Asset',
                                id: 'padasjoki',
                            },
                        },
                    ],
                },
            },
        },
    ],
    assets: [
        {
            sys: {
                id: 'padasjoki',
                type: 'Asset',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        id: 'master',
                        type: 'Link',
                        linkType: 'Environment',
                    },
                },
                createdAt: '2019-08-14T16:58:20.971Z',
                updatedAt: '2019-08-14T16:58:20.971Z',
                revision: 2,
            },
            fields: {
                title: {
                    en: 'Padasjoki Updated',
                },
                file: {
                    en: {
                        url: '//images.ctfassets.net/abc/padasjoki/789/padasjoki.jpg',
                        details: {
                            size: 5080466,
                            image: {
                                width: 4000,
                                height: 3000,
                            },
                        },
                        fileName: 'padasjoki.jpg',
                        contentType: 'image/jpeg',
                    },
                },
            },
        },
    ],
    deletedEntries: [
        {
            sys: {
                id: 'bar',
                type: 'DeletedEntry',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        id: 'master',
                        type: 'Link',
                        linkType: 'Environment',
                    },
                },
                createdAt: '2019-08-14T18:56:24.903Z',
                updatedAt: '2019-08-14T18:56:24.903Z',
                deletedAt: '2019-08-14T18:56:24.903Z',
                revision: 1,
            },
        },
    ],
    deletedAssets: [
        {
            sys: {
                id: 'bargis',
                type: 'DeletedAsset',
                space: {
                    sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: 'abc',
                    },
                },
                environment: {
                    sys: {
                        id: 'master',
                        type: 'Link',
                        linkType: 'Environment',
                    },
                },
                createdAt: '2019-08-14T18:56:31.621Z',
                updatedAt: '2019-08-14T18:56:31.621Z',
                deletedAt: '2019-08-14T18:56:31.621Z',
                revision: 1,
            },
        },
    ],
    nextSyncToken: 're-sync-token',
    toPlainObject() {
        return this;
    },
} as Sync.Result<'en', 'de'>;

export const client = (new ClientStub() as unknown) as ContentfulClientApi;
