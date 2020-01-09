'use strict';

const discordConfig = require('./config/discord-config.json');
const jiraConfig = require('./config/jira-config.json');
const gitlabConfig = require('./config/gitlab-config.json');

const Discord = require('discord.js');
const logger = require('winston');
const Gitlab = require('./services/gitlab');
const Jira = require('./services/jira');
const Staffsquared = require('./services/staffsquared');
const CloudflareStatus = require('./services/cloudflare-status');
const AwardManager = require('./services/award');
const FoodOrder = require('./services/food');
const Reminder = require('./services/reminder');
const chat = require('./utils/discord-chat');
const utils = require('./utils/utils');
const _ = require('./services/bot');

const SERVERS = {};
const ADMIN_ROLES = {};
const WHITELISTED_ROLES = {};
const WHITELISTED_CHANNELS = {};

const helpCommands = {};

const isAdmin = (info) => {
  return info.serverId &&
    _.isAdmin(info.roleIds,
      ADMIN_ROLES[info.serverId])
};

const isPermitted = (info) => {
  return info.serverId &&
    _.isPermitted(info.channel.id,
      info.roleIds,
      WHITELISTED_CHANNELS[info.serverId],
      WHITELISTED_ROLES[info.serverId])
};

const unprotectedCommand = (info, triggers, f, params, description) => {
  const commands = triggers.commands.map((c) => {
    return `**\`${c}\`**`
  }).join(" or ");
  helpCommands[triggers.commands.join('|')] = `  * ${commands} ${params ? params + '' : ''} - ${description}`;
  _.command(info, triggers.commands, triggers.regex, f);
};

const protectedCommand = (info, triggers, f, params, description) => {
  const commands = triggers.commands.map((c) => {
    return `**\`${c}\`**`
  }).join(" or ");
  helpCommands[triggers.commands.join('|')] = `  * ${commands} ${params ? params + '' : ''} - **(protected)** ${description}`;
  if (isPermitted(info)) {
    _.command(info, triggers.commands, triggers.regex, f);
  }
};

const adminCommand = (info, triggers, f, params, description) => {
  const commands = triggers.commands.map((c) => {
    return `**\`${c}\`**`
  }).join(" or ");
  helpCommands[triggers.commands.join('|')] = `  * ${commands} ${params ? params + '' : ''} - **(admin)** ${description}`;
  if (isAdmin(info)) {
    _.command(info, triggers.commands, triggers.regex, f);
  }
};

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
  colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
const bot = new Discord.Client({
  autorun: true
});
bot.login(discordConfig.token);

let reminder = null;

bot.once('ready', (evt) => {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.user.username + ' - (' + bot.user.id + ')');
  bot.guilds.array().forEach((server) => {
    SERVERS[server.id] = server;
    ADMIN_ROLES[server.id] = [];
    WHITELISTED_ROLES[server.id] = [];
    WHITELISTED_CHANNELS[server.id] = [];

    server.roles.array().forEach((role) => {
      if (discordConfig.adminRoles.includes(role.name)) {
        ADMIN_ROLES[server.id].push(role.id);
      }
    });

    server.roles.array().forEach((role) => {
      if (discordConfig.roleWhitelist.includes(role.name)) {
        WHITELISTED_ROLES[server.id].push(role.id);
      }
    });

    server.channels.array().forEach((channel) => {
      if (discordConfig.channelWhitelist.includes(channel.name)) {
        WHITELISTED_CHANNELS[server.id].push(channel.id);
      }
    });
  });

  reminder = new Reminder(bot);
  if (reminder.load()) {
    logger.warn("Unable to load saved Reminder files.")
  }
  reminder.checkTimeReminders();
});

const pokedBy = {};

let ignoredUserIds = [];

let muted = false;

const foodOrders = new FoodOrder();
if (foodOrders.load()) {
  logger.warn("Unable to load saved Food Order files.")
}
const awards = new AwardManager();
if (awards.load()) {
  logger.warn("Unable to load saved Awards files.")
}

