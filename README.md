# Contentful Tools

Using the two packages in this repo, you can generate type declarations and getter functions for the
entries and assets of a Contentful space — just set up an instance of `ContentfulStore` in your own
project, and get fast, type-safe, auto-synchronizing access to your content.


## Contentful Store

[![Version](https://badgen.net/npm/v/@contentful-tools/store)](https://npmjs.org/package/@contentful-tools/store)
[![License](https://badgen.net/github/license/insidelabs/contentful-tools)](https://github.com/insidelabs/contentful-tools/blob/master/packages/store/LICENSE)
[![Dependencies](https://badgen.net/david/dep/insidelabs/contentful-tools/packages/store)](https://david-dm.org/insidelabs/contentful-tools?path=packages/store)
[![Dev Dependencies](https://badgen.net/david/dev/insidelabs/contentful-tools/packages/store)](https://david-dm.org/insidelabs/contentful-tools?path=packages/store)
[![Dependabot Status](https://badgen.net/dependabot/insidelabs/contentful-tools?icon=dependabot)](https://dependabot.com)

`npm install @contentful-tools/store`

The store caches content in-memory, and can be accessed synchronously in microseconds. It can be set
up to synchronize whenever content is accessed, throttled to a configurable minimum interval. This
uses the `sync` endpoint of the Contentful Content Delivery API, which returns the entries and
assets that have been added and deleted since the last sync — to efficiently keep content always
up-to-date.

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


## Contentful Generator

[![Version](https://badgen.net/npm/v/@contentful-tools/generator)](https://npmjs.org/package/@contentful-tools/generator)
[![License](https://badgen.net/github/license/insidelabs/contentful-tools)](https://github.com/insidelabs/contentful-tools/blob/master/packages/generator/LICENSE)
[![Dependencies](https://badgen.net/david/dep/insidelabs/contentful-tools/packages/generator)](https://david-dm.org/insidelabs/contentful-tools?path=packages/generator)
[![Dev Dependencies](https://badgen.net/david/dev/insidelabs/contentful-tools/packages/generator)](https://david-dm.org/insidelabs/contentful-tools?path=packages/generator)
[![Dependabot Status](https://badgen.net/dependabot/insidelabs/contentful-tools)](https://dependabot.com)
[![oclif](https://badgen.net/badge/cli/oclif/purple?icon=terminal)](https://oclif.io)

`npm install -D @contentful-tools/generator`

The CLI pulls your content definition and creates an interface for each content type, using its field
validations to create the appropriate TypeScript type. Generated fields are marked optional or
required according to the content type definition. The following field types are supported:

* Boolean ⟹ `boolean`
* Date ⟹ `string` (ISO8601)
* Integer ⟹ `number`
* Number ⟹ `number`
* Symbol (short string) ⟹ `string`
* Symbol enum (fixed value or values) ⟹ references a generated `enum ExampleEnum`
* Symbol enum array ⟹ `ExampleEnum[]`
* Text (long) ⟹ `string` 

The following reference types from `@contentful-tools/store`, allowing them to be updated with
improved definitions:

* Location ⟹ `Field.Location`, defined as `{ lon: number; lat: number }`
* Object (JSON) ⟹ `Field.JSON`, defined as `{ [key: string]: any } | any[]`
* Rich text ⟹ `Field.RichText`, defined as `any`

Reference-type fields are generated with a `Link` type, also defined in `@contentful-tools/store`.
The store unwraps these definitions with the `Resolved.Entry` type alias. As you would expect,
instead of links, the resolved version of a content type has fields which map to the linked,
resolved type — either another entry type, or an asset. This is what allows you to follow links to
arbitrary depth in a type-safe way, for entries retrieved from the store.

* Entry link ⟹ `Link.Entry<EntryType>` / `Resolved.Entry<EntryType>`
* Entry link array ⟹ `Link.Entry<EntryType>[]` / `Resolved.Entry<EntryType>[]`
* Asset link ⟹ `Link.Asset` / `Content.Asset`
* Asset link array ⟹ `Link.Asset[]` / `Content.Asset[]`

An enum of all content type IDs for your space is also generated, allowing you to differentiate
between content types for mixed reference fields with a switch statement on
`entry.sys.contentType.sys.id`.

#### Example generated type:

```ts
export interface Post extends Content.Entry<ContentTypeId.Post> {
    fields: {
	title: string;
	content: string;
        author: Link.Entry<Author>;
    };
}
```

### Getters

Optionally, the generator will create a module which exports typed functions to get your assets and
entries from the store. You __must__ call the `setStore()` function also exported by this module
with an instance of `ContentfulStore`, before using any of the provided getters:

```ts
export type BaseLocale = 'en';
export type ExtraLocales = 'de';
export type Locales = BaseLocale | ExtraLocales;

export const baseLocale: BaseLocale = 'en';
export const extraLocales: ExtraLocales[] = ['de'];
export const locales: [BaseLocale, ...ExtraLocales[]] = [baseLocale, ...extraLocales];

type Store = ContentfulStore<BaseLocale, ExtraLocales>;

let store: Store;

export function setStore(contentfulStore: Store): void {
    store = contentfulStore;
}
```

The base locale for your content space, and any additional locales, should be provided in the
generator config. Separating the base and extra locales is what allows type-safe access to a field
marked as required, without having to make a null check — on the basis that an entry cannot be
published if it is missing a value for your space’s default locale.

__Note__, you should also make sure to call `await store.sync()` before attempting to use any of the
getters (typically before your server starts accepting requests), otherwise you will get no content
on first use.

#### Example generated getters:

```ts
export function getAsset(id: string, locale?: Locales): Content.Asset | null {
    return store.getAsset(id, locale);
}

export function getAssets(locale?: Locales): Content.Asset[] {
    return store.getAssets(locale);
}

export function getPost(id: string, locale?: Locales): Resolved.Entry<Post> | null {
    return store.getEntry<Post>(id, locale, ContentTypeId.Post);
}

export function getAllPosts(locale?: Locales): Resolved.Entry<Post>[] {
    return store.getEntries<Post>(locale, ContentTypeId.Post);
}

```

With these functions, you can do something like the following in a type-safe way:

```ts
function getPostAuthorAvatar(postId: string): Content.Asset | null {
    const post = getPost('123');
    return post ? post.fields.author.fields.avatar : null;
}
```


### Config

Example `contentful.json` config file (a different name can be specified via the CLI):

```json
{
    // (required) Where to put the generated files
    "outDir": "./store",

    // (required) Specify at least a base locale; extra may be an empty array
    "locales": {
        "base": "en",
        "extra": ["de"]
    },

    // (default = false) Whether to remove everything in the output directory before generation
    "clean": true,

    // (default = '') File extension to add before `.ts` for entry / asset files
    "fileExtension": ".data",

    // (default = { assetType: 'Asset', entryType: 'Entry', getters: false })
    "generate": {
        "assetType": "ImageAsset", // (optional) name for generated asset type
        "entryType": "Entry", // (optional) name for generated generic entry type
        "getters": true // (optional) whether to generate getters or a filename; if true, filename = 'index.ts'
    },

    // (default = { prefix: '', suffix: '' })
    // Specify one or both of the following to control the generated interface names; e.g. MyPostEntry
    "baseType": {
        "prefix": "My",
        "suffix": "Entry"
    },

    // (optional)
    // Specify one or both of the following to generate a type alias for each content type
    // interface, such as: type ResolvedPostData = Resolved.Entry<Post>
    "resolvedType": {
        "prefix": "Resolved",
        "suffix": "Data"
    },

    // (optional)
    // Mapping from your content type IDs to desired interface names; the generated ContentTypeId
    // enum uses the actual IDs as its string values
    "contentTypeNameMap": {
        "blogPost": "Post",
	...
    }
}
```

### Prettier

The generator uses the TypeScript compiler API and Prettier internally. If you have a config
somewhere that Prettier can find, the generator will use it to format the resulting code.


### CLI Usage

```
Generates a type-safe Contentful content delivery client.

USAGE
  $ contentful-generate

OPTIONS
  -c, --config=config            [default: contentful.json] Path to JSON configuration file
  -e, --environment=environment  [default: master] Contentful environment name
  -h, --help                     show CLI help
  -s, --space=space              Contentful space ID
  -t, --token=token              Contentful management API access token
  -v, --version                  show CLI version

DESCRIPTION
  Requires a management API access token, space ID, and environment name. These
  may be specified with the following environment variables:

       CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
       CONTENTFUL_SPACE_ID
       CONTENTFUL_ENVIRONMENT

  These may also be sourced from a .env file, located in the working directory.
```

### Improvements

The generator CLI could be improved by the following:

* Produce a useful error message if you try to use the getters without first setting up the store properly
* Fetch locales, instead of requiring them in the config
* Use [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), to allow JS or YAML config files
* Add a flag to prefer values from .env over ones set in the environment (makes it easier to use for multiple spaces)
