/* ===== recurring-date playground ===== */
/* global RecurringDate, moment, $, FullCalendar, Datepicker, Prism , bootstrap  */

/**
 * @typedef {import("../../types/RecurringDate") } RecurringDate
 * @typedef {import("../../types/RecurringDate").Pattern } Pattern
 */

RecurringDate.initializeWithDateLibrary(moment);
const HTML_DATE_FORMAT = "mm/dd/yyyy"; // date format for HTML input fields
const BASE_PATTERN = {
  moment_locale: moment.locale(),
  date_format: "MM/DD/YYYY", // must be a moment.js date format
  timezone: moment().utcOffset(),
};
const DATEPICKER_OPTIONS = {
  format: HTML_DATE_FORMAT,
  buttonClass: "btn",
};
const DESCRIPTION_OUTPUT_HEADING = `<h6 class="alert-heading">Currently Displaying:</h6>`;
const FORM_FIELDS_NORMAL = [
  // ids of form fields
  "start",
  "every",
  "unit",
  "end_condition",
  "until",
  "rfor",
  "nth",
  "occurrence_of",
];

const FORM_FIELDS_CHECKBOXES = [
  // ids of checkboxes
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

const ALL_FORM_FIELD_IDS = FORM_FIELDS_NORMAL.concat(
  FORM_FIELDS_CHECKBOXES
).map((id) => "#" + id);

// generates the JS code for displaying to the user (which they can then copy/paste)
const getJSCode = (pattern) => {
  return `const moment = require("moment");
const RecurringDate = require("@cunneen/recurring-date");
RecurringDate.initializeWithDateLibrary(moment);
const pattern = ${JSON.stringify(pattern,null,2)};

const r = new RecurringDate(pattern);
const description = r.describe();
// description will be a plain English description of the pattern
//   e.g. "Every 2 weeks on Monday, Wednesday, and Friday starting today for 5 occurrences"
const dates = r.generate();
// dates is now an array of moment objects, e.g. : 
// [
//   Moment<2010-02-21T00:00:00+08:00>,
//   Moment<2010-02-22T00:00:00+08:00>,
//   Moment<2010-02-23T00:00:00+08:00>,
//   ...
// ]
const jsDates = dates.map(m => m.toDate());
// jsDates wll be an array of JS Date objects; e.g.:
// [ 2025-02-20T16:00:00.000Z, 2025-02-22T16:00:00.000Z, ... ]
`
}
// reference to our FullCalendar instance
let calendar;

const todayMoment = moment();

// this var holds all our calendar events (for output display)
let calendarEvents = [];

// event source for fullcalendar
async function getCalendarEvents() {
  return calendarEvents;
}

/**
 * @returns {Pattern} pattern
 */
function getUpdatedPattern() {
  var pattern = Object.assign({}, BASE_PATTERN);
  // gather pattern
  FORM_FIELDS_NORMAL.forEach(function (k) {
    pattern[k] = $("#" + k).val();
  });
  pattern.days = [];
  // gather selected days
  $("input.week_days").map(function (i, e) {
    if (e.checked) {
      pattern.days.push(parseInt(e.value, 10));
    }
  });
  return pattern;
}

function updateDescriptionOutput(description) {
  $("#descriptionOutput").html(`${DESCRIPTION_OUTPUT_HEADING}${description}`);
}

function updateOutputWithPattern(/**@type {Pattern} */ updatedPattern) {
  $("#output").val("Input: \n");

  //pattern.forEach(function (e, i) {
  //$('#output').val($('#output').val() + '\t' + i + ': ' + e + "\n")
  //});
  $("#output").val(
    $("#output").val() + JSON.stringify(updatedPattern, null, 2) + "\n"
  );
  $("#outputPattern").html(JSON.stringify(updatedPattern, null, 2) + "\n");
  Prism.highlightElement($("#outputPattern")[0]);

  $("#outputJS").html(getJSCode(updatedPattern) + "\n");
  Prism.highlightElement($("#outputJS")[0]);

  var r = new RecurringDate(updatedPattern);
  var description = r.describe();
  updateDescriptionOutput(description);
}

function refreshOutput() {
  const updatedPattern = getUpdatedPattern();
  updateOutputWithPattern(updatedPattern);
}

function updateOutputWithResults(
  /**@type {import("moment").Moment[]} */ dates,
  /**@type {String} */ description,
  /**@type {Boolean}  */ includesToday
) {
  $("#output").val(
    $("#output").val() + "r.describe():\n\t" + description + "\n\n"
  );

  $("#output").val($("#output").val() + "r.generate():\n");

  updateDescriptionOutput(description);

  // compact description. next version.
  // $('#output').val( $('#output').val() + "short:\n" + r.describe(true) + "\n\n");

  // Port it over once I can get a dates value
  /*$('#output').value += dates.collect(function(d) {
    return d.toString('ddd MM/dd/yyyy');
  }).join("\n");*/

  // update full calendar
  calendarEvents = dates.map(function (d, i) {
    return {
      title: `Generated Date #${i + 1} (${d.format(BASE_PATTERN.date_format)})`,
      start: d.toDate(),
      end: d.clone().add(12, "hours").toDate(),
      extendedProps: {
        description: description,
      },
    };
  });
  // tell fullcalendar to update
  calendar.refetchEvents();

  var dateList = dates.reduce(function (memo, d) {
    return memo + "\t" + d.toString("ddd MM/dd/yyyy") + "\n";
  }, "");

  $("#output").val($("#output").val() + dateList + "\n");

  $("#output").val($("#output").val() + "includes today:\n");
  // $("#output").val($("#output").val() + r.contains(Date.now()));
  $("#output").val($("#output").val() + includesToday);
}
/**
 * Updates the #output element with the results of generating a recurrence
 * pattern according to the form values.
 *
 */
function generateRecurrence() {
  /**@type {Pattern} */
  const updatedPattern = getUpdatedPattern();
  updateOutputWithPattern(updatedPattern);
  //$('#output').val($('#output').val() + '\n');

  try {
    /** @type {RecurringDate} */
    var r = new RecurringDate(updatedPattern);
    var dates = r.generate();

    updateOutputWithResults(dates, r.describe(), r.contains(Date.now()));
  } catch (e) {
    $("#output").val(e.message);
    return;
  }
}

// ============= INIT =================================

$(document).ready(function () {
  // == datepickers and initial dates in the form
  const start = document.querySelector("#start");
  const until = document.querySelector("#until");

  $(start).val(moment().format(BASE_PATTERN.date_format));
  $(until).val(moment().add(6, "month").format(BASE_PATTERN.date_format));
  new Datepicker(start, DATEPICKER_OPTIONS);
  $(start).on("changeDate", refreshOutput);
  new Datepicker(until, DATEPICKER_OPTIONS);
  $(until).on("changeDate", refreshOutput);

  // == form field event handlers
  $(ALL_FORM_FIELD_IDS.join(",")).change(function () {
    const updatedPattern = getUpdatedPattern();
    updateOutputWithPattern(updatedPattern);
  });
  $("#end_condition").change(function () {
    $("#for_span, #until_span").hide();
    $("#" + this.value + "_span").show();
  });

  $("#unit").change(function () {
    $("#week_span, #month_span").hide();
    if (this.value == "w") $("#week_span").show();
    if (this.value == "m") $("#month_span").show();
  });

  $("button").click(generateRecurrence);

  // == initialize calendar
  // fullcalendar bootstrap 5 theme settings override
  //  - see https://github.com/fullcalendar/fullcalendar/blob/main/packages/bootstrap5/src/BootstrapTheme.ts
  const fcbs5plpugin = FullCalendar.globalPlugins.find(
    (p) => p.name === "@fullcalendar/bootstrap5"
  );
  if (fcbs5plpugin) {
    fcbs5plpugin.themeClasses.bootstrap5.prototype.classes.buttonGroup =
      "btn-group btn-group-sm";
    fcbs5plpugin.themeClasses.bootstrap5.prototype.classes.button =
      "btn btn-sm btn-primary";
  }

  var calendarEl = document.getElementById("calendar");
  calendar = new FullCalendar.Calendar(calendarEl, {
    // initialView: "multiMonthYear",
    initialView: "multiMonthYear",
    themeSystem: "bootstrap5",
    headerToolbar: {
      left: "prev,today,next",
      center: "title",
      right: "timeGridDay,timeGridWeek,dayGridMonth,multiMonthYear,listYear",
    },
    buttonIcons: {
      // today: "house",
      // timeGridDay: "calendar-day",
      // timeGridWeek: "calendar-week",
      // dayGridMonth: "calendar-month",
      // multiMonthYear: "calendar",
      // listYear: "card-list",
    },
    navLinks: true,
    initialDate: todayMoment.toDate(),
    events: getCalendarEvents,
    eventDidMount: function (info) {
      new bootstrap.Tooltip(info.el, {
        html: true,
        title: `
        <div class="alert" role="alert">
          <div class="alert-heading"><i class="bi bi-info-circle"></i> ${info.event.title}</div>
          <hr>
          <p class="mb-0">${info.event.extendedProps.description}</p>
        </div>
        `,
      });
    },
  });
  calendar.render();

  // == initial recurrence
  generateRecurrence();
});
