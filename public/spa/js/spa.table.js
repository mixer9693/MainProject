
spa.table = (function () {
        var
            config = {
                options: {
                    ajax: {
                        url: '/api/movement-order/for-manager',
                        dataSrc: "",
                        // beforeSend: function(request) {
                        //     console.log('beforeSend')
                        //     request.setRequestHeader("Authorization", 'Bearer '+spa.auth.getToken());
                        // },
                    },
                    createdRow: function( row, data, dataIndex ) {
                        $(row).attr('id', data.id);
                    },
                    // select: {
                    //     style: 'os'
                    // },
                    scrollY: function () {
                        return '500px';
                    },
                    scrollX: true,
                    scrollCollapse: false,
                    paging: false,
                    order: [[2, "asc"], [ 0, "desc" ]],
                    language: {
                        search: 'Поиск'
                    },
                    columnDefs:[
                    {
                        targets: -1,
                        data: null,
                        defaultContent:  "<button>Открыть</button>"
                    },
                    {
                        targets: 7,

                        render: function (row, type, val, meta ) {
                            return renderPerformer(val);
                        }
                    },
                    ],

                    columns: [
                        { data: 'id'},
                        { data: 'order_id' },
                        { data: 'status' },
                        { data: 'order.from', orderable: false},
                        { data: 'order.to', orderable: false},
                        { data: 'order.when' },
                        { data: 'order.phone', orderable: false},
                        { data: ''},
                        { data: '' , orderable: false}
                    ]
                },
            },

            listClickListeners = new Array(),
            dataTable = null,
            table = null,
            container = null,

            init, addButtonClickListener, repaintTable, addClickListener,

            subscribeToSocketEvents, renderPerformer


        init = function ($container) {
            console.log('spa.table > init');
            container = $container;
            container.load('spa/html/spa.table.html', function () {
                console.log('spa.table > after:load spa.table.html');

                table = $(container).find('#movemetOrderTable');

                $.fn.dataTable.ext.errMode = 'throw';

                dataTable = table.DataTable(config.options);
                console.log('spa.table > init: after:DataTable');

                subscribeToSocketEvents()

                $(table).find('tbody').on( 'click', 'button', function () {
                    console.log('click')
                    var data = dataTable.row( $(this).closest('tr')).data();
                    // console.log(data);
                    listClickListeners.forEach(function (call) {
                        call(data);
                    });
                });

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

            spa.socket.addUpdateOrderHandler(function (data) {
                console.log('addUpdateOrderHandler');
                console.log(data);
                var row = dataTable.row('#'+data.id);
                var rowData = row.data();
                rowData.order = data.order;
                row.data(rowData).draw(false);
            });

            spa.socket.addUpdateMovementOrderHandler(function (data) {
                console.log('addUpdateMovementOrderHandler');
                var row = dataTable.row('#'+data.id);
                var rowData = row.data(data).draw(false);

            });

            spa.socket.addNewOrderHandler(function (data) {
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
            dataTable:dataTable
        }


    })()
