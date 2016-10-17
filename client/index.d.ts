/// Type definitions for client

/// <reference path="./typings/index.d.ts" />

// CKEditor does not come as a module by default, but we have shimmed it into
// RequireJS to fake it as such, so the module declaration below announces
// this fact to the TypeScript compiler
declare module "ckeditor" {
    export = CKEDITOR;
}
