export function getDescription(commandDescription: string): string {
    return [commandDescription.trim(), commonDescription.trim()].join('\n\n');
}

export const commonDescription = `
Requires a management API access token and environment name, which may be
specified with the following environment variable:

    CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
    CONTENTFUL_ENVIRONMENT
    
This may also be sourced from a .env file, located in the working directory.
`;
