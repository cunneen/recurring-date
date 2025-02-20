/**
 * Test against dayjs and momentjs, via their convenience loaders and directly
 */

// =================
// ==== imports ====
// =================

// mocha
const { describe } = require('mocha');
// dayjs import and dayjs plugins
const dayjs = require('dayjs');
const localizedFormat = require("dayjs/plugin/localizedFormat");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

// import the RecurringDate class directly (i.e. not via one of the loaders)
const RecurringDate = require('../lib/RecurringDate');

// import the tests we want to run
const runTests = require('./core_tests');

// we want to test the dayjs entrypoint for this module
const { RecurringDate: RecurringDateDayJS, dateLibrary: dayjsFromLoader } = require('../lib/loader-dayjs');

// we want to test the moment entrypoint for this module
const { RecurringDate: RecurringDateMomentJS, dateLibrary: momentjs } = require('../lib/loader-moment');

// ===============
// ==== TESTS ====
// ===============

// == DAYJS LOADER ==

// test using dayjs as the date library, via the dayjs loader

// run our tests using dayjs
describe('dayjs', () => {
  runTests(dayjsFromLoader, RecurringDateDayJS, "dayjs");
});

// == MOMENTJS LOADER ==

// test using momentjs as the date library, via the momentjs loader

// run our tests using momentjs
describe('momentjs', () => {

  runTests(momentjs, RecurringDateMomentJS, "momentjs");
});
// == EXPICIT INIT ==

// test by explicitly specifying dayjs as the date library
// (rather than using the dayjs loader entrypoint)

// load dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

// initialize the library
RecurringDate.initializeWithDateLibrary(dayjs);

// run our tests using explicitly-initialized dayjs
describe('dayjs (explicit init)', () => {

  runTests(dayjs, RecurringDate, "dayjs (explicit init)");
});