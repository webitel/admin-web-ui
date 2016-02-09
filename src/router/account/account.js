var config = require(global["APP_ROOT_PATH"] + '/config/index.js');
var log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module);

module.exports = function(app) {
    app.route('/account')
        .get(function(req, res, next) {
            if (!req.session.user) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.cookie("sessionData", JSON.stringify(req.session.user), {});

            res.render("layout.jade", {
                role: req.session.user.role
            });
        })

        .post(function(req, res, next) {
            if (!req.session.user) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.render("account/accRoot.jade", {
                role: req.session.user.role
            });

            /*if (req.session.user.role === "root") {
                res.render("account/accRoot.jade", {
                    role: req.session.user.role
                });
            }
            else if (req.session.user.role === "admin") {
                res.render("account/accAdmin.jade", {
                    role: req.session.user.role
                });
            }
            else if (req.session.user.role === "user") {
                res.render("account/accUser.jade", {
                    role: req.session.user.role
                });
            }
            else {
                res.render("account/accUser.jade", {
                    role: req.session.user.role
                });
            }*/
        })
};