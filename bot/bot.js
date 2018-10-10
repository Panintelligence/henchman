'use strict';

const discordConfig = require('./config/discord-config.json');
const jenkinsConfig = require('./config/jenkins-config.json');

const Discord = require('discord.io');
const logger = require('winston');
const Jenkins = require('./jenkins');
const Gitlab = require('./gitlab');
const chat = require('./discord-chat')

const WHITELISTED_ROLES = {};
const WHITELISTED_CHANNELS = {};

const intersectArray = (a, b) => {
  return a.filter((e) => { b.includes(e) });
};

const protectedCommand = (info, bangCommand, regex, f) => {
  if (intersectArray(info.roleIds, WHITELISTED_ROLES[info.serverId]) && WHITELISTED_CHANNELS[info.serverId].includes(info.channelID)) {
    const match = regex ? info.message.match(regex) : null;
    if (info.message.indexOf(bangCommand) === 0 || (match && match.length > 1)) {
      f(info, bangCommand, (match && match.length > 1) ? match : []);
    }
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

  if (message.indexOf('!poke') === 0) {
    chat(bot, channelID, `Yeah yeah, I'm here, <@${userID}>`);
  }
  else if (message.indexOf('!info') === 0 || message.indexOf('!help') === 0) {
    chat(bot, channelID, `Here's some info, <@${userID}>:
Commands:
  * \`!poke\` - check if I'm around.
  * \`!info\` or \`!help\` - this info.
  * \`!branches [filter]\` - lists all the branches in git. Optionally pass a filter to "grep" by.
  * \`!release\` - tries to find the release branch.
  * \`!build [branch]\` - start a build (if \`branch\` is not provided then I'll use \`${jenkinsConfig.defaultBranch}\`).
  * \`!cancel [build|queue] <number>\` - cancel a build or a queue item. If \`build\` or \`queue\` is not provided, I'll assume it's a build number.
In addition, I respond to plain english requests that contain the words:
  * \`start\` and \`build\` for building (and optionally a \`branch\`).
  * \`cancel\` paired with \`build\` or \`queue\` and a build/queue \`number\`.
If anyone asks what the release branch is I'll try to find the latest one too!`);
  }
  else {
    protectedCommand(msgInfo, '!release', /.* *(((what|which|where)(\'s| is|)|have) (the|) release (branch|))/i,
      (info, command, match) => {
        Gitlab.branchList(null, msgInfo, (branchesString) => {
          const branches = JSON.parse(branchesString);
          const branchNames = branches.filter((b) => { return b.name.indexOf("release") !== -1; })
          .sort((a,b)=>{ return a.commit.committed_date < b.commit.committed_date ? 1 : (a.commit.committed_date > b.commit.committed_date ? -1 : 0); });
          chat(msgInfo.bot, msgInfo.channelID, `<@${msgInfo.userID}>, the release branch is probably \`${branchNames[0].name}\``);
        });
      });

    protectedCommand(msgInfo, '!branches', null,
      (info, command, match) => {
        let filter = "";
        if (info.message.indexOf(command) !== -1) {
          filter = (info.message.split(command)[1] || "").trim();
        }
        Gitlab.branchList(filter, msgInfo);
      });


    protectedCommand(msgInfo, '!build', /.* *(start) .* *(build) *((on|for|from|) *(`|)(\w*)(`|)|)/i,
      (info, command, match) => {
        const b = info.message.indexOf(command) !== -1 ? info.message.split(command)[1].trim() : null;
        const branch = match[6] || b || jenkinsConfig.defaultBranch;
        chat(info.bot, info.channelID, `Sure, <@${info.userID}>. I've asked Jenkins to build from \`${branch}\`.`);
        Jenkins.requestBuild(branch, msgInfo);
      });

    protectedCommand(msgInfo, '!cancel', /.* *(cancel) .* *(build|queue) *(`|)(\w*)(`|)/i,
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
      });
  }
});