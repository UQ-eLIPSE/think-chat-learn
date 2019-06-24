
import Vue from "vue";

export enum EventList {
    PUSH_SNACKBAR = "PUSH_SNACKBAR"
}

// If the error is true, then it will set a danger flag to the snackbar. Success otherwise
export interface SnackEvent {
    message: string;
    error?: boolean;
}

export const EventBus = new Vue();
