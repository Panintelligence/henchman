# ![Henchman Logo](images/henchman-logo-small.png) Henchman Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

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
