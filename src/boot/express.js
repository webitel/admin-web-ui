var express      = require('express'),
    bodyParser   = require('body-parser'),
    session      = require('express-session'),
    config       = require(global["APP_ROOT_PATH"] + '/config/index.js'),
    cookieParser = require('cookie-parser'),
    favicon      = require('serve-favicon');


module.exports = function(app) {
    app.set('port', config.get('application:port'));
    app.set('view engine', "jade");
    app.set('views', global.APP_ROOT_PATH + "/views");

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use(session({
        secret: config.get('application:session:secret') || "default_secret",
        resave: false,
        saveUninitialized: false
    }));

    app.use(express.static(global["APP_ROOT_PATH"] + '/public'));
    app.use(favicon(global["APP_ROOT_PATH"] + '/public/img/favicon.ico'));
};