# recurring-date

A zero-dependency* JavaScript library to generate recurring dates.

(*momentjs or dayjs must be installed as a peer dependency)

For example:

```txt
Every 2 weeks on Monday, Wednesday, and Friday starting today for 5 occurrences
```

```txt
Every month on the last Sunday starting on 02/10/09 until 03/30/10
```

This library will generate a list of dates for those patterns.

---

## Installation

```
npm install moment
npm install recurring-date
```

## Usage

```js
var RecurringDate = require('recurring-date');
var moment = require('moment');
RecurringDate.initializeWithDateLibrary(moment);
// Every day starting on Sunday, February 21, 2010 until Sunday, March 7, 2010
var r = new RecurringDate({
  start: "02/21/2010",
  until: "03/07/2010",
  every: "1",
  unit: "d",
  end_condition: "until",
  date_format: "MM/DD/YYYY",  
});
var dates = r.generate();

// dates is now an array of moment objects:
// [
//   Moment<2010-02-21T00:00:00+08:00>,
//   Moment<2010-02-22T00:00:00+08:00>,
//   Moment<2010-02-23T00:00:00+08:00>,
//   Moment<2010-02-24T00:00:00+08:00>,
//   Moment<2010-02-25T00:00:00+08:00>,
//   Moment<2010-02-26T00:00:00+08:00>,
//   Moment<2010-02-27T00:00:00+08:00>,
//   Moment<2010-02-28T00:00:00+08:00>,
//   Moment<2010-03-01T00:00:00+08:00>,
//   Moment<2010-03-02T00:00:00+08:00>,
//   Moment<2010-03-03T00:00:00+08:00>,
//   Moment<2010-03-04T00:00:00+08:00>,
//   Moment<2010-03-05T00:00:00+08:00>,
//   Moment<2010-03-06T00:00:00+08:00>,
//   Moment<2010-03-07T00:00:00+08:00>
// ]
```

This is a fork of mooman's [recurring_dates](https://github.com/mooman/recurring_dates).

##### Changes in this fork

- Removed all hard dependencies:
  - dayjs or momentjs (or a momentjs-compatible library) is required as a peer dependency
- Added types
- Fixed some issues around timezones

#### Requirements

- dayjs or momentjs is required as a peer dependency

#### Usage

    var r = new RecurringDate(pattern);
    alert(r.describe());
    dates = r.generate();
    if (r.contains('03/28/10')) alert('in pattern!');

#### API

    Class RecurringDate (pattern [, date_format])

where pattern is a JSON object with the following options:

- start: start date. date. required.
- every: interval magnitude (every XXX weeks...). integer. required.
- unit: valid values are 'd', 'w', 'm', 'y' for days, weeks, months, and years
  respectively. probably required.
- end_condition: how should the recurrence be terminated.
  valid values are 'until' and 'for'. 'until' should be a date.
  'for' should be an integer (for N occurrences). required.
- until: if end_condition is 'until', pass the date here.
- rfor: if end_condition is 'for', pass an integer here.
- nth: valid values are 'first', 'second', 'third', 'fourth', and 'last'.
  see 'occurrence_of' option. to be used with 'm' unit option.
- occurrence_of: valid values are 0-6, corresponding to the days of the week.
  in conjuction with 'nth' option, specifies nth day of the month
  (last Sunday of the month). to be used with 'm' unit option.
- days: to be used with 'w' unit option. an array of integers representing day
  of the week (0-6). eg. Every 2 weeks on Tuesday (2) and Thursday (4),
  pass [2,4] as the value.

ex.
    { start: new Date(), every: 2, unit: 'w', end_condition: 'for', rfor: 5, days: [1,3,5] }
    generates:
    Every 2 weeks on Monday, Wednesday, and Friday for 5 occurrences starting today

---

    String describe ()

Tries to describe the supplied pattern in English.

---

    Boolean contains (date)

Determines whether "date" is in the recurrence pattern. This calls generate(),
if it hasn't already been generated, otherwise, it will use the dates generated
from the last time generate() was called. Returns true if "date" is in the pattern.
"date" can be either a string or a Date object, but please make sure the time
portion is all balls (00:00:00).

Note that this only check if "date" is contained within the pattern's starting and
ending points. Next version will support indefinite ending date and throwaway dates
generation, instead of storing them all in an array.

-----

    Date[] generate ([limit])

Generate the dates based on supplied pattern. Returns array of Date objects.
Optional argument limit puts an upper limit on how many dates to generate
(for preview or to prevent some memory leak).

### TODO

- Indefinite ending date (seems to be working if occurences == 0)
- Throwaway date generation (not store in array, but just output it)

### COMMENTS

Please feel free fork and improve, submit bug reports, suggestions, comments.

### LICENSE

Released under MIT License.
