'use strict';

const discordConfig = require('./config/discord-config.json');
const jenkinsConfig = require('./config/jenkins-config.json');
const jiraConfig = require('./config/jira-config.json');
const gitlabConfig = require('./config/gitlab-config.json');

const Discord = require('discord.io');
const logger = require('winston');
const Jenkins = require('./services/jenkins');
const Gitlab = require('./services/gitlab');
const Jira = require('./services/jira');
const Staffsquared = require('./services/staffsquared');
const CloudflareStatus = require('./services/cloudflare-status');
const chat = require('./utils/discord-chat');
const utils = require('./utils/utils');
const _ = require('./services/bot');

const WHITELISTED_ROLES = {};
const WHITELISTED_CHANNELS = {};

const helpCommands = {};

const isPermitted = (info) => {
  return info.serverId &&
    _.isPermitted(info.channelID,
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
  token: discordConfig.token,
  autorun: true
});

bot.on('ready', (evt) => {
  logger.info('Connected');
  logger.info('Logged in as: ');
  logger.info(bot.username + ' - (' + bot.id + ')');
  Object.keys(bot.servers).forEach((serverId) => {
    WHITELISTED_ROLES[serverId] = [];
    WHITELISTED_CHANNELS[serverId] = [];

    Object.keys(bot.servers[serverId].roles).forEach((roleId) => {
      if (discordConfig.roleWhitelist.includes(bot.servers[serverId].roles[roleId].name)) {
        WHITELISTED_ROLES[serverId].push(roleId);
      }
    });

    Object.keys(bot.servers[serverId].channels).forEach((channelId) => {
      if (discordConfig.channelWhitelist.includes(bot.servers[serverId].channels[channelId].name)) {
        WHITELISTED_CHANNELS[serverId].push(channelId);
      }
    });
  });
});

const pokedBy = {

};

