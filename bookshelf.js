var knex = require('knex')({
    client: 'mysql',
    connection: {
        host     : '127.0.0.1',
        user     : 'root',
        password : 'root',
        database : 'transport',
        charset  : 'utf8',
        timezone: 'UTC'
    }
});

var bookshelf = require('bookshelf')(knex);

var MovementOrder = bookshelf.Model.extend({
    tableName: 'movement_orders',
    order: function() {
        return this.belongsTo(Order, 'order_id', 'id');
    },
    performer: function() {
        return this.belongsTo(Performer, 'performer_id', 'id');
    }
});

var Order = bookshelf.Model.extend({
    tableName: 'orders',
    movement_order: function() {
        return this.hasOne(MovementOrder, 'order_id', 'id');
    }
});

var Performer = bookshelf.Model.extend({
    tableName: 'performers',
    employee: function() {
        return this.belongsTo(Employee, 'employee_id', 'id');
    },
    car: function() {
        return this.belongsTo(Car, 'car_id', 'id');
    }
});

var Employee = bookshelf.Model.extend({
    tableName: 'employees'
});

var Car = bookshelf.Model.extend({
    tableName: 'cars'
});

var Authentication = bookshelf.Model.extend({
    tableName: 'authentication',
    employee: function() {
        return this.belongsTo(Employee, 'employee_id', 'id');
    }
});

module.exports = bookshelf;

module.exports.MovementOrder = MovementOrder;
module.exports.Order = Order;
module.exports.Performer = Performer;
module.exports.Employee = Employee;
module.exports.Car = Car;
module.exports.Authentication = Authentication;

