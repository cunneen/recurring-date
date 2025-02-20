export = RecurringDate;
/**
 * @typedef {Object} Pattern The specification for a recurrence of dates.
 * @property {Date|String} start start date ; if specified as a string, ensure that date_format is specified.
 * @property {Number} every the frequency of repetition e.g. the "[NNN]" in the sentence, "Every [NNN] weeks on Monday, Wednesday, and Friday starting today for 5 occurrences"
 * @property {"d"|"w"|"m"|"y"} unit the unit of time for the repetition i.e. days, weeks, months, or years
 * @property {"until"|"for"} end_condition how should the recurrence be terminated. If `"until"`, then `until` should be a date. If `"for"`, then `rfor` should be an integer (for N occurrences).
 * @property {Date|String} [until] end date ; if specified as a string, ensure that date_format is specified. Required if `end_condition === "until"` .
 * @property {Number} [rfor] if end_condition is 'for', pass an integer here.
 * @property {Number} [occurrence_of] valid values are 0-6, corresponding to the days of the week.
  in conjuction with 'nth' option, specifies nth day of the month
  (last Sunday of the month). to be used with 'm' unit option.
 * @property {"first"|"second"|"third"|"fourth"|"last"} [nth] valid values are 'first', 'second', 'third', 'fourth', and 'last'.
  see 'occurrence_of' option. to be used with 'm' unit option.
 * @property {Number[]} [days] to be used with 'w' unit option. an array of integers representing day
  of the week (0-6). eg. Every 2 weeks on Tuesday (2) and Thursday (4),
  pass [2,4] as the value.
 * @property {String} [date_format] a string representing the date format to use
 *  when parsing start and end dates, if they are strings. If not specified,
 *  start and end dates should be either Date objects or moment objects.
 *  (See {@link https://momentjs.com/docs/#/displaying/format/ | momentjs docs}
 *   for valid format characters)
 * @property {String} [moment_locale = "en"] a locale identifier as per {@link https://cdn.jsdelivr.net/npm/dayjs@1/locale.json | this JSON document}
 * @property {Number} [timezone] A UTC offset in minutes, as per {@link https://momentjs.com/docs/#/manipulating/utc-offset/ | momentjs utcOffset()}
 *
 */
/**
 * RecurringDate class
 * @class
 * @param {Pattern} pattern a JSON object with pattern options
 * @param {String} date_format a string representing the date format to use
 *  when parsing start and end dates, if they are strings. If not specified,
 *  start and end dates should be either Date objects or moment objects.
 *  (See {@link https://momentjs.com/docs/#/displaying/format/ | momentjs docs} or
 *   {@link https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens | dayjs docs}
 *   for valid format characters)
 */
