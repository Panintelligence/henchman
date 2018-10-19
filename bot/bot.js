'use strict';

const discordConfig = require('./config/discord-config.json');
const jenkinsConfig = require('./config/jenkins-config.json');
const jiraConfig = require('./config/jira-config.json');

const Discord = require('discord.io');
const logger = require('winston');
const Jenkins = require('./jenkins');
const Gitlab = require('./gitlab');
const Staffsquared = require('./staffsquared');
const chat = require('./discord-chat')
const utils = require('./utils')

const WHITELISTED_ROLES = {};
const WHITELISTED_CHANNELS = {};

const helpCommands = {};

const isDev = (info) => {
  return info.roleIds && info.serverId && info.channelID && utils.intersectArray(info.roleIds, WHITELISTED_ROLES[info.serverId]) && WHITELISTED_CHANNELS[info.serverId].includes(info.channelID)
}

const command = (info, bangCommands, regex, f) => {
  const match = regex ? info.message.match(regex) : null;
  const bangCommand = utils.string.startsWithAny(info.message, bangCommands)
  if (bangCommand !== null || (match && match.length > 0)) {
    f(info, bangCommand, (match && match.length > 0) ? match : []);
  }
}

const unprotectedCommand = (info, bangCommands, regex, f, params, description) => {
  const commands = bangCommands.map((c) => {
    return `**\`${c}\`**`
  }).join(" or ");
  helpCommands[bangCommands.join('|')] = `  * ${commands} ${params ? params + '' : ''} - ${description}`;
  command(info, bangCommands, regex, f);
};

