const assert = require('assert');
const jira = require('../src/services/jira');

const _conf = {
  "protocol": "https",
  "host": "your.jira.url",
  "projects": [
    { "code":"PROJ1", "issueStart": 5000 },
    { "code":"PROJ2", "issueStart": 5, "default": true }
  ]
};

describe('Jira Service test', () => {
  describe('matchesToIssueLinks', () => {
      it('should return a list of unique issues links that are not already links in their messages', ()=>{

        const scenarios = {
          "1": {matches: ['1']},
          "123": {matches: ['123']},
          "123 and PROJ2-123": {matches: ['123', 'PROJ2-123']},
          "9980": {matches: ['9980']},
          "Can anyone check 4456?": {matches: ['4456']},
          "Can anyone have a look at 6542\n4564\nPROJ1-5545": {matches: [' 6542', '\n4564', '\nPROJ1-5545']},
          "Hello": {matches:[]},
          "I'm mentioning 8789 and 8789 twice but 5122 only once": {matches: [' 8789', ' 8789', ' 5122']},
          "Just fixed 8789, 5412 and 8655": {matches: ['8789', '5412', '8655']},
          "P-9999": {matches: []},
          "PROJ1": {matches: []},
          "PROJ1-321": {matches: ['PROJ1-321']},
          "PROJ2": {matches: []},
          "PROJ2-456": {matches: ['PROJ2-456']},
          "PROJ2-654: That does a bad thing": {matches: ['PROJ2-654']},
          "PROJECT1": {matches: []},
          "PROJECT2": {matches: []},
          "Raised PROJ1-4456": {matches: ['PROJ1-4456']},
          "The issue is 8975": {matches: ['8975']},
          "You can't have fixed 8789 5412 or 8655!": {matches: ['8789', '5412', '8655']},
        };

        const permittedResults = [];
        const unpermittedResults = [];
        Object.keys(scenarios).sort().forEach((msg) => {
          const trueCase = jira._.matchesToIssueLinks(msg, scenarios[msg].matches, true, _conf);
          const falseCase = jira._.matchesToIssueLinks(msg, scenarios[msg].matches, false, _conf);
          if(trueCase.length > 0){
            permittedResults.push(trueCase);
          }
          if(falseCase.length > 0){
            unpermittedResults.push(falseCase);
          }
        });

        assert.deepEqual(permittedResults, [
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-123`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-123`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-9980`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-4456`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-6542`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-4564`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[0].code}-5545`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-8789`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-5122`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-8789`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-5412`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-8655`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-456`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-654`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-8975`],
          [`${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-8789`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-5412`, `${_conf.protocol}://${_conf.host}/browse/${_conf.projects[1].code}-8655`],
        ]);
    });
  });
});
