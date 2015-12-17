module.exports = function(app) {
    require(__dirname + '/login/login.js')(app);
    require(__dirname + '/dashboard/dashboard.js')(app);
    require(__dirname + '/account/account.js')(app);
    require(__dirname + '/gateways/gateways.js')(app);
    require(__dirname + '/statistics/statistics.js')(app);
    require(__dirname + '/callflow/callflow.js')(app);
    require(__dirname + '/logout/logout.js')(app);
    require(__dirname + '/profile/profile.js')(app);
    require(__dirname + '/media/media.js')(app);
    require(__dirname + '/acd/acd.js')(app);
    require(__dirname + '/cdr/cdr.js')(app);
};
