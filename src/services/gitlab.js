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
  if (msgInfo && msgInfo.channel && msgInfo.user && branchNames) {
    if (branchNames.length > 10) {
      const messagesToSend = [{
        channel: msgInfo.channel,
        message: `There's lots of branches, <@${msgInfo.user.id}>! I've sent you a PM.`
      },
      {
        channel: msgInfo.user,
        message: `Here's what I found:`
      }];

      const branchMessages = [""];

      branchNames.forEach((b) => {
        let i = branchMessages.length - 1;
        const msgToAdd = `  * \`${b}\`\n`;

        if (branchMessages[i].length + msgToAdd.length >= 2000) {
          branchMessages[i] = branchMessages[i].replace(/\n$/, "");
          branchMessages.push([""]);
          i++;
        }

        branchMessages[i] += `* \`${b}\`\n`
      });
      branchMessages[branchMessages.length - 1] = branchMessages[branchMessages.length - 1].replace(/\n$/, "");

      branchMessages.forEach((msg) => {
        messagesToSend.push({
          channel: msgInfo.user,
          message: msg
        });
      })

      return messagesToSend;
    }
    if (branchNames.length === 0) {
      return [{
        channel: msgInfo.channel,
        message: `I could not find any branches, <@${msgInfo.userID}>.`
      }]
    }

    return [{
      channel: msgInfo.channel,
      message: `Here's what I found, <@${msgInfo.userID}>:\n${branchNames.map((b) => { return `  * \`${b}\`` }).join('\n')}`
    }]
  }

  return [];
}

const createListOfBranches = (branches, filter) => {
  if (!branches) {
    return [];
  }

  return branches.filter((b) => {
    return filter ? b.name.indexOf(filter) !== -1 : true;
  }).map((b) => {
    return b.name;
  });
}


const gitlab = {
  branchList: (filter, msgInfo, callback) => {
    chat(msgInfo.bot, msgInfo.channel, `Hold on while I try to find out, <@${msgInfo.user.id}>...`);
    makeGitlabRequest('GET', `/api/v4/projects/${gitlabConfig.projectId}/repository/branches?per_page=999999999`, null, callback || ((branchesString) => {
      const branchNames = createListOfBranches(JSON.parse(branchesString), filter);
      createBranchesMessages(branchNames, msgInfo).forEach((m) => {
        chat(msgInfo.bot, m.channel, m.message);
      });
    })).end();
  },
  "_": {
    createBranchesMessages: createBranchesMessages,
    createListOfBranches: createListOfBranches,
  }
}

module.exports = gitlab;
