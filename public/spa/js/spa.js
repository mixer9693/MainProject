

var spa = (function () {
    var
        config = {
            main_container: null,
            main_html: null,
            countMessages: 1
        },

        init, showMessage, selectTab;

    var ob1, ob2;

    init = function ($container) {
        console.log('spa > init');

        if (config.main_container)
            return config.main_container;

        config.main_container = $container;

        spa.auth.init(config.main_container).then(function (value) {
            console.log('spa > after:auth ');

            $.get('spa/html/spa.html').done(function (data) {
                config.main_html = data;
                $(config.main_container).html(config.main_html);

                console.log('spa > after:load index.html ');

                spa.socket.init();

                var tab1 = $(config.main_container).find('#tab1');
                var tab2 = $(config.main_container).find('#tab2');
                var tab3 = $(config.main_container).find('#tab3');

                selectTab(1);
                spa.table.init(tab1);

                spa.table.order2.init().then(function () {

                    var form = spa.table.order2.createForm(tab2);

                    form.addSubmitListener(function (data) {

                        spa.table.order2.createOrder(data).then(function (data) {
                            var head = 'Заказ № '+data.order_id+' создан';
                            var mes = '#'+data.id;
                            console.log(head + ' '+ mes);
                            spa.showMessage(head, mes, 'success');

                            spa.selectTab(1);

                        }).catch(function (err) {

                            var head = 'Ошибка!';
                            var mes = err;
                            console.log(head + ' '+ mes);
                            spa.showMessage(head, mes, 'danger');

                        });

                    });
                });


                spa.table.edit_page.init(tab3);


            }).fail(function (err) {
                showMessage('Это пиздец, ребята!', 'Мы все умрем...', 'danger');
                alert(err);
                console.log(err);
            });
        }).catch(function (reason) {
            alert(reason);
        });
    }

    selectTab = function(number) {
        $('.nav-tabs li a[href="#tab'+number+'"]').click()
    }

    showMessage = function (head, mes, type) {
        // console.log('spa > showMessage')
        var id = 'mes_'+config.countMessages;
        config.countMessages ++;

        var alertType = type ? 'alert-'+type : 'alert-info';

        var el = "<div id=\""+id+"\" class=\"alert "+alertType+"\" role=\"alert\">"+
                    "<a href=\"#\" class=\"close\" data-dismiss=\"alert\">×</a>"+
                    "<strong>"+head+"</strong> "+(mes? mes: '')+
                 "</div>";

        $('#notice-container').prepend(el).find('#'+id).delay(3000).hide('slow', function () {
            $(this).remove();
        });
    }


    return {
        init : init,
        showMessage: showMessage,
        selectTab: selectTab,
    }

})();
