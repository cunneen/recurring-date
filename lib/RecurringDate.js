/*
 * Copyright (c) 2010 Rachot Moragraan, City of Garden Grove, CA
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/** @typedef {import("moment")} MomentCompatibleLibrary The momentjs library or a compatible equivalent e.g. dayjs */
/** @typedef {import("moment").Moment} MomentInstance An instance of the date library, e.g. a momentjs instance */

/** @type {MomentCompatibleLibrary} */
let dateLibrary;

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
function RecurringDate(pattern, date_format) {
  if (typeof pattern != "object") throw new TypeError("pattern must be a JSON");

  if (!pattern.every) {
    throw new ReferenceError("Every magnitude must be specified");
  }

  if (isNaN(parseInt(pattern.every))) {
    throw new TypeError("Every magnitude must be a valid number");
  }

  if (!date_format && !pattern.date_format) {
    if (typeof pattern.start === "string") {
      throw new ReferenceError(
        "If start date is a string, date_format must be specified"
      );
    }
    if (typeof pattern.until === "string") {
      throw new ReferenceError(
        "If end date is a string, date_format must be specified"
      );
    }
  }

  this.pattern = pattern;

  // stores generated dates based on recurrence pattern
  this.dates = [];

  /** @type {Pattern["moment_locale"]} */
  this.moment_locale = pattern.moment_locale || "en";
  dateLibrary.locale(this.moment_locale);
  /** @type {Pattern["date_format"]} */
  this.date_format = date_format || pattern.date_format;
  /** @type {Pattern["timezone"]} */
  this.timezone = pattern.timezone;

  /** @type {MomentInstance} */
  this.start = this._getDate(pattern.start);

  if (!this.start.isValid()) {
    throw new TypeError(
      `pattern.start "${pattern.start}" does not match date_format: "${this.date_format}"`
    );
  }
  if (pattern.end_condition === "until") {
    if (pattern.until) {
      /** @type {MomentInstance} */
      this.until = this._getDate(pattern.until);
      if (!this.until.isValid()) {
        throw new TypeError(
          `pattern.until "${pattern.until}" does not match date_format: "${this.date_format}"`
        );
      }
    } else {
      throw new ReferenceError("until date must be specified");
    }
  } else {
    /** @type {Pattern["rfor"]} */
    this.rfor = parseInt(pattern.rfor);
  }
  /** @type {Pattern["every"]} */
  this.every = parseInt(pattern.every);
  /** @type {Pattern["unit"]} */
  this.unit = pattern.unit;
  /** @type {Pattern["end_condition"]} */
  this.end_condition = pattern.end_condition;

  /** @type {Pattern["occurrence_of"]} */
  this.occurrence_of = pattern.occurrence_of;
  /** @type {Pattern["nth"]} */
  this.nth = parseInt(pattern.nth);
  /** @type {Pattern["days"]} */
  this.days = pattern.days ? pattern.days.sort() : [];
}

RecurringDate.prototype._getDate = function (value) {
  let result;
  // if it's already a date-library object, then just return it without attempting to parse.
  if (Object.prototype.hasOwnProperty.call(Object, dateLibrary, "isMoment")) {
    if (dateLibrary.isMoment(value)) {
      result = value;
    }
  } else if (
    Object.prototype.hasOwnProperty.call(Object, dateLibrary, "isDayjs")
  ) {
    if (dateLibrary.isDayjs(value)) {
      result = value;
    }
  } else if (
    Object.prototype.hasOwnProperty.call(Object, dateLibrary, "isDate")
  ) {
    // if it's already a date object, just wrap it in the date library without attempting to parse
    if (dateLibrary.isDate(value)) {
      result = dateLibrary(value);
    }
  } else if (value instanceof Date) {
    result = dateLibrary(value);
  }
  // if it's a string then parse it
  else if (typeof value === "string") {
    // attempt to parse the date as a string
    //TODO: datejs has a bug with strict parsing of timezones, see https://github.com/iamkun/dayjs/issues/2797 ;
    //      once that is fixed, change strict parsing to true by uncommenting the following line
    // result = dateLibrary(value, this.date_format, true);
    result = dateLibrary(value, this.date_format);
  } else {
    // it's something we don't recognize (e.g. a luxon date). Try to wrap it in the date library object.
    result = dateLibrary(value);
  }
  // Handle timezone offsets
  if (this.timezone) {
    result = result.utcOffset(this.timezone);
  }

  return result;
};

