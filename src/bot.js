'use strict';

const discordConfig = require('./config/discord-config.json');
const jenkinsConfig = require('./config/jenkins-config.json');
const jiraConfig = require('./config/jira-config.json');
const gitlabConfig = require('./config/gitlab-config.json');

const Discord = require('discord.js');
const logger = require('winston');
const Jenkins = require('./services/jenkins');
const Gitlab = require('./services/gitlab');
const Jira = require('./services/jira');
const Staffsquared = require('./services/staffsquared');
const CloudflareStatus = require('./services/cloudflare-status');
const AwardManager = require('./services/award');
const chat = require('./utils/discord-chat');
const utils = require('./utils/utils');
const _ = require('./services/bot');

const SERVERS = {};
const WHITELISTED_ROLES = {};
const WHITELISTED_CHANNELS = {};

const helpCommands = {};

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

bot.once('ready', (evt) => {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.user.username + ' - (' + bot.user.id + ')');
  bot.guilds.array().forEach((server) => {
    SERVERS[server.id] = server;
    WHITELISTED_ROLES[server.id] = [];
    WHITELISTED_CHANNELS[server.id] = [];

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
});

const pokedBy = {};

const ignoredUserIds = [];

const awards = new AwardManager();
if(awards.load()){
  logger.warn("Unable to load saved files.")
}

bot.on('message', (message) => {
  if (message.author.id === bot.user.id) {
    return;
  }
  if (ignoredUserIds.includes(message.author.id)) {
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

  unprotectedCommand(msgInfo, _.triggers.ignore,
    (info, command, match) => {
      let mentionedUser = null;
      if (info.message.indexOf(command) !== -1) {
        mentionedUser = (info.message.split(command)[1] || "").trim().replace(/<@/g, "").replace(/>/g, "") || null;
        if (!_.userInServer(info.channel.guild, mentionedUser)) {
          mentionedUser = null;
        }
      }
      if (mentionedUser === null) {
        chat(bot, info.channel, `You need to \`@\` a user for me to ignore.\nFor example: \`!ignore @code-ginger-ninja#9811\``);
      } else if (mentionedUser === info.channel.guild.owner.user.id) {
        chat(bot, info.channel, `I cannot ignore my master, <@${info.user.id}>.`);
      } else {
        chat(bot, info.channel, `All right, <@${info.user.id}>. Ignoring <@${mentionedUser}> from now on.`);
      }
    }, "<@user-reference>", "Tell me to ignore a user");

  unprotectedCommand(msgInfo, _.triggers.award,
    (info, command, match) => {
      let awardedItem = null;
      let mentionedUser = null;
      let quantity = 1;
      if (info.message.indexOf(command) !== -1) {
        const msg = (info.message.split(command)[1] || "").trim().split(' ');
        awardedItem = (msg[0] || "").trim() || null;
        mentionedUser = (msg[1] || "").trim().replace(/<@/g, "").replace(/>/g, "") || null;
        quantity = Number((msg[2] || "").trim()) || 1;
        if (!_.userInServer(info.channel.guild, mentionedUser)) {
          mentionedUser = null;
        }
      }

      if (mentionedUser === null || awardedItem === null || quantity <= 0) {
        chat(bot, info.channel, `You need to \`@\` someone and specify what item to award (and how much as long as it's a positive number).\nFor example: \`!award beer @code-ginger-ninja#9811\` 10`);
      } else {
        const totalQuantity = awards.give(info.user.id, mentionedUser, awardedItem, quantity);
        chat(bot, info.channel, `<@${info.user.id}> now owes <@${mentionedUser}> ${totalQuantity}x ${awardedItem}`);
      }
      awards.save();
    }, "<item> <@recipient-user-reference> [|quantity]", "Award a user x items. If quantity is left empty (or is 0 or less), it defaults to 1.");

  unprotectedCommand(msgInfo, _.triggers.payoff,
    (info, command, match) => {
      let awardedItem = null;
      let mentionedUser = null;
      let quantity = 1;
      if (info.message.indexOf(command) !== -1) {
        const msg = (info.message.split(command)[1] || "").trim().split(' ');
        awardedItem = (msg[0] || "").trim() || null;
        mentionedUser = (msg[1] || "").trim().replace(/<@/g, "").replace(/>/g, "") || null;
        quantity = Number((msg[2] || "").trim()) || 1;
      }

      if (mentionedUser === null || awardedItem === null || quantity <= 0) {
        chat(bot, info.channel, `You need to \`@\` someone and specify what item to award (and how much as long as it's a positive number).\nFor example: \`!payoff beer @code-ginger-ninja#9811\` 10`);
      } else {
        const totalQuantity = awards.removeDebt(mentionedUser, info.user.id, awardedItem, quantity);
        if (totalQuantity === false) {
          chat(bot, info.channel, `<@${mentionedUser}> never owed you a ${awardedItem}, <@${info.user.id}>.`);
        } else {
          chat(bot, info.channel, `<@${mentionedUser}> now owes <@${info.user.id}> ${totalQuantity}x ${awardedItem}.`);
        }
        awards.save();
      }
    }, "<item> <@sender-user-reference> [|quantity]", "Consider x items owed to you by a user paid off. If quantity is left empty (or is 0 or less), it defaults to 1.");

  unprotectedCommand(msgInfo, _.triggers.owed,
    (info, command, match) => {
      const stuffOwed = awards.formatOwings(awards.getItemsOwedToUser(info.user.id), info.channel.guild);
      if(stuffOwed === null){
        chat(bot, info.channel, `No one owes you anything, <@${info.user.id}>.`);
      } else {
        chat(bot, info.channel, `This is what people owe you, <@${info.user.id}>:\n${stuffOwed}`);
      }
    }, null, "Check who owes you stuff.");

  unprotectedCommand(msgInfo, _.triggers.owe,
    (info, command, match) => {
      const stuffOwed = awards.formatOwings(awards.getItemsUserOwes(info.user.id), info.channel.guild);
      if(stuffOwed === null){
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
    }, "[|today|tomorrow|this week|next week]", "See who's out");

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
    }, "[|filter]", "I'll list all the branches in git. Optionally pass a filter to \"grep\" by");

  protectedCommand(msgInfo, _.triggers.build,
    (info, command, match) => {
      const b = info.message.indexOf(command) !== -1 ? info.message.split(command)[1].trim() : null;
      const branch = match[7] || b || jenkinsConfig.defaultBranch;
      chat(info.bot, info.channel, `Sure, <@${info.user.id}>. I've asked Jenkins to build from \`${branch}\`.`);
      Jenkins.requestBuild(branch, info);
    }, "[|branch]", `I'll ask jenkins to initiate a build (if \`branch\` is not provided then I'll use \`${jenkinsConfig.defaultBranch}\``);

  protectedCommand(msgInfo, _.triggers.cancelBuild,
    (info, command, match) => {
      let number = "";
      let type = "";
      if (info.message.indexOf(command) !== -1) {
        const params = info.message.split(command)[1].trim().split(/ +/);
        type = params.length > 1 ? params[0] : 'build';
        number = params.length > 1 ? params[1] : params[0];
      } else {
        type = match[2];
        number = match[4];
      }
      if (type.toLowerCase() === 'queue') {
        Jenkins.cancelQueue(number, () => {
          chat(info.bot, info.channel, `I've cancelled queue item ${number}, <@${info.user.id}>.`);
        });
      } else {
        Jenkins.cancelBuild(number, () => {
          chat(info.bot, info.channel, `I've cancelled build number ${number}, <@${info.user.id}>.`);
        });
      }
    }, "[|build|queue] <number>", "I will cancel a build or a queue item. If \`build\` or \`queue\` is not provided, I'll assume it's a build number");

  unprotectedCommand(msgInfo, _.triggers.cloudflareStatus,
    (info, command, match) => {
      CloudflareStatus.getOutages(info.bot, info.channel);
    }, null, "Check if there's a cloudflare problem");

  unprotectedCommand(msgInfo, _.triggers.help, (info, command, match) => {
    chat(info.bot, info.channel, `Here's some info, <@${info.user.id}>:
  Commands:
${Object.values(helpCommands).join("\n")}

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
