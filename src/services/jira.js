const config = require('../config/jira-config.json');
const http = require('https');


const jiraGet = (url, success, fail) => {
  const options = {
    method: "GET",
    headers: {
      "Authorization": `Basic ${config.token}`,
      "Content-Type": "application/json"
    }
  }
  http.request(url, options, (res) => {
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
  })
  .end();
};

const _matchesToIssueLinks = (message, matches, isPermitted, config) => {
  return matches.map(m => m.trim())
    .filter((m) => {
      return message.split(/\s/g).filter((word) => {
          return word.includes(m) && (word.includes('http') || word.includes('@') || (word.includes('<') && word.includes('>')))
        }).length === 0 &&
        !message.includes(`${config.protocol}://${config.host}/browse/${m}`)
    })
    .filter((m) => {
      return config.projects.some((p) => m.includes(p.code)) || isPermitted
    })
    .filter((m) => {
      return config.projects.some((p) => {
        return Number(m.includes(p.code) ? m.split(`${p.code}-`)[1] : m) >= p.issueStart
      });
    })
    .reduce((acc, issue)=>{
      const defaultProject = config.projects.find(p => p.default);
      if(!acc.includes(issue) && !acc.includes(`${defaultProject.code}-${issue}`) && !acc.map(a=>`${defaultProject.code}-${a}`).includes(issue)){
        acc.push(issue);
      }
      return acc;
    }, [])
    .map((issueNumber) => {
      const defaultProject = config.projects.find(p => p.default);
      if (isPermitted && !config.projects.some(p => issueNumber.includes(p.code))) {
        if (Number(issueNumber) >= defaultProject.issueStart) {
          return `${config.protocol}://${config.host}/browse/${defaultProject.code}-${issueNumber}`
        }
        return null;
      }
      return `${config.protocol}://${config.host}/browse/${issueNumber}`
    })
    .filter((m) => {
      return !!m
    });
};

const matchesToIssueLinks = (message, matches, isPermitted) => {
  return _matchesToIssueLinks(message, matches, isPermitted, config);
}

const checkIssueExists = (link, success, fail) => {
  const issueNr = link.split('/browse/')[1];
  jiraGet(`${config.protocol}://${config.host}/rest/api/2/issue/${issueNr}`, success, (e) => {
    console.log(e);
    fail(e);
  })
}

module.exports = {
  matchesToIssueLinks: matchesToIssueLinks,
  checkIssueExists: checkIssueExists,
  issueTypeIcons: config.issueTypeIcons,
  _: {
    matchesToIssueLinks: _matchesToIssueLinks
  }
};
