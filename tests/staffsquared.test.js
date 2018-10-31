const assert = require('assert');
const staffsquared = require('../src/services/staffsquared');


describe('Staffsquared Service test', () => {
  describe('getNamesInDateRange', () => {
    const absentees = [{
        "EmployeeId": 1,
        "FirstName": "John",
        "LastName": "Doe",
        "EventStart": "2018-11-01T08:30:00",
        "EventEnd": "2018-11-01T17:00:00"
      },
      {
        "EmployeeId": 2,
        "FirstName": "Jane",
        "LastName": "Doe",
        "EventStart": "2018-10-29T08:30:00",
        "EventEnd": "2018-11-02T17:00:00"
      },
      {
        "EmployeeId": 3,
        "FirstName": "Orgrim",
        "LastName": "Doomhammer",
        "EventStart": "2018-10-31T08:30:00",
        "EventEnd": "2018-10-31T13:00:00"
      },
      {
        "EmployeeId": 3,
        "FirstName": "Orgrim",
        "LastName": "Doomhammer",
        "EventStart": "2018-10-31T14:00:00",
        "EventEnd": "2018-10-31T17:00:00"
      },
      {
        "EmployeeId": 4,
        "FirstName": "Sarah",
        "LastName": "Kerrigan",
        "EventStart": "2018-11-10T10:00:00",
        "EventEnd": "2018-12-01T17:00:00"
      },
      {
        "EmployeeId": 5,
        "FirstName": "Sylvanas",
        "LastName": "Windrunner",
        "EventStart": "2018-11-05T08:30:00Z",
        "EventEnd": "2018-11-10T17:00:00Z"
      },
      {
        "EmployeeId": 5,
        "FirstName": "Sylvanas",
        "LastName": "Windrunner",
        "EventStart": "2018-11-11T08:30:00Z",
        "EventEnd": "2018-11-15T17:00:00Z"
      },
    ]
    it('should only gets the names within the date range', () => {
      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-11-01T00:00:00'),
        end: new Date('2018-11-02T00:00:00')
      }), [
        ` * **John Doe** (2018-11-01 08:30:00 to 2018-11-01 17:00:00)`,
        ` * **Jane Doe** (2018-10-29 08:30:00 to 2018-11-02 17:00:00)`,
      ]);

      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-10-27T00:00:00'),
        end: new Date('2018-10-30T00:00:00')
      }), [
        ` * **Jane Doe** (2018-10-29 08:30:00 to 2018-11-02 17:00:00)`,
      ]);

      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-11-02T00:00:00'),
        end: new Date('2018-11-05T00:00:00')
      }), [
        ` * **Jane Doe** (2018-10-29 08:30:00 to 2018-11-02 17:00:00)`,
      ]);

      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-11-09T00:00:00'),
        end: new Date('2018-11-20T00:00:00')
      }), [
        ` * **Sarah Kerrigan** (2018-11-10 10:00:00 to 2018-12-01 17:00:00)`,
        ` * **Sylvanas Windrunner** (2018-11-05 08:30:00 to 2018-11-15 17:00:00)`,
      ]);

      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-10-30T00:00:00'),
        end: new Date('2018-11-01T00:00:00')
      }), [
        ` * **Jane Doe** (2018-10-29 08:30:00 to 2018-11-02 17:00:00)`,
        ` * **Orgrim Doomhammer** (2018-10-31 08:30:00 to 2018-10-31 17:00:00)`,
      ]);
    });

    it('should not alter the original list', ()=>{
      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-11-09T00:00:00'),
        end: new Date('2018-11-20T00:00:00')
      }), [
        ` * **Sarah Kerrigan** (2018-11-10 10:00:00 to 2018-12-01 17:00:00)`,
        ` * **Sylvanas Windrunner** (2018-11-05 08:30:00 to 2018-11-15 17:00:00)`,
      ]);

      assert.deepEqual(staffsquared.getNamesInDateRange(absentees, {
        start: new Date('2018-11-09T00:00:00'),
        end: new Date('2018-11-20T00:00:00')
      }), [
        ` * **Sarah Kerrigan** (2018-11-10 10:00:00 to 2018-12-01 17:00:00)`,
        ` * **Sylvanas Windrunner** (2018-11-05 08:30:00 to 2018-11-15 17:00:00)`,
      ]);
    });
  });
});
