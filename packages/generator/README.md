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

The store caches content in-memory, and can be accessed synchronously in microseconds. The store can
be set up to synchronize whenever content is accessed, throttled to a configurable minimum interval.
This uses the `sync` endpoint of the Contentful Content Delivery API, which returns the entries &
assets that have been added & deleted since the last sync — to efficiently keep content always
up-to-date.

Note, the first fetch after an period of no requests will potentially return stale content, since
the store synchronously responds before triggering the sync. If your server is under any appreciable
load however, this won’t be a problem.

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

The generate pulls your content definiton 

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
