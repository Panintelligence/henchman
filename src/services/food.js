
const fs = require('fs');
const Bot = require('./bot');

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
    };

    self.clear = function () {
        _orders = {};
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
    };

    self.formattedOrders = function() {
        if(Object.keys(_orders).length === 0){
            return null;
        }

        const orders = Object.keys(_orders).map((food) => {
            return `  * ${food}: ${_orders[food].length}`
        });
        
        return orders.join('\n')
    }
};

module.exports = FoodOrder