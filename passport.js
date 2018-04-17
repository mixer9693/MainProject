var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

const accessSecret = 'accessSecret';
var jwt =require('./jwt');
var model = require('./model');

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = accessSecret;
opts.ignoreExpiration = false; //false

passport.use('local', new LocalStrategy({
    usernameField: 'login',
    passwordField: 'password',
    session: false
},
    function (login, password, done) {
        console.log('LocalStrategy');
        model.authentication(login, password, function (err, data) {
            if (err)
                return done(null, false, {
                    message: 'Неверный логин или пароль'
                });
            else
                return done(null, data);
        });
    }
));

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    console.log('JwtStrategy');
    console.log(jwt_payload.exp);
    console.log(Math.floor(Date.now()/1000))
    return done(null, jwt_payload);
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});


module.exports = passport;