'use strict';

const discordConfig = require('./config/discord-config.json');
const jenkinsConfig = require('./config/jenkins-config.json');

const Discord = require('discord.io');
const logger = require('winston');
const Jenkins = require('./jenkins');
const Gitlab = require('./gitlab');
const Staffsquared = require('./staffsquared');
const chat = require('./discord-chat')

const WHITELISTED_ROLES = {};
const WHITELISTED_CHANNELS = {};

const intersectArray = (a, b) => {
  return a.filter((e) => { b.includes(e) });
};

const stringStartsWithAny = (string, startingList) => {
  for (let i in startingList) {
    if (string.indexOf(startingList[i]) === 0) {
      return startingList[i];
    }
  }
  return null;
}

const helpCommands = {};

const command = (info, bangCommands, regex, f) => {
  const match = regex ? info.message.match(regex) : null;
  const bangCommand = stringStartsWithAny(info.message, bangCommands)
  if (bangCommand !== null || (match && match.length > 1)) {
    f(info, bangCommand, (match && match.length > 1) ? match : []);
  }
}

const unprotectedCommand = (info, bangCommands, regex, f, params, description) => {
  const commands = bangCommands.map((c) => { return `\`${c}\`` }).join(" or ");
  helpCommands[bangCommands.join('|')] = `  * ${commands} ${params ? params + '' : ''}- ${description}`;
  command(info, bangCommands, regex, f);
};

const protectedCommand = (info, bangCommands, regex, f, params, description) => {
  const commands = bangCommands.map((c) => { return `\`${c}\`` }).join(" or ");
  helpCommands[bangCommands.join('|')] = `  * ${commands} ${params ? params + '' : ''}- (protected) ${description}`;
  if (intersectArray(info.roleIds, WHITELISTED_ROLES[info.serverId]) && WHITELISTED_CHANNELS[info.serverId].includes(info.channelID)) {
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
    serverId: evt.d['guild_id'],
    roleIds: evt.d.member.roles,
    message: message,
    bot: bot,
    channelID: channelID,
    userID: userID
  };

  unprotectedCommand(msgInfo, ['!poke'], /.* *(Is the|) *bot on(line|)\?/, () => {
    chat(bot, channelID, `Yeah yeah, I'm here, <@${userID}>`);
  }, null, "Check if I'm around");

  unprotectedCommand(msgInfo, ['!away', '!holiday'], /.* *Who('s| is) out( of( the|) office| off|)\?/i, () => {
    Staffsquared.absences(msgInfo, (absentees) => {
      const absenteeNames = absentees.map((p) => { return p['FirstName'] + " " + p['LastName'] });
      chat(bot, channelID, `<@${msgInfo.userID}>: According to StaffSquared only these people are off today:\n${absenteeNames.join('\n')}`);
    });
  }, null, "See who's off");

  protectedCommand(msgInfo, ['!release'], /.* *(((what|which|where)(\'s| is|)|have) (the|) release (branch|))/i,
    (info, command, match) => {
      Gitlab.branchList(null, msgInfo, (branchesString) => {
        const branches = JSON.parse(branchesString);
        const branchNames = branches.filter((b) => { return b.name.indexOf("release") !== -1; })
          .sort((a, b) => { return a.commit.committed_date < b.commit.committed_date ? 1 : (a.commit.committed_date > b.commit.committed_date ? -1 : 0); });
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
    }, "[filter]", "I'll list all the branches in git. Optionally pass a filter to \"grep\" by");


  protectedCommand(msgInfo, ['!build'], /.* *(start) .* *(build) *((on|for|from|) *(`|)((?!please\b)\b\w+)(`|)|)/i,
    (info, command, match) => {
      const b = info.message.indexOf(command) !== -1 ? info.message.split(command)[1].trim() : null;
      const branch = match[6] || b || jenkinsConfig.defaultBranch;
      chat(info.bot, info.channelID, `Sure, <@${info.userID}>. I've asked Jenkins to build from \`${branch}\`.`);
      Jenkins.requestBuild(branch, msgInfo);
    }, "[branch]", `I'll ask jenkins to initiate a build (if \`branch\` is not provided then I'll use \`${jenkinsConfig.defaultBranch}\``);

  protectedCommand(msgInfo, ['!cancel'], /.* *(cancel) .* *(build|queue) *(`|)((?!please\b)\b\w+)(`|)/i,
    (info, command, match) => {
      let number = "";
      let type = "";
      if (info.message.indexOf(command) !== -1) {
        const params = info.message.split(command)[1].trim().split(/ +/);
        type = params.length > 1 ? params[0] : 'build';
        number = params.length > 1 ? params[1] : params[0];
      }
      else {
        type = match[2];
        number = match[4];
      }
      if (type.toLowerCase() === 'queue') {
        Jenkins.cancelQueue(number, () => {
          chat(info.bot, info.channelID, `I've cancelled queue item ${number}, <@${info.userID}>.`);
        });
      }
      else {
        Jenkins.cancelBuild(number, () => {
          chat(info.bot, info.channelID, `I've cancelled build number ${number}, <@${info.userID}>.`);
        });
      }
    }, "[build|queue] <number>", "I will cancel a build or a queue item. If \`build\` or \`queue\` is not provided, I'll assume it's a build number");


  unprotectedCommand(msgInfo, ['!info', '!help'], null, () => {
    chat(bot, channelID, `Here's some info, <@${userID}>:
  Commands:
${Object.values(helpCommands).join("\n")}
  
  In addition, I respond to plain english requests that contain the words:
    * \`start\` and \`build\` for building (and optionally a \`branch\`).
    * \`cancel\` paired with \`build\` or \`queue\` and a build/queue \`number\`.
  If anyone asks what the release branch is I'll try to find the latest one too!`);
  }, null, "This info");
});