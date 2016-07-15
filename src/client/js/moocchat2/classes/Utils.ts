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
         * Format a time interval as mm:ss.
         * 
         * Minute is variable length, seconds is always 2 places.
         * 
         * @param {number} ms Time interval in milliseconds
         */
        formatIntervalAsMMSS: (ms: number) => {
            let minutes = Math.floor(ms / (1000 * 60));

            let seconds = Math.floor(ms % (1000 * 60) / 1000);

            return minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
        }
    }
}
