import store from '../store';

/**
 * Utilities to track if a mark has been changed
 */
export function setMarkChangedFlag(changed: boolean) {
    store.commit('SET_MARK_CHANGED_FLAG', changed);
}

export function isMarkChanged() {
    return store.getters.isMarkChanged;
}

/**
 * Checks if a mark change has been detected.
 * If a mark change has been detected, prompts the user to confirm whether they want to cancel navigation or continue navigation.
 * @returns `true` If it is safe to navigate to another page / user wants to discard marks and continue navigation
 */

export function confirmMarkNavigateAway() {
    const changed = isMarkChanged();

    if (changed) {
        const confirmed = confirm("Mark may have unsaved changes. Changes will be discarded if you continue. Continue?");
        if(confirmed) {
            // User has confirmed they are OK to navigate away, set the changed flag as false
            setMarkChangedFlag(false);
        }
        return confirmed;
    }

    return true;
}