bot.on('message', (user, userID, channelID, message, evt) => {
  if (userID === bot.id) {
    return;
  }

  logger.info(message);

  const msgInfo = {
    serverId: evt.d['guild_id'] || null,
    roleIds: evt.d.member ? evt.d.member.roles : null,
    message: message,
    bot: bot,
    channelID: channelID,
    userID: userID
  };

  let wasPoke = false;

  unprotectedCommand(msgInfo, _.triggers.poke,
    (info, command, match) => {
      if(!pokedBy[userID]){
        pokedBy[userID] = {
          times: 0
        }
      }
      const messages = [
        `I'm here, <@${userID}>`,
        `Yeah yeah, I'm here, <@${userID}>`,
        `Just cut it out, <@${userID}>! :angry:`,
        `I'm not replying about this anymore, <@${userID}>`
      ]
      if(pokedBy[userID].times < messages.length){
        chat(bot, channelID, messages[pokedBy[userID].times]);
      }
      pokedBy[userID].times++;

      wasPoke = true;
    }, null, "Check if I'm around");

  unprotectedCommand(msgInfo, _.triggers.jiraProjects,
    (info, command, match) => {
      const issueLinkCandidates = Jira.matchesToIssueLinks(info.message, match, isPermitted(info));
      const issueLinks = [];
      const badIssueLinks = [];

      const allDone = (issues, processedLinksNumber, totalLinksNumber) => {
        if(processedLinksNumber === totalLinksNumber){
          if (issues && issues.length > 0) {
            if (issues.length > 1) {
              chat(bot, channelID, `Those look like Jira issues:\n ${issues.join('\n')}`);
            } else {
              chat(bot, channelID, `That looks like a Jira issue:\n ${issues[0]}`);
            }
          }
        }
      };
      
      issueLinkCandidates.forEach((link)=>{
        Jira.checkIssueExists(link,
          (rawData) => {
            const data = JSON.parse(rawData);
            issueLinks.push(`${Jira.issueTypeIcons[data.fields.issuetype.name.toLowerCase()]} ${data.fields.summary} - ${link}`);
            allDone(issueLinks, issueLinks.length+badIssueLinks.length, issueLinkCandidates.length);
          },
          () => {
            badIssueLinks.push(link);
            allDone(issueLinks, issueLinks.length+badIssueLinks.length, issueLinkCandidates.length);
          })
      });
    }, "<number>", `I will attempt to link any Jira issues for the following projects: ${jiraConfig.projects.map(p=>p.code).join(', ')}`);

  unprotectedCommand(msgInfo, _.triggers.holiday,
    (info, command, match) => {
      if (info.message.indexOf(command) !== -1 || (match)) {
        const commandArgs = info.message.split(command);
        const param = (commandArgs.length > 1 ? commandArgs[1] : match[5]).trim().toLowerCase() || null;

        if (!param || param === "today") {
          Staffsquared.absencesToday(msgInfo, (absentees) => {
            const absenteeNames = absentees
                .sort((p1, p2) => {
                  if(p1['EventTypeId'] > p2['EventTypeId']){
                    return 1;
                  }
                  if(p1['EventTypeId'] < p2['EventTypeId']){
                    return -1;
                  }
                  return 0;
                })
                .map((p) => {
                  return ` * (${Staffsquared.EVENT_TYPES[p['EventTypeId']]}) **${p['FirstName']} ${p['LastName']}**`
                });
            if (absenteeNames.length > 0) {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared these people are out of office today:\n${absenteeNames.join('\n')}`);
            } else {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared, nobody is out of office today.`);
            }
          });
        } else {
          const dateRange = utils.date.textToDateRange(utils.date.midnightToday(), param);
          if(!dateRange){
            return;
          }

          Staffsquared.absencesFuture(msgInfo, (absentees) => {
            const absenteeNames = Staffsquared.getNamesInDateRange(absentees, dateRange);
            if (absenteeNames.length > 0) {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared these people are off ${param}:\n${absenteeNames.join('\n')}`);
            } else {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared, nobody is off ${param}.`);
            }
          });
        }
      }
    }, "[|today|tomorrow|this week|next week]", "See who's out");

  protectedCommand(msgInfo, _.triggers.release,
    (info, command, match) => {
      Gitlab.branchList(null, msgInfo, (branchesString) => {
        const branches = JSON.parse(branchesString);
        const branchNames = branches.filter((b) => {
            return new RegExp(gitlabConfig.releaseBranchPattern).test(b.name);
          })
          .sort((a, b) => {
            return a.commit.committed_date < b.commit.committed_date ? 1 : (a.commit.committed_date > b.commit.committed_date ? -1 : 0);
          });
        chat(msgInfo.bot, msgInfo.channelID, `<@${msgInfo.userID}>, the release branch is probably \`${branchNames[0].name}\``);
      });
    }, null, "I'll try to figure out what the release branch is");

  protectedCommand(msgInfo, _.triggers.branches,
    (info, command, match) => {
      let filter = "";
      if (info.message.indexOf(command) !== -1) {
        filter = (info.message.split(command)[1] || "").trim();
      }
      Gitlab.branchList(filter, msgInfo);
    }, "[|filter]", "I'll list all the branches in git. Optionally pass a filter to \"grep\" by");

  protectedCommand(msgInfo, _.triggers.build,
    (info, command, match) => {
      const b = info.message.indexOf(command) !== -1 ? info.message.split(command)[1].trim() : null;
      const branch = match[7] || b || jenkinsConfig.defaultBranch;
      chat(info.bot, info.channelID, `Sure, <@${info.userID}>. I've asked Jenkins to build from \`${branch}\`.`);
      Jenkins.requestBuild(branch, msgInfo);
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
          chat(info.bot, info.channelID, `I've cancelled queue item ${number}, <@${info.userID}>.`);
        });
      } else {
        Jenkins.cancelBuild(number, () => {
          chat(info.bot, info.channelID, `I've cancelled build number ${number}, <@${info.userID}>.`);
        });
      }
    }, "[|build|queue] <number>", "I will cancel a build or a queue item. If \`build\` or \`queue\` is not provided, I'll assume it's a build number");

  unprotectedCommand(msgInfo, _.triggers.cloudflareStatus,
    (info, command, match) => {
      CloudflareStatus.getOutages(info.bot, info.channelID);
    }, null, "Check if there's a cloudflare problem");

  unprotectedCommand(msgInfo, _.triggers.help, () => {
    chat(bot, channelID, `Here's some info, <@${userID}>:
  Commands:
${Object.values(helpCommands).join("\n")}

***(protected)** commands can only be issued from privileged channels and by privileged roles.*
  * *Channels: ${discordConfig.channelWhitelist.map((r)=>{return `#${r}`}).join(', ')}*
  * *Roles:  ${discordConfig.roleWhitelist.join(', ')}*

In addition, I respond to plain english requests that contain the words:
  * \`start\` and \`build\` for building (and optionally a \`branch\`).
  * \`cancel\` paired with \`build\` or \`queue\` and a build/queue \`number\`.
If anyone asks what the release branch is I'll try to find the latest one too!`);
  }, null, "This info");

  if(!wasPoke){
    if(!pokedBy[userID]){
      pokedBy[userID] = {
        times: 0
      }
    }
    pokedBy[userID].times = 0;
  }
});
