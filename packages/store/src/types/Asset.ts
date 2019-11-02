export interface Asset {
    __typename: 'Asset';
    __id: string;
    title?: string;
    description?: string;
    file: {
        url: string;
        contentType: string;
        fileName: string;
        details: {
            size: number;
            image?: {
                width: number;
                height: number;
            };
        };
    };
}
