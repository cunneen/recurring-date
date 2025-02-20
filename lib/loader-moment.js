/**
 * A convenience loader for using moment as the date library
 */
const moment = require("moment");

const RecurringDate = require("./RecurringDate");

RecurringDate.initializeWithDateLibrary(moment);

// we export the now-initialized RecurringDate class, and re-export 
// the moment library for convenience
module.exports = { RecurringDate , dateLibrary: moment };