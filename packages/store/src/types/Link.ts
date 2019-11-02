import { SysType } from './SysType';

export interface AssetLink {
    sys: {
        type: 'Link';
        linkType: 'Asset';
        id: string;
    };
}

export interface EntryLink {
    sys: {
        type: 'Link';
        linkType: 'Entry';
        id: string;
    };
}

export interface SpaceLink {
    sys: {
        type: 'Link';
        linkType: 'Space';
        id: string;
    };
}

export interface EnvironmentLink {
    sys: {
        type: 'Link';
        linkType: 'Environment';
        id: string;
    };
}

export interface ContentTypeLink {
    sys: {
        type: 'Link';
        linkType: 'ContentType';
        id: string;
    };
}

export interface Link {
    sys: {
        type: 'Link';
        linkType: SysType;
        id: string;
    };
}
