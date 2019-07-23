
const Bot = require('./bot');
const Persist = require('./persist');

const FoodOrder = function () {
    let _orders = {};
    const self = this;

    self.order = function (userID, food) {
        const f = food.toLowerCase()
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(' ');
        if(!_orders[f]){
            _orders[f] = [];
        }
        _orders[f].push(userID);
        self.save();
    };

    self.clear = function () {
        _orders = {};
        self.save();
    };

    self.cancel = function (userID) {
        if(Object.keys(_orders).length === 0){
            return;
        }
        const toRemove = [];
        Object.keys(_orders).forEach((food)=>{
            _orders[food] = _orders[food].filter((id)=>{
                return id !== userID;
            });
            if (_orders[food].length === 0){
                toRemove.push(food);
            }
        });
        toRemove.forEach((food)=>{
            delete _orders[food];
        });
        self.save();
    };

    self.formattedOrders = function(withPeople, guild) {
        if(Object.keys(_orders).length === 0){
            return null;
        }

        const orders = Object.keys(_orders).map((food) => {
            if(withPeople){
                return `  * ${food}: x${_orders[food].length} (${_orders[food].map((id)=>{return Bot.userIDToUser(id, guild)}).join(", ")})`
            }
            return `  * ${food} x${_orders[food].length}`
        });
        
        return orders.join('\n')
    }

    self.save = function () {
        return Persist.save('food.json', _orders);
    };

    self.load = function () {
        _orders = Persist.load('food.json');
        const success = _orders !== null;
        if(!success){
            _orders = {};
        }
        return success;
    };
};

module.exports = FoodOrder