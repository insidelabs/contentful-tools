# Contentful Store

[![Version](https://badgen.net/npm/v/@contentful-tools/store)](https://npmjs.org/package/@contentful-tools/store)
[![License](https://badgen.net/github/license/insidelabs/contentful-tools)](https://github.com/insidelabs/contentful-tools/blob/master/packages/store/LICENSE)
[![Dependencies](https://badgen.net/david/dep/insidelabs/contentful-tools/packages/store)](https://david-dm.org/insidelabs/contentful-tools?path=packages/store)
[![Dev Dependencies](https://badgen.net/david/dev/insidelabs/contentful-tools/packages/store)](https://david-dm.org/insidelabs/contentful-tools?path=packages/store)
[![Dependabot Status](https://badgen.net/dependabot/insidelabs/contentful-tools?icon=dependabot)](https://dependabot.com)

`npm install @contentful-tools/store`

Use in conjunction with:
[Contentful Tools CLI](https://github.com/insidelabs/contentful-tools/tree/master/packages/cli#readme)
([npm](https://www.npmjs.com/package/@contentful-tools/cli))

The store caches content in-memory, and can be accessed synchronously in microseconds. It
can be set up to synchronize whenever content is accessed, throttled to a configurable minimum
interval. This uses the `sync` endpoint of the Contentful Content Delivery API, which returns the
entries and assets that have been added and deleted since the last sync — to efficiently keep
content always up-to-date.

Your content can be linked however you like, even circularly. Assets and entries are stored by ID,
and links are transparently resolved on the fly, using getter properties. This meshes nicely with a
GraphQL API, and allows blazingly fast queries of arbitrary depth. Fields resolve to the value for
the requested locale first, but use the base locale’s value as a fallback.

Note, the first fetch after a period of no requests will potentially return stale content, since the
store synchronously responds before triggering the sync. If your server is under any appreciable
load however, this won’t be a problem. You are at least guaranteed to get back content in a
consistent state — you’ll never get partially-synced content.

Also note, this probably won’t work very well in serverless environments, unless you’re doing
something to keep your function containers alive between invocations. Otherwise, there’s a fairly
high startup cost to pay in order to run the initial sync with Contentful (of course, dependent on
the size of your content space).
