const config = require('../config/jira-config.json');
const http = require('https');


const jiraGet = (url, success, fail) => {
  http.get(url, (res) => {
    const chunks = [];
    res.on('data', (chunk) => {
      chunks.push(chunk);
    });
    if(res.statusCode >= 200 && res.statusCode < 300){
      res.on('end', () => {
        let data = "";
        try {
          data = Buffer.concat(chunks).toString();
        } catch (e) {
          data = chunks.join("");
        }

        if (success) {
          success(data);
        }
      });  
    }
    else {
      fail({});
    }
  }).on('error', (e) => {
    if(fail){
      fail(e);
    }
  });
};

const _matchesToIssueLinks = (message, matches, isPermitted, jiraConfig) => {
  return matches.map(m => m.trim())
    .filter((m) => {
      return message.split(/\s/g).filter((word) => {
          return word.includes(m) && (word.includes('http') || word.includes('@') || (word.includes('<') && word.includes('>')))
        }).length === 0 &&
        !message.includes(`${jiraConfig.protocol}://${jiraConfig.host}/browse/${m}`)
    })
    .filter((m) => {
      return jiraConfig.projects.some((p) => m.includes(p.code)) || isPermitted
    })
    .filter((m) => {
      return jiraConfig.projects.some((p) => {
        return Number(m.includes(p.code) ? m.split(`${p.code}-`)[1] : m) >= p.issueStart
      });
    })
    .reduce((acc, issue)=>{
      const defaultProject = jiraConfig.projects.find(p => p.default);
      if(!acc.includes(issue) && !acc.includes(`${defaultProject.code}-${issue}`) && !acc.map(a=>`${defaultProject.code}-${a}`).includes(issue)){
        acc.push(issue);
      }
      return acc;
    }, [])
    .map((issueNumber) => {
      const defaultProject = jiraConfig.projects.find(p => p.default);
      if (isPermitted && !jiraConfig.projects.some(p => issueNumber.includes(p.code))) {
        if (Number(issueNumber) >= defaultProject.issueStart) {
          return `${jiraConfig.protocol}://${jiraConfig.host}/browse/${defaultProject.code}-${issueNumber}`
        }
        return null;
      }
      return `${jiraConfig.protocol}://${jiraConfig.host}/browse/${issueNumber}`
    })
    .filter((m) => {
      return !!m
    });
};

const matchesToIssueLinks = (message, matches, isPermitted) => {
  return _matchesToIssueLinks(message, matches, isPermitted, config);
}

const checkIssueExists = (link, success, fail) => {
  jiraGet(link, success, (e) => {
    console.log(e);
    fail(e);
  })
}

module.exports = {
  matchesToIssueLinks: matchesToIssueLinks,
  checkIssueExists: checkIssueExists,
  _: {
    matchesToIssueLinks: _matchesToIssueLinks
  }
};
