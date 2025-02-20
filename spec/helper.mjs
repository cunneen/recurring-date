/* helper functions */
/* global moment */

function humanReadableDates(dates) {
  const dateFormat = "MM/DD/YYYY";
  if (dates instanceof Array) {
    return dates.map(function (d) {
      return d.format?.(dateFormat) ?? d.toString(dateFormat);
    });
  } else {
    return dates.format?.(dateFormat) ?? dates.toString(dateFormat);
  }
}

let _printHelperFn = JSON.stringify;

export const setPrintHelperFn = function (printHelperFn) {
  _printHelperFn = printHelperFn;
};

export const helpers = {
  humanReadableDates,
  datesEqual: function (expected, actual) {
    if (expected instanceof Array) {
      for (let i = 0; i < actual.length; i++) {
        if (!moment(expected[i]).isSame(actual[i])) return false;
      }
      return actual.length == expected.length;
    } else {
      return moment(expected).isSame(actual);
    }
  },
  datesEqualFailure: function (expected, actual, not) {
    var i = 0;
    if (expected.length == actual.length) {
      for (let i = 0; i < actual.length; i++) {
        if (!moment(expected[i]).isSame(actual[i])) break;
      }
      return [
        "date at index",
        i,
        "expected",
        _printHelperFn(humanReadableDates(actual[i])),
        not ? "to not equal" : "to equal",
        _printHelperFn(humanReadableDates(expected[i])),
      ].join(" ");
    } else {
      return [
        "array not the same length. expected ",
        expected.length,
        "but was",
        actual.length,
      ].join(" ");
    }
  },
};
