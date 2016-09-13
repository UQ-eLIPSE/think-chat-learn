/// Type definitions for server

/// <reference path="./typings/index.d.ts" />

// oauth-signature
declare module "oauth-signature" {
    export function generate(
        httpMethod: string,
        url: string,
        parameters: { [key: string]: string },
        consumerSecret: string,
        tokenSecret?: string,
        options?: { [key: string]: any }): string;
}

declare type ObjectId = any;

declare module "mongojs" {
    // Empty module definition as we don't have proper type definitions for mongojs
    const _: any;
    export = _;
}