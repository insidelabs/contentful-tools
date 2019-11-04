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

This generator CLI pulls a content space definition from Contentful and creates an interface for each
content type, using its field validations to create the appropriate TypeScript type. Generated
fields are marked optional or required according to the content type definition. The following field
types give the corresponding TypeScript types:

-   Boolean ⟹ `boolean`
-   Date ⟹ `string` (ISO8601)
-   Integer ⟹ `number`
-   Number ⟹ `number`
-   Text (long string) ⟹ `string`
-   Symbol (short string) ⟹ `string`
-   Symbol enum (fixed value or values) ⟹ references a generated `enum ExampleEnum`
-   Symbol enum array ⟹ `ExampleEnum[]`

The following mappings reference types from `@contentful-tools/store`, allowing them to be updated with
improved definitions, without regeneration:

-   Location ⟹ `Location`, defined as `{ lon: number; lat: number }`
-   Object ⟹ `JSON`, defined as `{ [key: string]: any } | any[]`
-   Rich text ⟹ `RichText`, defined as `any`

Reference-type fields can be followed to the linked entry or asset — the store lazily evaluates the links
using getters, so circular references are no problem.

Entries are flattened for ease-of-use (especially within a GraphQL API) with top-level `__typename` and `__id`
properties. `__id` is the Contentful ‘sys’ ID; `__typename` uses the provided values from the generator config
(see below), or otherwise just the API name for the content type (if no mapping is provided).

#### Example generated interface:

```ts
export interface Post extends Entry {
    __typename: 'Post';
    __id: string;
    title: string;
    content: string;
    author: Author;
}
```

### Store class

The generator creates a class with typed methods to get your assets and entries from the store.
It must be instantiated with an instance of `ContentfulStore`, before using any of its methods.

```ts
export class ContentStore {
    private readonly store: Store;

    constructor(contentfulStore: Store) {
        this.store = contentfulStore;
    }

    getAsset(__id: string, locale: Locale): Asset | null {
        return this.store.getAsset(__id, locale);
    }

    getAssets(locale: Locale): Asset[] {
        return this.store.getAssets(locale);
    }

    // ...
}
```

The base locale for your content space, and any additional locales, should be provided in the
generator config. Separating the base and extra locales is what allows type-safe access to a field
marked as required, without having to make a null check — on the basis that an entry cannot be
published if it is missing a value for your space’s default locale.

**Note**, you should also make sure to call `await store.sync()` before attempting to use any of the
getters (typically before your server starts accepting requests), otherwise you will get no content
on first use.

```ts
function getPostAuthorAvatar(postId: string): Content.Asset | null {
    const post = contentStore.getPost('123');
    return post ? post.author.avatar : null;
}
```

### Config

Example `contentful.json` config file (a different name can be specified via the CLI):

```json5
{
    // (default = false)
    // Whether to remove everything in the output directory before generation;
    // use at your own risk!
    "clean": true,

    // (required)
    // Where to put the generated TypeScript files;
    // created for you using the equivalent of mkdir -p
    "outDir": "./store",
    
    // (required)
    // Contentful space ID.
    "space": "a1b2c3d4",
    
    // (required)
    // Specify at least a base locale; extra may be an empty array.
    "locales": {
        "base": "en",
        "extra": ["de"]
    },
    
    // (optional)
    // If specified, all types will be grouped together in a single namespace file with the given name.
    "namespace": "Content",
    
    // (required)
    // Name of the generated class containing methods to get content entries & assets.
    "storeClass": "ContentStore",

    // (default = false)
    // Whether the locale parameter to the generated methods is optional.
    "localeOptional": true,
    
    // (optional)
    // Array of field IDs, for which getter methods are generated.
    // For example, given ["id"] and a content type "BlogPost", the method "getBlogPostById" is generated.
    "fieldGetters": [
        "id"
    ],
    
    // (optional)
    // Uses the specified field in default getter methods, instead of "__id"
    "idField": "id",

    // (optional)
    // Mapping from your content type IDs to desired interface names; the generated ContentTypeId
    // enum uses the actual IDs as its string values. If omitted, interfaces will be generated with
    // your content type IDs capitalized (e.g. blogPost ⟹ BlogPost).
    "contentTypeNameMap": {
        "blogPost": "Post",
        // ...
    },
    
    // (optional)
    // Generates a convenient getter method for content types that only have one entry.
    "singletons": [
        "Config"
    ],
    
    // (optional)
    // Useful to override the very generic JSON type for object fields. Path is relative to the generated output;
    // type should be the name of an exported interface or type alias.
    "typeOverrides": {
        "Post": {
            "extra": {
                "path": "./overrides/Post",
                "type": "PostExtra"
            }
        }
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
