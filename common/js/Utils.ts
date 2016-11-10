/**
 * MOOCchat
 * Utilities module
 */
export const Utils = {
    DateTime: {
        /**
         * Converts seconds to milliseconds.
         * 
         * @param {number} seconds
         * 
         * @return {number} Value of input in milliseconds
         */
        secToMs: (seconds: number) => {
            return seconds * 1000;
        },

        /**
         * Converts minutes to milliseconds.
         * 
         * @param {number} minutes
         * 
         * @return {number} Value of input in milliseconds
         */
        minToMs: (minutes: number) => {
            return Utils.DateTime.secToMs(minutes * 60);
        },

        /**
         * Converts hours to milliseconds.
         * 
         * @param {number} hours
         * 
         * @return {number} Value of input in milliseconds
         */
        hrsToMs: (hours: number) => {
            return Utils.DateTime.minToMs(hours * 60);
        },

        /**
         * Format a time interval as mm:ss.
         * 
         * Minute is variable length, seconds is always 2 places.
         * 
         * @param {number} ms Time interval in milliseconds
         */
        formatIntervalAsMMSS: (ms: number) => {
            const minutes = Math.floor(ms / (1000 * 60));
            const seconds = Math.floor(ms % (1000 * 60) / 1000);

            return minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
        }
    },

    Array: {
        includes: <T>(array: T[], searchElement: T) => {
            const len = array.length;
            let k = 0;

            var currentElement: T;
            while (k < len) {
                currentElement = array[k];
                if (searchElement === currentElement ||
                    (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                    return true;
                }
                k++;
            }
            return false;
        },

        /*
         * Shuffles array in place.
         * http://stackoverflow.com/a/6274381
         * 
         * @param {T[]} a The array containing the items.
         */
        shuffleInPlace: <T>(a: T[]) => {
            let j: number, x: T, i: number;
            for (i = a.length; i; i -= 1) {
                j = Math.floor(Math.random() * i);
                x = a[i - 1];
                a[i - 1] = a[j];
                a[j] = x;
            }
        }
    },
}
