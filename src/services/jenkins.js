'use strict';

const jenkinsConfig = require('../config/jenkins-config.json');
const http = require(jenkinsConfig.protocol || 'https');
const chat = require('../utils/discord-chat')

const DEFAULT_PROJECT = `job/${jenkinsConfig.project}`


const makeJenkinsRequest = (method, path, body, callback, onRequest) => {
  return http.request({
    hostname: jenkinsConfig.host,
    path: path,
    method: method,
    auth: `${jenkinsConfig.user}:${jenkinsConfig.token}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
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

const jenkins = {
  "_": {
    toJenkinsBody: (buildParams) => {
      return "json=" + escape(
        `{"parameter": ${JSON.stringify(buildParams, null, ' ')
          .replace(/\n/g, '')
          .replace(/  /g, ' ')
          .replace(/\[ \{/g, '[{')
          .replace(/\} \]/g, '}]')}}`
      );
    },
    getQueuedItems: (queue, project) => {
      return queue.filter((item) => {
        return project ? item.task.name === project : true;
      }).map((item) => {
        return item.id
      });
    },
    getItemsAheadText: (queuedItems, queueItem) => {
      return `${queuedItems.indexOf(queueItem)} ${queuedItems.indexOf(queueItem) === 1 ? 'item' : 'items'}`
    }
  },
  cancelBuild: (number, callback) => {
    makeJenkinsRequest('POST', `/${DEFAULT_PROJECT}/${number}/stop`, null, callback).end();
  },
  cancelQueue: (number, callback) => {
    makeJenkinsRequest('POST', `/queue/cancelItem?id=${number}`, null, callback).end();
  },
  fetchProjectInfo: (callback) => {
    makeJenkinsRequest('GET', `/${DEFAULT_PROJECT}/api/json`, null, callback).end();
  },
  fetchQueueItems: (callback) => {
    makeJenkinsRequest('GET', `/queue/api/json`, null, callback).end();
  },
  fetchBuildInfo: (buildNumber, callback) => {
    makeJenkinsRequest('GET', `/${DEFAULT_PROJECT}/${buildNumber}/api/json`, null, callback).end();
  },
  requestBuild: (branch, msgInfo) => {
    const buildParams = jenkinsConfig.defaultBuildParams.map((param) => {
      const p = {};
      p.name = param.name.replace(/\[\[branch\]\]/g, branch);
      p.value = typeof param.value === "string" ? param.value.replace(/\[\[branch\]\]/g, branch) : param.value;
      return p;
    });
    const body = jenkins._.toJenkinsBody(buildParams);

    const request = makeJenkinsRequest('POST', `/${DEFAULT_PROJECT}/build`, body, null, (r) => {
      jenkins.fetchQueueItems((queueResString) => {
        const queuedItems = jenkins._.getQueuedItems(JSON.parse(queueResString).items, jenkinsConfig.project);

        if (queuedItems.length !== 0) {
          const queueItem = Math.max.apply(null, queuedItems);
          const itemsAhead = jenkins._.getItemsAheadText(queuedItems, queueItem);
          chat(msgInfo.bot, msgInfo.channelID, `Your build has been queued with the item number ${queueItem}, <@${msgInfo.userID}>. There's one item currentl building and ${itemsAhead} queued in front of it.`);
        } else {
          jenkins.fetchProjectInfo((projectInfoString) => {
            const projectInfo = JSON.parse(projectInfoString);
            const lastBuild = projectInfo.lastBuild;
            jenkins.fetchBuildInfo(lastBuild.number, (buildInfoString) => {
              const buildInfo = JSON.parse(buildInfoString);
              if (buildInfo.building) {
                chat(msgInfo.bot, msgInfo.channelID, `Your build (${lastBuild.number}) is now running, <@${userID}>: ${lastBuild.url}`);
              } else {
                chat(msgInfo.bot, msgInfo.channelID, `I'm not sure what happened to your build, <@${userID}>. It might have failed right away. The last build was ${buildInfo.url}`);
              }
            });
          });
        }
      });
    });
    request.write(body);
    request.end();
  }
}

module.exports = jenkins;
