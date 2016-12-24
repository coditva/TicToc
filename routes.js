var fs = require('fs');

module.exports = function (app, passport) {

    var appData = JSON.parse(fs.readFileSync('./config/appData.json'));
    
    // Handle GET requests
    
    app.get('/', function (req, res) {
        res.render('index.ejs', appData);
    });

    app.get('/login', function (req, res) {
        appData.message = "Put a message in me";
        res.render('login.ejs', appData);
    });

    app.get('/signup', function (req, res) {
        appData.message = "Put a message in me";
        res.render('signup.ejs', appData);
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        res.render('profile.ejs', {
            user: req.user
        });
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });



    // Handle POST requests

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login?failed',
    }));

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup?failed',
    }));


}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login');
}
