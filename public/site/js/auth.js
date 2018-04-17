

var auth = (function () {

    var timeOutId

    var init, getToken, checkAuthentication, serialize, authenticate, setSession, setWorkingState,
        showError, validate

    var getSession, setTimeOutRefresh,
        hasExpired, isAuthenticated, refreshToken

    init = function () {
        var session = getSession()
        if (session) {
            setWorkingState();
            // setTimeOutRefresh(session.expiresIn)
            return true
        }
        if (location.pathname != '/site/auth.html')
            location.href = '/site/auth.html'
    }

    serialize = function ($form) {
        var login = $form.find('input[name=login]').val();
        var password = $form.find('input[name=password]').val();
        return {login: login, password: password}
    }

    authenticate = function (userData) {
        return new Promise(function (resolve, reject) {
            console.log('authenticate')
            if (!userData.login || !userData.password)
                reject('Переданы не все аргументы')

            $.post('/api/auth', userData).done(function (data) {
                console.log(data)
                if (data.role == 'manager')
                    resolve(data)
                reject({status: 403})

            }).fail(function (err) {
                reject(err)
                throw Error(err);
            })
        })
    }

    setWorkingState = function () {
        $.ajaxSetup({
            beforeSend: function(request) {
                console.log('   *beforeSend')
                request.setRequestHeader("Authorization", 'Bearer '+ getToken());
            }
        })

        setTimeOutRefresh(getSession().expiresIn)
    }

    setTimeOutRefresh = function (expiresIn) {
        //console.log('setTimeOutRefresh')
        clearTimeout(timeOutId);
        var timeNow = Math.floor(Date.now()/1000);
        var timeOut = (expiresIn - timeNow - 10)*1000;
        timeOutId = setTimeout(refreshToken, timeOut);
    }

    setSession = function (JWT) {
        sessionStorage.setItem('accessToken', JWT.accessToken)
        sessionStorage.setItem('refreshToken', JWT.refreshToken)
        sessionStorage.setItem('expiresIn', JWT.expiresIn)
    }

    getSession = function () {
        var accessToken = sessionStorage.getItem('accessToken')
        var refreshToken = sessionStorage.getItem('refreshToken')
        var expiresIn = sessionStorage.getItem('expiresIn')
        if (accessToken && refreshToken && expiresIn)
            return{
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresIn: expiresIn
            }
    }

    isAuthenticated = function () {
        if (sessionStorage.getItem('accessToken'))
            return !hasExpired(sessionStorage.getItem('expiresIn'))
        return false;
    }

    getToken = function () {
        if (isAuthenticated()) {
            console.log('   *token good')
            return sessionStorage.getItem('accessToken')
        }
        console.log('   *token bad')
        return false
    }

    hasExpired = function (expiresIn) {
        var timeNow = Math.floor(Date.now()/1000);
        return timeNow > expiresIn -2
    }

    refreshToken = function () {
        console.log('refreshToken');
        return new Promise(function (resolve, reject) {

            var data = {
                refresh_token: sessionStorage.getItem('refreshToken')
            }

            $.post('/api/auth/refresh', data).done(function (data) {
                setSession(data)
                setTimeOutRefresh(data.expiresIn)

                resolve();

            }).fail(function (err) {
                console.log('Не удается обновить токен')
                sessionStorage.clear();
                location.href = '/site/auth.html'
                reject(err);
                // throw Error('Не удается обновить токен' + err);
            });

        })
    }

    checkAuthentication = function () {
        console.log('auth > checkAuthentication')
        if (getSession()) return true
        return false
    }

    showError = function ($form, message) {
        var alert = $form.find('#form-message')
        if (message)
            alert.show(300).text(message)
        else
            alert.hide()
    }

    validate = function ($form) {
        var login = $form.find('input[name=login]').val();
        var password = $form.find('input[name=password]').val();

        if (!login || !password ) {
            var mes = 'Не все поля заполнены'
            showError($form, mes)
            return false
        }
        return true
    }


    return{
        authenticate: authenticate,
        getToken: getToken,
        checkAuthentication: checkAuthentication,
        serialize: serialize,
        setSession: setSession,
        init: init,
        setWorkingState: setWorkingState,
        showError: showError,
        validate: validate
    }

})()