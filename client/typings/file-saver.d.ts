declare const saveAs: (data: Blob | File, filename?: string, disableAutoBOM?: boolean) => void;

declare module "file-saver" {
    export = saveAs; 
}
