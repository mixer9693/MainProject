var express = require('express');
var router = express.Router();

var controller = require('../controller');
var autorize = require('../model').autorize;
var ROLE = require('../model').ROLE;

var passport = require('../passport');
router.use(passport.initialize());


router.post('/api/auth', passport.authenticate('local'),
    function (req, res) {res.json(req.user);}
)

router.post('/api/auth/refresh', controller.refreshTokens);


router.get('/api/movement-orders(/:id)?', passport.authenticate('jwt'),
    autorize([ROLE.MANAGER, ROLE.DRIVER]),
    function (req, res) {
        switch (req.user.role){
            case 'manager':
                controller.getMovementOrders(req, res)
                break
            case 'driver':
                req.query.performer_id = 0;
                controller.getMovementOrders(req, res)
                break
        }
    }
)

router.get('/api/performers(/:id)?', passport.authenticate('jwt'),
    autorize([ROLE.MANAGER, ROLE.DRIVER]),
    function (req, res) {
        switch (req.user.role) {
            case 'manager':
                controller.getPerformers(req, res)
                break
            case 'driver':
                req.query.employee_id = req.user.employee_id
                controller.getPerformers(req, res)
                break
        }
    }
)

router.get('/api/performers/:per_id/movement-orders(/:mov_id)?', passport.authenticate('jwt'),
    autorize([ROLE.MANAGER, ROLE.DRIVER]),
    function (req, res) {
        switch (req.user.role) {
            case 'manager':
                req.query.performer_id = req.params.per_id
                controller.getMovementOrders(req, res)
                break
            case 'driver':
                controller.getMyMovementOrders(req, res)
                break
        }
    }
)

router.post('/api/movement-orders/:id', passport.authenticate('jwt'),
    autorize([ROLE.MANAGER, ROLE.DRIVER]),
    function (req, res) {
        switch (req.user.role) {
            case 'manager':
                controller.updateMovementOrder(req, res)
                break
            case 'driver':
                controller.updateMyMovementOrder(req, res)
                break
        }
    }
)

router.post('/api/performers/:id', passport.authenticate('jwt'),
    autorize(ROLE.DRIVER),
    function (req, res) {
        controller.updateMePerformer(req, res)
    }
)

router.post('/api/performers/:id/set', passport.authenticate('jwt'),
    autorize(ROLE.DRIVER),
    function (req, res) {
        controller.performerSetIn(req, res)
    }
)

router.post('/api/performers/:id/reset', passport.authenticate('jwt'),
    autorize(ROLE.DRIVER),
    function (req, res) {
        controller.performerSetOut(req, res)
    }
)

router.post('/api/orders', passport.authenticate('jwt'),
    autorize(ROLE.MANAGER),
    function (req, res) {
        controller.createOrder(req, res)
    }
)

router.post('/api/orders:id', passport.authenticate('jwt'),
    autorize(ROLE.MANAGER),
    function (req, res) {
      controller.updateOrder(req, res)
    }
)






router.post('/api/test/post', function (req, res) {
    console.log('test/post')
    console.log(req.body)
})

var mod = require('../model');


// /* GET home page. */
// router.get('/', function(req, res, next) {
//     res.redirect('spa/index.html')
//     // res.render('index', { title: 'Express' });
// });

router.get('/', function (req, res) {
    console.log('////')
    res.redirect('/site/auth.html');
})

module.exports = router;
