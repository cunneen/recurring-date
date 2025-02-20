/**
 * A convenience loader for using dayjs as the date library
 */
const dayjs = require("dayjs");
const localizedFormat = require("dayjs/plugin/localizedFormat");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

const RecurringDate = require("./RecurringDate");

RecurringDate.initializeWithDateLibrary(dayjs);

// we export the now-initialized RecurringDate class, and re-export 
// the dayjs library for convenience
module.exports = { RecurringDate , dateLibrary: dayjs };