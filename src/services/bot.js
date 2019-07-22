const utils = require('../utils/utils');
const jiraConfig = require('../config/jira-config.json');

const isAdmin = (roleIds, adminRoles) => {
  if (!roleIds) {
    return false;
  }
  return utils.array.anyIntersection(roleIds, adminRoles);
};

const isPermitted = (channelId, roleIds, whitelistedChannels, whitelistedRoles) => {
  if (!roleIds || !channelId) {
    return false;
  }
  return utils.array.anyIntersection(roleIds, whitelistedRoles) &&
    whitelistedChannels.includes(channelId);
};

const command = (info, bangCommands, regex, f) => {
  const match = regex ? info.message.match(regex) : null;
  const bangCommand = utils.string.getMatchingStartingWord(info.message, bangCommands || []);
  if (bangCommand !== null || (match && match.length > 0)) {
    f(info, bangCommand, (match && match.length > 0) ? match : []);
  }
};

const userInServer = (server, userID) => {
  return server.members.array().map(m => m.id).includes(userID);
};

const userIDToUser = (userID, server) => {
  return server.members.array().find(m => m.id === userID) || {id: userID, displayName: userID};
};

const triggers = {
  purge: {
    commands: ['!purge'],
    regex: null
  },
  poke: {
    commands: ['!poke'],
    regex: /.* *(is |)(the |) *bot (is |)(on(line|)|around)\?/i
  },
  award: {
    commands: ['!award', '!give'],
    regex: null
  },
  payoff: {
    commands: ['!payoff', '!deaward'],
    regex: null
  },
  owed: {
    commands: ['!owed'],
    regex: null
  },
  owe: {
    commands: ['!owe'],
    regex: null
  },
  ignore: {
    commands: ['!ignore'],
    regex: null
  },
  unignore: {
    commands: ['!listen', '!unignore'],
    regex: null
  },
  mute: {
    commands: ['!mute'],
    regex: null
  },
  unmute: {
    commands: ['!unmute'],
    regex: null
  },
  food: {
    commands: ['!food', '!order'],
    regex: null
  },
  reminder: {
    commands: ['!remind'],
    regex: null
  },
  jiraProjects: {
    commands: jiraConfig.projects.map(p => `!${p.code}`),
    regex: new RegExp(`(^|\\s+)((${jiraConfig.projects.map(p => `${p.code}`).join('|')})-|)[0-9]+(\\s+|\\W|$)`, 'gim'),
    regexForTest: new RegExp(`(^|\\s+)((PROJ1|PROJ2)-|)[0-9]+`, 'gim')
  },
  holiday: {
    commands: ['!away', '!holiday'],
    regex: /.* *Who('s| is) (out( of( the|) office|)|on holiday|off|away) *(|today|tomorrow|this week|next week)\?/i
  },
  release: {
    commands: ['!release'],
    regex: /.* *(((what|which|where)(\'s| is|)|can I have|which (one|branch)(\'s| is)) (the|) release( branch|))/i
  },
  branches: {
    commands: ['!branches'],
    regex: null
  },
  build: {
    commands: ['!build'],
    regex: /.* *(start|can I have a|make) .* *(build)(\s|\W|$)+((on|for|from|) *(`|)((?!please\b)\b\w+)(`|)|)/i
  },
  cancelBuild: {
    commands: ['!cancel'],
    regex: /.* *(cancel) .* *(build|queue) *(`|)((?!please\b)\b\w+)(`|)/i
  },
  cloudflareStatus: {
    commands: ['!argo', '!cloudflare'],
    regex: null
  },
  help: {
    commands: ['!info', '!help'],
    regex: null
  },
}

module.exports = {
  isPermitted: isPermitted,
  isAdmin: isAdmin,
  command: command,
  userInServer: userInServer,
  userIDToUser: userIDToUser,
  triggers: triggers
}
