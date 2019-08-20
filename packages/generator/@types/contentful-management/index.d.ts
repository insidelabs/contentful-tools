declare module 'contentful-management' {
    import { OutgoingHttpHeaders } from 'http';

    function createClient(params: {
        accessToken: string;
        defaultHostname?: string;
        defaultHostnameUpload?: string;
        headers?: OutgoingHttpHeaders;
    }): Client;

    export interface Client {
        createPersonalAccessToken(data: { name: string; scopes: string[] }): PersonalAccessToken;
        createSpace<L extends string>(data: { name: string }, organizationId?: string): Promise<Space<L>>;
        getCurrentUser(): Promise<User>;
        getPersonalAccessToken(tokenId: string): PersonalAccessToken;
        getPersonalAccessTokens(): Promise<Collection<PersonalAccessToken>>;
        getSpace<L extends string>(spaceId: string): Promise<Space<L>>;
        getSpaces<L extends string>(): Promise<Collection<Space<L>>>;
        getOrganizations(): Promise<Collection<Organization>>;
        // getUsagePeriods(organizationId: string): Promise<Collection<UsagePeriod>>;
        // getUsages(organizationId: string, type: 'space' | 'organization', query: UsagesQuery): Promise<Collection<Usage>>;
    }

    interface Organization {
        sys: {
            id: string;
            type: SysType.Organization;
            createdAt: string;
            updatedAt: string;
            version: number;
        };
        name: string;
    }

    interface PersonalAccessToken {
        sys: {
            id: string;
            type: SysType.PersonalAccessToken;
            createdAt: string;
            updatedAt: string;
        };
        name: string;
        scopes: string[];
        revokedAt: string | null;

        revoke(): Promise<PersonalAccessToken>;
    }

    interface User {
        sys: {
            id: string;
            type: SysType.User;
            createdAt: string;
            updatedAt: string;
            version: number;
        };
        activated: boolean;
        avatarUrl: string;
        confirmed: boolean;
        email: string;
        firstName: string;
        lastName: string;
        signInCount: number;

        toPlainObject(): PlainObject<User>;
    }

    export interface Space<L extends string> extends Entity<Space<L>> {
        sys: SysUpdated<SysType.Space>;
        name: string;

        // createApiKey(data): Promise<ApiKey>;
        // createApiKeyWithId(id: string, data): Promise<ApiKey>;
        // createEnvironment()
        // createEnvironmentWithId(id)
        // createRole(data)
        // createRoleWithId(id, data)
        // createSpaceMembership(data)
        // createSpaceMembershipWithId(id, data)
        // createWebhook(data)
        // createWebhookWithId(id, data)
        getApiKey(id: string): Promise<ApiKey>;
        getApiKeys(): Promise<Collection<ApiKey>>;
        getEnvironment(id: string): Promise<Environment<L>>;
        getEnvironments(): Promise<Collection<Environment<L>>>;
        // getPreviewApiKey(id: string): Promise<PreviewApiKey>;
        // getPreviewApiKeys(): Promise<Collection<PreviewApiKey>>;
        // getRole(id)
        // getRoles()
        // getSpaceMembership(id)
        // getSpaceMemberships()
        // getWebhook(id)
        // getWebhooks()
    }

    interface ApiKey extends Entity<ApiKey> {
        sys: SysUpdated<SysType.ApiKey>;
        name: string;
        description: string | null;
        accessToken: string;
        policies: Array<{
            actions: string;
            effect: string;
        }>;
        preview_api_key: Link<SysType.PreviewApiKey>;
    }

    // interface PreviewApiKey extends Omit<ApiKey, 'sys'> {
    //     sys: SysUpdated<SysType.PreviewApiKey>;
    // }

    export interface Environment<L extends string> extends Entity<Environment<L>> {
        sys: SysUpdated<SysType.Environment>;
        name: string;

        createAsset(data: CreateAssetData<L>): Promise<Asset<L>>;
        createAssetFromFiles(data: CreateAssetFromFilesData<L>): Promise<Asset<L>>;
        createAssetWithId(id: string, data: CreateAssetData<L>): Promise<Asset<L>>;
        createEntry<F = EntryFields>(contentTypeId: string, data: CreateEntryData<L, F>): Promise<Entry<L, F>>;
        createEntryWithId<F = EntryFields>(
            contentTypeId: string,
            id: string,
            data: CreateEntryData<L, F>,
        ): Promise<Entry<L, F>>;
        createUpload(data: CreateUploadData): Promise<Upload>;
        getAsset(id: string): Promise<Asset<L>>;
        getAssets(): Promise<Collection<Asset<L>>>;
        getContentType(id: string): Promise<ContentType>;
        getContentTypes(): Promise<Collection<ContentType>>;
        getEntries(): Promise<Collection<Entry<L, EntryFields>>>;
        getEntry<F = EntryFields>(id: string): Promise<Entry<L, F>>;
        getLocale(id: string): Promise<Locale>;
        getLocales(): Promise<Collection<Locale>>;
        getUpload(id: string): Promise<Upload>;
        // createContentType(data)
        // createContentTypeWithId(id, data)
        // createLocale(data)
        // createUiExtension(data)
        // createUiExtensionWithId(id, data)
        // getContentTypeSnapshots(contentTypeId)
        // getEditorInterfaceForContentType(contentTypeId)
        // getEntrySnapshots(entryId)
        // getUiExtension(id)
        // getUiExtensions()
    }

    interface CreateAssetData<L extends string> {
        fields: Localized<
            L,
            {
                title?: string;
                description?: string;
                file?: {
                    contentType: string;
                    fileName: string;
                    uploadFrom: Link<SysType.Upload>;
                };
            }
            >;
    }

    interface CreateAssetFromFilesData<L extends string> {
        fields: Localized<
            L,
            {
                title?: string;
                description?: string;
                file: {
                    contentType: string;
                    fileName: string;
                    file: Buffer;
                };
            }
            >;
    }

    interface CreateEntryData<L extends string, F extends EntryFields> {
        fields: Partial<Localized<L, F>>;
    }

    interface CreateUploadData {
        file: Buffer;
    }

    interface Locale extends Entity<Locale> {
        sys: SysLinked<SysType.Locale>;
        name: string;
        code: string;
        contentDeliveryApi: boolean;
        contentManagementApi: boolean;
        default: boolean;
        optional: boolean;
        fallbackCode: string | null;
    }

    export interface ContentType extends Entity<ContentType>, Publishable<ContentType> {
        sys: SysPublished<SysType.ContentType>;
        fields: ContentTypeField[];

        // findAndUpdateField(id, key, value)
        // getEditorInterface()
        // getSnapshot(snapshotId)
        // getSnapshots()
        // omitAndDeleteField(id)
    }

    export enum AssetMimetype {
        attachment = 'attachment',
        plaintext = 'plaintext',
        image = 'image',
        audio = 'audio',
        video = 'video',
        richtext = 'richtext',
        presentation = 'presentation',
        spreadsheet = 'spreadsheet',
        pdf = 'pdfdocument',
        archive = 'archive',
        code = 'code',
        markup = 'markup',
    }

    export enum LinkType {
        Asset = 'Asset',
        Entry = 'Entry',
    }

    export enum FieldType {
        Array = 'Array',
        Boolean = 'Boolean',
        Date = 'Date',
        Integer = 'Integer',
        Link = 'Link',
        Location = 'Location',
        Number = 'Number',
        Object = 'Object',
        RichText = 'RichText',
        Symbol = 'Symbol',
        Text = 'Text',
    }

    export type ContentTypeField =
        | ArrayField
        | BooleanField
        | DateTimeField
        | LinkedAssetField
        | LinkedEntryField
        | LocationField
        | NumberField
        | ObjectField
        | RichTextField
        | SymbolField
        | TextField;

    interface BaseField {
        id: string;
        name: string;
        type: FieldType;
        disabled: boolean;
        omitted: boolean;
        required: boolean;
        localized: boolean;
    }

    export interface ArrayField extends BaseField {
        type: FieldType.Array;
        validations: ArrayValidation[];
        items:
            | {
            type: FieldType.Link;
            linkType: LinkType.Asset;
            validations: LinkedAssetValidation[];
        }
            | {
            type: FieldType.Link;
            linkType: LinkType.Entry;
            validations: LinkedEntryValidation[];
        }
            | {
            type: FieldType.Symbol;
            validations: TextValidation[];
        };
    }

    export interface BooleanField extends BaseField {
        type: FieldType.Boolean;
    }

    export interface DateTimeField extends BaseField {
        type: FieldType.Date;
        validations: DateTimeValidation[];
    }

    export interface LinkedAssetField extends BaseField {
        type: FieldType.Link;
        linkType: LinkType.Asset;
        validations: LinkedAssetValidation[];
    }

    export interface LinkedEntryField extends BaseField {
        type: FieldType.Link;
        linkType: LinkType.Entry;
        validations: LinkedEntryValidation[];
    }

    export interface LocationField extends BaseField {
        type: FieldType.Location;
    }

    export interface NumberField extends BaseField {
        type: FieldType.Integer | FieldType.Number;
        validations: NumberValidation[];
    }

    export interface ObjectField extends BaseField {
        type: FieldType.Object;
        validations: ObjectValidation[];
    }

    export interface RichTextField extends BaseField {
        type: FieldType.RichText;
    }

    export interface SymbolField extends BaseField {
        type: FieldType.Symbol;
        validations: TextValidation[];
    }

    export interface TextField extends BaseField {
        type: FieldType.Text;
        validations: TextValidation[];
    }

    /*
     * Field type validations
     */

    export type ArrayValidation = SizeValidation;

    export type DateTimeValidation = {
        dateRange:
            | { min: string }
            | { max: string }
            | { min: string; max: string }
            | { before: string }
            | { after: string }
            | { before: string; after: string };
        message?: string;
    };

    export type LinkedAssetValidation =
        | {
        linkMimetypeGroup: AssetMimetype[];
        message?: string;
    }
        | {
        assetImageDimensions: {
            width: MinMaxNumber;
            height: MinMaxNumber;
        };
        message?: string;
    }
        | {
        assetFileSize: MinMaxNumber;
        message?: string;
    };

    export type LinkedEntryValidation = {
        linkContentType: string[];
        message?: string;
    };

    export type NumberValidation =
        | UniqueValidation
        | EnumNumberValidation
        | {
        range: MinMaxNumber;
        message?: string;
    };

    export type ObjectValidation = SizeValidation;

    export type TextValidation =
        | UniqueValidation
        | SizeValidation
        | PatternValidation
        | EnumStringValidation;

    /*
     * Generic validations
     */

    export type EnumNumberValidation = {
        in: number[];
        message?: string;
    };

    export type EnumStringValidation = {
        in: string[];
        message?: string;
    };

    export type PatternValidation = {
        regexp: {
            pattern: string;
            flags?: string;
        };
        message?: string;
    };

    export type SizeValidation = {
        size: MinMaxNumber;
        message?: string;
    };

    export type UniqueValidation = {
        unique: true;
    };

    type MinMaxNumber =
        | { min: number }
        | { max: number }
        | {
        min: number;
        max: number;
    };

    interface Upload {
        sys: Sys<SysType.Upload> & {
            expiresAt: string;
        };

        delete(): Promise<void>;
        toPlainObject(): PlainObject<Upload>;
    }

    interface Asset<L extends string> extends Entity<Asset<L>>, Archivable<Asset<L>>, Publishable<Asset<L>> {
        sys: SysPublished<SysType.Asset>;
        fields: Localized<L, AssetFields>;

        processForAllLocales(): Promise<Asset<L>>;
        processForLocale(locale: string): Promise<Asset<L>>;
    }

    interface AssetFields {
        title?: string;
        description?: string;
        file?: {
            contentType: string;
            fileName: string;
            url: string;
            details?: {
                size: number;
                image?: {
                    width: number;
                    height: number;
                };
            };
        };
    }

    interface Entry<L extends string, F extends EntryFields>
        extends Entity<L>,
            Archivable<Entry<L, F>>,
            Publishable<Entry<L, F>> {
        // getSnapshot(snapshotId);
        // getSnapshots();

        sys: SysPublished<SysType.Entry> & {
            contentType: Link<SysType.ContentType>;
        };

        fields: Localized<L, F>;
    }

    type EntryFields = {
        [K in string]: any;
    };

    type PlainObject<E> = {
        [K in { [K in keyof E]: E[K] extends Function ? never : K }[keyof E]]: E[K];
    };

    interface Entity<E> {
        update(): Promise<E>;
        delete(): Promise<void>;
        toPlainObject(): PlainObject<E>;
    }

    interface Publishable<E> {
        isDraft(): boolean;
        isPublished(): boolean;
        isUpdated(): boolean;
        publish(): Promise<E>;
        unpublish(): Promise<E>;
    }

    interface Archivable<E> {
        isArchived(): boolean;
        archive(): Promise<E>;
        unarchive(): Promise<E>;
    }

    type Sys<S extends SysType> = {
        id: string;
        type: S;
        createdAt: string;
        createdBy: Link<SysType.User>;
    };

    type SysUpdated<S extends SysType> = Sys<S> & {
        updatedAt: string;
        updatedBy: Link<SysType.User>;
        version: number;
    };

    type SysLinked<S extends SysType> = SysUpdated<S> & {
        space: Link<SysType.Space>;
        environment: Link<SysType.Environment>;
    };

    type SysPublished<S extends SysType> = SysLinked<S> & {
        firstPublishedAt: string;
        publishedAt: string;
        publishedBy: Link<SysType.User>;
        publishedCounter: number;
        publishedVersion: number;
    };

    enum SysType {
        ApiKey = 'ApiKey',
        Array = 'Array',
        Asset = 'Asset',
        ContentType = 'ContentType',
        Entry = 'Entry',
        Environment = 'Environment',
        Link = 'Link',
        Locale = 'Locale',
        Organization = 'Organization',
        PersonalAccessToken = 'PersonalAccessToken',
        PreviewApiKey = 'PreviewApiKey',
        Space = 'Space',
        Upload = 'Upload',
        User = 'User',
    }

    type Collection<T> = {
        sys: {
            type: SysType.Array;
        };
        items: T[];
        limit: number;
        skip: number;
        total: number;
    };

    type Link<T> = {
        sys: {
            type: SysType.Link;
            linkType: T;
            id: string;
        };
    };

    type Localized<L extends string, T> = {
        [key in keyof T]: {
            [locale in L]?: T[key];
        };
    };
}
