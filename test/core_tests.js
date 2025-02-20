/* global describe, it */
// === main tests ===
/**
 * @typedef {import("../types/RecurringDate")} RecurringDate
 */

/**
 * Runs all the tests for a given date library.
 * @param {import('../lib/RecurringDate').MomentCompatibleLibrary} dateLibrary - The date
 *    library (e.g. moment or dayjs).
 * @param {RecurringDate} RecurringDate - The RecurringDate class to be tested,
 *    already initialized with the date library (i.e. via
 * {@link RecurringDate.initializeWithMomentLibrary}).
 * @param {"moment"|"dayjs"|"luxon"|String} dateLibraryDescription - A string to
 *     denote which date library is being used in the tests the desired date
 *     library i.e. dayjs or momentjs, via
 *  {@link RecurringDate.initializeWithMomentLibrary}.
 */
function runTests(dateLibrary, RecurringDate, dateLibraryDescription) {
  // common function to test expected dates against actual results from the "generate" method

  /**
   * Runs a test against the RecurringDate "generate" method.
   * @param {Pattern} pattern - The pattern to test
   * @param {String[]|Date[]} expected_dates - The dates we are expecting,
   * against which actual results will be compared.
   * @param {String} [expected_date_format] - The date format to which we'll
   * convert the generated dates so they can be compared against the expected
   * dates (i.e. the date format of the expected dates)
   * @param {Function} [callback] - A callback to be executed after the test. If
   * the test fails, the callback will be passed a string describing the
   * failure. If the test passes, the callback will be passed no arguments.
   */
  function test_dates(pattern, expected_dates, expected_date_format, callback) {
    if (!callback) {
      callback = expected_date_format;
      expected_date_format = pattern.date_format;
    }
    /** @type {RecurringDate} */
    var r = new RecurringDate(pattern);
    expected_dates = expected_dates.map(function (d) {
      return dateLibrary(d, pattern.date_format, true);
    });
    var generated = r.generate();

    if (expected_dates.length !== generated.length)
      return callback("Invalid number of results");

    for (var i = 0; i < generated.length; i++) {
      var expected = dateLibrary(expected_dates[i], pattern.date_format, true),
        realised = generated[i];
      if (expected.valueOf() !== realised.valueOf()) {
        return callback(
          expected_dates[i] + " does not match generated date " + generated[i]
        );
      }
    }
    return callback();
  }

  describe(`${dateLibraryDescription} - by days with`, function () {
    var base_pattern = {
      start: "02/21/2010",
      until: "03/07/2010",
      every: "1",
      unit: "d",
      end_condition: "until",
      date_format: "MM/DD/YYYY",
    };

    it(`${dateLibraryDescription} - specific ending date and every is 1`, function (done) {
      var expected_dates = [
        "02/21/2010",
        "02/22/2010",
        "02/23/2010",
        "02/24/2010",
        "02/25/2010",
        "02/26/2010",
        "02/27/2010",
        "02/28/2010",
        "03/01/2010",
        "03/02/2010",
        "03/03/2010",
        "03/04/2010",
        "03/05/2010",
        "03/06/2010",
        "03/07/2010",
      ];

      test_dates(base_pattern, expected_dates, done);
    });

    it(`${dateLibraryDescription} - specific ending date and every is more than 1`, function (done) {
      var pattern = Object.assign({}, base_pattern);
      pattern.every = "2";

      var expected_dates = [
        "02/21/2010",
        "02/23/2010",
        "02/25/2010",
        "02/27/2010",
        "03/01/2010",
        "03/03/2010",
        "03/05/2010",
        "03/07/2010",
      ];

      test_dates(pattern, expected_dates, done);
    });

    it(`${dateLibraryDescription} - number of occurences`, function (done) {
      var pattern = Object.assign({}, base_pattern);
      pattern.every = "2";
      pattern.end_condition = "for";
      pattern.rfor = "6";

      var expected_dates = [
        "02/21/2010",
        "02/23/2010",
        "02/25/2010",
        "02/27/2010",
        "03/01/2010",
        "03/03/2010",
      ];

      test_dates(pattern, expected_dates, done);
    });

    it(`${dateLibraryDescription} - time information`, function (done) {
      var pattern = {
        ...base_pattern,
        start: "02/21/2010 7:00 PM",
        until: "03/07/2010 7:00 PM",
        date_format: "MM/DD/YYYY h:mm A",
      };
      var expected_dates = [
        "02/21/2010 7:00 PM",
        "02/22/2010 7:00 PM",
        "02/23/2010 7:00 PM",
        "02/24/2010 7:00 PM",
        "02/25/2010 7:00 PM",
        "02/26/2010 7:00 PM",
        "02/27/2010 7:00 PM",
        "02/28/2010 7:00 PM",
        "03/01/2010 7:00 PM",
        "03/02/2010 7:00 PM",
        "03/03/2010 7:00 PM",
        "03/04/2010 7:00 PM",
        "03/05/2010 7:00 PM",
        "03/06/2010 7:00 PM",
        "03/07/2010 7:00 PM",
      ];

      test_dates(pattern, expected_dates, done);
    });
  }); // describe by days

  describe(`${dateLibraryDescription} - by weeks with`, function () {
    var base_pattern = {
      start: "02/21/2010",
      until: "03/21/2010",
      every: "1",
      unit: "w",
      end_condition: "until",
      days: [0],
      date_format: "MM/DD/YYYY",
    };

    it(`${dateLibraryDescription} - specific ending date and one day a week`, function (done) {
      var expected_dates = [
        "02/21/2010",
        "02/28/2010",
        "03/07/2010",
        "03/14/2010",
        "03/21/2010",
      ];
      test_dates(base_pattern, expected_dates, done);
    });

    it(`${dateLibraryDescription} - specific ending date and multiple days a week`, function (done) {
      var pattern = Object.assign({}, base_pattern);
      pattern.every = "2";
      pattern.days = [0, 3, 6];

      var expected_dates = [
        "02/21/2010",
        "02/24/2010",
        "02/27/2010",
        "03/07/2010",
        "03/10/2010",
        "03/13/2010",
        "03/21/2010",
      ];
      test_dates(pattern, expected_dates, done);
    });

    // definitely needs more work
    it(`${dateLibraryDescription} - #describe`, function (done) {
      var r = new RecurringDate(base_pattern);
      if (!r.describe().match(/Sunday/)) return done("Invalid description");
      return done();
    });
  }); // describe by weeks

  describe(`${dateLibraryDescription} - with timezone offset`, function () {
    // fn to provide diagnostics when the test fails
    const errorString = (results, expected, momentResults, recurringDateInstance, index) => {
      return `Unexpected time result: ${results[index]} (expected ${
        expected[index]
      }), index ${index},\n result   as date: ${new Date(
        results[index]
      )},\n expected as date: ${new Date(
        expected[index]
      )},\n resultArray: ${JSON.stringify(
        results,
        null,
        2
      )}, expectedArray: ${JSON.stringify(
        expected,
        null,
        2
      )}, resultsAsStrings: ${JSON.stringify(
        momentResults.map((d) => d.format("YYYY-MM-DDTHH:mm:ss.SSZ (ddd)")),
        null,
        2
      )}, expectedAsStrings: ${JSON.stringify(
        expected.map((d) =>
          dateLibrary(d).format("YYYY-MM-DDTHH:mm:ss.SSZ (ddd)")
        ),
        null,
        2
      )},\n description: ${recurringDateInstance.describe()}`;
    };

    const startDateString = "13-01-2014 06:30 AM +10:00";
    const startDateFormat = "DD-MM-YYYY HH:mm A Z";
    const timezone = "-0500";
    const expected = [
      1389558600000, 1389645000000, 1390249800000, 1390854600000, 1391459400000,
      1392064200000, 1392669000000, 1393273800000, 1393878600000, 1394483400000,
      1395088200000,
    ];

    /** @type {import("../types/RecurringDate").Pattern} */
    const baseParams = {
      until: "03/21/2014",
      every: "1",
      unit: "w",
      end_condition: "until",
      days: [1],
      timezone,
      date_format: "MM/DD/YYYY",
    };

    it(`${dateLibraryDescription} - generate with a timezone offset, start is dateLibrary instance`, function (done) {
      var start = dateLibrary(
        startDateString,
        startDateFormat
        //TODO: datejs has a bug with strict parsing of timezones, see https://github.com/iamkun/dayjs/issues/2797 ;
        //      once that is fixed, change strict parsing to true by uncommenting the following line
        // ,true
      );
      const params = {
        ...baseParams,
        start: start
      }

      // ====
      /** @type {RecurringDate} */
      const r = new RecurringDate(params);
      const momentResults = r.generate();
      const results = momentResults?.map((d) => d.valueOf());

      for (var i = 0; i < results.length; i++) {
        if (results[i] != expected[i]) {
          return done(errorString(results, expected, momentResults, r));
        }
      }
      return done();
    });
    it(`${dateLibraryDescription} - generate with a timezone offset, start is Date obj`, function (done) {
      var start = dateLibrary(
        startDateString,
        startDateFormat
        //TODO: datejs has a bug with strict parsing of timezones, see https://github.com/iamkun/dayjs/issues/2797 ;
        //      once that is fixed, change strict parsing to true by uncommenting the following line
        // ,true
      );
      const params = {
        ...baseParams,
        start: start.toDate()
      }

      // ====
      /** @type {RecurringDate} */
      const r = new RecurringDate(params);
      const momentResults = r.generate();
      const results = momentResults?.map((d) => d.valueOf());

      for (var i = 0; i < results.length; i++) {
        if (results[i] != expected[i]) {
          return done(errorString(results, expected, momentResults, r));
        }
      }
      return done();
    });
    it(`${dateLibraryDescription} - generate with a timezone offset, start is string`, function (done) {
      const params = {
        ...baseParams,
        start: startDateString,
        date_format: startDateFormat,
        until: dateLibrary("03/21/2014","MM/DD/YYYY").utcOffset(timezone).format(startDateFormat)
      }

      // ====
      /** @type {RecurringDate} */
      const r = new RecurringDate(params);
      const momentResults = r.generate();
      const results = momentResults?.map((d) => d.valueOf());

      for (var i = 0; i < results.length; i++) {
        if (results[i] != expected[i]) {
          return done(errorString(results, expected, momentResults, r));
        }
      }
      return done();
    });
  });

  describe(`${dateLibraryDescription} - by months with`, function () {
    /** @type {import("../types/RecurringDate").Pattern} */
    var pattern = {
      start: "01/06/2016",
      until: "12/31/2016",
      every: 1,
      unit: "m",
      end_condition: "until",
      nth: 1,
      occurrence_of: 3,
      date_format: "MM/DD/YYYY",
      moment_locale: "en-au",
    };

    it(`${dateLibraryDescription} - specific ending date and once a month on first wednesday`, function (done) {
      var expected_dates = [
        "01/06/2016",
        "02/03/2016",
        "03/02/2016",
        "04/06/2016",
        "05/04/2016",
        "06/01/2016",
        "07/06/2016",
        "08/03/2016",
        "09/07/2016",
        "10/05/2016",
        "11/02/2016",
        "12/07/2016",
      ];
      test_dates(pattern, expected_dates, done);
    });

    it(`${dateLibraryDescription} - number of occurrences and once a month on first wednesday`, function (done) {
      var expected_dates = [
        "01/06/2016",
        "02/03/2016",
        "03/02/2016",
        "04/06/2016",
        "05/04/2016",
      ];
      pattern.end_condition = "for";
      pattern.rfor = 5;
      test_dates(pattern, expected_dates, done);
    });

    // definitely needs more work
    it(`${dateLibraryDescription} - #describe`, function (done) {
      var r = new RecurringDate(pattern);
      const result = r.describe();
      const expected =
        "Every month on the first Wednesday starting on Wednesday, January 6, 2016 12:00 AM (+08:00) for 5 occurrences";
      if (!result === expected)
        return done(
          `Invalid description; expected: \n"${expected}",\n actual: \n"${result}"`
        );
      return done();
    });
  }); // describe by weeks
}

module.exports = runTests;
