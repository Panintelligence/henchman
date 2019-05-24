# ![Henchman Logo](images/henchman-logo-small.png) Henchman Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

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
