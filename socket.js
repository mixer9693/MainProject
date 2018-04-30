var io;
var socketioJwt = require('socketio-jwt');
var jwt = require('./jwt');
var model = require("./model");

const accessSecret = 'accessSecret';

module.exports.init = init;

module.exports.emitForDrivers = emitForDrivers;
module.exports.emitForManagers = emitForManagers;
module.exports.sendToDriverById = sendToDriverById;
module.exports.sendToManagerById = sendToManagerById;

var driversSocket = {};
var managersSocket = {};


function init(server) {
    io = require('socket.io')(server);
    emitInterval();
    io.use(socketioJwt.authorize({
        secret: accessSecret,
        handshake: true,
    }));


    io.on('connection', function (socket) {
//        var time = socket.decoded_token.exp - Math.floor(Date.now()/1000);

        //console.log('time ' + time);
//         setTimeout(function () {
            // console.log('setTimeout')
            // var error = {message: "jwt expired", code: "invalid_token", type: "UnauthorizedError"}
//            socket. disconnect(false);
//        }, time*1000);

        console.log('connection');
        switch (socket.decoded_token.role){
            case 'driver':
                socket.leaveAll();
                if (socket.decoded_token.performer_id)
                    driversSocket[socket.decoded_token.performer_id] = socket;
                socket.join('/driver');
                // console.log(driversSocket);
                break;
            case 'manager':
                socket.leaveAll();
                managersSocket[socket.decoded_token.employee_id] = socket;
                console.log('connect socket.id: '+socket.decoded_token.employee_id+' size: ' + Object.keys(managersSocket).length);
                //console.log(Object.keys(managersSocket).length);
                socket.join('/manager');
                // console.log(Object.keys(managersSocket));
                break;
        }

        //назначить заказ вдителю. Постпает от менеджера. Вносятся изменения в базу,
        //затем отсылается ответ менеджеру об успешном назначении водителя на заказ,
        //и отправляется событие водителю о назначении заказа.
        socket.on('offer order', function (data) {
            console.log('offer order');
            console.log(data);

            if (!data.performerId || !data.movId || !data.managerId){
                var message = 'Отправка события offer_order завершилась с ошибкой'
                sendToManagerById(data.managerId, "offer order", {data: data, error: true});
                return;
            }

            model.setMovementOrder({id: data.movId}, {performer_id: data.performerId},
                function (err, res) {
                    console.log('offer order setMovementOrder');
                    if (err) {
                        console.log('offer order setMovementOrder ERROR');
                        sendToManagerById(data.managerId, "offer order", {data: data, error: true});
                        return;
                    }
                    console.log('offer order setMovementOrder OK');
                    sendToManagerById(data.managerId, "offer order", {data: data, error: null});

                    sendToDriverById(data.performerId, "offer order", data);
                    console.log('offer order setMovementOrder end');
            })

        });

        socket.on('disconnect', function (data) {
            console.log('disconnect ');
            switch (socket.decoded_token.role){
                case 'driver':
                    socket.leaveAll();
                    delete driversSocket[socket.decoded_token.performer_id];
                    break;
                case 'manager':
                    socket.leaveAll();
                    delete managersSocket[socket.decoded_token.employee_id];
                    console.log('disconnect socket.id: '+socket.decoded_token.employee_id+' size: ' + Object.keys(managersSocket).length);
                    console.log(Object.keys(managersSocket));
                    break;
            }
        });

    });

}

function emitForDrivers(event, data) {
    io.to('/driver').emit(event, data);
}
function emitForManagers(event, data) {
    if (io)
        io.to('/manager').emit(event, data);

}

function sendToDriverById(id, event, data) {
    if (driversSocket[id])
        driversSocket[id].emit(event, data);
}

function sendToManagerById(id, event, data) {
    managersSocket[id].emit(event, data);
}

var c = 0;
function emitInterval() {
    setInterval(function () {
        emitForDrivers('news b', 'update order '+c);
        sendToDriverById(5, "news b", "BY ID")
        // emitForManagers('update order', 'update order '+c);
        // emitForManagers('update movement-order', 'update movement-order '+c);
        // emitForManagers('update performer', 'update performer '+c);
        // emitForManagers('new order', 'new order '+c);
        // emitForManagers('driver at-wokr', 'driver at-wokr '+c);
        // emitForManagers('news', 'news '+c);
        c++
    }, 3000);
}




