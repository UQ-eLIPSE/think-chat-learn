
import Vue from "vue";

export enum EventList {
    PUSH_SNACKBAR = "PUSH_SNACKBAR",
    OPEN_MODAL = "OPEN MODAL"
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
    fn?: (...args: any) => any;
    selfRef?: any;
}

export function showSnackbar(messageText: string, isError?: boolean) {
    const message: SnackEvent = {
      message: messageText,
      error: !!isError
    };
    EventBus.$emit(EventList.PUSH_SNACKBAR, message);
    return;
  }


export const EventBus = new Vue();
