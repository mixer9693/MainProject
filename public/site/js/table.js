
table = (function () {
        var
            config = {
                options: {
                    ajax: {
                        url: '/api/movement-orders?completed=0&with=order,performer',
                        dataSrc: "",
                        // beforeSend: function(request) {
                        //     console.log('beforeSend')
                        //     request.setRequestHeader("Authorization", 'Bearer '+spa.auth.getToken());
                        // },
                    },
                    createdRow: function( row, data, dataIndex ) {
                        $(row).attr('id', data.id);
                    },
                    scrollY: function () {
                        return window.innerHeight- 170;
                    },
                    // scrollX: true,
                    scrollCollapse: false,
                    paging: false,
                    order: [[5, "asc"], [ 0, "desc" ]],
                    language: {
                        search: 'Поиск',
                        loadingRecords: 'Загрузка',
                        info: 'Показаны с _START_ по _END_ из _TOTAL_ записей',
                        infoEmpty: ''
                    },
                    columnDefs:[
                    // {
                    //     targets: -1,
                    //     data: null,
                    //     defaultContent:  "<button>Открыть</button>"
                    // },
                    {
                            targets: 3,
                            render: function (row, type, val, meta ) {
                                return renderData(val);
                            }
                    },{
                            targets: 4,
                            // render: function (row, type, val, meta ) {
                            //     return '+7 981 959 27 20'
                            // }
                    },

                    ],

                    columns: [
                        { data: 'order_id'},
                        // { data: 'order_id' },
                        { data: 'order.from', orderable: false},
                        { data: 'order.to', orderable: false},
                        { data: 'order.when' },
                        { data: 'order.phone', orderable: false},
                        { data: 'status' },
                        // { data: '' , orderable: false}
                    ]
                },
            },

            listClickListeners = new Array(),
            dataTable = null,
            $table = null,
            container = null,

            init, addButtonClickListener, repaintTable, addClickListener,

            subscribeToSocketEvents, renderPerformer, renderData


        init = function ($table) {
            console.log('spa.table > init');
            $table = $table

            $.fn.dataTable.ext.errMode = 'throw';

            dataTable = $table.DataTable(config.options);

            subscribeToSocketEvents()

            $table.find('tbody').on( 'dblclick', 'tr', function (event) {
                event.stopPropagation()
                console.log('click')
                // var data = dataTable.row( $(this).closest('tr')).data();
                var data = dataTable.row( $(this)).data();
                // console.log(data);
                listClickListeners.forEach(function (call) {
                    call(data);
                });

                location.href = 'edit.html?mov_id='+data.id
            });

            $table.find('tbody').on( 'click', 'tr', function () {
                $table.find('tr').removeClass('select')
                $(this).addClass('select')
            });

        }

        renderPerformer = function(row) {
            //console.log('render')
            if (!row.performer || !row.performer.car)
                return 'не назначен';

            var data = row.performer;
            var srt = '<a id=' + data.id + ' href=\'#\'>'
                + '<span>' + data.employee.name + ' ' + data.employee.surname + '</span><br>'
                + '<span>' + data.car.car_brand + ' ' + data.car.state_number + '</span></a>';

            return srt;
        }

        renderData = function (row) {
            var when = row.order.when
            if (!when) return ''

            const mouth = [null,'января', 'февраля','марта', 'апреля', 'мая','июня', 'июля',
                'августа','сентября', 'октября','ноября', 'декабря']

            var m = mouth[when.substr(5, 2)%12]
            var d = when.substr(8,2) < 10 ? when.substr(8,2)%10 : when.substr(8,2)+' '
            var t = when.substr(11, 5)
            // 2018-03-17T12:00:00.000Z
            return d + m +'<br>'+t
        }

        repaintTable = function () {
            container.load('html/spa.table.html', function () {

                table = $(container).find('#movemetOrderTable');

                $.fn.dataTable.ext.errMode = 'throw';

                dataTable = table.DataTable(config.options);

                console.log('spa.table > repaintTable: after:DataTable');

                $(table).find('tbody').on( 'click', 'button', function () {
                    //console.log('click')
                    var data = dataTable.row( $(this).closest('tr')).data();
                    //console.log(data);
                    listClickListeners.forEach(function (call) {
                        call(data);
                    });
                } );
            });
        }

        subscribeToSocketEvents = function () {
            console.log('spa.table > subscribeToSocketEvents');

            socket.addUpdateOrderHandler(function (data) {
                console.log('addUpdateOrderHandler');
                console.log(data);
                var row = dataTable.row('#'+data.id);
                var rowData = row.data();
                rowData.order = data.order;
                row.data(rowData).draw(false);
            });

            socket.addUpdateMovementOrderHandler(function (data) {
                console.log('addUpdateMovementOrderHandler');
                if (data.completed == 1){
                    dataTable.row('#'+data.id).remove().draw()
                }
                var row = dataTable.row('#'+data.id);
                var rowData = row.data(data).draw(false);

            });

            socket.addNewOrderHandler(function (data) {
                console.log('addNewOrderHandler');
                dataTable.row.add(data).draw(false);
            });

        }

        addButtonClickListener = function(handler) {
            listClickListeners.push(handler);
        }


        return {
            init: init,
            addButtonClickListener: addButtonClickListener,
            repaintTable: repaintTable,

        }


    })()
