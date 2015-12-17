var config = require(global["APP_ROOT_PATH"] + '/config/index.js');
var log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module);

module.exports = function(app) {
    app.route('/logout')
        .get(function(req, res, next) {
            //  видалити дані про користувача із сесії
            //  очищати кукі і локальне сховище
            req.session.user = undefined;
            res.redirect("/login");
        })
};
