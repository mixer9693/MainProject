var model = require('./model');

module.exports.refreshTokens = refreshTokens;
module.exports.getMovementOrders = getMovementOrders;
module.exports.getMyMovementOrders = getMyMovementOrders;
module.exports.getFreeMovementOrderById = getFreeMovementOrderById;
module.exports.getPerformers = getPerformers;
module.exports.getMyPerformers = getMyPerformers;
module.exports.getPerformerMe = getPerformerMe;
module.exports.updateMovementOrder = updateMovementOrder;
module.exports.updateOrder = updateOrder;
module.exports.updateMyMovementOrder = updateMyMovementOrder;
module.exports.updateMePerformer = updateMePerformer;

module.exports.performerSetIn = performerSetIn;
module.exports.performerSetOut = performerSetOut;

module.exports.createOrder = createOrder;
//module.exports.setPerformerAtWork = setPerformerAtWork;


function refreshTokens(req, res) {
    console.log('refreshTokens')
    if (!req.body.refresh_token){
        var message = 'Запрос не содержит refresh_token';
        send(res, 401, message);
    }
    model.refreshToken(req.body.refresh_token, send(res));
}



function getMovementOrders(req, res) {
    console.log('getMovementOrders')
    var where = {}

    if (req.params.id)
        where.id = req.params.id
    if (req.query && req.query.completed != undefined)
        where.completed = req.query.completed
    if (req.query && req.query.performer_id != undefined)
        where.performer_id = req.query.performer_id

    console.log(where)

    var withRelated = (req.query && req.query.with) ? req.query.with.split(',') : null

    model.getMovementOrders(where, withRelated, send(res))
}


function getMyMovementOrders(req, res) {
    if (!req.user.performer_id){
        var message = 'Токен не содержит performer_id';
        send(res, 401, message);
    }
    req.query.performer_id = req.user.performer_id
    req.params.id = req.params.mov_id

    getMovementOrders(req, res)

}

function getFreeMovementOrderById(req, res) {
    model.getMovementOrders({id: req.params.id, performer_id: null},
        'order', send(res));
}

function getPerformers(req, res) {
    var where = {};

    if (req.params.id)
        where.id = req.params.id;
    if (req.query && req.query.at_work != undefined)
        where.at_work = req.query.at_work
    if (req.query && req.query.free != undefined)
        where.free = req.query.free
    if (req.query && req.query.position != undefined)
        where.free = req.query.position
    if (req.query && req.query.employee_id != undefined)
        where.employee_id = req.query.employee_id

    var withRelated = (req.query && req.query.with) ? req.query.with.split(',') : null

    model.getPerformers(where, withRelated, send(res));
}

function getMyPerformers(req, res) {
    model.getPerformers({employee_id: req.user.employee_id}, 'car', send(res));
}

function getPerformerMe(req, res) {
    if (!req.user.performer_id){
        var message = 'Токен не содержит performer_id';
        send(res, 401, message);
    }
    model.getPerformers({id: req.user.performer_id}, ['car', 'employee'], send(res));
}

function updateMovementOrder(req, res) {
    var data = req.body;
    delete data.id;

    // console.log(data);
    model.setMovementOrder({id: req.params.id}, data, send(res));
}

function updateOrder(req, res) {
    var data = req.body;
    delete data.id;
    model.setOrder({id: req.params.id}, data, send(res));
}

function updateMyMovementOrder(req, res) {
    if (!req.user.performer_id){
        var message = 'Токен не содержит performer_id';
        send(res, 401, message);
    }else if(!req.body.status){
        var message = 'Нет данных для изменения';
        send(res, 401, message);
    }
    model.setMovementOrder({id: req.params.id, performer_id: req.user.performer_id},
        {status: req.body.status}, send(res));
}

function updateMePerformer(req, res) {
    if (!req.user.performer_id){
        var message = 'Токен не содержит performer_id';
        send(res, 401, message);
    }
    var options = {};
    if (req.body.free)
        options['free'] = req.body.free;
    if (req.body.position)
        options['position'] = req.body.position;
    model.setPerformer({id: req.user.performer_id, at_work: 1}, options, send(res));
}

function selectPerformer(req, res) {
   model.selectPerformer(req.params.id, req.user.employee_id, send(res));
}

function createOrder(req, res) {
    var data = req.body;
    delete data.id;
    // console.log(data);
    model.createOrder(data, send(res));
}

function setPerformerAtWork(req, res) {
    if (!req.user.performer_id){
        var message = 'Токен не содержит performer_id';
        send(res, 401, message);
    }
    var atWork = 0;
    if (req.body.at_work)
        atWork = req.body.at_work;
    model.setPerformerAtWork(req.user.performer_id, req.user.employee_id, atWork, send(res));
}


function performerSetIn(req, res) {
    model.performerSetIn(req.params.id, req.user.employee_id, send(res));
}

function performerSetOut(req, res) {
    model.performerSetOut(req.user.employee_id, send(res));
}

function send(res, code, message) {
    var code = 501;
    var message = 'Not Implemented'

    function end(err, data) {
        if (err) {
            console.log(err);
            res.status(code);
            res.json({error: message, code: code});
        } else
            res.json(data);
    }
    return end;
}



