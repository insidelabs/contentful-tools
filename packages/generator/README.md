# Contentful Generator

[![Version](https://badgen.net/npm/v/@contentful-tools/generator)](https://npmjs.org/package/@contentful-tools/generator)
[![License](https://badgen.net/github/license/insidelabs/contentful-tools)](https://github.com/insidelabs/contentful-tools/blob/master/packages/generator/LICENSE)
[![Dependencies](https://badgen.net/david/dep/insidelabs/contentful-tools/packages/generator)](https://david-dm.org/insidelabs/contentful-tools?path=packages/generator)
[![Dev Dependencies](https://badgen.net/david/dev/insidelabs/contentful-tools/packages/generator)](https://david-dm.org/insidelabs/contentful-tools?path=packages/generator)
[![Dependabot Status](https://badgen.net/dependabot/insidelabs/contentful-tools)](https://dependabot.com)
[![oclif](https://badgen.net/badge/cli/oclif/purple?icon=terminal)](https://oclif.io)

`npm install -D @contentful-tools/generator`

Read this first:
[Contentful Store](https://github.com/insidelabs/contentful-tools/tree/master/packages/store#readme)
([npm](https://www.npmjs.com/package/@contentful-tools/store))

This generator CLI pulls your content definition from Contentful and creates an interface for each
content type, using its field validations to create the appropriate TypeScript type. Generated
fields are marked optional or required according to the content type definition. The following field
types give the corresponding TypeScript types:

* Boolean ⟹ `boolean`
* Date ⟹ `string` (ISO8601)
* Integer ⟹ `number`
* Number ⟹ `number`
* Text (long string) ⟹ `string` 
* Symbol (short string) ⟹ `string`
* Symbol enum (fixed value or values) ⟹ references a generated `enum ExampleEnum`
* Symbol enum array ⟹ `ExampleEnum[]`

The following mappings reference types from `@contentful-tools/store`, allowing them to be updated with
improved definitions, without regeneration:

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

#### Example generated interface:

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

```json5
{
    // (required)
    // Where to put the generated TypeScript files;
    // created for you using the equivalent of mkdir -p
    "outDir": "./store",

    // (required)
    // Specify at least a base locale; extra may be an empty array
    "locales": {
        "base": "en",
        "extra": ["de"]
    },

    // (default = false)
    // Whether to remove everything in the output directory before generation;
    // use at your own risk!
    "clean": true,

    // (default = '')
    // File extension to add before '.ts' for entry / asset interface files
    // (does not apply to getters file, which by default will be 'index.ts' if enabled);
    // for example, BlogPost ⟹ 'BlogPost.data.ts'
    "fileExtension": ".data",

    // Options to control generated code
    "generate": {
        // (default = 'Asset')
        // Name for generated asset type
        "assetType": "ImageAsset",

        // (default = 'Entry')
        // Name for generated generic entry type
        "entryType": "GenericEntry",

        // (default = false)
        // Whether to generate getters; if true, generates index.ts
        // May also be a string specifying the getters filename (leave off '.ts')
        "getters": true
    },

    // (optional)
    // Mapping from your content type IDs to desired interface names; the generated ContentTypeId
    // enum uses the actual IDs as its string values. If omitted, interfaces will be generated with
    // your content type IDs capitalized (e.g. blogPost ⟹ BlogPost).
    "contentTypeNameMap": {
        "blogPost": "Post",
        // ...
    },

    // (optional)
    // Specify one or both of the following to control the generated interface names;
    // for example: Post ⟹ MyPostData
    "baseType": {
        // (default = '')
        "prefix": "My",

        // (default = '')
        "suffix": "Data"
    },

    // (optional)
    // Specify one or both of the following to generate a type alias for resolved types;
    // applies to the 'base' content type name;
    // for example: Post ⟹ MyPostData ⟹ type ResolvedPostData = Resolved.Entry<MyPostData>
    "resolvedType": {
        // (default = 'Resolved')
        "prefix": "Resolved",

        // (default = '')
        "suffix": "Data"
    }
}
```

### Prettier

The generator uses the TypeScript compiler API and Prettier internally. If you have a config
somewhere that Prettier can find, the generator will use it to format the resulting code.


### CLI usage

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

## Possible improvements

* Add tests!
* Produce a useful error message if you try to use the getters without first setting up the store properly
* Fetch locales, instead of requiring them in the config
* Use [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), to allow JS or YAML config files
* Document the config with a JSON schema and upload to [JSON Schema Store](http://schemastore.org/json/)
* Add a flag to prefer values from .env over ones set in the environment (makes it easier to use for multiple spaces)