declare function RecurringDate(pattern: Pattern, date_format: string): void;
declare class RecurringDate {
    /**
     * @typedef {Object} Pattern The specification for a recurrence of dates.
     * @property {Date|String} start start date ; if specified as a string, ensure that date_format is specified.
     * @property {Number} every the frequency of repetition e.g. the "[NNN]" in the sentence, "Every [NNN] weeks on Monday, Wednesday, and Friday starting today for 5 occurrences"
     * @property {"d"|"w"|"m"|"y"} unit the unit of time for the repetition i.e. days, weeks, months, or years
     * @property {"until"|"for"} end_condition how should the recurrence be terminated. If `"until"`, then `until` should be a date. If `"for"`, then `rfor` should be an integer (for N occurrences).
     * @property {Date|String} [until] end date ; if specified as a string, ensure that date_format is specified. Required if `end_condition === "until"` .
     * @property {Number} [rfor] if end_condition is 'for', pass an integer here.
     * @property {Number} [occurrence_of] valid values are 0-6, corresponding to the days of the week.
      in conjuction with 'nth' option, specifies nth day of the month
      (last Sunday of the month). to be used with 'm' unit option.
     * @property {"first"|"second"|"third"|"fourth"|"last"} [nth] valid values are 'first', 'second', 'third', 'fourth', and 'last'.
      see 'occurrence_of' option. to be used with 'm' unit option.
     * @property {Number[]} [days] to be used with 'w' unit option. an array of integers representing day
      of the week (0-6). eg. Every 2 weeks on Tuesday (2) and Thursday (4),
      pass [2,4] as the value.
     * @property {String} [date_format] a string representing the date format to use
     *  when parsing start and end dates, if they are strings. If not specified,
     *  start and end dates should be either Date objects or moment objects.
     *  (See {@link https://momentjs.com/docs/#/displaying/format/ | momentjs docs}
     *   for valid format characters)
     * @property {String} [moment_locale = "en"] a locale identifier as per {@link https://cdn.jsdelivr.net/npm/dayjs@1/locale.json | this JSON document}
     * @property {Number} [timezone] A UTC offset in minutes, as per {@link https://momentjs.com/docs/#/manipulating/utc-offset/ | momentjs utcOffset()}
     *
     */
    /**
     * RecurringDate class
     * @class
     * @param {Pattern} pattern a JSON object with pattern options
     * @param {String} date_format a string representing the date format to use
     *  when parsing start and end dates, if they are strings. If not specified,
     *  start and end dates should be either Date objects or moment objects.
     *  (See {@link https://momentjs.com/docs/#/displaying/format/ | momentjs docs} or
     *   {@link https://day.js.org/docs/en/parse/string-format#list-of-all-available-parsing-tokens | dayjs docs}
     *   for valid format characters)
     */
    constructor(pattern: Pattern, date_format: string);
    pattern: Pattern;
    dates: any[];
    /** @type {Pattern["moment_locale"]} */
    moment_locale: Pattern["moment_locale"];
    /** @type {Pattern["date_format"]} */
    date_format: Pattern["date_format"];
    /** @type {Pattern["timezone"]} */
    timezone: Pattern["timezone"];
    /** @type {MomentInstance} */
    start: MomentInstance;
    /** @type {MomentInstance} */
    until: MomentInstance;
    /** @type {Pattern["rfor"]} */
    rfor: Pattern["rfor"];
    /** @type {Pattern["every"]} */
    every: Pattern["every"];
    /** @type {Pattern["unit"]} */
    unit: Pattern["unit"];
    /** @type {Pattern["end_condition"]} */
    end_condition: Pattern["end_condition"];
    /** @type {Pattern["occurrence_of"]} */
    occurrence_of: Pattern["occurrence_of"];
    /** @type {Pattern["nth"]} */
    nth: Pattern["nth"];
    /** @type {Pattern["days"]} */
    days: Pattern["days"];
    _getDate(value: any): any;
    /**
     * Move to the next or last dayOfWeek based on the orient value.
     * @param {MomentInstance}   momentToManipulate
     * @param {Number}   dayOfWeek = The dayOfWeek to move to
     * @param {Number}   orient - Forward (+1) or Back (-1). Defaults to +1. [Optional]
     * @return {Date}    this
     */
    _moveToDayOfWeek(momentToManipulate: MomentInstance, dayOfWeek: number, orient: number): Date;
    /**
     * Moves the date to the next n'th occurrence of the dayOfWeek starting from the beginning of the month. The number (-1) is a magic number and will return the last occurrence of the dayOfWeek in the month.
     * @param {MomentInstance}   momentToManipulate
     * @param {Number}   dayOfWeek - The dayOfWeek to move to
     * @param {Number}   occurrence - The n'th occurrence to move to. Use (-1) to return the last occurrence in the month
     * @return {MomentInstance}    An instance of the date library with the new date
     */
    _movetoNthOccurrence(momentToManipulate: MomentInstance, dayOfWeek: number, occurrence: number): MomentInstance;
    /**
     * Returns a plain English string describing the recurrence pattern.
     *
     * @return {String} A description of the recurrence pattern
     */
    describe(): string;
    /**
     * Determines whether "date" is in the recurrence pattern. This calls generate(),
     * if it hasn't already been generated, otherwise, it will use the dates generated
     * from the last time generate() was called. Returns true if "date" is in the pattern.
     * "date" can be either a string or a Date object, but please make sure the time
     * portion is all zeros (00:00:00).
     *
     * Note that this only check if "date" is contained within the pattern's starting and
     * ending points. Next version will support indefinite ending date and throwaway dates
     * generation, instead of storing them all in an array.
     *
     * @param {String|Date} date the date to check
     * @return {Boolean} whether the date is in the pattern
     */
    contains(d: any): boolean;
    /**
     * Generates an array of dates base on input pattern.
     *
     * @param {Number} [max] maximum number of dates to generate. If not specified,
     *  will generate until it reaches the end condition.
     * @return {MomentInstance[]} an array of generated dates.
     */
    generate(max?: number): MomentInstance[];
}
declare namespace RecurringDate {
    export { initializeWithDateLibrary, Pattern, MomentCompatibleLibrary, MomentInstance };
}
/**
 * Initialize this instance with the momentjs library or a compatible equivalent e.g. dayjs.
 * RecurringDate is designed to be used with a library like momentjs, but does not hard-code a dependency on momentjs.
 * Initialize the library with a momentjs-compatible library to enable its functionality.
 * @param {MomentCompatibleLibrary} dateLibraryParam The momentjs library or a compatible equivalent e.g. dayjs
 */
