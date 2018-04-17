var db = require('./bookshelf');
var md5 = require('md5');
var jwt = require('./jwt');
var socket = require('./socket');

module.exports.getMovementOrders = getMovementOrders;
module.exports.getPerformers = getPerformers;
module.exports.getEmployees = getEmployees;
module.exports.setMovementOrder = setMovementOrder;
module.exports.setOrder = setOrder;
module.exports.setPerformer = setPerformer;
module.exports.createOrder = createOrder;

module.exports.authentication = authentication;
module.exports.refreshToken = refreshToken;
module.exports.performerSetIn = performerSetIn;
module.exports.performerSetOut = performerSetOut;
//module.exports.setPerformerAtWork = setPerformerAtWork;

module.exports.autorize = autorize;
module.exports.ROLE = {DRIVER: 'driver', MANAGER: 'manager'}


function getMovementOrders(where, withRelated, callback) {
    db.MovementOrder.query('orderBy', 'id', 'desc').where(where).fetchAll({withRelated: withRelated}).then(function (value) {
        callback(null, value.toJSON());
    }).catch(function (reason) {
        callback(reason);
    });
}

function getPerformers(where, withRelated, callback) {
    db.Performer.where(where).fetchAll({withRelated: withRelated}).then(function (value) {
        callback(null, value.toJSON());
    }).catch(function (reason) {
        callback(reason);
    });
}

function getAuthentication(where, withRelated, callback) {
    db.Authentication.where(where).fetchAll({withRelated: withRelated}).then(function (value) {
        callback(null, value.toJSON());
        return;
    }).catch(function (reason) {
        callback(reason);
    });
}

function getEmployees(where, callback) {
    db.Employee.where(where).fetchAll().then(function (value) {
        callback(null, value.toJSON());
    }).catch(function (reason) {
        callback(reason);
    });
}

function setMovementOrder(where, options, callback) {
    console.log(options)
    db.transaction(function(t) {
        db.MovementOrder.query('limit', 1).where(where).save(options, {patch: true, transacting: t}).then(function (value) {
            db.MovementOrder.where(where).fetch({transacting: t, withRelated:['order', 'performer.car', 'performer.employee']}).then(function (value2) {
                t.commit();
                var data = value2.toJSON();

                socket.emitForManagers('update movement-order', data);
                if (data.performer_id != null)
                    socket.sendToDriverById(data.performer_id, 'update movement-order', data);

                callback(null, value2.toJSON());

            }).catch(function (reason) {
                console.log('!select');
                t.rollback();
                callback(reason);
            })
        }).catch(function (reason) {
            console.log('!update');
            t.rollback();
            callback(reason);
        });
    }).catch(function (reason) {
        //console.log(reason);
    });
}

function setOrder(where, options, callback) {
    db.transaction(function(t) {
        db.Order.query('limit', 1).where(where).save(options, {patch: true, transacting: t}).then(function (value) {
            db.MovementOrder.where({order_id: where.id}).fetch({transacting: t, withRelated: ['order']}).then(function (value2) {
                // console.log(where);
                t.commit();
                var data = value2.toJSON();
                callback(null, data);
                socket.emitForManagers('update order', data);
                if (data.performer_id != null)
                    socket.sendToDriverById(data.performer_id, 'update order', data);
            }).catch(function (reason) {
                t.rollback();
                callback(reason);
            })

        }).catch(function (reason) {
            t.rollback();
            callback(reason);
        });
    }).catch(function (reason) {
        console.log(reason);
    });
}



function setPerformer(where, options, callback) {
    db.transaction(function(t) {
        db.Performer.query('limit', 1).where(where).save(options, {patch: true}).then(function (value) {
            db.Performer.where(where).fetch({transacting: t}).then(function (value2) {
                t.commit();
                var data = value2.toJSON();
                callback(null, data);
                socket.emitForManagers('update performer', data);
                socket.sendToDriverById(data.id, 'update performer', data);
            }).catch(function (reason) {
                t.rollback();
                callback(reason);
            })
        }).catch(function (reason) {
            t.rollback();
            callback(reason);
        });
    }).catch(function (reason) {
        // console.log(reason);
    });
}

