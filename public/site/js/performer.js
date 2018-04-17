
performer = (function () {

    var
        container,
        Storage, setPerformerClickListener, removePerformerClickListener,

        getPerformer, showPerformerInfo, showPerformersList, closePerformerInfo,
        closePerformersList, showHeader,

        init, show, addSetPerformerClickListener, addRemovePerformerClickListener, setPerformer

    init = function ($container) {
        container = $container

        container.find('#remove-performer').click(function (event) {
            // $(this).attr('disabled', '');
            var perfId  = $('#performer-info').attr('data-performer_id');
            if (removePerformerClickListener)
                removePerformerClickListener(Storage[perfId]);
        });

        container.find('#set-performer').click(function (event) {
            // $(this).attr('disabled', '');
            var perfId  = $('#performer-info').attr('data-performer_id');
            if (setPerformerClickListener)
                setPerformerClickListener(Storage[perfId]);
        });

        return this
    }

    show = function(performerId) {

        closePerformerInfo()
        closePerformersList()

        if(performerId != 0){
            showHeader(performerId);

            getPerformer(performerId).then(function () {
                showPerformerInfo(Storage[performerId]);

            }).catch(function (err) {
                var cont = container.find('#performers-list')
                    .html('').html('<h7>Не удалось загрузить список водителей</h7><br>'+err);
                throw Error(err);
            });

        }else {

            showHeader();

            getPerformer().then(function () {
                console.log('after get')
                showPerformersList()

            }).catch(function (err) {
                var cont = container.find('#performers-list')
                    .html('').html('<h7>Не удалось загрузить список водителей</h7><br>'+err)
                throw Error(err);
            })
        }
        
    }

    getPerformer = function (id) {
        return new Promise(function (resolve, reject) {
            var url = id ? '/api/performers/'+id+'?with=employee,car'
                :'/api/performers?with=employee,car&at_work=1&free=1';


            $.get(url).done(function (res) {
                Storage = {};

                res.forEach(function (el) {
                    console.log('forEach');
                    Storage[el.id] = el;
                });

                resolve();

            }).fail(function (err) {
                console.log('performers > getFreePerformers -> fail');
                reject(err)
            });
        });

    }

    showPerformerInfo = function (Performer) {
        container.find('#performer-info, #buttons').removeClass('invisible')
            .attr('data-performer_id', Performer.id);

        var atWorkClass, freeClass, freeMessage;

        if (Performer.at_work == 1)
            atWorkClass = 'badge-info';
        else
            atWorkClass = 'badge-default';

        if (Performer.free == 1) {
            freeClass = 'badge-success';
            freeMessage = 'свободен';
        }
        else {
            freeClass = 'badge-danger';
            freeMessage = 'занят';
        }

        container.find('#at-work').removeClass('badge-info', 'badge-default').addClass(atWorkClass);
        container.find('#free').text(freeMessage).addClass(freeClass);

        container.find('#performer-name').text(Performer.employee.name);
        container.find('#performer-surname').text(Performer.employee.surname);

        container.find('#performer-car-type').text(Performer.car.type_of_car);
        container.find('#car-carrying_capacity').text(Performer.car.carrying_capacity);
        container.find('#car-mark').text(Performer.car.car_brand);
        container.find('#car-state_number').text(Performer.car.state_number);
        container.find('#performer-phone').text(Performer.employee.phone)
    }

    showPerformersList = function () {
        console.log('showPerformersList')
        var cont = container.find('#performers-list').removeClass('invisible').find('div');
        // console.log(cont);

        var keys = Object.keys(Storage);

        cont = cont.html('<ul></ul>').find('ul');

        keys.forEach(function (key) {
            console.log('forEach  keys')
            var el = Storage[key];
            var li = '<li data-performer_id='+key+'>' +
                '<h8>'+ el.employee.name+' '+el.employee.surname +'</h8>' +
                '<em>, автомобиль </em>' +
                '<span>'+ el.car.type_of_car +'</span> ' +
                '<i>'+ el.car.carrying_capacity +'</i>т' +
                '</li>';

            cont.prepend(li);
        });

        cont.find('li').on('click', function () {
            // console.log(Storage[$(this).attr('data-performer_id')])
            showPerformerInfo(Storage[$(this).attr('data-performer_id')]);
        });
    }

    closePerformerInfo = function () {
        container.find('#performer-info, #buttons').addClass('invisible');
    }

    closePerformersList = function () {
        container.find('#performers-list').addClass('invisible')
    }

    addSetPerformerClickListener = function (handler) {
        if (handler && typeof handler == 'function') {
            setPerformerClickListener = handler;
            return true;
        }
        return false;
    }

    addRemovePerformerClickListener = function (handler) {
        if (handler && typeof handler == 'function') {
            removePerformerClickListener = handler;
            return true;
        }
        return false;
    }

    showHeader = function (performerId) {
        if (performerId){
            container.find('#performer-id').text(performerId)
                .removeClass('badge-warning').addClass('badge-success');

            container.find('#remove-performer').css('display', 'block');
            container.find('#set-performer').css('display', 'none');
            container.find('#reset-performer').css('display', 'block');

        }else {
            container.find('#performer-id').text('не назначен')
                .removeClass('badge-success').addClass('badge-warning');

            container.find('#remove-performer').css('display', 'none');
            container.find('#set-performer').css('display', 'block');
        }

    }

    setPerformer = function (movId, performId) {
        return new Promise(function (resolve, reject) {
            if (!movId) {reject(); return}

            var data = {id: movId, performer_id: performId, status: ' новый'}
            console.log(data);

            $.post('/api/movement-orders/'+movId, data).done(function (data) {
                console.log('sta.table.performer > setPerformer :done');
                resolve(data)

            }).fail(function (err) {
                console.log('FFFAAAIL')
                throw Error(err)
                reject();
            });
        });
    }

    return{
        init: init,
        show: show,
        addRemovePerformerClickListener: addRemovePerformerClickListener,
        addSetPerformerClickListener: addSetPerformerClickListener,
        setPerformer: setPerformer,
        closePerformersList: closePerformersList,
        closePerformerInfo: closePerformerInfo,
        Storage: Storage
    }

})()