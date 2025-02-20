(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.RecurringDate = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require("./lib/RecurringDate");

},{"./lib/RecurringDate":2}],2:[function(require,module,exports){
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

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9SZWN1cnJpbmdEYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9saWIvUmVjdXJyaW5nRGF0ZVwiKTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAgUmFjaG90IE1vcmFncmFhbiwgQ2l0eSBvZiBHYXJkZW4gR3JvdmUsIENBXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydChcIm1vbWVudFwiKX0gTW9tZW50Q29tcGF0aWJsZUxpYnJhcnkgVGhlIG1vbWVudGpzIGxpYnJhcnkgb3IgYSBjb21wYXRpYmxlIGVxdWl2YWxlbnQgZS5nLiBkYXlqcyAqL1xuLyoqIEB0eXBlZGVmIHtpbXBvcnQoXCJtb21lbnRcIikuTW9tZW50fSBNb21lbnRJbnN0YW5jZSBBbiBpbnN0YW5jZSBvZiB0aGUgZGF0ZSBsaWJyYXJ5LCBlLmcuIGEgbW9tZW50anMgaW5zdGFuY2UgKi9cblxuLyoqIEB0eXBlIHtNb21lbnRDb21wYXRpYmxlTGlicmFyeX0gKi9cbmxldCBkYXRlTGlicmFyeTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQYXR0ZXJuIFRoZSBzcGVjaWZpY2F0aW9uIGZvciBhIHJlY3VycmVuY2Ugb2YgZGF0ZXMuXG4gKiBAcHJvcGVydHkge0RhdGV8U3RyaW5nfSBzdGFydCBzdGFydCBkYXRlIDsgaWYgc3BlY2lmaWVkIGFzIGEgc3RyaW5nLCBlbnN1cmUgdGhhdCBkYXRlX2Zvcm1hdCBpcyBzcGVjaWZpZWQuXG4gKiBAcHJvcGVydHkge051bWJlcn0gZXZlcnkgdGhlIGZyZXF1ZW5jeSBvZiByZXBldGl0aW9uIGUuZy4gdGhlIFwiW05OTl1cIiBpbiB0aGUgc2VudGVuY2UsIFwiRXZlcnkgW05OTl0gd2Vla3Mgb24gTW9uZGF5LCBXZWRuZXNkYXksIGFuZCBGcmlkYXkgc3RhcnRpbmcgdG9kYXkgZm9yIDUgb2NjdXJyZW5jZXNcIiBcbiAqIEBwcm9wZXJ0eSB7XCJkXCJ8XCJ3XCJ8XCJtXCJ8XCJ5XCJ9IHVuaXQgdGhlIHVuaXQgb2YgdGltZSBmb3IgdGhlIHJlcGV0aXRpb24gaS5lLiBkYXlzLCB3ZWVrcywgbW9udGhzLCBvciB5ZWFyc1xuICogQHByb3BlcnR5IHtcInVudGlsXCJ8XCJmb3JcIn0gZW5kX2NvbmRpdGlvbiBob3cgc2hvdWxkIHRoZSByZWN1cnJlbmNlIGJlIHRlcm1pbmF0ZWQuIElmIGBcInVudGlsXCJgLCB0aGVuIGB1bnRpbGAgc2hvdWxkIGJlIGEgZGF0ZS4gSWYgYFwiZm9yXCJgLCB0aGVuIGByZm9yYCBzaG91bGQgYmUgYW4gaW50ZWdlciAoZm9yIE4gb2NjdXJyZW5jZXMpLlxuICogQHByb3BlcnR5IHtEYXRlfFN0cmluZ30gW3VudGlsXSBlbmQgZGF0ZSA7IGlmIHNwZWNpZmllZCBhcyBhIHN0cmluZywgZW5zdXJlIHRoYXQgZGF0ZV9mb3JtYXQgaXMgc3BlY2lmaWVkLiBSZXF1aXJlZCBpZiBgZW5kX2NvbmRpdGlvbiA9PT0gXCJ1bnRpbFwiYCAuXG4gKiBAcHJvcGVydHkge051bWJlcn0gW3Jmb3JdIGlmIGVuZF9jb25kaXRpb24gaXMgJ2ZvcicsIHBhc3MgYW4gaW50ZWdlciBoZXJlLlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IFtvY2N1cnJlbmNlX29mXSB2YWxpZCB2YWx1ZXMgYXJlIDAtNiwgY29ycmVzcG9uZGluZyB0byB0aGUgZGF5cyBvZiB0aGUgd2Vlay5cbiAgaW4gY29uanVjdGlvbiB3aXRoICdudGgnIG9wdGlvbiwgc3BlY2lmaWVzIG50aCBkYXkgb2YgdGhlIG1vbnRoXG4gIChsYXN0IFN1bmRheSBvZiB0aGUgbW9udGgpLiB0byBiZSB1c2VkIHdpdGggJ20nIHVuaXQgb3B0aW9uLlxuICogQHByb3BlcnR5IHtcImZpcnN0XCJ8XCJzZWNvbmRcInxcInRoaXJkXCJ8XCJmb3VydGhcInxcImxhc3RcIn0gW250aF0gdmFsaWQgdmFsdWVzIGFyZSAnZmlyc3QnLCAnc2Vjb25kJywgJ3RoaXJkJywgJ2ZvdXJ0aCcsIGFuZCAnbGFzdCcuXG4gIHNlZSAnb2NjdXJyZW5jZV9vZicgb3B0aW9uLiB0byBiZSB1c2VkIHdpdGggJ20nIHVuaXQgb3B0aW9uLlxuICogQHByb3BlcnR5IHtOdW1iZXJbXX0gW2RheXNdIHRvIGJlIHVzZWQgd2l0aCAndycgdW5pdCBvcHRpb24uIGFuIGFycmF5IG9mIGludGVnZXJzIHJlcHJlc2VudGluZyBkYXlcbiAgb2YgdGhlIHdlZWsgKDAtNikuIGVnLiBFdmVyeSAyIHdlZWtzIG9uIFR1ZXNkYXkgKDIpIGFuZCBUaHVyc2RheSAoNCksXG4gIHBhc3MgWzIsNF0gYXMgdGhlIHZhbHVlLlxuICogQHByb3BlcnR5IHtTdHJpbmd9IFtkYXRlX2Zvcm1hdF0gYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBkYXRlIGZvcm1hdCB0byB1c2VcbiAqICB3aGVuIHBhcnNpbmcgc3RhcnQgYW5kIGVuZCBkYXRlcywgaWYgdGhleSBhcmUgc3RyaW5ncy4gSWYgbm90IHNwZWNpZmllZCxcbiAqICBzdGFydCBhbmQgZW5kIGRhdGVzIHNob3VsZCBiZSBlaXRoZXIgRGF0ZSBvYmplY3RzIG9yIG1vbWVudCBvYmplY3RzLiBcbiAqICAoU2VlIHtAbGluayBodHRwczovL21vbWVudGpzLmNvbS9kb2NzLyMvZGlzcGxheWluZy9mb3JtYXQvIHwgbW9tZW50anMgZG9jc31cbiAqICAgZm9yIHZhbGlkIGZvcm1hdCBjaGFyYWN0ZXJzKVxuICogQHByb3BlcnR5IHtTdHJpbmd9IFttb21lbnRfbG9jYWxlID0gXCJlblwiXSBhIGxvY2FsZSBpZGVudGlmaWVyIGFzIHBlciB7QGxpbmsgaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9kYXlqc0AxL2xvY2FsZS5qc29uIHwgdGhpcyBKU09OIGRvY3VtZW50fVxuICogQHByb3BlcnR5IHtOdW1iZXJ9IFt0aW1lem9uZV0gQSBVVEMgb2Zmc2V0IGluIG1pbnV0ZXMsIGFzIHBlciB7QGxpbmsgaHR0cHM6Ly9tb21lbnRqcy5jb20vZG9jcy8jL21hbmlwdWxhdGluZy91dGMtb2Zmc2V0LyB8IG1vbWVudGpzIHV0Y09mZnNldCgpfVxuICogXG4gKi9cblxuLyoqXG4gKiBSZWN1cnJpbmdEYXRlIGNsYXNzXG4gKiBAY2xhc3NcbiAqIEBwYXJhbSB7UGF0dGVybn0gcGF0dGVybiBhIEpTT04gb2JqZWN0IHdpdGggcGF0dGVybiBvcHRpb25zXG4gKiBAcGFyYW0ge1N0cmluZ30gZGF0ZV9mb3JtYXQgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBkYXRlIGZvcm1hdCB0byB1c2VcbiAqICB3aGVuIHBhcnNpbmcgc3RhcnQgYW5kIGVuZCBkYXRlcywgaWYgdGhleSBhcmUgc3RyaW5ncy4gSWYgbm90IHNwZWNpZmllZCxcbiAqICBzdGFydCBhbmQgZW5kIGRhdGVzIHNob3VsZCBiZSBlaXRoZXIgRGF0ZSBvYmplY3RzIG9yIG1vbWVudCBvYmplY3RzLlxuICogIChTZWUge0BsaW5rIGh0dHBzOi8vbW9tZW50anMuY29tL2RvY3MvIy9kaXNwbGF5aW5nL2Zvcm1hdC8gfCBtb21lbnRqcyBkb2NzfSBvclxuICogICB7QGxpbmsgaHR0cHM6Ly9kYXkuanMub3JnL2RvY3MvZW4vcGFyc2Uvc3RyaW5nLWZvcm1hdCNsaXN0LW9mLWFsbC1hdmFpbGFibGUtcGFyc2luZy10b2tlbnMgfCBkYXlqcyBkb2NzfVxuICogICBmb3IgdmFsaWQgZm9ybWF0IGNoYXJhY3RlcnMpXG4gKi9cbmZ1bmN0aW9uIFJlY3VycmluZ0RhdGUocGF0dGVybiwgZGF0ZV9mb3JtYXQpIHtcbiAgaWYgKHR5cGVvZiBwYXR0ZXJuICE9IFwib2JqZWN0XCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJwYXR0ZXJuIG11c3QgYmUgYSBKU09OXCIpO1xuXG4gIGlmICghcGF0dGVybi5ldmVyeSkge1xuICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIkV2ZXJ5IG1hZ25pdHVkZSBtdXN0IGJlIHNwZWNpZmllZFwiKTtcbiAgfVxuXG4gIGlmIChpc05hTihwYXJzZUludChwYXR0ZXJuLmV2ZXJ5KSkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXZlcnkgbWFnbml0dWRlIG11c3QgYmUgYSB2YWxpZCBudW1iZXJcIik7XG4gIH1cblxuICBpZiAoIWRhdGVfZm9ybWF0ICYmICFwYXR0ZXJuLmRhdGVfZm9ybWF0KSB7XG4gICAgaWYgKHR5cGVvZiBwYXR0ZXJuLnN0YXJ0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXG4gICAgICAgIFwiSWYgc3RhcnQgZGF0ZSBpcyBhIHN0cmluZywgZGF0ZV9mb3JtYXQgbXVzdCBiZSBzcGVjaWZpZWRcIlxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwYXR0ZXJuLnVudGlsID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXG4gICAgICAgIFwiSWYgZW5kIGRhdGUgaXMgYSBzdHJpbmcsIGRhdGVfZm9ybWF0IG11c3QgYmUgc3BlY2lmaWVkXCJcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcblxuICAvLyBzdG9yZXMgZ2VuZXJhdGVkIGRhdGVzIGJhc2VkIG9uIHJlY3VycmVuY2UgcGF0dGVyblxuICB0aGlzLmRhdGVzID0gW107XG5cbiAgLyoqIEB0eXBlIHtQYXR0ZXJuW1wibW9tZW50X2xvY2FsZVwiXX0gKi9cbiAgdGhpcy5tb21lbnRfbG9jYWxlID0gcGF0dGVybi5tb21lbnRfbG9jYWxlIHx8IFwiZW5cIjtcbiAgZGF0ZUxpYnJhcnkubG9jYWxlKHRoaXMubW9tZW50X2xvY2FsZSk7XG4gIC8qKiBAdHlwZSB7UGF0dGVybltcImRhdGVfZm9ybWF0XCJdfSAqL1xuICB0aGlzLmRhdGVfZm9ybWF0ID0gZGF0ZV9mb3JtYXQgfHwgcGF0dGVybi5kYXRlX2Zvcm1hdDtcbiAgLyoqIEB0eXBlIHtQYXR0ZXJuW1widGltZXpvbmVcIl19ICovXG4gIHRoaXMudGltZXpvbmUgPSBwYXR0ZXJuLnRpbWV6b25lO1xuXG4gIC8qKiBAdHlwZSB7TW9tZW50SW5zdGFuY2V9ICovXG4gIHRoaXMuc3RhcnQgPSB0aGlzLl9nZXREYXRlKHBhdHRlcm4uc3RhcnQpO1xuXG4gIGlmICghdGhpcy5zdGFydC5pc1ZhbGlkKCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgYHBhdHRlcm4uc3RhcnQgXCIke3BhdHRlcm4uc3RhcnR9XCIgZG9lcyBub3QgbWF0Y2ggZGF0ZV9mb3JtYXQ6IFwiJHt0aGlzLmRhdGVfZm9ybWF0fVwiYFxuICAgICk7XG4gIH1cbiAgaWYgKHBhdHRlcm4uZW5kX2NvbmRpdGlvbiA9PT0gXCJ1bnRpbFwiKSB7XG4gICAgaWYgKHBhdHRlcm4udW50aWwpIHtcbiAgICAgIC8qKiBAdHlwZSB7TW9tZW50SW5zdGFuY2V9ICovXG4gICAgICB0aGlzLnVudGlsID0gdGhpcy5fZ2V0RGF0ZShwYXR0ZXJuLnVudGlsKTtcbiAgICAgIGlmICghdGhpcy51bnRpbC5pc1ZhbGlkKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICBgcGF0dGVybi51bnRpbCBcIiR7cGF0dGVybi51bnRpbH1cIiBkb2VzIG5vdCBtYXRjaCBkYXRlX2Zvcm1hdDogXCIke3RoaXMuZGF0ZV9mb3JtYXR9XCJgXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcInVudGlsIGRhdGUgbXVzdCBiZSBzcGVjaWZpZWRcIik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8qKiBAdHlwZSB7UGF0dGVybltcInJmb3JcIl19ICovXG4gICAgdGhpcy5yZm9yID0gcGFyc2VJbnQocGF0dGVybi5yZm9yKTtcbiAgfVxuICAvKiogQHR5cGUge1BhdHRlcm5bXCJldmVyeVwiXX0gKi9cbiAgdGhpcy5ldmVyeSA9IHBhcnNlSW50KHBhdHRlcm4uZXZlcnkpO1xuICAvKiogQHR5cGUge1BhdHRlcm5bXCJ1bml0XCJdfSAqL1xuICB0aGlzLnVuaXQgPSBwYXR0ZXJuLnVuaXQ7XG4gIC8qKiBAdHlwZSB7UGF0dGVybltcImVuZF9jb25kaXRpb25cIl19ICovXG4gIHRoaXMuZW5kX2NvbmRpdGlvbiA9IHBhdHRlcm4uZW5kX2NvbmRpdGlvbjtcblxuICAvKiogQHR5cGUge1BhdHRlcm5bXCJvY2N1cnJlbmNlX29mXCJdfSAqL1xuICB0aGlzLm9jY3VycmVuY2Vfb2YgPSBwYXR0ZXJuLm9jY3VycmVuY2Vfb2Y7XG4gIC8qKiBAdHlwZSB7UGF0dGVybltcIm50aFwiXX0gKi9cbiAgdGhpcy5udGggPSBwYXJzZUludChwYXR0ZXJuLm50aCk7XG4gIC8qKiBAdHlwZSB7UGF0dGVybltcImRheXNcIl19ICovXG4gIHRoaXMuZGF5cyA9IHBhdHRlcm4uZGF5cyA/IHBhdHRlcm4uZGF5cy5zb3J0KCkgOiBbXTtcbn1cblxuUmVjdXJyaW5nRGF0ZS5wcm90b3R5cGUuX2dldERhdGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgbGV0IHJlc3VsdDtcbiAgLy8gaWYgaXQncyBhbHJlYWR5IGEgZGF0ZS1saWJyYXJ5IG9iamVjdCwgdGhlbiBqdXN0IHJldHVybiBpdCB3aXRob3V0IGF0dGVtcHRpbmcgdG8gcGFyc2UuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoT2JqZWN0LCBkYXRlTGlicmFyeSwgXCJpc01vbWVudFwiKSkge1xuICAgIGlmIChkYXRlTGlicmFyeS5pc01vbWVudCh2YWx1ZSkpIHtcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChcbiAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoT2JqZWN0LCBkYXRlTGlicmFyeSwgXCJpc0RheWpzXCIpXG4gICkge1xuICAgIGlmIChkYXRlTGlicmFyeS5pc0RheWpzKHZhbHVlKSkge1xuICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKFxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChPYmplY3QsIGRhdGVMaWJyYXJ5LCBcImlzRGF0ZVwiKVxuICApIHtcbiAgICAvLyBpZiBpdCdzIGFscmVhZHkgYSBkYXRlIG9iamVjdCwganVzdCB3cmFwIGl0IGluIHRoZSBkYXRlIGxpYnJhcnkgd2l0aG91dCBhdHRlbXB0aW5nIHRvIHBhcnNlXG4gICAgaWYgKGRhdGVMaWJyYXJ5LmlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJlc3VsdCA9IGRhdGVMaWJyYXJ5KHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgcmVzdWx0ID0gZGF0ZUxpYnJhcnkodmFsdWUpO1xuICB9XG4gIC8vIGlmIGl0J3MgYSBzdHJpbmcgdGhlbiBwYXJzZSBpdFxuICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAvLyBhdHRlbXB0IHRvIHBhcnNlIHRoZSBkYXRlIGFzIGEgc3RyaW5nXG4gICAgLy9UT0RPOiBkYXRlanMgaGFzIGEgYnVnIHdpdGggc3RyaWN0IHBhcnNpbmcgb2YgdGltZXpvbmVzLCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2lhbWt1bi9kYXlqcy9pc3N1ZXMvMjc5NyA7XG4gICAgLy8gICAgICBvbmNlIHRoYXQgaXMgZml4ZWQsIGNoYW5nZSBzdHJpY3QgcGFyc2luZyB0byB0cnVlIGJ5IHVuY29tbWVudGluZyB0aGUgZm9sbG93aW5nIGxpbmVcbiAgICAvLyByZXN1bHQgPSBkYXRlTGlicmFyeSh2YWx1ZSwgdGhpcy5kYXRlX2Zvcm1hdCwgdHJ1ZSk7XG4gICAgcmVzdWx0ID0gZGF0ZUxpYnJhcnkodmFsdWUsIHRoaXMuZGF0ZV9mb3JtYXQpO1xuICB9IGVsc2Uge1xuICAgIC8vIGl0J3Mgc29tZXRoaW5nIHdlIGRvbid0IHJlY29nbml6ZSAoZS5nLiBhIGx1eG9uIGRhdGUpLiBUcnkgdG8gd3JhcCBpdCBpbiB0aGUgZGF0ZSBsaWJyYXJ5IG9iamVjdC5cbiAgICByZXN1bHQgPSBkYXRlTGlicmFyeSh2YWx1ZSk7XG4gIH1cbiAgLy8gSGFuZGxlIHRpbWV6b25lIG9mZnNldHNcbiAgaWYgKHRoaXMudGltZXpvbmUpIHtcbiAgICByZXN1bHQgPSByZXN1bHQudXRjT2Zmc2V0KHRoaXMudGltZXpvbmUpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGlzIGluc3RhbmNlIHdpdGggdGhlIG1vbWVudGpzIGxpYnJhcnkgb3IgYSBjb21wYXRpYmxlIGVxdWl2YWxlbnQgZS5nLiBkYXlqcy5cbiAqIFJlY3VycmluZ0RhdGUgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoIGEgbGlicmFyeSBsaWtlIG1vbWVudGpzLCBidXQgZG9lcyBub3QgaGFyZC1jb2RlIGEgZGVwZW5kZW5jeSBvbiBtb21lbnRqcy5cbiAqIEluaXRpYWxpemUgdGhlIGxpYnJhcnkgd2l0aCBhIG1vbWVudGpzLWNvbXBhdGlibGUgbGlicmFyeSB0byBlbmFibGUgaXRzIGZ1bmN0aW9uYWxpdHkuXG4gKiBAcGFyYW0ge01vbWVudENvbXBhdGlibGVMaWJyYXJ5fSBkYXRlTGlicmFyeVBhcmFtIFRoZSBtb21lbnRqcyBsaWJyYXJ5IG9yIGEgY29tcGF0aWJsZSBlcXVpdmFsZW50IGUuZy4gZGF5anNcbiAqL1xuUmVjdXJyaW5nRGF0ZS5pbml0aWFsaXplV2l0aERhdGVMaWJyYXJ5ID0gZnVuY3Rpb24gKGRhdGVMaWJyYXJ5UGFyYW0pIHtcbiAgZGF0ZUxpYnJhcnkgPSBkYXRlTGlicmFyeVBhcmFtO1xufTtcblxuLyoqXG4gKiBNb3ZlIHRvIHRoZSBuZXh0IG9yIGxhc3QgZGF5T2ZXZWVrIGJhc2VkIG9uIHRoZSBvcmllbnQgdmFsdWUuXG4gKiBAcGFyYW0ge01vbWVudEluc3RhbmNlfSAgIG1vbWVudFRvTWFuaXB1bGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9ICAgZGF5T2ZXZWVrID0gVGhlIGRheU9mV2VlayB0byBtb3ZlIHRvXG4gKiBAcGFyYW0ge051bWJlcn0gICBvcmllbnQgLSBGb3J3YXJkICgrMSkgb3IgQmFjayAoLTEpLiBEZWZhdWx0cyB0byArMS4gW09wdGlvbmFsXVxuICogQHJldHVybiB7RGF0ZX0gICAgdGhpc1xuICovXG5SZWN1cnJpbmdEYXRlLnByb3RvdHlwZS5fbW92ZVRvRGF5T2ZXZWVrID0gZnVuY3Rpb24gKFxuICBtb21lbnRUb01hbmlwdWxhdGUsXG4gIGRheU9mV2VlayxcbiAgb3JpZW50XG4pIHtcbiAgbGV0IGRpZmYgPSAoZGF5T2ZXZWVrIC0gbW9tZW50VG9NYW5pcHVsYXRlLmRheSgpICsgNyAqIChvcmllbnQgfHwgKzEpKSAlIDc7XG4gIHJldHVybiBtb21lbnRUb01hbmlwdWxhdGUuYWRkKFxuICAgIGRpZmYgPT09IDAgPyAoZGlmZiArPSA3ICogKG9yaWVudCB8fCArMSkpIDogZGlmZixcbiAgICBcImRheXNcIlxuICApO1xufTtcblxuLyoqXG4gKiBNb3ZlcyB0aGUgZGF0ZSB0byB0aGUgbmV4dCBuJ3RoIG9jY3VycmVuY2Ugb2YgdGhlIGRheU9mV2VlayBzdGFydGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1vbnRoLiBUaGUgbnVtYmVyICgtMSkgaXMgYSBtYWdpYyBudW1iZXIgYW5kIHdpbGwgcmV0dXJuIHRoZSBsYXN0IG9jY3VycmVuY2Ugb2YgdGhlIGRheU9mV2VlayBpbiB0aGUgbW9udGguXG4gKiBAcGFyYW0ge01vbWVudEluc3RhbmNlfSAgIG1vbWVudFRvTWFuaXB1bGF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9ICAgZGF5T2ZXZWVrIC0gVGhlIGRheU9mV2VlayB0byBtb3ZlIHRvXG4gKiBAcGFyYW0ge051bWJlcn0gICBvY2N1cnJlbmNlIC0gVGhlIG4ndGggb2NjdXJyZW5jZSB0byBtb3ZlIHRvLiBVc2UgKC0xKSB0byByZXR1cm4gdGhlIGxhc3Qgb2NjdXJyZW5jZSBpbiB0aGUgbW9udGhcbiAqIEByZXR1cm4ge01vbWVudEluc3RhbmNlfSAgICBBbiBpbnN0YW5jZSBvZiB0aGUgZGF0ZSBsaWJyYXJ5IHdpdGggdGhlIG5ldyBkYXRlXG4gKi9cblJlY3VycmluZ0RhdGUucHJvdG90eXBlLl9tb3ZldG9OdGhPY2N1cnJlbmNlID0gZnVuY3Rpb24gKFxuICBtb21lbnRUb01hbmlwdWxhdGUsXG4gIGRheU9mV2VlayxcbiAgb2NjdXJyZW5jZVxuKSB7XG4gIGxldCBzaGlmdCA9IDA7XG4gIGxldCBtYW5pcHVsYXRlZE1vbWVudDtcbiAgaWYgKG9jY3VycmVuY2UgPiAwKSB7XG4gICAgc2hpZnQgPSBvY2N1cnJlbmNlIC0gMTtcbiAgfSBlbHNlIGlmIChvY2N1cnJlbmNlID09PSAtMSkge1xuICAgIG1hbmlwdWxhdGVkTW9tZW50ID0gbW9tZW50VG9NYW5pcHVsYXRlLmVuZE9mKFwibW9udGhcIik7IC8vIHNoaWZ0IHRvIHRoZSBlbmQgb2YgdGhlIG1vbnRoXG4gICAgaWYgKG1hbmlwdWxhdGVkTW9tZW50LmRheSgpICE9PSBkYXlPZldlZWspIHtcbiAgICAgIC8vIGlzIHRoaXMgdGhlIHJpZ2h0IGRheT9cbiAgICAgIG1hbmlwdWxhdGVkTW9tZW50ID0gdGhpcy5fbW92ZVRvRGF5T2ZXZWVrKFxuICAgICAgICBtYW5pcHVsYXRlZE1vbWVudCxcbiAgICAgICAgZGF5T2ZXZWVrLFxuICAgICAgICAtMVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hbmlwdWxhdGVkTW9tZW50O1xuICB9XG4gIC8vIG1vdmUgdG8gdGhlIGVuZCBvZiB0aGUgcHJldmlvdXMgbW9udGhcbiAgbWFuaXB1bGF0ZWRNb21lbnQgPSBtb21lbnRUb01hbmlwdWxhdGUuc3RhcnRPZihcIm1vbnRoXCIpO1xuICBtYW5pcHVsYXRlZE1vbWVudCA9IG1hbmlwdWxhdGVkTW9tZW50LnN1YnRyYWN0KDEsIFwiZGF5c1wiKTtcbiAgLy8gbW92ZSBmb3J3YXJkIHRvIHRoZSBkZXNpcmVkIGRheSBvZiB0aGUgd2Vla1xuICBtYW5pcHVsYXRlZE1vbWVudCA9IHRoaXMuX21vdmVUb0RheU9mV2VlayhtYW5pcHVsYXRlZE1vbWVudCwgZGF5T2ZXZWVrLCArMSk7XG4gIC8vIGFkZCB0aGUgZGVzaXJlZCBudW1iZXIgb2Ygd2Vla3MgKGFkZCBvbmUgbGVzcyB0aGFuIFwiMXN0XCIsIFwiMm5kXCIsIFwiM3JkXCIgZXRjKVxuICByZXR1cm4gbWFuaXB1bGF0ZWRNb21lbnQuYWRkKHNoaWZ0LCBcIndlZWtzXCIpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcGxhaW4gRW5nbGlzaCBzdHJpbmcgZGVzY3JpYmluZyB0aGUgcmVjdXJyZW5jZSBwYXR0ZXJuLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gQSBkZXNjcmlwdGlvbiBvZiB0aGUgcmVjdXJyZW5jZSBwYXR0ZXJuXG4gKi9cblJlY3VycmluZ0RhdGUucHJvdG90eXBlLmRlc2NyaWJlID0gZnVuY3Rpb24gKCkge1xuICBjb25zdCB1bml0cyA9IHsgZDogXCJkYXlcIiwgdzogXCJ3ZWVrXCIsIG06IFwibW9udGhcIiwgeTogXCJ5ZWFyXCIgfTtcbiAgY29uc3Qgd2VlayA9IFtcbiAgICBcIlN1bmRheVwiLFxuICAgIFwiTW9uZGF5XCIsXG4gICAgXCJUdWVzZGF5XCIsXG4gICAgXCJXZWRuZXNkYXlcIixcbiAgICBcIlRodXJzZGF5XCIsXG4gICAgXCJGcmlkYXlcIixcbiAgICBcIlNhdHVyZGF5XCIsXG4gICAgXCJkYXlcIixcbiAgXTtcbiAgY29uc3QgbnRod29yZCA9IFtcIlwiLCBcImZpcnN0XCIsIFwic2Vjb25kXCIsIFwidGhpcmRcIiwgXCJmb3VydGhcIiwgXCJmaWZ0aFwiLCBcImxhc3RcIl07XG5cbiAgY29uc3QgdCA9IFtcIkV2ZXJ5XCJdO1xuICBpZiAodGhpcy5ldmVyeSA+IDIpIHtcbiAgICB0LnB1c2godGhpcy5ldmVyeSwgdW5pdHNbdGhpcy51bml0XSArIFwic1wiKTtcbiAgfSBlbHNlIGlmICh0aGlzLmV2ZXJ5ID09IDIpIHtcbiAgICB0LnB1c2goXCJvdGhlclwiLCB1bml0c1t0aGlzLnVuaXRdKTtcbiAgfSBlbHNlIHtcbiAgICB0LnB1c2godW5pdHNbdGhpcy51bml0XSk7XG4gIH1cblxuICBpZiAodGhpcy51bml0ID09IFwid1wiKSB7XG4gICAgY29uc3QgZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkLnB1c2god2Vla1t0aGlzLmRheXNbaV1dKTtcbiAgICB9XG4gICAgdC5wdXNoKFwib25cIiwgZC5qb2luKFwiLCBcIikpO1xuICB9IGVsc2UgaWYgKHRoaXMudW5pdCA9PSBcIm1cIikge1xuICAgIC8vIGNoZWNrIGlmIGl0J3MgYSBzcGVjaWFsIHdvcmRcbiAgICBjb25zdCBkYXlfaWR4ID1cbiAgICAgIHRoaXMub2NjdXJyZW5jZV9vZiA8IDAgPyB3ZWVrLmxlbmd0aCAtIDEgOiB0aGlzLm9jY3VycmVuY2Vfb2Y7XG4gICAgY29uc3QgbnRoX2lkeCA9IHRoaXMubnRoIDwgMCA/IG50aHdvcmQubGVuZ3RoIC0gMSA6IHRoaXMubnRoO1xuXG4gICAgdC5wdXNoKFwib24gdGhlXCIsIG50aHdvcmRbbnRoX2lkeF0sIHdlZWtbZGF5X2lkeF0pO1xuICB9XG5cbiAgdC5wdXNoKFwic3RhcnRpbmcgb25cIiwgdGhpcy5zdGFydC5mb3JtYXQoXCJMTExMIChaKVwiKSk7XG5cbiAgaWYgKHRoaXMuZW5kX2NvbmRpdGlvbiA9PSBcInVudGlsXCIpIHtcbiAgICB0LnB1c2goXCJ1bnRpbFwiLCB0aGlzLl9nZXREYXRlKHRoaXMudW50aWwpLmZvcm1hdChcIkxMTEwgKFopXCIpKTtcbiAgfSBlbHNlIGlmICh0aGlzLmVuZF9jb25kaXRpb24gPT0gXCJmb3JcIikge1xuICAgIHQucHVzaChcImZvclwiLCB0aGlzLnJmb3IsIFwib2NjdXJyZW5jZXNcIik7XG4gIH1cblxuICByZXR1cm4gdC5qb2luKFwiIFwiKTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIFwiZGF0ZVwiIGlzIGluIHRoZSByZWN1cnJlbmNlIHBhdHRlcm4uIFRoaXMgY2FsbHMgZ2VuZXJhdGUoKSxcbiAqIGlmIGl0IGhhc24ndCBhbHJlYWR5IGJlZW4gZ2VuZXJhdGVkLCBvdGhlcndpc2UsIGl0IHdpbGwgdXNlIHRoZSBkYXRlcyBnZW5lcmF0ZWRcbiAqIGZyb20gdGhlIGxhc3QgdGltZSBnZW5lcmF0ZSgpIHdhcyBjYWxsZWQuIFJldHVybnMgdHJ1ZSBpZiBcImRhdGVcIiBpcyBpbiB0aGUgcGF0dGVybi5cbiAqIFwiZGF0ZVwiIGNhbiBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgYSBEYXRlIG9iamVjdCwgYnV0IHBsZWFzZSBtYWtlIHN1cmUgdGhlIHRpbWVcbiAqIHBvcnRpb24gaXMgYWxsIHplcm9zICgwMDowMDowMCkuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgb25seSBjaGVjayBpZiBcImRhdGVcIiBpcyBjb250YWluZWQgd2l0aGluIHRoZSBwYXR0ZXJuJ3Mgc3RhcnRpbmcgYW5kXG4gKiBlbmRpbmcgcG9pbnRzLiBOZXh0IHZlcnNpb24gd2lsbCBzdXBwb3J0IGluZGVmaW5pdGUgZW5kaW5nIGRhdGUgYW5kIHRocm93YXdheSBkYXRlc1xuICogZ2VuZXJhdGlvbiwgaW5zdGVhZCBvZiBzdG9yaW5nIHRoZW0gYWxsIGluIGFuIGFycmF5LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfERhdGV9IGRhdGUgdGhlIGRhdGUgdG8gY2hlY2tcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgdGhlIGRhdGUgaXMgaW4gdGhlIHBhdHRlcm5cbiAqL1xuUmVjdXJyaW5nRGF0ZS5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoZCkge1xuICBpZiAodGhpcy5kYXRlcy5sZW5ndGggPT0gMCkgdGhpcy5nZW5lcmF0ZSgpO1xuXG4gIC8vIGNhbiBiZSBzdHJpbmcgb3IgZGF0ZSBvYmplY3QgYWxyZWFkeVxuICBkID0gdGhpcy5fZ2V0RGF0ZShkKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZC5kaWZmKHRoaXMuZGF0ZXNbaV0sIFwiZGF5c1wiKSA9PT0gMCkgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYW4gYXJyYXkgb2YgZGF0ZXMgYmFzZSBvbiBpbnB1dCBwYXR0ZXJuLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBbbWF4XSBtYXhpbXVtIG51bWJlciBvZiBkYXRlcyB0byBnZW5lcmF0ZS4gSWYgbm90IHNwZWNpZmllZCxcbiAqICB3aWxsIGdlbmVyYXRlIHVudGlsIGl0IHJlYWNoZXMgdGhlIGVuZCBjb25kaXRpb24uXG4gKiBAcmV0dXJuIHtNb21lbnRJbnN0YW5jZVtdfSBhbiBhcnJheSBvZiBnZW5lcmF0ZWQgZGF0ZXMuXG4gKi9cblJlY3VycmluZ0RhdGUucHJvdG90eXBlLmdlbmVyYXRlID0gZnVuY3Rpb24gKG1heCkge1xuICBpZiAoISh0aGlzLnJmb3IgfHwgdGhpcy51bnRpbCB8fCBtYXgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJUaGVyZSBpcyBubyB2YWxpZCBlbmQgY29uZGl0aW9uIHNwZWNpZmllZFwiKTtcbiAgfVxuXG4gIGNvbnN0IGVuZENvbmRpdGlvblJlYWNoZWQgPSBmdW5jdGlvbiAob2NjdXJyZW5jZXMsIGN1cnJlbnRfZGF0ZSkge1xuICAgIGlmIChtYXggJiYgb2NjdXJyZW5jZXMubGVuZ3RoID49IG1heCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKFxuICAgICAgdGhpcy5lbmRfY29uZGl0aW9uID09IFwiZm9yXCIgJiZcbiAgICAgIHRoaXMucmZvciAmJlxuICAgICAgb2NjdXJyZW5jZXMubGVuZ3RoID49IHRoaXMucmZvclxuICAgIClcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGlmIChcbiAgICAgIHRoaXMuZW5kX2NvbmRpdGlvbiA9PSBcInVudGlsXCIgJiZcbiAgICAgIHRoaXMudW50aWwgJiZcbiAgICAgIGN1cnJlbnRfZGF0ZS52YWx1ZU9mKCkgPiB0aGlzLnVudGlsLnZhbHVlT2YoKVxuICAgIClcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfS5iaW5kKHRoaXMpO1xuXG4gIC8qKiBAdHlwZSB7TW9tZW50SW5zdGFuY2VbXX0gKi9cbiAgY29uc3QgZGF0ZXMgPSBbXTtcblxuICBsZXQgY3VyciA9IHRoaXMuc3RhcnQuY2xvbmUoKTtcbiAgLy8gYWx3YXlzIGluY2x1ZGUgc3RhcnQgZGF0ZSBpbiByZWN1cnJlbmNlXG4gIGRhdGVzLnB1c2goY3Vyci5jbG9uZSgpKTtcblxuICAvLyB3ZWVrbHkgcmVjdXJyZW5jZVxuICBpZiAodGhpcy51bml0ID09IFwid1wiKSB7XG4gICAgLy8gaWYgaXQncyBub3QgYWxyZWFkeSBhIHN1bmRheSwgbW92ZSBpdCB0byB0aGUgY3VycmVudCB3ZWVrJ3Mgc3VuZGF5XG4gICAgaWYgKCFjdXJyLmRheSgpID09PSAwKSB7XG4gICAgICBjdXJyID0gY3Vyci5kYXkoMCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZGF5cy5sZW5ndGggPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgIFwiV2Vla2x5IHJlY3VycmVuY2Ugd2FzIHNlbGVjdGVkIHdpdGhvdXQgYW55IGRheXMgc3BlY2lmaWVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHdoaWxlICghZW5kQ29uZGl0aW9uUmVhY2hlZChkYXRlcywgY3VycikpIHtcbiAgICAgIC8vIHNjYW4gdGhyb3VnaCB0aGUgY2hlY2tlZCBkYXlzXG4gICAgICBmb3IgKHZhciBpIGluIHRoaXMuZGF5cykge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuZGF5cywgaSkpIHtcbiAgICAgICAgICB2YXIgZCA9IHRoaXMuZGF5c1tpXTtcblxuICAgICAgICAgIGlmIChjdXJyLmRheSgpIDwgZCkge1xuICAgICAgICAgICAgY3VyciA9IGN1cnIuZGF5KGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoY3VyciA8PSB0aGlzLnN0YXJ0KSBjb250aW51ZTtcbiAgICAgICAgICBpZiAoZW5kQ29uZGl0aW9uUmVhY2hlZChkYXRlcywgY3VycikpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgZGF0ZXMucHVzaChjdXJyLmNsb25lKCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHJld2luZCBiYWNrIHRvIHN1bmRheVxuICAgICAgaWYgKGN1cnIuZGF5KCkgIT09IDApIHtcbiAgICAgICAgY3VyciA9IGN1cnIuZGF5KDApO1xuICAgICAgfVxuICAgICAgLy8gbmV4dCByZXBldGl0aW9uXG4gICAgICBjdXJyID0gY3Vyci5hZGQodGhpcy5ldmVyeSwgXCJ3ZWVrc1wiKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodGhpcy51bml0ID09IFwibVwiKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm9jY3VycmVuY2Vfb2YgPT0gLTEpIHtcbiAgICAgICAgY3VyciA9IGN1cnIuZGF0ZSgtMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyID0gdGhpcy5fbW92ZXRvTnRoT2NjdXJyZW5jZShjdXJyLCB0aGlzLm9jY3VycmVuY2Vfb2YsIHRoaXMubnRoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGVuZENvbmRpdGlvblJlYWNoZWQoZGF0ZXMsIGN1cnIpKSBicmVhaztcblxuICAgICAgaWYgKGN1cnIgPiB0aGlzLnN0YXJ0KSB7XG4gICAgICAgIGRhdGVzLnB1c2goY3Vyci5jbG9uZSgpKTtcbiAgICAgIH1cblxuICAgICAgY3VyciA9IGN1cnIuYWRkKHRoaXMuZXZlcnksIFwibW9udGhzXCIpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIVtcImRcIiwgXCJ5XCJdLmluY2x1ZGVzKHRoaXMudW5pdCkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGB1bml0ICgke3RoaXMudW5pdH0pIHNob3VsZCBiZSBvbmUgb2YgW1wiZFwiLFwibVwiLFwieVwiXTsgb3RoZXJ3aXNlIFwiZGF5c1wiIHNob3VsZCBiZSBzcGVjaWZpZWQuYFxuICAgICAgKTtcbiAgICB9XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLnVuaXQgPT0gXCJkXCIpIHtcbiAgICAgICAgY3VyciA9IGN1cnIuYWRkKHRoaXMuZXZlcnksIFwiZGF5c1wiKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy51bml0ID09IFwieVwiKSB7XG4gICAgICAgIGN1cnIgPSBjdXJyLmFkZCh0aGlzLmV2ZXJ5LCBcInllYXJzXCIpO1xuICAgICAgfVxuICAgICAgLy8gZWxzZSBpbmZpbml0ZSBsb29wIHlheVxuICAgICAgaWYgKGVuZENvbmRpdGlvblJlYWNoZWQoZGF0ZXMsIGN1cnIpKSBicmVhaztcblxuICAgICAgZGF0ZXMucHVzaChjdXJyLmNsb25lKCkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNhY2hlIHJlc3VsdHNcbiAgdGhpcy5kYXRlcyA9IGRhdGVzO1xuICByZXR1cm4gdGhpcy5kYXRlcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVjdXJyaW5nRGF0ZTtcbiJdfQ==
