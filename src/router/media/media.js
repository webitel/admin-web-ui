var config = require(global["APP_ROOT_PATH"] + '/config/index.js');
var log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module);

module.exports = function(app) {
    app.route('/media')
        .get(function(req, res, next) {
            if (!req.session.user) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.cookie("sessionData", JSON.stringify(req.session.user), {});

            res.render("layout.jade", {
                role : req.session.user.role
            });
        })

        .post(function(req, res, next) {
            if (!req.session.user) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            if (req.session.user.role === "root") {
                res.render("media/mediaRoot.jade", {
                    role: req.session.user.role
                });
            }
            else if (req.session.user.role === "admin") {
                res.render("media/mediaAdmin.jade", {
                    role: req.session.user.role
                });
            }
            else if (req.session.user.role === "user") {
                res.render("media/mediaUser.jade", {
                    role: req.session.user.role
                });
            }
        })
};