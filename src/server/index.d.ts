/// Type definitions for external modules

// oauth-signature
declare module "oauth-signature" {
    export function generate(
        httpMethod: string,
        url: string,
        parameters: {[key: string]: string},
        consumerSecret: string,
        tokenSecret?: string,
        options?: {[key: string]: any}): string;
}
