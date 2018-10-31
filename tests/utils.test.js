const assert = require('assert');
const utils = require('../src/utils/utils');

const array1 = [1, 2, 3, 4, 5, 6];
const array2 = [4, 5, 6, 7, 8, 9];
const array3 = [10, 11, 12, 13, 14, 15];
const array4 = [4, 4, 4, 5, 6]

describe('Utils test', () => {
  describe('Array Utils', () => {
    describe('intersect', () => {
      it('should return an array with the common elements of the two arrays', () => {
        assert.equal(utils.array.intersect(array1, array2).length, 3);
        assert.deepEqual(utils.array.intersect(array1, array2), [4, 5, 6]);
        assert.equal(utils.array.intersect(array2, array1).length, 3);
        assert.deepEqual(utils.array.intersect(array2, array1), [4, 5, 6]);
      });
      it('should not have duplicates', () => {
        assert.equal(utils.array.intersect(array1, array4).length, 3);
        assert.deepEqual(utils.array.intersect(array1, array4), [4, 5, 6]);
        assert.equal(utils.array.intersect(array4, array1).length, 3);
        assert.deepEqual(utils.array.intersect(array4, array1), [4, 5, 6]);
      });
      it('should return an empty array if arrays have no common elements', () => {
        assert.equal(utils.array.intersect(array3, array1).length, 0);
        assert.deepEqual(utils.array.intersect(array3, array1), []);
      });
      it('should return an empty array if any array is null', () => {
        assert.equal(utils.array.intersect(array1, null).length, 0);
        assert.deepEqual(utils.array.intersect(array1, null), []);
        assert.equal(utils.array.intersect(null, array1).length, 0);
        assert.deepEqual(utils.array.intersect(null, array1), []);
      });
    });
    describe('anyIntersection', () => {
      it('returns true if there are any common elements', () => {
        assert.equal(utils.array.anyIntersection(array1, array2), true);
        assert.equal(utils.array.anyIntersection(array2, array1), true);
      });
      it('returns false if there are no common elements', () => {
        assert.equal(utils.array.anyIntersection(array1, array3), false);
        assert.equal(utils.array.anyIntersection(array3, array1), false);
        assert.equal(utils.array.anyIntersection(array1, null), false);
        assert.equal(utils.array.anyIntersection(null, array1), false);
      });
    });
  });
  describe('Date utils', () => {
    describe('textToDateRange', () => {
      it('should "tomorrow", "this week" and "next week" into date ranges', () => {
        assert.deepEqual(utils.date.textToDateRange("2018-10-29", "tomorrow"), {start:new Date("2018-10-30"), end: new Date("2018-10-31")});
        assert.deepEqual(utils.date.textToDateRange("2018-10-31", "tomorrow"), {start:new Date("2018-11-01"), end: new Date("2018-11-02")});
        assert.deepEqual(utils.date.textToDateRange("2018-12-30", "tomorrow"), {start:new Date("2018-12-31"), end: new Date("2019-01-01")});

        assert.deepEqual(utils.date.textToDateRange("2018-11-08", "this week"), {start:new Date("2018-11-04"), end: new Date("2018-11-10T23:59:59.000Z")});
        assert.deepEqual(utils.date.textToDateRange("2018-12-31", "this week"), {start:new Date("2018-12-30"), end: new Date("2019-01-05T23:59:59.000Z")});

        assert.deepEqual(utils.date.textToDateRange("2018-11-08", "next week"), {start:new Date("2018-11-11"), end: new Date("2018-11-17T23:59:59.000Z")});
        assert.deepEqual(utils.date.textToDateRange("2018-12-31", "next week"), {start:new Date("2019-01-06"), end: new Date("2019-01-12T23:59:59.000Z")});
      });
    });
    describe('max', () => {
      it('should return the latest date of the two', () => {
        assert.deepEqual(utils.date.max("2018-10-28", "2018-10-27"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.max("2018-10-28 10:15:00", "2018-10-28 10:15:01"), new Date("2018-10-28 10:15:01"));
      });
      it('should cope with nulls', () => {
        assert.deepEqual(utils.date.max("2018-10-28", null), new Date("2018-10-28"));
        assert.deepEqual(utils.date.max(null, "2018-10-28"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.max(null, null), null);
      });
      it('should work with strings and dates interchangeably', () => {
        assert.deepEqual(utils.date.max("2018-10-28", "2018-10-27"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.max(new Date("2018-10-28"), "2018-10-27"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.max("2018-10-28", new Date("2018-10-27")), new Date("2018-10-28"));
        assert.deepEqual(utils.date.max(new Date("2018-10-28"), new Date("2018-10-27")), new Date("2018-10-28"));
      });
    });
    describe('min', () => {
      it('should return the earliest date of the two', () => {
        assert.deepEqual(utils.date.min("2018-10-28", "2018-10-29"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.min("2018-10-28 10:15:00", "2018-10-28 10:15:01"), new Date("2018-10-28 10:15:00"));
      });
      it('should cope with nulls', () => {
        assert.deepEqual(utils.date.min("2018-10-28", null), new Date("2018-10-28"));
        assert.deepEqual(utils.date.min(null, "2018-10-28"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.min(null, null), null);
      });
      it('should work with strings and dates interchangeably', () => {
        assert.deepEqual(utils.date.min("2018-10-28", "2018-10-29"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.min(new Date("2018-10-28"), "2018-10-29"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.min("2018-10-28", new Date("2018-10-29")), new Date("2018-10-28"));
        assert.deepEqual(utils.date.min(new Date("2018-10-28"), new Date("2018-10-29")), new Date("2018-10-28"));
      });
    });
    describe('formatDate', () => {
      it('should return the date in the YYYY-MM-DD format', () => {
        assert.deepEqual(utils.date.formatDate("2018-1-1"), "2018-01-01");
        assert.deepEqual(utils.date.formatDate("2018-09-5"), "2018-09-05");
        assert.deepEqual(utils.date.formatDate("2018-10-28"), "2018-10-28");
        assert.deepEqual(utils.date.formatDate("2018-10-28 07:05:00"), "2018-10-28");
        assert.deepEqual(utils.date.formatDate(new Date("2018-10-28 07:05")), "2018-10-28");
        assert.deepEqual(utils.date.formatDate(null), "");
        assert.deepEqual(utils.date.formatDate(new Date(null)), "1970-01-01");
      });
    });
    describe('formatHumanISO', () => {
      it('should return the date in the YYYY-MM-DD HH:mm:ss format', () => {
        assert.deepEqual(utils.date.formatHumanISO("2018-10-28"), "2018-10-28 00:00:00");
        assert.deepEqual(utils.date.formatHumanISO("2018-10-28 07:05:00"), "2018-10-28 07:05:00");
        assert.deepEqual(utils.date.formatHumanISO(new Date("2018-10-28T01:20:30.400Z")), "2018-10-28 01:20:30");
        assert.deepEqual(utils.date.formatHumanISO(null), "");
      });
    });
    describe('isSameDay', () => {
      it('should return true as long as the year, month and day are the same', () => {
        assert.equal(utils.date.isSameDay("2018-10-28", "2018-10-28"), true);
        assert.equal(utils.date.isSameDay("2018-10-28 00:00:00", "2018-10-28"), true);
        assert.equal(utils.date.isSameDay("2018-10-28 00:41", "2018-10-28 00:12:15"), true);

        assert.equal(utils.date.isSameDay(new Date("2018-10-28"), "2018-10-28"), true);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:00:00"), "2018-10-28"), true);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:41"), "2018-10-28 00:12:15"), true);

        assert.equal(utils.date.isSameDay("2018-10-28", new Date("2018-10-28")), true);
        assert.equal(utils.date.isSameDay("2018-10-28 00:00:00", new Date("2018-10-28")), true);
        assert.equal(utils.date.isSameDay("2018-10-28 00:41", new Date("2018-10-28 00:12:15")), true);

        assert.equal(utils.date.isSameDay(new Date("2018-10-28"), new Date("2018-10-28")), true);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:00:00"), new Date("2018-10-28")), true);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:41"), new Date("2018-10-28 00:12:15")), true);
      });
      it('should return false if the year, month or day are different', () => {
        assert.equal(utils.date.isSameDay("2018-10-28", "2018-10-27"), false);
        assert.equal(utils.date.isSameDay("2018-10-28 00:00:00", "2018-11-28"), false);
        assert.equal(utils.date.isSameDay("2018-10-28 00:41", "2019-10-28 00:12:15"), false);

        assert.equal(utils.date.isSameDay(new Date("2018-10-28"), "2018-10-27"), false);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:00:00"), "2018-11-28"), false);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:41"), "2019-10-28 00:12:15"), false);

        assert.equal(utils.date.isSameDay("2018-10-28", new Date("2018-10-27")), false);
        assert.equal(utils.date.isSameDay("2018-10-28 00:00:00", new Date("2018-11-28")), false);
        assert.equal(utils.date.isSameDay("2018-10-28 00:41", new Date("2019-10-28 00:12:15")), false);

        assert.equal(utils.date.isSameDay(new Date("2018-10-28"), new Date("2018-10-27")), false);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:00:00"), new Date("2018-11-28")), false);
        assert.equal(utils.date.isSameDay(new Date("2018-10-28 00:41"), new Date("2019-10-28 00:12:15")), false);
      });
      it('should cope with nulls', () => {
        assert.equal(utils.date.isSameDay("2018-10-28", null), false);
        assert.equal(utils.date.isSameDay(null, "2018-10-28"), false);
        assert.equal(utils.date.isSameDay(null, new Date(null)), false);
        assert.equal(utils.date.isSameDay(new Date(null), null), false);
      })
    });
    describe('isAdjoiningDate',()=>{
      it('should return true if there is 1 day or less of difference between two dates', () => {
        assert.equal(utils.date.isAdjoiningDate("2018-10-28", "2018-10-29"), true);
        assert.equal(utils.date.isAdjoiningDate("2018-10-29", "2018-10-28"), true);

        assert.equal(utils.date.isAdjoiningDate("2018-10-28 10:30:00", "2018-10-29 08:00:00"), true);
        assert.equal(utils.date.isAdjoiningDate("2018-10-29 08:00:00", "2018-10-28 10:30:00"), true);

        assert.equal(utils.date.isAdjoiningDate("2018-10-28 07:30:00", "2018-10-29 08:00:00"), false);
        assert.equal(utils.date.isAdjoiningDate("2018-10-29 08:00:00", "2018-10-28 07:30:00"), false);

        assert.equal(utils.date.isAdjoiningDate("2018-11-10T17:00:00", "2018-11-11T08:30:00"), true);
        assert.equal(utils.date.isAdjoiningDate("2018-11-11T08:30:00", "2018-11-10T17:00:00"), true);
      });
      it('should cope with nulls', () => {
        assert.equal(utils.date.isAdjoiningDate("2018-10-28", null), false);
        assert.equal(utils.date.isAdjoiningDate(null, "2018-10-28"), false);
        assert.equal(utils.date.isAdjoiningDate(null, new Date(null)), false);
        assert.equal(utils.date.isAdjoiningDate(new Date(null), null), false);
      })
    }),
    describe('addDays', () => {
      it('should increase the number of days by the amount provided', () => {
        assert.deepEqual(utils.date.addDays("2018-01-01", 1), new Date("2018-01-02"));
        assert.deepEqual(utils.date.addDays("2018-01-01", -1), new Date("2017-12-31"));
        assert.deepEqual(utils.date.addDays("2018-01-31", 1), new Date("2018-02-01"));
        assert.deepEqual(utils.date.addDays("2018-01-01", null), new Date("2018-01-01"));
        assert.deepEqual(utils.date.addDays(null, 1), null);
      });
      it('should change the time according to lightsavers', () => {
        assert.deepEqual(utils.date.addDays(new Date("2018-10-28"), 1), new Date("2018-10-29 01:00"));
      });
      it('should return a new date', () => {
        const date = new Date("2018-10-29");
        const changedDate = utils.date.addDays(date, 1);
        assert.notEqual(changedDate, date);
        assert.deepEqual(date, new Date("2018-10-29"));
        assert.deepEqual(changedDate, new Date("2018-10-30"));
      });
    });
    describe('getWeekStart', () => {
      it('should get the date at which the week started (Sunday)', () => {
        assert.deepEqual(utils.date.getWeekStart("2018-08-26"), new Date("2018-08-26"));
        assert.deepEqual(utils.date.getWeekStart("2018-08-27"), new Date("2018-08-26"));
        assert.deepEqual(utils.date.getWeekStart("2018-08-30"), new Date("2018-08-26"));
        assert.deepEqual(utils.date.getWeekStart("2018-08-31"), new Date("2018-08-26"));
        assert.deepEqual(utils.date.getWeekStart("2018-09-01"), new Date("2018-08-26"));
        assert.deepEqual(utils.date.getWeekStart("2018-09-02"), new Date("2018-09-02"));
      });
      it('NOTE: daylight savings will interfere with this', () => {
        assert.deepEqual(utils.date.getWeekStart("2018-10-28"), new Date("2018-10-28"));
        assert.deepEqual(utils.date.getWeekStart("2018-10-29"), new Date("2018-10-28 00:00:00"));
        assert.deepEqual(utils.date.getWeekStart("2018-10-29"), new Date("2018-10-27T23:00:00.000Z"));
      });
    });
    describe('getWeekEnd', () => {
      it('should get the date at which the week ended (Saturday)', () => {
        assert.deepEqual(utils.date.getWeekEnd("2018-08-26"), new Date("2018-09-01 23:59:59"));
        assert.deepEqual(utils.date.getWeekEnd("2018-08-27"), new Date("2018-09-01 23:59:59"));
        assert.deepEqual(utils.date.getWeekEnd("2018-08-30"), new Date("2018-09-01 23:59:59"));
        assert.deepEqual(utils.date.getWeekEnd("2018-08-31"), new Date("2018-09-01 23:59:59"));
        assert.deepEqual(utils.date.getWeekEnd("2018-09-01"), new Date("2018-09-01 23:59:59"));
        assert.deepEqual(utils.date.getWeekEnd("2018-09-02"), new Date("2018-09-08 23:59:59"));
      });
      it('NOTE: daylight savings will interfere with this', () => {
        assert.deepEqual(utils.date.getWeekEnd("2018-09-01"), new Date("2018-09-01T22:59:59.000Z"));
      });
    });
  });
  describe('String utils', () => {
    describe('capitalize', () => {
      it('should capitalize the first word  of every word in a string', () => {
        assert.equal(utils.string.capitalize("hello"), "Hello");
        assert.equal(utils.string.capitalize("Hello"), "Hello");
        assert.equal(utils.string.capitalize("Hello World"), "Hello World");
        assert.equal(utils.string.capitalize("hello World"), "Hello World");
        assert.equal(utils.string.capitalize("hello world"), "Hello World");
      });
    });
    describe('getMatchingStartingWord', () => {
      it('should return the first word of the string if it matches any word of the list', () => {
        assert.equal(utils.string.getMatchingStartingWord("Hello world", ["Hello", "Bye"]), "Hello");
        assert.equal(utils.string.getMatchingStartingWord("Hello world", ["Bye", "Hello"]), "Hello");
        assert.equal(utils.string.getMatchingStartingWord("Hello world", ["Bye", "hello"]), "Hello");
      });
    });
  });
  describe('Object utils', () => {
    describe('clone', () => {
      it('should produce an entirely new clone', () => {
        const object = {"value": 1, "nested":{"value":2}};
        assert.notEqual(object, utils.object.clone(object));
        assert.deepEqual(object, utils.object.clone(object));
      });
      it('should not affect original\'s values', () => {
        const object = {"value": 1, "nested":{"value":2}};
        const clone = utils.object.clone(object);
        clone.value = 2;
        clone.nested.value = 3;
        assert.notEqual(object.value, 2);
        assert.notEqual(object.nested.value, 3);
        assert.equal(clone.value, 2);
        assert.equal(clone.nested.value, 3);
      });
    });
  });
});