declare function initializeWithDateLibrary(dateLibraryParam: MomentCompatibleLibrary): void;
/**
 * The specification for a recurrence of dates.
 */
type Pattern = {
    /**
     * start date ; if specified as a string, ensure that date_format is specified.
     */
    start: Date | string;
    /**
     * the frequency of repetition e.g. the "[NNN]" in the sentence, "Every [NNN] weeks on Monday, Wednesday, and Friday starting today for 5 occurrences"
     */
    every: number;
    /**
     * the unit of time for the repetition i.e. days, weeks, months, or years
     */
    unit: "d" | "w" | "m" | "y";
    /**
     * how should the recurrence be terminated. If `"until"`, then `until` should be a date. If `"for"`, then `rfor` should be an integer (for N occurrences).
     */
    end_condition: "until" | "for";
    /**
     * end date ; if specified as a string, ensure that date_format is specified. Required if `end_condition === "until"` .
     */
    until?: Date | string;
    /**
     * if end_condition is 'for', pass an integer here.
     */
    rfor?: number;
    /**
     * valid values are 0-6, corresponding to the days of the week.
     * in conjuction with 'nth' option, specifies nth day of the month
     * (last Sunday of the month). to be used with 'm' unit option.
     */
    occurrence_of?: number;
    /**
     * valid values are 'first', 'second', 'third', 'fourth', and 'last'.
     * see 'occurrence_of' option. to be used with 'm' unit option.
     */
    nth?: "first" | "second" | "third" | "fourth" | "last";
    /**
     * to be used with 'w' unit option. an array of integers representing day
     * of the week (0-6). eg. Every 2 weeks on Tuesday (2) and Thursday (4),
     * pass [2,4] as the value.
     */
    days?: number[];
    /**
     * a string representing the date format to use
     * when parsing start and end dates, if they are strings. If not specified,
     * start and end dates should be either Date objects or moment objects.
     * (See {@link https://momentjs.com/docs/#/displaying/format/ | momentjs docs}for valid format characters)
     */
    date_format?: string;
    /**
     * a locale identifier as per {@link https://cdn.jsdelivr.net/npm/dayjs@1/locale.json | this JSON document}
     */
    moment_locale?: string;
    /**
     * A UTC offset in minutes, as per {@link https://momentjs.com/docs/#/manipulating/utc-offset/ | momentjs utcOffset()}
     */
    timezone?: number;
};
/**
 * The momentjs library or a compatible equivalent e.g. dayjs
 */
type MomentCompatibleLibrary = typeof moment;
/**
 * An instance of the date library, e.g. a momentjs instance
 */
type MomentInstance = import("moment").Moment;
//# sourceMappingURL=RecurringDate.d.ts.map