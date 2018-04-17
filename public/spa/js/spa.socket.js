
spa.socket = (function () {

    var
        config = {
            timeOutConnectId: 0
        },

        events = {
            'update order':          null,
            'update movement-order': null,
            'update performer':      null,
            'new order':             null,
            'driver at-wokr':        null,
            'offer_order':           null
        },

        socket = null,
        countConnect = 0,

        init, addUpdateOrderHandler, addUpdateMovementOrderHandler, addUpdatePerformerHandler,
        addNewOrderHandler, addDriverAtWorkHandler, emitOfferOrderEvent, addOfferOrderHandler,

        connect, onDisconnect, onError, subscribeToEvents

    init = function () {
        console.log('spa.socket > init');
        var token = spa.auth.getToken();

        if (token)
            connect(token);
        else
            spa.auth.addUpdateTokenListener(function (data) {
                connect(data);
            });
    }

    connect = function (token) {
        socket = io.connect('http://localhost:3000', {
            'query': 'token=' + token
        });

        socket.on('disconnect', onDisconnect);

        socket.on('error', onError);

        subscribeToEvents();

        socket.on('news', function (data) {
            console.log(data);
        });
    }

    onDisconnect = function (reason) {
        //console.log('disconnect');
        //console.log(reason);
        init();
    }

    onError = function (error) {
        console.log('error');
        console.log(error);

        config.timeOutConnectId = setTimeout(function () {
                init();
        }, 1000);
    }

    subscribeToEvents = function () {
        if (events['update order'] != null)
            socket.on('update order',          events['update order']);
        if (events['update movement-order'] != null)
            socket.on('update movement-order', events['update movement-order']);
        if (events['update performer'] != null)
            socket.on('update performer',      events['update performer']);
        if (events['new order'] != null)
            socket.on('new order',             events['new order']);
        if (events['driver at-wokr'] != null)
            socket.on('driver at-wokr',        events['driver at-wokr']);
    }

    addUpdateOrderHandler = function (handler) {
        if (typeof handler == 'function') {
            events['update order'] = handler;
            socket.on('update order', events['update order']);
        }
    }

    addUpdateMovementOrderHandler = function (handler) {
        if (typeof handler == 'function') {
            events['update movement-order'] = handler;
            socket.on('update movement-order', events['update movement-order'])
        }
    }

    addUpdatePerformerHandler = function (handler) {
        if (typeof handler == 'function') {
            events['update performer'] = handler;
            socket.on('update performer', events['update performer']);
        }
    }

    addNewOrderHandler = function (handler) {
        if (typeof handler == 'function') {
            events['new order'] = handler;
            socket.on('new order', events['new order']);
        }
    }

    addDriverAtWorkHandler = function (handler) {
        if (typeof handler == 'function') {
            events['driver at-wokr'] = handler;
            socket.on('driver at-wokr', events['driver at-wokr']);
        }
    }

    emitOfferOrderEvent = function (data) {
        socket.emit('offer_order', data);
    }

    addOfferOrderHandler = function (handler) {
        if (typeof handler == 'function') {
            events['offer_order'] = handler;
            socket.on('offer_order', events['offer_order']);
        }
    }

    return {
        init:                          init,
        addUpdateOrderHandler:         addUpdateOrderHandler,
        addUpdateMovementOrderHandler: addUpdateMovementOrderHandler,
        addUpdatePerformerHandler:     addUpdatePerformerHandler,
        addNewOrderHandler:            addNewOrderHandler,
        addDriverAtWorkHandler:        addDriverAtWorkHandler,
        emitOfferOrderEvent:           emitOfferOrderEvent,
        addOfferOrderHandler:          addOfferOrderHandler,

        events: events
    }

})($);