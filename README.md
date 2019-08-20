# Contentful Tools

Using the two packages in this repo, you can generate type declarations and getter functions for the
entries and assets of a Contentful space — then simply provide an instance of `ContentfulStore` in
your own project, and get fast, type-safe, auto-synchronizing access to your content.

Content is cached in-memory, and can be accessed synchronously in microseconds. The store can be
configured so that whenever content is accessed, a synchronization is automatically triggered
— throttled to a minimum interval of your choice. This uses the `sync` endpoint of the Contentful
Content Delivery API, which delivers a diff of the added & deleted entries and assets, to
efficiently keep content always up-to-date.