/**
 * Initialize this instance with the momentjs library or a compatible equivalent e.g. dayjs.
 * RecurringDate is designed to be used with a library like momentjs, but does not hard-code a dependency on momentjs.
 * Initialize the library with a momentjs-compatible library to enable its functionality.
 * @param {MomentCompatibleLibrary} dateLibraryParam The momentjs library or a compatible equivalent e.g. dayjs
 */
RecurringDate.initializeWithDateLibrary = function (dateLibraryParam) {
  dateLibrary = dateLibraryParam;
};

/**
 * Move to the next or last dayOfWeek based on the orient value.
 * @param {MomentInstance}   momentToManipulate
 * @param {Number}   dayOfWeek = The dayOfWeek to move to
 * @param {Number}   orient - Forward (+1) or Back (-1). Defaults to +1. [Optional]
 * @return {Date}    this
 */
RecurringDate.prototype._moveToDayOfWeek = function (
  momentToManipulate,
  dayOfWeek,
  orient
) {
  let diff = (dayOfWeek - momentToManipulate.day() + 7 * (orient || +1)) % 7;
  return momentToManipulate.add(
    diff === 0 ? (diff += 7 * (orient || +1)) : diff,
    "days"
  );
};

/**
 * Moves the date to the next n'th occurrence of the dayOfWeek starting from the beginning of the month. The number (-1) is a magic number and will return the last occurrence of the dayOfWeek in the month.
 * @param {MomentInstance}   momentToManipulate
 * @param {Number}   dayOfWeek - The dayOfWeek to move to
 * @param {Number}   occurrence - The n'th occurrence to move to. Use (-1) to return the last occurrence in the month
 * @return {MomentInstance}    An instance of the date library with the new date
 */
RecurringDate.prototype._movetoNthOccurrence = function (
  momentToManipulate,
  dayOfWeek,
  occurrence
) {
  let shift = 0;
  let manipulatedMoment;
  if (occurrence > 0) {
    shift = occurrence - 1;
  } else if (occurrence === -1) {
    manipulatedMoment = momentToManipulate.endOf("month"); // shift to the end of the month
    if (manipulatedMoment.day() !== dayOfWeek) {
      // is this the right day?
      manipulatedMoment = this._moveToDayOfWeek(
        manipulatedMoment,
        dayOfWeek,
        -1
      );
    }
    return manipulatedMoment;
  }
  // move to the end of the previous month
  manipulatedMoment = momentToManipulate.startOf("month");
  manipulatedMoment = manipulatedMoment.subtract(1, "days");
  // move forward to the desired day of the week
  manipulatedMoment = this._moveToDayOfWeek(manipulatedMoment, dayOfWeek, +1);
  // add the desired number of weeks (add one less than "1st", "2nd", "3rd" etc)
  return manipulatedMoment.add(shift, "weeks");
};

/**
 * Returns a plain English string describing the recurrence pattern.
 *
 * @return {String} A description of the recurrence pattern
 */
