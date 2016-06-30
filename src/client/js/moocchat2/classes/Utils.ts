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
        secToMs: function(seconds: number) {
            return seconds * 1000;
        },

        /**
         * Format a time interval as mm:ss.
         * 
         * Minute is variable length, seconds is always 2 places.
         * 
         * @param {number} ms Time interval in milliseconds
         */
        formatIntervalAsMMSS: function(ms: number) {
            let minutes = Math.floor(ms / (1000 * 60));

            let seconds = Math.floor(ms % (1000 * 60) / 1000);

            return minutes + ":" + ((seconds < 10) ? "0" : "") + seconds;
        }
    },

    Object: {
        /**
         * Applies argument array as input parameters to provided `constructor` and returns a new instance of `constructor`.
         * 
         * @param {Function} constructor
         * @param {any[]} args Argument array
         * 
         * @return {Object} New instance of `constructor`
         */
        applyConstructor: function<T>(constructor: Function, args: any[]): T {
            return new (constructor.bind.apply(constructor, [].concat(null, args)));
        }
    }
}
