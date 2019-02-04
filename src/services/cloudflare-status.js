'use strict';

const http = require('https');
const chat = require('../utils/discord-chat')

const statusHost = "www.cloudflarestatus.com";
const statusUrl = "/history.json";

const makeCloudflareStatusRequest = (callback, onRequest) => {
  return http.request({
    hostname: statusHost,
    path: statusUrl,
    method: "GET",
    headers: {}
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

module.exports = {
  getOutages: function (bot, channel) {
    makeCloudflareStatusRequest((data) => {
      const statuses = JSON.parse(data).components
        .filter((component) => {
          return component.status !== "operational" && (component.name === 'Cloudflare Sites and Services' || component.name === 'Argo Tunnel')
        })
        .map((component) => {
          return `  - **${component.name}**: \`${component.status}\``
        });
      const message = (statuses.length !== 0) ? `Looks like we've got problems :disaprovingsteve:\n${statuses.join('\n')}` : "Everything is fine"
      console.log(`Sending ${message}`)
      chat(bot, channel, message)
    }).end()
  }
}