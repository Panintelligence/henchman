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
          "Raised PROJ2-4456",
          "Just fixed 8789, 5412 and 8655",
          "You can't have fixed 8789 5412 or 8655!",
          "Can anyone have a look at 6542\n4564\nPROJ2-45",
          "I'm mentioning 8789 and 8789 twice but 5122 only once"
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.jiraProjects.regexForTest, (i, _, match) => {
            executed.push([i.message, match]);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, [
          ["9980", ["9980"]],
          ["1", ["1"]],
          ["123", ["123"]],
          ["PROJ1-321", ["PROJ1-321"]],
          ["PROJ2-456", ["PROJ2-456"]],
          ["The issue is 8975", [" 8975"]],
          ["Can anyone check 4456?", [" 4456"]],
          ["Raised PROJ2-4456", [" PROJ2-4456"]],
          ["Just fixed 8789, 5412 and 8655", [" 8789", " 5412", " 8655"]],
          ["You can't have fixed 8789 5412 or 8655!", [" 8789", " 5412", " 8655"]],
          ["Can anyone have a look at 6542\n4564\nPROJ2-45", [" 6542", "\n4564", "\nPROJ2-45"]],
          ["I'm mentioning 8789 and 8789 twice but 5122 only once", [" 8789", " 8789", " 5122"]]
        ]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "PROJECT1", "PROJECT2", "PROJ1", "PROJ2", "P-9999"]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.holiday.regex}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "Who?",
          "Who is out?",
          "Who's out?",
          "Who's in?",
          "Who is out of office?",
          "Who's away?",
          "Who's on holiday?",
          "Who's on holiday today?",
          "Who's off tomorrow?",
          "Who is out of the office next week?",
          "Anyone off tomorrow?",
          "Who got away?"
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.holiday.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, ["Who is out?", "Who's out?", "Who is out of office?",
          "Who's away?", "Who's on holiday?", "Who's on holiday today?", "Who's off tomorrow?", "Who is out of the office next week?"]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "Who?", "Who's in?", "Anyone off tomorrow?", "Who got away?"]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.release.regex}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "What's the release?",
          "Which one's the release branch?",
          "Can I have the release branch?",
          "Which branch is the release one?",
          "Can someone tell me what the release branch is?",
          "Hey bot, what's the release branch?",
          "release",
          "release branch",
          "Something that we've released",
          "Something that we're going to release",
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.release.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, ["What's the release?", "Which one's the release branch?", "Can I have the release branch?",
          "Which branch is the release one?", "Can someone tell me what the release branch is?", "Hey bot, what's the release branch?"]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "release", "release branch", "Something that we've released", "Something that we're going to release",]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.branches.regex}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "branches",
          "",
          "anything",
          "this should never be triggered by regex",
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.branches.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, []);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "branches", "", "anything", "this should never be triggered by regex",]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.build.regex}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "Mr Bot, start a build please",
          "Can anyone start a build?",
          "Start a build for this_branch",
          "Can I have a build from master please?",
          "<@1111> make a build",
          "build master",
          "start building stuff",
          "this is a good build for mage",
          "build from master",
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.build.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, ["Mr Bot, start a build please",
        "Can anyone start a build?",
        "Start a build for this_branch",
        "Can I have a build from master please?",
        "<@1111> make a build"]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi", "build master", "start building stuff", "this is a good build for mage",
          "build from master",]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.cancelBuild.regex}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "Mr Bot, cancel the build please",
          "Can anyone cancel the build?",
          "cancel the build for this_branch",
          "<@1111> cancel the build",
          "cancel build",
          "Mr Bot, cancel the queue please",
          "Can anyone cancel the queue?",
          "cancel the queue for this_branch",
          "<@1111> cancel the queue",
          "cancel queue",
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.cancelBuild.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, ["cancel the build for this_branch", "cancel the queue for this_branch"]);
        assert.deepEqual(notExecuted, ["Hello", "aksdjijqwi",
          "Mr Bot, cancel the build please",
          "Can anyone cancel the build?",
          "<@1111> cancel the build",
          "cancel build",
          "Mr Bot, cancel the queue please",
          "Can anyone cancel the queue?",
          "<@1111> cancel the queue",
          "cancel queue"]);
      });

      it(`should execute when the message matches the regex: ${bot.triggers.help.regex}`, () => {
        const executed = [];
        let notExecuted = [];

        ["Hello",
          "aksdjijqwi",
          "info",
          "help",
          "",
          "anything",
          "this should never be triggered by regex"
        ].forEach((m)=>{
          notExecuted.push(m);
          bot.command({ message:m }, null, bot.triggers.help.regex, (i) => {
            executed.push(i.message);
            notExecuted = notExecuted.filter(c => c !== m);
          });
        });

        assert.deepEqual(executed, []);
        assert.deepEqual(notExecuted, ["Hello",
          "aksdjijqwi",
          "info",
          "help",
          "",
          "anything",
          "this should never be triggered by regex"]);
      });
    });
  });
});
