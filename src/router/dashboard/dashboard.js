var config = require(global["APP_ROOT_PATH"] + '/config/index.js');
var log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module);

module.exports = function(app) {
    app.route('/')
        .get(function(req, res, next) {
            res.redirect("/dashboard");
        });

    app.route('/dashboard')
        .get(function(req, res, next) {
            if (!req.session.user) {
                log.debug("Check user in session. User are not in session. Request redirect=/login");
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
                log.debug("Check user in session. User are not in session. Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.render("dashboard/dashboardPartial.jade", {
                role: req.session.user.role
            });
        })
};