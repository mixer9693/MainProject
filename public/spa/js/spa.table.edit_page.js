
spa.table.edit_page = (function () {
        var
            container, containerForm, orderForm, html, row,

            init, show, setPerformerInfo, getFreePerformers,
            setData, setPerformer
    
        init = function ($container) {
            container = $container;

            $.get('spa/html/spa.table.edit.html').done(function (data) {
                html = data;
                container.html(html);

                /* ------ раздел с формой заказа ----- */

                containerForm  = container.find('#edit-order');
                orderForm = spa.table.order2.createForm(containerForm);
                containerForm = container.find('#'+orderForm.id);

                containerForm.find('#btn-reset').addClass('invisible');
                containerForm.find('#btn-save').addClass('invisible');

                containerForm.change(function () {
                    containerForm.find('#btn-save').removeClass('invisible');
                });

                orderForm.addSubmitListener(function (data) {
                    console.log('spa.table.order.edit > submit');

                    containerForm.find('#btn-save').attr('disabled', '');

                    spa.table.order2.updateOrder(data).then(function (data) {
                        containerForm.find('#btn-save').attr('disabled', null).addClass('invisible');
                        var hed = 'Заказ № '+data.order_id +' изменен';
                        spa.showMessage(hed, null, 'success');
                    }).catch(function (err) {
                        var hed = 'Не удалось изменить заказ № '+data.order_id;
                        spa.showMessage(hed, null, 'danger');
                    })
                });


                /* ------ раздел с информацией по движению ----- */

                container.find('#select-status').change(function () {
                    container.find('#btn-change-status').removeClass('invisible');
                });

                container.find('#btn-change-status').on('click', function () {
                    container.find('#btn-change-status').attr('disabled', '');

                    var status = container.find('#select-status').val();
                    var movId = container.find('#spa-table-edit').attr('data-mov_id');
                    var data = {id: movId, status: status};
                    $.post('/api/movement-order/for-manager/'+movId, data).done(function (res) {

                        container.find('#status').text(res.status);

                        container.find('#select-status').val('');

                        container.find('#btn-change-status').attr('disabled', null)
                            .addClass('invisible');

                        var hed = 'Заказ № '+res.order_id+ ' #'+res.id;
                        var mes = 'Статус изменен на <i>'+res.status+'</i>';
                        spa.showMessage(hed, mes, 'success');

                    }).fail(function (err) {
                        console.log('/api/movement-order/for-manager/ fail');

                        container.find('#btn-change-status').attr('disabled', null);

                        var mes = 'Не удалось изменить статус заказа';
                        spa.showMessage('', mes, 'danger');

                    });
                });


                /* раздел с информацией по исполнителю */

                spa.table.performer.init(container.find('#performer')).then(function () {
                    spa.table.addButtonClickListener(function (data) {
                        console.log('addButtonClickListener');
                        setData(data);
                        row = data.id;

                        spa.table.performer.show(data.performer_id);

                        spa.selectTab(3);
                    });

                    spa.table.performer.addSetPerformerClickListener(function (data) {
                        console.log('addSetPerformerClickListener');
                        var mov = container.find('#spa-table-edit').attr('data-mov_id');

                        setPerformer(mov, data.id).then(function () {
                            spa.showMessage('setPerformer', 'done', 'success');
                            spa.table.performer.show(data.id);

                        }).catch(function (err) {
                            spa.showMessage('setPerformer', 'fail', 'danger');
                        });

                    });

                    spa.table.performer.addRemovePerformerClickListener(function (data) {
                        console.log('addRemovePerformerClickListener');
                        var mov = container.find('#spa-table-edit').attr('data-mov_id');

                        setPerformer(mov, 0).then(function () {
                            spa.showMessage('setPerformer null', 'done', 'success');
                            spa.table.performer.show();

                        }).catch(function (err) {
                            spa.showMessage('setPerformer null', 'fail', 'danger');
                            throw Error(err);
                        });
                    });


                })

            }).catch(function () {
                //загрузка шаблона
            });

        }

        setData = function (data) {
            console.log('setData');

            container.find('#spa-table-edit').attr('data-mov_id', data.id);
            container.find('#mov-id').html(data.id);
            container.find('#order-id').text(data.order_id);
            container.find('#status').html(data.status);

            orderForm.setData(data.order);
        }

        show = function (data) {
            console.log('show show show');
            console.log(data);
            var d = 'ddd';
            row = data;
            setData(data);



            console.log(row)

            if(data.performer_id){
                container.find('#performer-info').removeClass('invisible');
                setPerformerInfo(data.performer);
            }else {
                container.find('#performer-id').text('не назначен')
                    .removeClass('badge-success').addClass('badge-warning');
                container.find('#performers-free').removeClass('invisible');
                getFreePerformers();
            }

        }

        getFreePerformers = function () {
            console.log('getFreePerformers')
            $.get('/api/performer/for-manager?at_work=1&free=1').done(function (res) {
                var cont = container.find('#performers-free');

                cont.find('ul').html('');

                res.forEach(function (el) {

                    var li = '<li>' +
                                '<h8>'+ el.employee.name+' '+el.employee.surname +'</h8>' +
                                '<em>, автомобиль </em>' +
                                '<span>'+ el.car.type_of_car +'</span> ' +
                                '<i>'+ el.car.carrying_capacity +'</i>т' +
                             '</li>';

                    cont.prepend(li);
                });

            }).catch(function (err) {
                console.log('spa.table.edit > getFreePerformers -> fail')
                var cont = container.find('#performers-free')
                    .html('').html('<h7>Не удалось загрузить список водителей</h7>')
            });
        }

        setPerformerInfo = function (Performer) {

            container.find('#performer-id').text(Performer.id)
                .removeClass('badge-warning').addClass('badge-success');

            var atWorkClass, freeClass;
            if (Performer.at_work == 1)
                atWorkClass = 'badge-info';
            else
                atWorkClass = 'badge-default';

            if (Performer.free == 1)
                freeClass = 'badge-success';
            else
                freeClass = 'badge-danger';

            container.find('#at-work').text(Performer.at_work).add(atWorkClass);
            container.find('#free').text(Performer.free).addClass(freeClass);

            container.find('#performer-name').text(Performer.employee.name);
            container.find('#performer-surname').text(Performer.employee.surname);

            container.find('#performer-car-type').text(Performer.car.type_of_car);
            container.find('#car-carrying_capacity').text(Performer.car.carrying_capacity);
            container.find('#car-mark').text(Performer.car.car_brand);
            container.find('#car-state_number').text(Performer.car.state_number);
        }

        setPerformer = function (movId, performId) {
            return new Promise(function (resolve, reject) {
                if (!movId) {reject(); return}

                var data = {id: movId, performer_id: performId, status: ' новый'}
                console.log(data);

                $.post('/api/movement-order/for-manager/'+movId, data).done(function (data) {
                    console.log('sta.table.performer > setPerformer :done');
                    resolve()

                }).fail(function (err) {
                    throw Error(err)
                    reject();
                });
            });
        }


        return{
            init: init,
            setData: setData
        }


    })()
