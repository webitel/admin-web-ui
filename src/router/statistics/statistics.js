
var config = require(global["APP_ROOT_PATH"] + '/config/index.js'),
    cdrCli = require(global["APP_ROOT_PATH"] + '/middleware/cdr/cdrClient.js');
    log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module);

module.exports = function(app) {

    //  зберігає дані, які прийшли від клієнта (фільтри, сторінки і т.п.)
    var param = {};

    app.route('/statistics')
        .get(function(req, res, next) {
            if (!req.session.user) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.cookie("sessionData", JSON.stringify(req.session.user), {});

            res.render("layout.jade", {
                role : req.session.user.role,
            });
        })

        .post(function(req, res, next) {
            //  якщо користувач не авторизований, значить він не збережений в сесії
            if (!req.session.user) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.render("statistics/statRoot.jade", {
                role: req.session.user.role
            });

            /*if (req.session.user.role === "root") {
                res.render("statistics/statRoot.jade", {
                    role: req.session.user.role
                });
            }
            else if (req.session.user.role === "admin") {
                res.render("statistics/statAdmin.jade", {
                    role: req.session.user.role
                });
            }
            else if (req.session.user.role === "user") {
                res.render("statistics/statUser.jade", {
                    role: req.session.user.role
                });
            }*/
        });

    app.route('/statistics/getData')
        .post(function(req, res, next) {
            log.info("Client request: method=" + req.method + ", url=" + req.url);

            var data;

            //  param : columns, filter, limit, offset, order, pageNumber, token, key
            param = req.body;
            param["token"] = req.session.user.token;
            param["key"] = req.session.user.key;
            param["webitelServer"] = req.session.user.webitelServer;

            //  отримати кількість записів статистики
            cdrCli.getListACount(param, function(err, resData) {
                if (err) {
                    errHandler(err.code, err.message);
                    return;
                }

                //  кількість записів записати в загальний обєкт і передати далі
                data = {
                    "recordsTotal"   : resData,
                    "recordsFiltered": resData
                };
                getListA();
            });

            //  отримати відфільтровану статистику
            function getListA() {
                cdrCli.getListA(param, function(err, resData) {
                    if (err) {
                        errHandler(err.code, err.message);
                        return;
                    }

                    data["rows"]           = resData;
                    data["total"]          = data.recordsTotal;
                    //  data["cdrServer"]      = global["CORE_SERVER_URL"];
                    data["cdrServer"]      = req.session.user.webitelServer;
                    data["x-access-token"] = param.token;
                    data["x-key"]          = param.key;

                    res.end(JSON.stringify(data));
                })
            }

            function errHandler(code, message) {
                if (code === 400) {
                    res.status(code).send(message);
                    return;
                }
                else if (code === 401) {
                    res.status(code).send(message);
                    return;
                } else if (code === 500) {
                    res.status(code).send(message);
                    return;
                } else if (code === 503) {
                    res.status(code).send(message);
                    return;
                } else {
                    res.status(code).send(message);
                    return;
                }
            }
        });

    app.route('/statistics/getCdrJSON')
        .post(function(req, res, next) {
            log.info("Client request: method=" + req.method + ", url=" + req.url);

            param = req.body;
            param["token"] = req.session.user.token;
            param["key"] = req.session.user.key;
            param["webitelServer"] = req.session.user.webitelServer;

            cdrCli.getCdrJSON(param, cb);
            function cb(err, cdrJSON) {

                if ( err ) {
                    errHandler(err.code, err.message);
                    return;
                }

                var response = JSON.parse(cdrJSON);

                //  якщо відповідь має статус, значить прийшов error
                if ( response.status ) {
                    errHandler(response.status, response.message);
                    return;
                }

                res.end(cdrJSON);
            }
            function errHandler(code, message) {
                if (code === 400) {
                    res.status(code).send(message);
                    return;
                }
                else if (code === 401) {
                    res.status(code).send(message);
                    return;
                } else if (code === 500) {
                    res.status(code).send(message);
                    return;
                } else if (code === 503) {
                    res.status(code).send(message);
                    return;
                } else {
                    res.status(code).send(message);
                    return;
                }
            }
        });


    //  TODO перевірити роботу над помилками
    app.route('/statistics/getDataForExcel')
        .post(function(req, res, next) {
            log.info("Client request: method=" + req.method + ", url=" + req.url);

            cdrCli.getDataForExcel({
                "webitelServer": req.session.user.webitelServer,
                "token": req.session.user.token,
                "key"  : req.session.user.key,
                "body" : req.body
            }, cb);
            function cb(err, response) {
                //
                if ( err ) {
                    res.end(JSON.stringify(err));
                    return;
                }

                res.end(JSON.stringify(response));
            }
        });

    app.route("/statistics/removeAudioRecord")
        .post(function(req, res, next) {
            log.info("Client request: method=" + req.method + ", url=" + req.url);

            cdrCli.delAudioRecord({
                "webitelServer": req.session.user.webitelServer,
                "token": req.session.user.token,
                "key"  : req.session.user.key,
                "body" : req.body
            }, cb);


            function cb(err, response) {
                //
                if ( err ) {
                    res.end(JSON.stringify(err));
                    return;
                }

                res.end(JSON.stringify(response));
            }
        });
};