RecurringDate.prototype.describe = function () {
  const units = { d: "day", w: "week", m: "month", y: "year" };
  const week = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "day",
  ];
  const nthword = ["", "first", "second", "third", "fourth", "fifth", "last"];

  const t = ["Every"];
  if (this.every > 2) {
    t.push(this.every, units[this.unit] + "s");
  } else if (this.every == 2) {
    t.push("other", units[this.unit]);
  } else {
    t.push(units[this.unit]);
  }

  if (this.unit == "w") {
    const d = [];
    for (var i = 0; i < this.days.length; i++) {
      d.push(week[this.days[i]]);
    }
    t.push("on", d.join(", "));
  } else if (this.unit == "m") {
    // check if it's a special word
    const day_idx =
      this.occurrence_of < 0 ? week.length - 1 : this.occurrence_of;
    const nth_idx = this.nth < 0 ? nthword.length - 1 : this.nth;

    t.push("on the", nthword[nth_idx], week[day_idx]);
  }

  t.push("starting on", this.start.format("LLLL (Z)"));

  if (this.end_condition == "until") {
    t.push("until", this._getDate(this.until).format("LLLL (Z)"));
  } else if (this.end_condition == "for") {
    t.push("for", this.rfor, "occurrences");
  }

  return t.join(" ");
};

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
RecurringDate.prototype.contains = function (d) {
  if (this.dates.length == 0) this.generate();

  // can be string or date object already
  d = this._getDate(d);

  for (var i = 0; i < this.dates.length; i++) {
    if (d.diff(this.dates[i], "days") === 0) return true;
  }
  return false;
};

/**
 * Generates an array of dates base on input pattern.
 *
 * @param {Number} [max] maximum number of dates to generate. If not specified,
 *  will generate until it reaches the end condition.
 * @return {MomentInstance[]} an array of generated dates.
 */
RecurringDate.prototype.generate = function (max) {
  if (!(this.rfor || this.until || max)) {
    throw new RangeError("There is no valid end condition specified");
  }

  const endConditionReached = function (occurrences, current_date) {
    if (max && occurrences.length >= max) return true;
    if (
      this.end_condition == "for" &&
      this.rfor &&
      occurrences.length >= this.rfor
    )
      return true;
    if (
      this.end_condition == "until" &&
      this.until &&
      current_date.valueOf() > this.until.valueOf()
    )
      return true;
    return false;
  }.bind(this);

  /** @type {MomentInstance[]} */
  const dates = [];

  let curr = this.start.clone();
  // always include start date in recurrence
  dates.push(curr.clone());

  // weekly recurrence
  if (this.unit == "w") {
    // if it's not already a sunday, move it to the current week's sunday
    if (!curr.day() === 0) {
      curr = curr.day(0);
    }

    if (this.days.length == 0) {
      throw new RangeError(
        "Weekly recurrence was selected without any days specified."
      );
    }

    while (!endConditionReached(dates, curr)) {
      // scan through the checked days
      for (var i in this.days) {
        if (Object.prototype.hasOwnProperty.call(this.days, i)) {
          var d = this.days[i];

          if (curr.day() < d) {
            curr = curr.day(d);
          }
          if (curr <= this.start) continue;
          if (endConditionReached(dates, curr)) continue;

          dates.push(curr.clone());
        }
      }

      // rewind back to sunday
      if (curr.day() !== 0) {
        curr = curr.day(0);
      }
      // next repetition
      curr = curr.add(this.every, "weeks");
    }
  } else if (this.unit == "m") {
    while (true) {
      if (this.occurrence_of == -1) {
        curr = curr.date(-1);
      } else {
        curr = this._movetoNthOccurrence(curr, this.occurrence_of, this.nth);
      }

      if (endConditionReached(dates, curr)) break;

      if (curr > this.start) {
        dates.push(curr.clone());
      }

      curr = curr.add(this.every, "months");
    }
  } else {
    if (!["d", "y"].includes(this.unit)) {
      throw new TypeError(
        `unit (${this.unit}) should be one of ["d","m","y"]; otherwise "days" should be specified.`
      );
    }
    while (true) {
      if (this.unit == "d") {
        curr = curr.add(this.every, "days");
      } else if (this.unit == "y") {
        curr = curr.add(this.every, "years");
      }
      // else infinite loop yay
      if (endConditionReached(dates, curr)) break;

      dates.push(curr.clone());
    }
  }

  // cache results
  this.dates = dates;
  return this.dates;
};

module.exports = RecurringDate;
