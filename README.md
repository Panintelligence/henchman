# [Henchman Logo](changes/images/henchman-logo-small.png) Henchman: a bot for Discord
A bot that lets you interact with various tools via Discord

# Features
* Jenkins
  * Start builds
  * Cancel builds
* Gitlab integration
  * List branches
* Staffsquared
  * Check who's on holiday
* Jira
  * Turn issue mentions into links

# Set up
1. Create a discord app with a bot: https://discordapp.com/developers/applications/
2. Click **"Bot"** on the side pannel and add a bot
3. Get the token (to use in `discord-config.json`)
4. Go back to **"General Information"** and get the **"Client ID"**
5. Go to: `https://discordapp.com/oauth2/authorize?&client_id=YOURCLIENTID&scope=bot&permissions=216064`
Where `client_id` is your bot's client ID

# Usage
On a discord server with the bot type `!info` and the bot will reply with the commands it understands.

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

## jira-config.json
Clone the `jira-config.json.template` into `jira-config.json` and fill the following settings:
```json
{
  "protocol": "https",
  "host": "your.jira.url",
  "projects": [
    { "code":"PROJECT1", "issueStart": 5000 },
    { "code":"PROJECT2", "issueStart": 1, "default": true }
  ]
}
```
