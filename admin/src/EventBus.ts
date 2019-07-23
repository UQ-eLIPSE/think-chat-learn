
import Vue from "vue";

export enum EventList {
    PUSH_SNACKBAR = "PUSH_SNACKBAR",
    OPEN_MODAL = "OPEN MODAL",
    QUILL_UPLOAD = "QUILL_UPLOAD",
    CONSOLIDATE_UPLOADS = "CONSOLIDATE_UPLOADS",
}

// If the error is true, then it will set a danger flag to the snackbar. Success otherwise
export interface SnackEvent {
    message: string;
    error?: boolean;
}

// Allows a custom message to be sent for the dialog in addition to the function to call
// The idea is to call apply on the function with the data once a confirmation has been received
// selfRef is what the "this" keyword should refer to
export interface ModalEvent {
    message: string;
    title: string;
    data?: any[];
    fn?: Function;
    selfRef?: any;
}

// Allows blobs to be uploaded from Quill to a page which then allows consolidation of uploads
export interface BlobUpload {
    id: string,
    blob: Blob
}

export const EventBus = new Vue();
