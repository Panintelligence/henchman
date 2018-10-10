# Jenkins Builder bot for Discord
A bot that lets you communicate with Jenkins on Discord

# Usage
Commands:
  * `!poke` - check if I'm around.
  * `!info` or `!help` - this info.
  * `!branches [filter]` - lists all the branches in git. Optionally pass a filter to "grep" by.
  * `!release` - tries to find the release branch.
  * `!build [branch]` - start a build (if branch is not provided then I'll use master).
  * `!cancel [build|queue] <number>` - cancel a build or a queue item. If build or queue is not provided, I'll assume it's a build number.
In addition, I respond to plain english requests that contain the words:
  * `start` and `build` for building (and optionally a `branch`).
  * `cancel` paired with `build` or `queue` and a build/queue `number`.
If anyone asks what the release branch is I'll try to find the latest one too!

# Config
## discord-config.json
Clone the `discord-config.json.template` into `discord-config.json` and fill the following settings:
```json
{
  "token": "your-bot-token",
  "roleWhitelist": ["Discord Role Name That Can Trigger Actions"],
  "channelWhitelist": ["Discord Channels That Can Trigger Actions"]
}
```

## jenkins-config.json
Clone the `jenkins-config.json.template` into `jenkins-config.json` and fill the following settings:
```json
{
  "protocol": "https",
  "host": "your.host.name",
  "project": "your-project",
  "user": "your-jenkins-user",
  "token": "your-jenkins-token",
  "defaultBranch": "master",
  "defaultBuildParams": [
      { "name": "STRING_PARAM", "value": "string value" },
      { "name": "STRING_PARAM_WITH_VARIABLE", "value": "[[variable]]" },
      { "name": "BOOLEAN_PARAM", "value": true }
    ]
}
```
The `defaultBuildParams` accept the `branch` variable via the notation: `[[variable]]`.

## gitlab-config.json
Clone the `gitlab-config.json.template` into `gitlab-config.json` and fill the following settings:
```json
{
  "protocol": "https",
  "host": "your.host.here",
  "projectId": 0,
  "token": "your-gitlab-token"
}
```