'use strict';

const gitlabConfig = require('../config/gitlab-config.json');
const http = require(gitlabConfig.protocol || 'https');
const chat = require('../utils/discord-chat');

const makeGitlabRequest = (method, path, body, callback, onRequest) => {
  return http.request({
    hostname: gitlabConfig.host,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'PRIVATE-TOKEN': gitlabConfig.token,
      'Content-Length': Buffer.byteLength(body || "")
    }
  }, onRequest || ((res) => {
    res.setEncoding('utf8');
    const chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    res.on('end', () => {
      let data = "";
      try {
        data = Buffer.concat(chunks).toString();
      } catch (e) {
        data = chunks.join("");
      }
      if (callback) {
        callback(data);
      }
    });
  }));
};


const createBranchesMessages = (branchNames, msgInfo) => {
  if (msgInfo) {
    if (branchNames.length > 10) {
      return [{
          channel: msgInfo.channelID,
          message: `There's lots of branches, <@${msgInfo.userID}>! I've sent you a PM.`
        },
        {
          channel: msgInfo.userID,
          message: `Here's what I found:\n${branchNames.map((b)=>{return `  * \`${b}\``}).join('\n')}`
        }
      ];
    }

    return {
      channel: msgInfo.channelID,
      message: `Here's what I found:\n${branchNames.map((b)=>{return `  * \`${b}\``}).join('\n')}`
    }
  }

  return [];
}


const gitlab = {
  branchList: (filter, msgInfo, callback) => {
    chat(msgInfo.bot, msgInfo.channelID, `Hold on while I try to find out, <@${msgInfo.userID}>...`);
    makeGitlabRequest('GET', `/api/v4/projects/${gitlabConfig.projectId}/repository/branches?per_page=999999999`, null, callback || ((branchesString) => {
      const branches = JSON.parse(branchesString);
      const branchNames = branches.filter((b) => {
        return filter ? b.name.indexOf(filter) !== -1 : true;
      }).map((b) => {
        return b.name;
      });
      createBranchesMessages(branchNames, msgInfo).forEach((m) => {
        chat(msgInfo.bot, m.channel, m.message);
      });
    })).end();
  }
}

module.exports = gitlab;
