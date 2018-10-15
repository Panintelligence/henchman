'use strict';

const staffsquaredConfig = require('./config/staffsquared-config.json');
const Cryptr = require('cryptr');
const http = require('https');
const querystring = require('querystring');
const utils = require('./utils');


let TOKEN = null;
let expiresAt = 0;

const makeGenericStaffsquaredRequest = (method, path, body, callback, onRequest) => {
  const headers = {
    'Accept': 'application/json'
  }
  if(TOKEN){
    headers['Authorization'] = `Bearer ${TOKEN}`
    headers['Content-Type'] = 'application/json'
  }
  else if(method !== 'GET'){
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }

  return http.request({
    hostname: 'api.staffsquared.com',
    path: path,
    method: method,
    headers: headers
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
      }
      catch (e) {
        data = chunks.join("");
      }
      if (callback) {
        callback(data);
      }
    });
  }));
};

const makeStaffsquaredRequest = (method, path, body, callback, onRequest) => {
  if(!TOKEN || new Date().getTime() >= (expiresAt-10)){
    const credentials = {
      grant_type: 'password',
      username: new Cryptr('XfT&TTub6PtOop8MDMrDsZ$QC!&$E@95NXYxtL%F4*yTvC9ZJU#F^S03Ixpf9bK!').decrypt(staffsquaredConfig.encryptedUsername),
      password: new Cryptr('0NA4@&VwBeY0NCVHIVTAJZ2s^l5M1E1aPoylBNRFAn8^zc4J1hB&p$24L4pmZH*J').decrypt(staffsquaredConfig.encryptedPassword)
    }
    const urlEncodedParams = querystring.stringify(credentials);
    const request = makeGenericStaffsquaredRequest('POST', '/api/Token', urlEncodedParams, (dataString)=>{
      const data = JSON.parse(dataString);
      TOKEN = data['access_token'];
      expiresAt = new Date().getTime() + data['expires_in'];
      console.log("Data: ", data)
      makeGenericStaffsquaredRequest(method, path, body, callback, onRequest).end();
    });
    request.write(urlEncodedParams);
    request.end();
  }
  else{
    makeGenericStaffsquaredRequest(method, path, body, callback, onRequest).end();
  }
}

module.exports = {
  absencesToday: (msgInfo, callback) => {
    makeStaffsquaredRequest('GET', `/api/Absence/Today`, null, ((string) => {
      callback(JSON.parse(string));
    }));
  },
  absencesFuture: (msgInfo, callback) => {
    makeStaffsquaredRequest('GET', `/api/Absence/Future`, null, ((string) => {
      callback(JSON.parse(string));
    }));
  }
};