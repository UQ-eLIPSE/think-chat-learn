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
    }
}
