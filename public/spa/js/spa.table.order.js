
spa.table.order2 = (function () {

    var
        htmlForm = null,
        count =  1,
        formId = 'spa-table-order-form',

        init, createForm, createOrder, updateOrder,
        serialize, validate, orderForm

    init = function () {
        console.log('spa.table.order > init');

        return new Promise(function (resolve, reject) {
            if (htmlForm) {reject('spa.table.order уже существует'); return;}

            $.get('spa/html/spa.table.order.html').done(function (data) {
                htmlForm = data;
                resolve();

            }).fail(function (err) {
                console.log('spa.table.order > init -> fail:' + err);
                reject(err);
            });
        });

    }

    serialize = function (form) {

        //var form = $(config.container).find('#' + config.formId);
        var ob = {
            id: form.attr('data-order_id'),
            from: form.find('#from').val(),
            to: form.find('#to').val(),
            description: form.find('#description').val(),
            phone: form.find('#phone').val(),
            lease_term: form.find('#lease_term').val(),
            value: form.find('#value').val()
        }

        var when;
        var d = form.find('#date').val();
        var t = form.find('#time').val();
        if (d){
            when = d;
            if (t)
                when += ' '+t;
        }
        if (when) ob.when = when;
        return ob;
    }

    validate = function (form) {
        return true;
    }

    createOrder = function (Order) {
        return new Promise(function (resolve, reject) {
            $.post('/api/order/for-manager', Order).done(function (data) {
                // console.log('spa.table.order2 > createOrder: done');
                resolve(data);

            }).fail(function (err) {
                console.log('spa.table.order2 > createOrder: fail');
                reject(err);
            });
        });
    }

    updateOrder = function (Order) {
        return new Promise(function (resolve, reject) {
            console.log(Order);
            if (!Order.id) { reject('No id'); return;}
            console.log('Update');
            $.post('/api/order/for-manager/'+Order.id, Order).done(function (data) {
                console.log('spa.table.order2 > createOrder: done');
                resolve(data);

            }).fail(function (err) {
                console.log('spa.table.order2 > createOrder: fail');
                reject(err);
            });
        });
    }

    createForm = function (container) {
        return orderForm(container);
    }

    orderForm = function ($container) {

        var container, id, listener,

            addSubmitListener, dis, setData,
            init, showWarning

        init = function ($container) {
            container = $container;

            id = formId+'-'+count++;
            container.html(htmlForm)
                .find('#spa-table-order-form').attr('id', id)
                .on('submit', function () {
                    console.log('submit ' + $(this).attr('id'));
                    // dis()
                    var ob = serialize($(this));
                    var valid = validate($(this));
                    if (!valid.error)
                        if (listener && typeof listener == 'function')
                            listener(ob);
                    else
                        showWarning(valid.error);
                });
        }

        showWarning = function (error) {
            //подсветить ошибки
        }


        addSubmitListener = function (handler) {
            listener = handler;
        }

        dis = function () {
            console.log('dis')
            $(container).find('#btn-save').attr('disabled', '');
        }


        setData = function (Order) {
            container.find('#'+id).attr('data-order_id', Order.id);
            container.find('#from').val(Order.from);
            container.find('#to').val(Order.to);
            container.find('#description').val(Order.description);
            var date = Order.when ? Order.when.substr(0, 10): '';
            container.find('#date').val(date);
            var time = Order.when ? Order.when.substr(11, 5): '';
            container.find('#time').val(time);
            container.find('#phone').val(Order.phone);
            container.find('#lease_term').val(Order.lease_term);
            container.find('#value').val(Order.value);
        }

        if ($container) init($container);

        return {
            id: id,
            addSubmitListener: addSubmitListener,
            dis: dis,
            setData: setData
        }

    }

    return {
        init: init,
        createForm: createForm,
        createOrder: createOrder,
        updateOrder: updateOrder
    }

})()





