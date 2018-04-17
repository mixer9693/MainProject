

var message = (function () {

    var container, countMessages = 1,
        type = {SUCCESS: 'success', DANGER: 'danger', WARNING: 'warning', INFO: 'info'}

    var init, showMessage

    init = function ($container) {
        container = $container.addClass('message-container')
        return this
    }

    showMessage = function (head, mes, type) {
        // console.log('spa > showMessage')

        var id = 'mes_'+countMessages;
        countMessages ++;

        var alertType = type ? 'alert-'+type : 'alert-info';

        var el = "<div id=\""+id+"\" class=\"alert "+alertType+"\" role=\"alert\">"+
            "<a href=\"#\" class=\"close\" data-dismiss=\"alert\">×</a>"+
            "<strong>"+(head? head: '')+"</strong> "+(mes? mes: '')+
            "</div>";

        $('.message-container').prepend(el).find('#'+id).delay(3000).hide('slow', function () {
            $(this).remove();
        });

        return this
    }

    return {
        init: init,
        showMessage: showMessage,
        TYPE: type
    }

})()