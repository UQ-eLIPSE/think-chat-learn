/**
 * MOOCchat
 * Utilities module
 */
export namespace Utils {
  export namespace DateTime {
    /**
     * Converts seconds to milliseconds.
     *
     * @param {number} seconds
     * @return {number} Value of input in milliseconds
     */
    export function secToMs(seconds: number) {
      return seconds * 1000;
    }

    /**
     * Converts minutes to milliseconds.
     *
     * @param {number} minutes
     * @return {number} Value of input in milliseconds
     */
    export function minToMs(minutes: number) {
      return secToMs(minutes * 60);
    }

    export function secondsToMinutes(seconds: number) {
      return seconds / 60;
    }
    export function msToMinutes(milliseconds: number) {
      return secondsToMinutes(milliseconds / 1000);
    }

    /**
     * Converts hours to milliseconds.
     *
     * @param {number} hours
     * @return {number} Value of input in milliseconds
     */
    export function hrsToMs(hours: number) {
      return minToMs(hours * 60);
    }

    /**
     * Format a time interval as mm:ss.
     *
     * Minute is variable length, seconds is always 2 places.
     *
     * @param {number} ms Time interval in milliseconds
     * @returns {string} Formatted time interval
     */
    export function formatIntervalAsMMSS(ms: number) {
      const minutes = Math.floor(ms / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);

      return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
  }

  export namespace Array {
    /**
     * Determines whether a given search element exists in array.
     *
     * ES2016 near-equivalent.
     *
     * https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
     *
     * @param {T[]} array
     * @param {T} searchElement
     * @returns {boolean} Whether searchElement exists in array
     */
    export function includes<T>(array: T[], searchElement: T) {
      const len = array.length;
      let k = 0;

      let currentElement: T;
      while (k < len) {
        currentElement = array[k];
        if (
          searchElement === currentElement ||
          (searchElement !== searchElement && currentElement !== currentElement)
        ) {
          // NaN !== NaN
          return true;
        }
        k++;
      }
      return false;
    }

    /**
     * Lighter version of .includes(), using Array#indexOf() internally.
     *
     * Note that Array#indexOf() slightly differently to ES2016 Array#includes() with regards to NaN.
     *
     * @param {T[]} array
     * @param {T} searchElement
     * @returns Whether searchElement exists in array
     */
    export function includesViaIndexOf<T>(array: T[], searchElement: T) {
      return array.indexOf(searchElement) > -1;
    }

    /**
     * Shuffles array in place.
     *
     * http://stackoverflow.com/a/6274381
     *
     * @param {T[]} a The array containing the items.
     */
    export function shuffleInPlace<T>(a: T[]) {
      let j: number;
      let x: T;
      let i: number;
      for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
      }
    }
  }

  export namespace String {
    export function padLeft(str: string, padChar: string, length: number) {
      return repeat(padChar, length - str.length) + str;
    }

    export function repeat(str: string, n: number): string {
      if (n === 0) {
        return "";
      }

      return n <= 1 ? str : str + repeat(str, n - 1);
    }
  }

  export namespace Rules {
    // For Vuetify form elements, check if the value is falsy and returns whether or not exist or an error message
    export function existenceRule(value: any) {
      return value ? true : "Empty field";
    }
  }
}