const protectedCommand = (info, bangCommands, regex, f, params, description) => {
  const commands = bangCommands.map((c) => {
    return `**\`${c}\`**`
  }).join(" or ");
  helpCommands[bangCommands.join('|')] = `  * ${commands} ${params ? params + '' : ''} - **(protected)** ${description}`;
  if (isDev(info)) {
    command(info, bangCommands, regex, f);
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

  unprotectedCommand(msgInfo, ['!poke'], /.* *(Is the|) *bot on(line|)\?/, () => {
    chat(bot, channelID, `Yeah yeah, I'm here, <@${userID}>`);
  }, null, "Check if I'm around");

  unprotectedCommand(msgInfo, [`!${jiraConfig.projectCode}`], new RegExp(`(${jiraConfig.projectCode}-|)[0-9][0-9][0-9][0-9]+`, 'gim'),
    (info, command, match) => {
      const issueLinks = match.filter((m) => {
          return info.message.split(/\s/g).filter((word) => {
              return word.includes(m) && (word.includes('http') || word.includes('@'))
            }).length === 0 &&
            !info.message.includes(`${jiraConfig.protocol}://${jiraConfig.host}/browse/${m}`)
        })
        .map((issueNumber) => {
          if (isDev(info) && !issueNumber.includes(jiraConfig.projectCode)) {
            return `${jiraConfig.protocol}://${jiraConfig.host}/browse/${jiraConfig.projectCode}-${issueNumber}`
          }
          return `${jiraConfig.protocol}://${jiraConfig.host}/browse/${issueNumber}`
        });
      if (issueLinks && issueLinks.length > 0) {
        if (issueLinks.length > 1) {
          chat(bot, channelID, `Those look like Jira issues:\n${issueLinks.join('\n')}`);
        }
        else {
          chat(bot, channelID, `That looks like a Jira issue: ${issueLinks.join('\n')}`);
        }
      }
    }, "<number>", `I will attempt to link any Jira issues for project code ${jiraConfig.projectCode}`);

  unprotectedCommand(msgInfo, ['!away', '!holiday'], /.* *Who('s| is) (out( of( the|) office| off|)|on holiday) *(|today|tomorrow|this week|next week)\?/i,
    (info, command, match) => {
      if (info.message.indexOf(command) !== -1 || (match)) {
        const commandArgs = info.message.split(command);
        const param = (commandArgs.length > 1 ? commandArgs[1] : match[5]).trim().toLowerCase() || null;

        if (!param || param === "today") {
          Staffsquared.absencesToday(msgInfo, (absentees) => {
            const absenteeNames = absentees.map((p) => {
              return ` * **${p['FirstName']} ${p['LastName']}**`
            });
            if (absenteeNames.length > 0) {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared these people are off today:\n${absenteeNames.join('\n')}`);
            } else {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared, nobody is off today.`);
            }
          });
        } else {
          let dateRange
          const midnightTodayDate = new Date();
          midnightTodayDate.setHours(0);
          midnightTodayDate.setMinutes(0);
          midnightTodayDate.setSeconds(0);
          midnightTodayDate.setMilliseconds(0);
          console.log(`Today at Midnight: ${midnightTodayDate}`)
          if (param === "tomorrow") {
            dateRange = {
              start: utils.date.addDays(midnightTodayDate, 1),
              end: utils.date.addDays(midnightTodayDate, 2)
            }
          } else {
            if (param === "this week") {
              dateRange = utils.date.getWeekRange(midnightTodayDate);
            } else if (param === "next week") {
              dateRange = utils.date.getWeekRange(utils.date.addDays(midnightTodayDate, 8));
            } else {
              return;
            }
          }
          Staffsquared.absencesFuture(msgInfo, (absentees) => {
            const absenteeNames = absentees
              .filter((p) => {
                return dateRange.start <= new Date(p['EventEnd']) && dateRange.end >= new Date(p['EventStart']);
              })
              .reduce((acc, p) => {
                const existingPerson = acc.find((a) => {
                  return a['EmployeeId'] === p['EmployeeId']
                });
                if (!existingPerson) {
                  acc.push(p);
                } else {
                  if (utils.date.isSameDay(existingPerson['EventStart'], p['EventEnd']) || utils.date.isSameDay(existingPerson['EventEnd'], p['EventStart'])) {
                    existingPerson['EventStart'] = utils.date.min(existingPerson['EventStart'], p['EventStart']);
                    existingPerson['EventEnd'] = utils.date.max(existingPerson['EventEnd'], p['EventEnd']);
                  } else {
                    acc.push(p);
                  }
                }
                return acc;
              }, [])
              .map((p) => {
                return ` * **${p['FirstName']} ${p['LastName']}** (${utils.date.formatHumanISO(p['EventStart'])} to ${utils.date.formatHumanISO(p['EventEnd'])})`
              });
            if (absenteeNames.length > 0) {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared these people are off ${param}:\n${absenteeNames.join('\n')}`);
            } else {
              chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared, nobody is off ${param}.`);
            }
          });
        }
      }

      // const absenteeNames = absentees.map((p) => {
      //   return {
      //     name: utils.string.capitalize(p['EmployeeEmail'].split('@')[0].split('.').join(' ')),
      //     type: p['AbsenceType']
      //   }
      // });


    }, "[|today|tomorrow|this week|next week]", "See who's off");

  protectedCommand(msgInfo, ['!release'], /.* *(((what|which|where)(\'s| is|)|have) (the|) release (branch|))/i,
    (info, command, match) => {
      Gitlab.branchList(null, msgInfo, (branchesString) => {
        const branches = JSON.parse(branchesString);
        const branchNames = branches.filter((b) => {
            return b.name.indexOf("release") !== -1;
          })
          .sort((a, b) => {
            return a.commit.committed_date < b.commit.committed_date ? 1 : (a.commit.committed_date > b.commit.committed_date ? -1 : 0);
          });
        chat(msgInfo.bot, msgInfo.channelID, `<@${msgInfo.userID}>, the release branch is probably \`${branchNames[0].name}\``);
      });
    }, null, "I'll try to figure out what the release branch is");

  protectedCommand(msgInfo, ['!branches'], null,
    (info, command, match) => {
      let filter = "";
      if (info.message.indexOf(command) !== -1) {
        filter = (info.message.split(command)[1] || "").trim();
      }
      Gitlab.branchList(filter, msgInfo);
    }, "[|filter]", "I'll list all the branches in git. Optionally pass a filter to \"grep\" by");


  protectedCommand(msgInfo, ['!build'], /.* *(start) .* *(build) *((on|for|from|) *(`|)((?!please\b)\b\w+)(`|)|)/i,
    (info, command, match) => {
      const b = info.message.indexOf(command) !== -1 ? info.message.split(command)[1].trim() : null;
      const branch = match[6] || b || jenkinsConfig.defaultBranch;
      chat(info.bot, info.channelID, `Sure, <@${info.userID}>. I've asked Jenkins to build from \`${branch}\`.`);
      Jenkins.requestBuild(branch, msgInfo);
    }, "[|branch]", `I'll ask jenkins to initiate a build (if \`branch\` is not provided then I'll use \`${jenkinsConfig.defaultBranch}\``);

  protectedCommand(msgInfo, ['!cancel'], /.* *(cancel) .* *(build|queue) *(`|)((?!please\b)\b\w+)(`|)/i,
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


  unprotectedCommand(msgInfo, ['!info', '!help'], null, () => {
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
});