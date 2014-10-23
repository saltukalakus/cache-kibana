// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var swig         = require('swig');

var configDB = require('./config/database.js');
var rbac = require('./app/permissions'); //TODO: Temporary hack. This should be performed in system installation

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

// set .swg as the default extension
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');



// required for passport
console.log("Cookie secret: " + process.env.CACHE_COOKIE);
app.use(session({ secret: process.env.CACHE_COOKIE })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

var staticMiddleware = express.static(__dirname + '/../src');

app.use("/kibana", function(req, res, next) {
    if (req.isAuthenticated()) {
        staticMiddleware(req, res, next);
    } else {
        res.redirect('/login');
    }
});

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
