# ![Henchman Logo](images/henchman-logo-small.png) Henchman Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [1.3.3] - 2019-07-22
### Added
- `!food` now has a `who` option to see who ordered what.

- `!remind` lets henchman remind you of something on a particular date, or when someone speaks.

- `!purge` will remove one or more messages from a channel (optionally belonging to one particular user)
For example, to delete the last 3 messages that Kieran sent, do:
```
!purge @Kieran Jennings 3
```

- Added admin-protected commands.

The Admin role can be configured in `config/discord-config.json` file:
```json
{
  "token": "yourtokenhere",
  "adminRoles": ["Admin"],
  "roleWhitelist": ["Developers", "DevOps", "Testers"],
  "channelWhitelist": ["dev", "test"]
}
```

### Changed
- `!mute`, `!unmute`, `!purge`, `!ignore` and `!unignore` are now admin-level.

- `!food` orders are no longer wiped when Henchman restarts.

## [1.3.2] - 2019-06-19
### Changed
- `!give` mechanics now support quantities to be given as `x5` or `5x` instead of just `5`.

### Fixed
- `!give` mechanics now ignore extraneous whitespace

## [1.3.1] - 2019-06-18
### Added
- `!food` to build and check a food order.
To use this functionality do:
* `!food <food>` to order `<food>`. Example: `!food Mushroom Toastie`
* `!food` to check the order
* `!food done` to clear the order
* `!food cancel` to cancel anything that you've ordered


## [1.3.0] - 2019-06-12
### Added
- `!ignore @user` to make Henchman ignore a user.

- `!listen @user` to make Henchman unignore a user.

- `!mute` make Henchman shut up.

- `!unmute` let Henchman talk again.

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
