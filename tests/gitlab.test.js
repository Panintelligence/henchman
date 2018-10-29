const assert = require('assert');
const gitlab = require('../src/services/gitlab');

const msgInfo = {
    channelID: 1,
    userID: 222
};
const manyBranches = [
    "branch_a",
    "branch_b",
    "branch_c",
    "branch_d",
    "branch_e",
    "branch_f",
    "branch_g",
    "branch_h",
    "branch_i",
    "branch_j",
    "branch_k"
];
const jsonBranches = [
    { name: "first_branch" },
    { name: "second_branch" },
    { name: "third_branch" },
    { name: "third_branch__a" },
    { name: "third_branch__b" },
    { name: "master" },
];
const branchesNamesInList = [
    "first_branch",
    "second_branch",
    "third_branch",
    "third_branch__a",
    "third_branch__b",
    "master",
]

describe('Gitlab Service test', () => {
    describe('createBranchesMessages', () => {
        it('should return an empty array if no parameters are passed', () => {
            assert.equal(gitlab._.createBranchesMessages(null, null).length, 0);
            assert.equal(gitlab._.createBranchesMessages([], null).length, 0);
            assert.equal(gitlab._.createBranchesMessages(null, {}).length, 0);
            assert.equal(gitlab._.createBranchesMessages([], {}).length, 0);
            assert.equal(gitlab._.createBranchesMessages(["a", "b"], {}).length, 0);
        });
        it('should return one message if there are no branches', () => {
            const messages = gitlab._.createBranchesMessages([], msgInfo);
            assert.equal(messages.length, 1);
            assert.equal(messages[0].channel, 1);
            assert.equal(messages[0].message, `I could not find any branches, <@222>.`);
        });
        it('should return one message if there are 10 branches or less', () => {
            const messages = gitlab._.createBranchesMessages(["branch_a", "branch_b"], msgInfo);
            assert.equal(messages.length, 1);
            assert.equal(messages[0].channel, 1);
            assert.equal(messages[0].message, `Here's what I found, <@222>:\n  * \`branch_a\`\n  * \`branch_b\``);
        });
        it('should return two messages if there are more than 10 branches', () => {
            const messages = gitlab._.createBranchesMessages(manyBranches, msgInfo);
            assert.equal(manyBranches.length, 11);
            assert.equal(messages.length, 2);
            assert.equal(messages[0].channel, 1);
            assert.equal(messages[0].message, `There's lots of branches, <@222>! I've sent you a PM.`);
            assert.equal(messages[1].channel, 222);
            assert.equal(messages[1].message, `Here's what I found:\n` +
                "  * `branch_a`\n" +
                "  * `branch_b`\n" +
                "  * `branch_c`\n" +
                "  * `branch_d`\n" +
                "  * `branch_e`\n" +
                "  * `branch_f`\n" +
                "  * `branch_g`\n" +
                "  * `branch_h`\n" +
                "  * `branch_i`\n" +
                "  * `branch_j`\n" +
                "  * `branch_k`");
        });
    });
    describe('createListOfBranches', () => {
        it('should return an empty array no branches json is provided', () => {
            assert.equal(gitlab._.createListOfBranches(null, null).length, 0);
            assert.equal(gitlab._.createListOfBranches([], null).length, 0);
            assert.equal(gitlab._.createListOfBranches(null, "branch_k").length, 0);
            assert.equal(gitlab._.createListOfBranches([], "branch_k").length, 0);
        });
        it('should return an empty array if no branch matches the filter', () => {
            assert.equal(gitlab._.createListOfBranches(jsonBranches, "branch_k").length, 0);
        });
        it('should return the whole branch list array if no filter is provided', () => {
            assert.equal(gitlab._.createListOfBranches(jsonBranches, "").length, 6);
            assert.deepEqual(gitlab._.createListOfBranches(jsonBranches, ""), branchesNamesInList);
            assert.equal(gitlab._.createListOfBranches(jsonBranches, null).length, 6);
            assert.deepEqual(gitlab._.createListOfBranches(jsonBranches, null), branchesNamesInList);
            assert.equal(gitlab._.createListOfBranches(jsonBranches).length, 6);
            assert.deepEqual(gitlab._.createListOfBranches(jsonBranches), branchesNamesInList);
        });
        it('should return any branch that contains the word in filter', () => {
            assert.equal(gitlab._.createListOfBranches(jsonBranches, "third_branch").length, 3);
            assert.deepEqual(gitlab._.createListOfBranches(jsonBranches, "third_branch"), ["third_branch", "third_branch__a", "third_branch__b"]);
        });
    });
});
