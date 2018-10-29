const assert = require('assert');
const jenkins = require('../src/services/jenkins');

describe('Jenkins Service test', () => {
  describe('toJenkinsBody', () => {
    it('should turn an array of json parameters into a request body that jenkins understands', () => {
      const params = [{
        "param1": "val1"
      }, {
        "param2": "val2"
      }];
      assert.equal(jenkins._.toJenkinsBody(params), 'json=%7B%22parameter%22%3A%20%5B%7B%20%22param1%22%3A%20%22val1%22%20%7D%2C%20%7B%20%22param2%22%3A%20%22val2%22%20%7D%5D%7D');
    })
  });
  describe('getQueuedItems', () => {
    const queue = [
      {
        id: 1,
        task: { name: "proj1" }
      },
      {
        id: 2,
        task: { name: "proj1" }
      },
      {
        id: 3,
        task: { name: "proj2" }
      }
    ];
    it('get a list of all queued IDs that belong to the project', () => {
      assert.deepEqual(jenkins._.getQueuedItems(queue, "proj1"), [1, 2]);

    });
    it('should return all IDs if no project is given', () => {
      assert.deepEqual(jenkins._.getQueuedItems(queue, null), [1, 2, 3]);

    });
  });
  describe('getItemsAheadText', () => {
    it('should return how many items are ahead of the one have queued', () => {
      assert.equal(jenkins._.getItemsAheadText([0, 1, 2, 3, 4], 3), '3 items');
      assert.equal(jenkins._.getItemsAheadText([0, 1, 2, 3, 4], 1), '1 item');
      assert.equal(jenkins._.getItemsAheadText([0, 1, 2, 3, 4], 0), '0 items');
    })
  });
});