bot.on('message', (message) => {
  if (message.author.id === bot.user.id || ignoredUserIds.includes(message.author.id)) {
    return;
  }

  logger.info([message.author.username, message.content]);

  const msgInfo = {
    serverId: message.guild.id || null,
    roleIds: message.member ? message.member.roles.array().map(r => r.id) : null,
    message: message.content,
    bot: bot,
    channel: message.channel,
    user: message.author
  };

  let wasPoke = false;

  reminder.getUserTriggers(msgInfo.user.id).forEach((memo)=>{
    chat(bot, msgInfo.channel, `Reminder <@${memo.userToRemind}>:\n${memo.messages.map((m)=>{return m.message}).join('\n')}`);
  });

  adminCommand(msgInfo, _.triggers.unmute,
    (info, command, match) => {
      if (muted) {
        muted = false;
        chat(bot, info.channel, `Thanks, <@${info.user.id}>. It's good to be back.`);
      }
    }, null, "Tell me to speak again.");

  if (muted) {
    return;
  }
  
  adminCommand(msgInfo, _.triggers.mute,
    (info, command, match) => {
      muted = true;
      const messages = ["Wait! Let me jus-", "But I di-", "Mmmfmmm!!! Mmmfmmfmmm!!!", ":zipper_mouth:", `I'll just shut up then, <@${info.user.id}>...`]
      const pick = Math.floor(Math.random() * messages.length);
      chat(bot, info.channel, messages[pick]);
    }, null, "Tell me to shut up.");


  adminCommand(msgInfo, _.triggers.purge,
    (info, command, match) => {
      const msg = info.message.split(/\s/);
      const userId = (msg.length >= 2 ? msg[1] : "any") || "any";
      const mentionedUser = userId.trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
      const numberOfMessages = (msg.length >= 3 ? msg[2] : 1) || 1;
      let messages = info.channel.messages.array();
      if (mentionedUser !== "any"){
        messages = info.channel.messages.array().filter((channelMessage) => {
          return channelMessage.author.id === mentionedUser;
        });
      }
      for(var i=(messages.length - numberOfMessages); i<messages.length; i++){
        messages[i].delete()
          .then((m) => {
            console.log(`Deleted ${m.author.username}'s "${m.content}"`);
          })
          .catch(console.error);
      }
      chat(bot, info.user, "Deleted messages.");
    }, "[any|<@user-reference>] [|<X number of messages>]", "Purge the last X messages in a channel (or the last X messages from a user in a channel).");
  

  unprotectedCommand(msgInfo, _.triggers.food,
    (info, command, match) => {
      const food = (info.message.split(command)[1] || "").replace(/\s\s+/g, ' ').trim() || null;
      if(!food || food === "who"){
        const allOrders = foodOrders.formattedOrders(!!food, info.channel.guild);
        if(!allOrders){
          chat(bot, info.channel, `No orders registered so far.`);
        } else {
          chat(bot, info.channel, `Food orders for today:\n${allOrders}`);
        }
      } else if (food === "done"){
        foodOrders.clear();
        chat(bot, info.channel, `Food orders cleared.`);
      } else if (food === "cancel"){
        foodOrders.cancel(info.user.id);
        chat(bot, info.channel, `Your order was cancelled, <@${info.user.id}>.`);
      } else {
        foodOrders.order(info.user.id, food);
        chat(bot, info.channel, `Added ${food} for <@${info.user.id}> to the lunch order. You can view the whole order with \`!food\``);
      }
    }, "[|done|cancel|who|<food order>]", "Order food, check what's being ordered, or use `!food cancel` to cancel your order. To complete (and clear) a group of orders type `!food done`");

  unprotectedCommand(msgInfo, _.triggers.reminder,
    (info, command, match) => {
      let userToRemind = null;
      let trigger = null;
      let reminderMessage = null;
      let type = null;
      if (info.message.indexOf(command) !== -1) {
        const msg = (info.message.split(command)[1] || "").replace(/\s\s+/g, ' ').trim().split(' ');
        // Look for user to remind
        userToRemind = (msg[0] || "").trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
        if (userToRemind !== null) {
          userToRemind = userToRemind === "me" ? info.user.id : userToRemind;
          if (!_.userInServer(info.channel.guild, userToRemind)) {
            userToRemind = null;
          }
        }
        // Look for trigger & type of trigger
        if ((msg[1] || "").trim().indexOf('<@') != -1){
          type = "user";
          trigger = (msg[1] || "").trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
          if (!_.userInServer(info.channel.guild, trigger)) {
            trigger = null;
          }
        } else {
          type = "date";
          trigger = (msg[1] || "").trim() || null;
          if(trigger !== null){
            let date = trigger.split('.')[0];
            const time = trigger.split('.')[1] || "09:00";
            if(date === "tomorrow"){
              date = utils.date.addDays(utils.date.midnightToday(), 1);
              date.setHours(9);
              trigger = date;
            } else {
              trigger = new Date(`${date} ${time}`);
            }
          }
        }
        // Reminder message
        reminderMessage = (msg.slice(2) || "").join(' ').trim() || null;
      }

      const errors = [];

      if (userToRemind === null){
        errors.push("You need to @ someone or use `me` as an alias.")
      }
      if (trigger === null || trigger.toString() === "Invalid Date"){
        errors.push("You need to provide a date in the `YYYY-MM-DD.HH:mm` format or @ someone to use as a trigger for the reminder.")
      }
      if (reminderMessage === null){
        errors.push("You need to tell me what to remind about")
      }

      if (errors.length > 0) {
        chat(bot, info.channel, errors.join('\n'));
      } else {
        reminder.remind(userToRemind, trigger, type, reminderMessage, info.channel.id);
        const when = type === 'date' ? `at ${trigger}` : `when <@${trigger}> speaks`
        const who = info.user.id === userToRemind ? 'you' : `<@${userToRemind}>`;
        chat(bot, info.channel, `Sure <@${info.user.id}>, I'll remind ${who} with "${reminderMessage}" ${when}.`);
      }
    }, "[me|<@user-to-remind>] [<time-to-trigger-reminder>|<@user-to-trigger-reminder>|tomorrow] <text-to-remind>", "Set reminders for yourself or someone else. I can remind you at a certain time or when someone speaks on any channel. Dates come in the `YYYY-MM-DD` or `YYYY-MM-DD.HH:MM` (when time is not provided it defaults to 09:00).");

  unprotectedCommand(msgInfo, _.triggers.poke,
    (info, command, match) => {
      if (!pokedBy[info.user.id]) {
        pokedBy[info.user.id] = {
          times: 0
        }
      }
      const messages = [
        `I'm here, <@${info.user.id}>`,
        `Yeah yeah, I'm here, <@${info.user.id}>`,
        `Just cut it out, <@${info.user.id}>! :angry:`,
        `I'm not replying about this anymore, <@${info.user.id}>`
      ]
      if (pokedBy[info.user.id].times < messages.length) {
        chat(bot, info.channel, messages[pokedBy[info.user.id].times]);
      }
      pokedBy[info.user.id].times++;

      wasPoke = true;
    }, null, "Check if I'm around");

  adminCommand(msgInfo, _.triggers.ignore,
    (info, command, match) => {
      let mentionedUser = null;
      if (info.message.indexOf(command) !== -1) {
        mentionedUser = (info.message.split(command)[1] || "").trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
        if (!_.userInServer(info.channel.guild, mentionedUser)) {
          mentionedUser = null;
        }
      }
      if (mentionedUser === null) {
        chat(bot, info.channel, `You need to \`@\` a user for me to ignore.\nFor example: \`!ignore @code-ginger-ninja#9811\``);
      } else if (mentionedUser === info.channel.guild.owner.user.id) {
        chat(bot, info.channel, `I cannot ignore my master, <@${info.user.id}>.`);
      } else {
        if (!ignoredUserIds.includes(mentionedUser)) {
          ignoredUserIds.push(mentionedUser);
          chat(bot, info.channel, `All right, <@${info.user.id}>. Ignoring <@${mentionedUser}> from now on.`);
        }
      }
    }, "<@user-reference>", "Tell me to ignore a user");

  adminCommand(msgInfo, _.triggers.unignore,
    (info, command, match) => {
      let mentionedUser = null;
      if (info.message.indexOf(command) !== -1) {
        mentionedUser = (info.message.split(command)[1] || "").trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
        if (!_.userInServer(info.channel.guild, mentionedUser)) {
          mentionedUser = null;
        }
      }
      if (mentionedUser === null) {
        chat(bot, info.channel, `You need to \`@\` a user for me to ignore.\nFor example: \`!listen @code-ginger-ninja#9811\``);
      } else {
        if (ignoredUserIds.includes(mentionedUser)) {
          ignoredUserIds = ignoredUserIds.filter((id) => {
            return id !== mentionedUser;
          });
          chat(bot, info.channel, `All right, <@${info.user.id}>. I'll listen to <@${mentionedUser}> again.`);
        }
      }
    }, "<@user-reference>", "Tell me to start listening to a previously ignored user.");

  unprotectedCommand(msgInfo, _.triggers.award,
    (info, command, match) => {
      let awardedItem = null;
      let mentionedUser = null;
      let quantity = 1;
      if (info.message.indexOf(command) !== -1) {
        const msg = (info.message.split(command)[1] || "").replace(/\s\s+/g, ' ').trim().split(' ');
        awardedItem = (msg[0] || "").trim() || null;
        mentionedUser = (msg[1] || "").trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
        quantity = Number((msg[2] || "").trim().replace("x", "")) || 1;
        if (!_.userInServer(info.channel.guild, mentionedUser)) {
          mentionedUser = null;
        }
      }

      if (mentionedUser === null || awardedItem === null || quantity <= 0) {
        chat(bot, info.channel, `You need to \`@\` someone and specify what item to award (and how much as long as it's a positive number).\nFor example: \`!award beer @code-ginger-ninja#9811 10\``);
      } else {
        const totalQuantity = awards.give(info.user.id, mentionedUser, awardedItem, quantity);
        chat(bot, info.channel, `<@${info.user.id}> now owes <@${mentionedUser}> ${totalQuantity}x ${awardedItem}`);
      }
      awards.save();
    }, "<item> <@recipient-user-reference> [|<quantity>]", "Award a user x items. If quantity is left empty (or is 0 or less), it defaults to 1.");

  unprotectedCommand(msgInfo, _.triggers.payoff,
    (info, command, match) => {
      let awardedItem = null;
      let mentionedUser = null;
      let quantity = 1;
      if (info.message.indexOf(command) !== -1) {
        const msg = (info.message.split(command)[1] || "").replace(/\s\s+/g, ' ').trim().split(' ');
        awardedItem = (msg[0] || "").trim() || null;
        mentionedUser = (msg[1] || "").trim().replace(/<@/g, "").replace(/>/g, "").replace(/!/, "") || null;
        quantity = Number((msg[2] || "").trim().replace("x", "")) || 1;
      }

      if (mentionedUser === null || awardedItem === null || quantity <= 0) {
        chat(bot, info.channel, `You need to \`@\` someone and specify what item to award (and how much as long as it's a positive number).\nFor example: \`!payoff beer @code-ginger-ninja#9811 10\``);
      } else {
        const totalQuantity = awards.removeDebt(mentionedUser, info.user.id, awardedItem, quantity);
        if (totalQuantity === false) {
          chat(bot, info.channel, `<@${mentionedUser}> never owed you ${awardedItem}, <@${info.user.id}>.`);
        } else {
          chat(bot, info.channel, `<@${mentionedUser}> now owes <@${info.user.id}> ${totalQuantity}x ${awardedItem}.`);
        }
        awards.save();
      }
    }, "<item> <@sender-user-reference> [|<quantity>]", "Consider x items owed to you by a user paid off. If quantity is left empty (or is 0 or less), it defaults to 1.");

  unprotectedCommand(msgInfo, _.triggers.owed,
    (info, command, match) => {
      const stuffOwed = awards.formatOwings(awards.getItemsOwedToUser(info.user.id), info.channel.guild);
      if (stuffOwed === null) {
        chat(bot, info.channel, `No one owes you anything, <@${info.user.id}>.`);
      } else {
        chat(bot, info.channel, `This is what people owe you, <@${info.user.id}>:\n${stuffOwed}`);
      }
    }, null, "Check who owes you stuff.");

  unprotectedCommand(msgInfo, _.triggers.owe,
    (info, command, match) => {
      const stuffOwed = awards.formatOwings(awards.getItemsUserOwes(info.user.id), info.channel.guild);
      if (stuffOwed === null) {
        chat(bot, info.channel, `You don't owe anything to anybody, <@${info.user.id}>.`);
      } else {
        chat(bot, info.channel, `This is what you owe others, <@${info.user.id}>:\n${stuffOwed}`);
      }
    }, null, "Check who do you owe stuff to.");

  unprotectedCommand(msgInfo, _.triggers.jiraProjects,
    (info, command, match) => {
      const issueLinkCandidates = Jira.matchesToIssueLinks(info.message, match, isPermitted(info));
      const issueLinks = [];
      const badIssueLinks = [];

      const allDone = (issues, processedLinksNumber, totalLinksNumber) => {
        if (processedLinksNumber === totalLinksNumber) {
          if (issues && issues.length > 0) {
            if (issues.length > 1) {
              chat(bot, info.channel, `Those look like Jira issues:\n ${issues.join('\n')}`);
            } else {
              chat(bot, info.channel, `That looks like a Jira issue:\n ${issues[0]}`);
            }
          }
        }
      };

      issueLinkCandidates.forEach((link) => {
        Jira.checkIssueExists(link,
          (rawData) => {
            const data = JSON.parse(rawData);
            issueLinks.push(`${Jira.issueTypeIcons[data.fields.issuetype.name.toLowerCase()]} ${data.fields.summary} - ${link}`);
            allDone(issueLinks, issueLinks.length + badIssueLinks.length, issueLinkCandidates.length);
          },
          () => {
            badIssueLinks.push(link);
            allDone(issueLinks, issueLinks.length + badIssueLinks.length, issueLinkCandidates.length);
          })
      });
    }, "<number>", `I will attempt to link any Jira issues for the following projects: ${jiraConfig.projects.map(p => p.code).join(', ')}`);

  unprotectedCommand(msgInfo, _.triggers.holiday,
    (info, command, match) => {
      if (info.message.indexOf(command) !== -1 || (match)) {
        const commandArgs = info.message.split(command);
        const param = (commandArgs.length > 1 ? commandArgs[1] : match[5]).trim().toLowerCase() || null;

        if (!param || param === "today") {
          Staffsquared.absencesToday(info, (absentees) => {
            const absenteeNames = absentees
              .sort((p1, p2) => {
                if (p1['EventTypeId'] > p2['EventTypeId']) {
                  return 1;
                }
                if (p1['EventTypeId'] < p2['EventTypeId']) {
                  return -1;
                }
                return 0;
              })
              .map((p) => {
                return ` * (${Staffsquared.EVENT_TYPES[p['EventTypeId']]}) **${p['FirstName']} ${p['LastName']}**`
              });
            if (absenteeNames.length > 0) {
              chat(bot, info.channel, `<@${info.user.id}>: According to StaffSquared these people are out of office today:\n${absenteeNames.join('\n')}`);
            } else {
              chat(bot, info.channel, `<@${info.user.id}>: According to StaffSquared, nobody is out of office today.`);
            }
          });
        } else {
          const dateRange = utils.date.textToDateRange(utils.date.midnightToday(), param);
          if (!dateRange) {
            return;
          }

          Staffsquared.absencesFuture(info, (absentees) => {
            const absenteeNames = Staffsquared.getNamesInDateRange(absentees, dateRange);
            if (absenteeNames.length > 0) {
              chat(bot, info.channel, `<@${info.user.id}>: According to StaffSquared these people are off ${param}:\n${absenteeNames.join('\n')}`);
            } else {
              chat(bot, info.channel, `<@${info.user.id}>: According to StaffSquared, nobody is off ${param}.`);
            }
          });
        }
      }
    }, "[|<today>|<tomorrow>|<this week>|<next week>]", "See who's out");

  protectedCommand(msgInfo, _.triggers.release,
    (info, command, match) => {
      Gitlab.branchList(null, info, (branchesString) => {
        const branches = JSON.parse(branchesString);
        const branchNames = branches.filter((b) => {
          return new RegExp(gitlabConfig.releaseBranchPattern).test(b.name);
        })
          .sort((a, b) => {
            return a.commit.committed_date < b.commit.committed_date ? 1 : (a.commit.committed_date > b.commit.committed_date ? -1 : 0);
          });
        chat(info.bot, info.channel, `<@${info.user.id}>, the release branch is probably \`${branchNames[0].name}\``);
      });
    }, null, "I'll try to figure out what the release branch is");

  protectedCommand(msgInfo, _.triggers.branches,
    (info, command, match) => {
      let filter = "";
      if (info.message.indexOf(command) !== -1) {
        filter = (info.message.split(command)[1] || "").trim();
      }
      Gitlab.branchList(filter, info);
    }, "[|<filter>]", "I'll list all the branches in git. Optionally pass a filter to \"grep\" by");

  protectedCommand(msgInfo, _.triggers.build,
    (info, command, match) => {
      chat(info.bot, info.channel, `Gitlab's probably already doing it...`);
    }, null, `Gitlab's automation takes care of this now.`);

  protectedCommand(msgInfo, _.triggers.merges,
    (info, command, match) => {
      chat(info.bot, info.channel, ``);
    }, null, `Lists all open merge requests on gitlab.`);

  unprotectedCommand(msgInfo, _.triggers.cloudflareStatus,
    (info, command, match) => {
      CloudflareStatus.getOutages(info.bot, info.channel);
    }, null, "Check if there's a cloudflare problem");

  unprotectedCommand(msgInfo, _.triggers.help, (info, command, match) => {
    chat(info.bot, info.channel, `I sent you a PM with all the commands, <@${info.user.id}>.`);
    chat(info.bot, info.user, `Commands:`);
    const allCommands = [];
    let partialCommands = [];
    Object.values(helpCommands).forEach((helpCommand) => {
      if (partialCommands.join('\n').length + helpCommand.length >= 2000) {
        allCommands.push(partialCommands.join('\n'));
        partialCommands = [];
      }
      partialCommands.push(helpCommand);
    });

    if (partialCommands.length !== 0) {
      allCommands.push(partialCommands.join('\n'));
    }

    allCommands.forEach((helpCommands) => {
      chat(info.bot, info.user, helpCommands);
    });
    chat(info.bot, info.user, `
----
***(admin)** commands can only be issued by admin-privileged roles.*
  * *Roles:  ${discordConfig.adminRoles.join(', ')}*

***(protected)** commands can only be issued from privileged channels and by privileged roles.*
  * *Channels: ${discordConfig.channelWhitelist.map((r) => { return `#${r}` }).join(', ')}*
  * *Roles:  ${discordConfig.roleWhitelist.join(', ')}*

In addition, I respond to plain english requests that contain the words:
  * \`start\` and \`build\` for building (and optionally a \`branch\`).
  * \`cancel\` paired with \`build\` or \`queue\` and a build/queue \`number\`.
If anyone asks what the release branch is I'll try to find the latest one too!`);
  }, null, "This info");

  if (!wasPoke) {
    if (!pokedBy[msgInfo.user.id]) {
      pokedBy[msgInfo.user.id] = {
        times: 0
      }
    }
    pokedBy[msgInfo.user.id].times = 0;
  }
});
