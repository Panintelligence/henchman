
const fs = require('fs');
const Bot = require('./bot');

const AwardManager = function () {
    let owed = {};
    let owes = {};
    const self = this;

    self.give = function (sender, recipient, rawItem, quantity) {
        const item = rawItem.toLowerCase();
        if (!(recipient in owed)) {
            owed[recipient] = {};
        }
        if (!(item in owed[recipient])) {
            owed[recipient][item] = {};
        }
        if (!(sender in owed[recipient][item])) {
            owed[recipient][item][sender] = 0;
        }

        if (!(sender in owes)) {
            owes[sender] = {};
        }
        if (!(item in owes[sender])) {
            owes[sender][item] = {};
        }
        if (!(recipient in owes[sender][item])) {
            owes[sender][item][recipient] = 0;
        }

        owed[recipient][item][sender] = owed[recipient][item][sender] + quantity;
        owes[sender][item][recipient] = owes[sender][item][recipient] + quantity;

        return owed[recipient][item][sender];
    };

    self.removeDebt = function (sender, recipient, rawItem, quantity) {
        const item = rawItem.toLowerCase();
        if (!(recipient in owed)) {
            return false;
        }
        if (!(item in owed[recipient])) {
            return false;
        }
        if (!(sender in owed[recipient][item])) {
            return false;
        }

        if (!(sender in owes)) {
            return false;
        }
        if (!(item in owes[sender])) {
            return false;
        }
        if (!(recipient in owes[sender][item])) {
            return false;
        }

        const newDebt = owed[recipient][item][sender];
        owed[recipient][item][sender] = Math.max(owed[recipient][item][sender] - quantity, 0);
        owes[sender][item][recipient] = Math.max(owes[sender][item][recipient] - quantity, 0);

        if (owed[recipient][item][sender] === 0) {
            delete owed[recipient][item][sender];
            delete owes[sender][item][recipient];
        }
        if (Object.keys(owed[recipient][item]).length === 0) {
            delete owed[recipient][item];
            delete owes[sender][item];
        }

        return newDebt;
    };

    self.getItemsOwedToUser = function (recipient) {
        return owed[recipient];
    };

    self.getItemsUserOwes = function (sender) {
        return owes[sender];
    };

    self.formatOwings = function(owings, guild) {
        if(Object.keys(owings).length === 0){
            return null;
        }

        const things = Object.keys(owings).map((item) => {
            const quantitiesPerPerson = Object.keys(owings[item]).map((person) => {
                return `    * ${Bot.userIDToUser(person, guild).displayName}: ${owings[item][person]}`;
            });
            return `  * ${item}: \n${quantitiesPerPerson.join('\n')}`;
        });
        return things.join('\n')
    }

    self.save = function () {
        try {
            fs.writeFileSync('./owes.json', JSON.stringify(owes), 'utf-8');
            fs.writeFileSync('./owed.json', JSON.stringify(owed), 'utf-8');
        } catch (e) {
            return false;
        }

        return true;
    };

    self.load = function () {
        let wentWell = true;
        try {
            owes = JSON.parse(fs.readFileSync('./owes.json'));
        } catch (e) {
            owes = {};
            wentWell = false;
        }
        try {
            owed = JSON.parse(fs.readFileSync('./owed.json'));
        } catch (e) {
            owed = {};
            wentWell = false;
        }
        return wentWell;
    };
};

module.exports = AwardManager