function setAuthentication(where, options, callback) {
    db.Authentication.query('limit', 1).where(where).save(options, {patch: true}).then(function (value) {
        callback(null, value.toJSON());
    }).catch(function (reason) {
        callback(reason);
    });
}

function createOrder(order, callback) {
    // console.log('createOrder')
    db.transaction(function(t) {
        new db.Order(order).save(null, {transacting: t}).then(function (newOrder) {
            new db.MovementOrder({order_id: newOrder.id}).save(null, {transacting: t}).then(function (newMov) {
                db.MovementOrder.where({id: newMov.id}).fetch({transacting: t, withRelated: ['order', 'performer']}).then(function (value) {
                    t.commit();
                    var data = value.toJSON();
                    callback(null, data);
                    socket.emitForManagers('new order', data);
                }).catch(function (reason) {
                    callback(reason);
                });

            }).catch(function (reason) {
                console.log('!Movement');
                t.rollback();
                callback(reason);
            })
        }).catch(function (reason) {
            console.log('!Order');
            t.rollback();
            callback(reason);
        });
    }).catch(function (reason) {
        console.log('catch ' +reason);
    });
}

function checkAuthentication(login, password, callback) {
    getAuthentication({employee_id: login, password: md5(password)}, null, callback);
}

function updateToken(employeeId, token, callback) {
    setAuthentication({employee_id: employeeId}, {refresh_token: token}, callback);
}

function checkToken(employeeId, token, callback) {
    getAuthentication({employee_id: employeeId, refresh_token: token}, null, callback);
}

function authentication(login, password, callback) {
    if (!login || !password){
        callback('Неверный логин или пароль');
        return;
    }
    checkAuthentication(login, password, function (err, data) {
        if (err){
            // console.log('wrr')
            callback(err);
            return;
        }
        if (data.length == 0){
            callback('Неверный логин или пароль');
            return;
        }
        var data  = data[0];
        var tokens = jwt.createTokens(data.employee_id, data.role);

        updateToken(data.employee_id, tokens.refreshToken, function (err, data) {
            if (err)
                callback(err);
            else
                callback(null, tokens);
        });

    });
}

//*
function refreshToken(token, callback) {
    try {
        var decoded = jwt.verifyRefreshToken(token);
    }catch (err){callback(err); return;}

    checkToken(decoded.employee_id, token, function (err, data) {
        if (err){
            callback(err);
            return;
        }
        if (data.length == 0){
            callback('Токен не актуален');
            return;
        }
        if (decoded.performer_id)
            var newTokens = jwt.createTokens(decoded.employee_id, decoded.role, decoded.performer_id);
        else
            var newTokens = jwt.createTokens(decoded.employee_id, decoded.role);

        updateToken(decoded.employee_id, newTokens.refreshToken, function (err, data) {
            if (err)
                callback(err);
            else
                callback(null, newTokens);
        });
    })
}


//устарела
function selectPerformer(employeeId, performerId, callback) {
    getPerformers({employee_id: employeeId, id: performerId}, null, function (err, data) {
        if (err){
            callback(err);
            return;
        }
        if (data.length == 0){
            callback('Исполнитель не найден');
            return;
        }
        var newToken = jwt.createTokens(employeeId, 'driver', data[0].id);

        updateToken(employeeId, newToken.refreshToken, function (err, data) {
            if (err)
                callback(err);
            else
                callback(null, newToken);
        });
    });
}

//устарела
function setPerformerAtWork(performerId, employeeId, atWork, callback) {
    db.transaction(function (t) {
        db.Performer.where({employee_id: employeeId}).save({free: 0, at_work: 0}, {patch: true, transacting: t}).then(function (value) {
            if (atWork == 0){
                t.commit();
                var data = value.toJSON();
                data['id'] = performerId;
                callback(null, data);
                socket.emitForManagers('driver at-wokr', data);
                socket.sendToDriverById(performerId, 'at-work', data);
            }else {
                db.Performer.where({id: performerId}).save({at_work: 1}, {patch: true, transacting: t}).then(function (value2) {
                    t.commit();
                    var data2 = value2.toJSON();
                    data2['id'] = performerId;
                    callback(null, data2);
                    socket.emitForManagers('driver at-wokr', data2);
                    socket.sendToDriverById(performerId, 'at-work', data2);
                }).catch(function (reason) {
                    t.rollback();
                    callback(reason);
                });
            }
        }).catch(function (reason) {
            t.rollback();
            callback(reason);
        })
    }).catch(function (reason) {
        console.log(reason);
    });
}


