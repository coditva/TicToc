var fs = require('fs');
var validate = require('validator');
var Team = require('./models/team.js');

module.exports = function (app, passport) {

    var appData = JSON.parse(fs.readFileSync('./config/appData.json'));
    
    // Handle GET requests
    
    app.get('/', function (req, res) {
        if (req.isAuthenticated()) {
            var data = appData;
            data.team = req.user;
            res.render('index.ejs', data);
        }else{
            res.render('index_loggedout.ejs', appData);
        }
    });

    app.get('/login', isLoggedOut, function (req, res) {
        appData.message = "Put a message in me";
        res.render('login.ejs', appData);
    });

    app.get('/signup', isLoggedOut, function (req, res) {
        appData.message = "Put a message in me";
        res.render('signup.ejs', appData);
    });

    app.get('/signup/step2', inStepTwo, function (req, res) {
        appData.message = "Put a message in me";
        var data = appData;
        data.team = req.user;
        res.render('signup_step2.ejs', data);
    });

    app.get('/profile', isLoggedIn, function (req, res) {
        if (req.user.local.username == "admin") {
            res.redirect('/admin');
        }else{
            var data = appData;
            data.team = req.user;
            res.render('profile.ejs', data);
        }
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/admin', isAdmin, function (req, res) {
        var data = appData;
        data.team = req.user;
        data.content = "this";
        res.render('admin.ejs', data);
    });

    // Handle POST requests

    app.post('/login', isLoggedOut, passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login?failed',
    }));

    app.post('/signup', isLoggedOut, passport.authenticate('local-signup', {
        successRedirect: '/signup/step2',
        failureRedirect: '/signup?failed',
    }));

    app.post('/checkanswer', isLoggedIn, function(req, res){
        // Validate data
        var answer = validate.trim(req.body.answer);
        var error = validate.isEmpty(answer);
        error += validate.isAlphanumeric(answer) ? 0 : 1;

        if (error) {
            res.redirect('/?wrongAnswer');
        } else {
            var questions = JSON.parse(fs.readFileSync('./config/questions.json'));
            var correctAnswer = questions[req.user.local.game.level].answer;
            if (answer == correctAnswer) {
                // Run query to increase level
                var query = { 'local.username': req.user.local.username };
                var update = { $set: { 'local.game.level': req.user.local.game.level + 1 } };
                var options = { strict: false };

                Team.update(query, update, options, function(err){
                    if (err) {
                        res.redirect('/?err');
                    }else{
                        res.redirect('/?success');
                    }
                });
            }else{
                res.redirect('/?wrongAnswer');
            }
        }
    });

    app.post('/signup/step2', inStepTwo, function(req, res){

        // Validate data
        var i = 0;
        var error = 0;
        while(i < 4){
            req.body.member[i] = validate.trim(req.body.member[i]);
            error += validate.isEmpty(req.body.member[i]);
            error += !validate.isAlphanumeric(req.body.member[i]);
            i++;
        }
        error += validate.isEmpty(req.body.phone);


        if(error){
            res.redirect('/signup/step2?failed');
        }else{

            var i = 0;
            var members = [];
            while(i < 4){
                members.push(req.body.member[i++]);
            }

            var query = { 'local.username': req.user.local.username };
            var update = {
                $set: {'local.phone': req.body.phone, 'local.status': 1},
                $push: { 'local.member': {$each: members }}
            };
            var opts = { strict: false };

            Team.update(query, update, opts, function (err) {
                if (err) {
                    res.redirect('/signup/step2?failed');
                } else {
                    res.redirect('/profile');
                }
            });
        }
    });
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect('/login?notAuth');
}

function isLoggedOut(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }

    res.redirect('/profile');
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.local.username == "admin") {
        return next();
    }

    res.redirect('/profile');
}

function inStepTwo(req, res, next) {
    if (req.isAuthenticated() && req.user.local.status == 0) {
        return next();
    }

    res.redirect('/profile');
}
