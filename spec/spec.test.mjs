/* global describe, it, RecurringDate, moment, expect */

/** @typedef {import("../types/RecurringDate")} RecurringDate */
RecurringDate.initializeWithDateLibrary(moment);

export const tests = (helpers) => {
  var datesEqual = helpers.datesEqual;
  var datesEqualFailure = helpers.datesEqualFailure;
  // common function to test expected dates
  var testDates = function (pattern, expectedDates) {
    /** @type {RecurringDate}  */
    var r = new RecurringDate(pattern);

    expectedDates = expectedDates.map(function (d) {
      return moment(d, "MM/DD/YYYY");
    });
    const result = r.generate();
    expect(
      datesEqual(result, expectedDates),
      datesEqualFailure(expectedDates, result)
    ).to.be.true;
  };
  describe("by days with", function () {
    /** @type {import("../types/RecurringDate").Pattern} */
    var base_pattern = {
      start: "02/21/2010",
      until: "03/07/2010",
      every: "1",
      unit: "d",
      end_condition: "until",
      date_format: "MM/DD/YYYY",
    };

    it("specific ending date and every is 1", function () {
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

      testDates(base_pattern, expected_dates);
    });

    it("specific ending date and every is more than 1", function () {
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

      testDates(pattern, expected_dates);
    });

    it("number of occurences", function () {
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

      testDates(pattern, expected_dates);
    });
  }); // describe by days

  describe("by weeks with", function () {
    var base_pattern = {
      start: "02/21/2010",
      until: "03/21/2010",
      every: "1",
      unit: "w",
      end_condition: "until",
      days: [0],
      date_format: "MM/DD/YYYY",
    };

    it("specific ending date and one day a week", function () {
      var expected_dates = [
        "02/21/2010",
        "02/28/2010",
        "03/07/2010",
        "03/14/2010",
        "03/21/2010",
      ];

      testDates(base_pattern, expected_dates);
    });

    it("specific ending date and multiple days a week", function () {
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

      testDates(pattern, expected_dates);
    });

    // definitely needs more work
    it("#describe", function () {
      var r = new RecurringDate(base_pattern);

      expect(r.describe()).to.match(/Sunday/);
    });
  }); // describe by weeks
};
