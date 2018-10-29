'use strict';

module.exports = (bot, channelID, message) => {
  bot.sendMessage({
    to: channelID,
    message: `:construction_worker: ${message}`
  });
};
