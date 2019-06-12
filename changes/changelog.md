# ![Henchman Logo](images/henchman-logo-small.png) Henchman Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [1.3.0] - 2019-06-12
### Added
- `!ignore @user` to make Henchman ignore a user.
- Debt/Award system!
To interact with this system:
* Use `!give` or `!award` to promise to give something to another person. If you owe Neil two beers, type `!give beer @neil-user-code 2`.
* Use `!payoff` or `!revoke` to consider a promised item given to you. If Steve gave you one beer, type `!payoff beer @steve-user-code`.
* Use `!owed` to see what stuff you're owed.
* Use `!owe` to see what stuff you owe to other people.

## [1.2.0] - 2019-06-12
### Changed
- Now using [`discord.js`](https://discord.js.org/) instead of the outdated [`discord.io`](https://github.com/izy521/discord.io#readme)

### Fixed
- Henchman can now PM you again when the list of branches is very long.

## [1.1.0] - 2019-05-24
### Changed
- Jira issues will now have a summary displayed. Also will show an icon for each issues type (configurable in `jira-config.json`)
Example:
```json
{
    "issueTypeIcons":{
        "vulnerability": "🔒",
        "bug": "🐞",
        "improvement": "✅",
        "defect": "⭕",
        "task": "🔷",
        "devops": "🐙"
    }
}
```
- The command `!release` should now match branches based on a regex pattern provided in `gitlab-config.json`.
Example:
```json
{
    "releaseBranchPattern": "[0-9].[0-9].[0-9]])"
}
```

## [1.0.0] - 2019-02-04
### Added
- Ready to work!
