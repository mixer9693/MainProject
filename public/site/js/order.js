
order = (function () {

    var createOrder, updateOrder, serialize, setData, showError, getDate, getTime

    serialize = function ($form) {

        //var form = $(config.container).find('#' + config.formId);
        var ob = {
            id: $form.attr('data-order_id'),
            from: $form.find('#from').val(),
            to: $form.find('#to').val(),
            description: $form.find('#description').val(),
            phone: $form.find('#phone').val(),
            lease_term: $form.find('#lease_term').val(),
            value: $form.find('#value').val()
        }

        var when;
        var d = $form.find('#date').val();
        var t = $form.find('#time').val();
        if (d){
            when = d;
            if (t)
                when += ' '+t;
        }
        if (when) ob.when = when;
        return ob;
    }

    createOrder = function (Order) {
        return new Promise(function (resolve, reject) {
            $.post('/api/orders', Order).done(function (data) {
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
            $.post('/api/orders/'+Order.id, Order).done(function (data) {
                console.log('spa.table.order2 > createOrder: done');
                resolve(data);

            }).fail(function (err) {
                console.log('spa.table.order2 > createOrder: fail');
                reject(err);
            });
        });
    }

    setData = function ($form, Order) {
        $form.attr('data-order_id', Order.id);
        $form.find('#from').val(Order.from);
        $form.find('#to').val(Order.to);
        $form.find('#description').val(Order.description);
        $form.find('#phone').val(Order.phone);
        $form.find('#lease_term').val(Order.lease_term);
        $form.find('#value').val(Order.value);

        if (Order.when){
            var date = Order.when.substr(0, 10);
            $form.find('#date').val(date);

            var time = Order.when.substr(11, 5)
            $form.find('#time').val(time);
        }else {
            // $form.find('#date').val(getDate());
        }


    }


    getDate = function () {
        var dateNow = new Date()
        var month = (dateNow.getMonth()+1) < 10 ? '0'+(dateNow.getMonth()+1) : dateNow.getMonth()+1;
        var day = dateNow.getDate() < 10 ? '0'+dateNow.getDate() : dateNow.getDate();
        var date = dateNow.getFullYear()+'-'+month + '-'+day
        return date
    }

    getTime = function () {
        var dateNow = new Date()
        dateNow.getHours()
        var hours = dateNow.getHours() < 10 ? '0'+dateNow.getHours() : dateNow.getHours();
        var minutes = dateNow.getMinutes() < 10 ? '0'+dateNow.getMinutes() : dateNow.getMinutes();
        var time = hours + ':' + minutes
        return time
    }




    return {
        setData: setData,
        createOrder: createOrder,
        updateOrder: updateOrder,
        serialize: serialize,
        getDate: getDate,
        getTime: getTime
    }

})()





