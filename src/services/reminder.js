
const fork = require('child_process');
const Persist = require('./persist');
const chat = require('../utils/discord-chat');

const Reminder = function (bot) {
    const self = this;
    const _bot = bot;
    let _reminders = {};

    const processTimeReminders = function(){
        const memos = self.getDateTriggers(new Date());
        memos.forEach((memo) => {
            memo.messages.forEach((m) => {
                const channel = bot.channels.array().find((c) => { return c.id === m.channel; });
                if(!!channel){
                    chat(bot, channel, `Reminder <@${m.userToRemind}>:\n${m.message}`);
                }     
            });       
        });
    };

    self.remind = function (userID, trigger, type, memo, channelID) {
        if(!_reminders[userID]){
            _reminders[userID] = {
                date: {},
                user: {}
            };
        }
        if(!_reminders[userID][type][trigger]){
            _reminders[userID][type][trigger] = [];
        }
        _reminders[userID][type][trigger].push({
            channel: channelID,
            message: memo,
            userToRemind: userID
        });

        self.save();
    };

    self.clear = function () {
        _reminders = {};
        self.save();
    };

    self.cancel = function (userID, type, trigger) {
        if(Object.keys(_reminders).length === 0){
            return;
        }

        if(!!trigger) {
            delete _reminders[userID];
            return;
        }

        delete _reminders[userID][type][trigger];

        if(Object.keys(_reminders[userID][type]).length === 0){
            delete _reminders[userID][type];
        }
        if(Object.keys(_reminders[userID]).length === 0){
            delete _reminders[userID];
        }
        self.save();
    };

    self.getUserTriggers = function(userID) {
        const triggers = [];
        Object.keys(_reminders).forEach((userToRemind) => {
            if(userID in _reminders[userToRemind]["user"]){
                triggers.push({
                    userToRemind: userToRemind,
                    messages: _reminders[userToRemind]["user"][userID] || []
                });
                self.cancel(userToRemind, "user", userID);
            }
        });
        return triggers;
    };

    self.getDateTriggers = function(date) {
        const triggers = [];
        Object.keys(_reminders).forEach((userToRemind) => {
            Object.keys(_reminders[userToRemind]["date"]).forEach((dateToRemind) => {
                if(new Date(dateToRemind) <= new Date(date)){
                    triggers.push({
                        date: dateToRemind,
                        messages: _reminders[userToRemind]["date"][dateToRemind] || []
                    });
                }
                self.cancel(userToRemind, "date", dateToRemind);
            });
        });
        return triggers;
    };

    self.save = function () {
        return Persist.save('reminders.json', JSON.stringify(_reminders));
    };

    self.load = function () {
        _reminders = Persist.load('reminders.json');
        const success = _reminders !== null;
        if(!success){
            _reminders = {};
        }
        return success;
    };

    self.checkTimeReminders = function() {
        setInterval(processTimeReminders, 10*1000);
    }
};

module.exports = Reminder