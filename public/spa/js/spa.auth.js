
spa.auth = (function () {
   var
       config = {
           timeOutId: 0,
           refreshPeriod: 14000*60
       },

       cache = {
           accessToken: null,
           refreshToken: null,
           expiresIn: 0,
           updating: false,
           container: null
       },

       listSubscribers = new Array(),

       init, getToken, authenticate, addUpdateTokenListener,
       isAuthenticated, refreshToken, hasExpired, sendUpdate, setCache, setTimeOutRefresh,
       serialize, showForm

       init = function ($container) {
           return new Promise(function (resolve, reject){
               console.log('spa.auth > init');
               cache.container = $container;

               showForm(function (err, data) {
                   if (err) {reject();}
                   else resolve(data);
               });
           });
       }

       getToken = function () {
            if (isAuthenticated()) {
                console.log('   *token good')
                return cache.accessToken;
            }
            console.log('   *token bad');
            return null;
       }

       serialize = function (form) {
          var login = $(form).find('input[name=login]').val();
          var password = $(form).find('input[name=password]').val();
          return {login: login, password: password}
       }

       showForm = function (callback) {
            //загрузить форму
           $.get('/spa/html/spa.auth.form.html').done(function (data) {

               $(cache.container).html(data);

               //подписаться на событие формы
               var form = $(cache.container).find('#spa-auth-form');
               form.on('submit', function (event) {
                   // console.log('spa.auth > showForm: submit')
                   var data = serialize(this);

                   //ауинтифицируем
                   authenticate(data.login, data.password).then(function (value) {
                      console.log('spa.auth > authenticate: done')
                      callback(null, {authenticate: true})

                   }).catch(function (reason) {
                     //добавить отображение ошибки на форму
                     var form = $(cache.container).find('.spa-auth-form').css('border', '1px solid red');
                   });
               });
           }).fail(function (err) { alert('error' + err);});
       }

       authenticate = function (login, password) {
            return new Promise(function (resolve, reject){
                if (!login || !password)
                    return reject('Переданы не все аргументы');

                cache.updating    = true;

                var data = {
                    login: login,
                    password: password
                }

                var inquiry = $.post('/api/auth', data);

                inquiry.done(function (data) {
                   setCache(data.accessToken, data.refreshToken, data.expiresIn);
                   cache.updating = false;

                    $.ajaxSetup({
                        beforeSend: function(request) {
                            console.log('   *beforeSend')
                            request.setRequestHeader("Authorization", 'Bearer '+ getToken());
                        }
                    });

                   setTimeOutRefresh(data.expiresIn);

                   return resolve();
                });

                inquiry.fail(function (err) {
                    cache.updating = false;
                    reject(err);
                });

            });
       }

       setTimeOutRefresh = function (expiresIn) {
           //console.log('setTimeOutRefresh')
           clearTimeout(config.timeOutId);
           var timeNow = Math.floor(Date.now()/1000);
           var timeOut = (expiresIn - timeNow - 10)*1000;
           config.timeOutId = setTimeout(refreshToken, timeOut);
       }

        addUpdateTokenListener = function (callback) {

          listSubscribers.push(callback);

          //если сейчас не обновляется, обновить
          if (!cache.updating)
              refreshToken().then(function (value) {
                  clearInterval(config.intervalId)
                  var intervalId = setInterval(refreshToken, config.refreshPeriod);
                  config.intervalId = intervalId;
              });
       }

       /* вспомогательные функции */

       refreshToken = function () {
           //console.log('refreshToken');
           return new Promise(function (resolve, reject) {
               cache.updating    = true;

               var data = {
                   refresh_token: cache.refreshToken
               }

               var inquiry = $.post('/api/auth/refresh', data);

               inquiry.done(function (data) {
                   setCache(data.accessToken, data.refreshToken, data.expiresIn);
                   cache.updating = false;

                   setTimeOutRefresh(data.expiresIn);

                   sendUpdate();
                   return resolve();
               });

               inquiry.fail(function (err) {
                   cache.updating = false;
                   //надо бы сообщить что не можем обновить токен
                   throw Error('Не удается обновить токен');
                   reject(err);
               });

           })
       }

       hasExpired = function (expiresIn) {
           var timeNow = Math.floor(Date.now()/1000);
           return timeNow > expiresIn -2
       }

       sendUpdate = function () {
           for (var i = 0; i < listSubscribers.length; i++){
               var call = listSubscribers.pop();
               call(cache.accessToken)
           }
       }

       setCache = function (accessToken, refreshToken, expiresIn) {
           cache.accessToken    = accessToken;
           cache.refreshToken   = refreshToken;
           cache.expiresIn      = expiresIn;
       }

       isAuthenticated = function () {
           if (cache.accessToken)
               return !hasExpired(cache.expiresIn)
           return false;
       }

       return {
           init:                   init,
           getToken:               getToken,
           authenticate:           authenticate,
           addUpdateTokenListener: addUpdateTokenListener,
           serialize: serialize,

       }

})($);