// Делает сотрудника исполнителем, если это позволено. Сбрасывает возможную активность
// других исполнителей для этого сотрудника. Устанавливает at_work: 1. Возвращает токены
// с performer_id; 
function performerSetIn(performerId, employeeId, callback) {
    // //сбросить другую активность этого исполнителя, если она есть
    resetActivity(employeeId, function (err, data) {
        if (err) {
            callback(err);
            return;
        }
        db.transaction(function (t) {
            //установить at-work:1, если есть такой исполнитель
            db.Performer.where({id: performerId, employee_id: employeeId})
                .save({at_work: 1}, {patch: true, transacting: t}).then(function (value) {
                //создать токены
                var tokens = jwt.createTokens(employeeId, 'driver', performerId);
                //записать токен
                db.Authentication.where({employee_id: employeeId})
                    .save({refresh_token: tokens.refreshToken}, {patch: true, transacting: t})
                    .then(function (value2) {
                        //получить исполнителя для эммита
                        db.Performer.where({id: performerId})
                            .fetch({transacting: t, withRelated: ['car', 'employee']})
                            .then(function (value3) {

                                t.commit();
                                var data = value3.toJSON();
                                callback(null, tokens);
                                try {
                                    socket.emitForManagers('driver at-wokr', data);
                                    delete data['employee'];
                                    socket.sendToDriverById(4, 'at-work', data);
                                } catch (err) {
                                }

                            }).catch(function (reason) {
                            console.log('!select after save');
                            t.rollback();
                            callback(reason);
                        });
                    }).catch(function (reason) {
                    console.log('!Authentication');
                    t.rollback();
                    callback(reason);
                });
            }).catch(function (reason) {
                console.log('!save');
                t.rollback();
                callback(reason);
            });
        }).catch(function (reason) {
            //console.log(reason);
        });
    });
}

//Забирает у сотрудника право исполнителя. Возвращает обычные токены
function performerSetOut(employeeId, callback ) {
    resetActivity(employeeId, function (err, data) {
        if (err){
            callback(err);
            return;
        }
        var tokens = jwt.createTokens(employeeId, 'driver');
        updateToken(employeeId, tokens.refreshToken, function (err, data) {
            if (err){
                callback(err);
                return;
            }else {
                callback(null, tokens);
            }
        });
    })
}

function autorize(role) {
    var roles;
    if (Array.isArray(role))
        roles = role;
    else
        roles = new Array(role);

    function checkRole(req, res, next) {
        var auth = false;
        roles.forEach(function (value) {
            if (req.user.role == value){
                auth = true;
                return;
            }
        });
        if (auth)
            next();
        else {
            res.status(403);
            res.json({error: 'Forbidden'});
        }
    }
    return checkRole;
}


//Устанавливает at_work и free в 0 для всех исполнителей данного сотрудника
function resetActivity(employeeId, callback) {
    db.Performer.where({employee_id: employeeId, at_work: 1}).fetchAll().then(function (value) {
        if (value.length > 0){
            value = value.toJSON();
            value.forEach(function (elem) {
                db.Performer.where({id: elem.id}).save({at_work: 0, free: 0}, {patch: true})
                    .then(function (updatedElem) {
                        if (updatedElem){
                            var updatedElem = updatedElem.toJSON();
                            elem.at_work = updatedElem.at_work;
                            elem.free = updatedElem.free;
                            socket.emitForManagers('driver at-work', elem);
                            socket.sendToDriverById(elem.id, 'at-work', elem);
                        }
                    }).catch(function (reason) {
                        console.log(reason)
                        callback(reason);
                        return;
                    });
            });
            callback(null, true);
            return;
        }
        callback(null, true);
    });
}
