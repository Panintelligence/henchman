const assert = require('assert');
const bot = require('../src/services/bot');
const jiraConfig = require('../src/config/jira-config.json');

describe('Bot test', () => {
  describe('isPermitted', () => {
    it('should allow only if he has any of the whitelisted roles and is present in the whitelisted channel', () => {
      const whitelistedChannels = [10001, 10002, 10003];
      const whitelistedRoles = [21, 22, 23];
      assert.equal(bot.isPermitted(10001, [21, 22, 30], whitelistedChannels, whitelistedRoles), true);
      assert.equal(bot.isPermitted(10002, [23], whitelistedChannels, whitelistedRoles), true);
      assert.equal(bot.isPermitted(10004, [21], whitelistedChannels, whitelistedRoles), false);
      assert.equal(bot.isPermitted(10004, [20, 26], whitelistedChannels, whitelistedRoles), false);
      assert.equal(bot.isPermitted(10002, [20, 26], whitelistedChannels, whitelistedRoles), false);
      assert.equal(bot.isPermitted(null, null, whitelistedChannels, whitelistedRoles), false);
      assert.equal(bot.isPermitted(null, [], whitelistedChannels, whitelistedRoles), false);
      assert.equal(bot.isPermitted(10003, [], whitelistedChannels, whitelistedRoles), false);
      assert.equal(bot.isPermitted(null, [22], whitelistedChannels, whitelistedRoles), false);
    });
  });

  describe('command', () => {
    describe('via !commands', () => {
      Object.keys(bot.triggers).forEach((trigger) => {
        it(`should execute when the message matches ${bot.triggers[trigger].commands.join(' or ')}`, () => {
          const executed = [];
          let notExecuted = ["Hello", "!aksdjijqwi", "!"];
          bot.triggers[trigger].commands.map(c => c.replace(/\!/, '')).forEach((c)=>{
            notExecuted.push(c);
            bot.command({ message: c }, bot.triggers[trigger].commands, null, (i) => {
              executed.push(i.message);
              notExecuted = notExecuted.filter(c => c !== "Hello");
            });
          });
          bot.command({ message: "Hello" }, bot.triggers[trigger].commands, null, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== "Hello");
          });
          bot.command({ message: "!aksdjijqwi" }, bot.triggers[trigger].commands, null, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== "!aksdjijqwi");
          });
          bot.command({ message: "!" }, bot.triggers[trigger].commands, null, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== "!");
          });
          bot.triggers[trigger].commands.forEach((command)=>{
            notExecuted.push(command);
            bot.command({ message: command }, bot.triggers[trigger].commands, null, (i) => {
              executed.push(i.message);
              notExecuted = notExecuted.filter(c => c !== i.message);
            });
          });
          assert.deepEqual(executed, bot.triggers[trigger].commands);
          const expectedNotExecuted = ["Hello", "!aksdjijqwi", "!"];
          bot.triggers[trigger].commands.map(c => c.replace(/\!/, '')).forEach((c)=>{
            expectedNotExecuted.push(c);
          });
          assert.deepEqual(notExecuted, expectedNotExecuted);
        })
      });
    });

    describe('via regex', () => {
      it(`should execute when the message matches the regex: ${bot.triggers.poke.regex}`, () => {
        const executed = [];
        let notExecuted = [];
        ["Hello",
          "aksdjijqwi",
          "poke",
          "Is the bot online?",
          "is the bot online?",
          "bot around?",
          "bot on?",
          "is the bot on?",
          "is henchman around?",
          "is the bot online?",
          "is it on?",
          "the bot online?",
          "I wonder if the bot is online?"
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.poke.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, ["Is the bot online?",
          "is the bot online?",
          "bot around?",
          "bot on?",
          "is the bot on?",
          "is the bot online?",
          "the bot online?",
          "I wonder if the bot is online?"]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "poke", "is henchman around?", "is it on?"]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.jiraProjects.regexForTest}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "PROJECT1",
          "PROJECT2",
          "PROJ1",
          "PROJ2",
          "P-9999",
          "9980",
          "1",
          "123",
          "PROJ1-321",
          "PROJ2-456",
          "The issue is 8975",
          "Can anyone check 4456?",
          "Raised PROJ2-4456?",
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.jiraProjects.regexForTest, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, ["9980", "1", "123", "PROJ1-321", "PROJ2-456", "The issue is 8975", ""]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "PROJECT1", "PROJECT2", "PROJ1", "PROJ2", "P-9999"]);
      });
    });
  });
});
