var
    config = require(global["APP_ROOT_PATH"] + '/config/index.js'),
    log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module),
    client = require(global["APP_ROOT_PATH"] + '/middleware/callflow'),
    request = require("request");


module.exports = function(app) {
    app.route('/callflow')
        .get(function(req, res, next) {

            if ( !req.session.user ) {
                log.debug("Check user in session. User are not in session. Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.cookie("sessionData", JSON.stringify(req.session.user), {});

            if ( req.query.reloadPage == "false" ) {
                res.render("callflow/callflowPartial.jade", {
                    domain: req.session.user['domain'],
                    role  : req.session.user['role']
                });
                return;
            }
            res.render("callflow/callflow.jade", {
                domain: req.session.user['domain'],
                role  : req.session.user['role']
            });
        })

        .post(function(req, res, next) {
            if (!req.session.user) {
                log.debug("Check user in session. User are not in session. Request redirect=/login");
                res.redirect('/login');
                return;
            };

            res.render('callflow/callflowPartial.jade', {
                domain: req.session.user['domain'],
                role  : req.session.user['role']
            });
        });

    app.route('/callflow/data/routes/public?:domain')
        .get(function (req, res, next) {
            try {
                client.getPublic(req.session.user, req.query['domain'], function (err, data) {
                    if (err) {
                        return next(err);
                    };
                    try {
                        res.json(JSON.parse(data));
                    } catch (e){
                        next(e);
                    };
                });
            } catch (e) {
                next(e)
            }
        })
        .post(function (req, res, next) {
            try {
                client.postPublic(req.session.user, req.body, function (err, response) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    ;
                    res.status(200).send(response);
                });
            } catch (e) {
                next(e)
            }
        })
        .put(function (req, res, next) {
            try {
                client.putPublic(req.session.user, req.query['id'], req.body, function (err, response) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    ;
                    res.status(200).send(response);
                });
            } catch (e) {
                next(e)
            };
        });

    app.delete('/callflow/data/routes/public/:id', function (req, res, next) {
        try {
            if (!req.params['id']) {
                return res.status(400).send('Bad request!');
            };
            client.deletePublic(req.session.user, req.params['id'], function (err, response) {
                if (err) {
                    return res.status(500).send(err.message);
                }
                ;
                res.status(200).end();
            });
        } catch (e) {
            next(e)
        }
    });

    app.route('/callflow/data/routes/default?:domain')
        .get(function (req, res, next) {
            try {
                client.getDefault(req.session.user, req.query['domain'], function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    ;
                    try {
                        res.json(JSON.parse(data));
                    } catch (e){
                        next(e);
                    };
                });
            } catch (e) {
                next(e)
            }
        })
        .post(function (req, res, next) {
            try {
                client.postDefault(req.session.user, req.body, function (err, response) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    ;
                    res.status(200).send(response);
                });
            } catch (e) {
                next(e)
            }
        })
        .put(function (req, res, next) {
            try {
                client.putDefault(req.session.user, req.query['id'], req.body, function (err, response) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    ;
                    res.status(200).send(response);
                });
            } catch (e) {
                next(e)
            }
        });

    app.put('/callflow/data/routes/default/:domainName/incOrder', function (req, res, next) {
        if (!req.params['domainName']) {
            return res.status(400).send('Bad request!');
        };
        client.incOrderDefault(req.session.user, req.params['domainName'], req['body'], function (err, result) {
            if (err) {
                next(err);
                return;
            };
            res.status(200).send(result);
        });
    });

    app.put('/callflow/data/routes/default/:id/setOrder', function (req, res, next) {
        if (!req.params['id']) {
            return res.status(400).send('Bad request!');
        };
        client.setOrderDefault(req.session.user, req.params['id'], req['body']['order'], function (err, result) {
            if (err) {
                next(err);
                return;
            };
            res.status(200).send(result);
        });
    });

    app.delete('/callflow/data/routes/default/:id', function (req, res, next) {
        try {
            if (!req.params['id']) {
                return res.status(400).send('Bad request!');
            }
            ;
            client.deleteDefault(req.session.user, req.params['id'], function (err, response) {
                if (err) {
                    return res.status(500).send(err.message);
                }
                ;
                res.status(200).end();
            });
        } catch (e) {
            next(e)
        }
    });


    /** EXTENSION */
    app.route('/callflow/data/routes/extension?:domain')
        .get(function(req, res, next) {
            try {
                client.getExtension(req.session.user, req.query['domain'], function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    try {
                        res.json(JSON.parse(data));
                    } catch (e){
                        next(e);
                    }
                })
            } catch (e) {
                next(e)
            }
        })

        .put(function(req, res, next) {
            try {
                client.putExtension(req.session.user, req.query['id'], req.body, function (err, response) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    res.status(200).send(response);
                });
            } catch (e) {
                next(e)
            }
        });


    /** VARIABLES */
    app.route('/callflow/data/routes/variables?:domain')
        .get(function(req, res, next) {
            try {
                client.getVariables(req.session.user, req.query['domain'], function (err, data) {
                    if (err) {
                        return next(err);
                    }
                    try {
                        res.json(JSON.parse(data));
                    } catch (e){
                        next(e);
                    }
                })
            } catch (e) {
                next(e)
            }
        })

        .put(function(req, res, next) {
            try {
                client.putVariables(req.session.user, req.query['domain'], req.body, function (err, response) {
                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    res.status(200).send(response);
                });
            } catch (e) {
                next(e)
            }
        });





    /**
     * CallFlow Designer
     */

    //  TODO можна зробити так, щоб передавати ще токен і ключ. Тоді не потрібно буде проходити логін в UI
    //  відгружає на клієнт розмітку і всі необхідні модулі для дизайнера
    app.route('/callflow/designer')
        .get(function(req, res, next) {

            if ( !req.session.user ) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            res.render("callflow/cfd/cfd.jade");
        });


    //  опрацьовує запит від дизайнера. Посилає запит на core, знаходить відповідний extension, повертає його дизайнеру
    app.route('/callflow/designer/extension')
        .get(function(req, res, next) {

            if ( !req.session.user ) {
                log.debug("User unauthorized! Request redirect=/login");
                res.redirect('/login');
                return;
            }

            var
                schema = req.query.schemaType || "",
                domain = req.query.domain || "",
                extensionID = req.query.id || "",

                webitelServer = req.session.user.webitelServer,
                token = req.session.user.token,
                key = req.session.user.key;

            if ( !schema || !extensionID || !domain ) {
                res.end(JSON.stringify({
                    "status": "-ERR",
                    "msg": "Bad request parameters. Schema, id, domain are required"
                }));
            }



            /**
             * DEFAULT
             */
            if ( schema === "default" ) {

                request.get(webitelServer + "/api/v2/routes/default?domain=" + domain, {
                        "headers": {
                        "Content-Type": "application/json",
                        "x-access-token": token,
                        "x-key": key
                    }},
                    function(err, requestRes, resBody) {

                            var
                                coreRes,
                                i;

                            if ( !err && requestRes.statusCode === 200 ) {
                                try { coreRes = JSON.parse(resBody); } catch(e) {
                                    res.end(JSON.stringify({
                                        "status": "-ERR",
                                        "msg": "Cannot parse JSON"
                                    }));
                                }

                                //  цикл по всіх extensions, находимо потрібний по ID
                                for ( i = 0; i < coreRes.length; i++ ) {
                                    if ( coreRes[i]._id === extensionID ) {
                                        res.end(JSON.stringify({
                                            "status": "+OK",
                                            "msg": "",
                                            "data": coreRes[i]
                                        }));
                                        break;
                                    }
                                }

                                res.end(JSON.stringify({
                                    "status": "-ERR",
                                    "msg": "Extension with _id(" + extensionID + ") not found"
                                }));
                            }
                            else if ( requestRes.statusCode === 401 ) {
                                res.status(401).end(resBody);
                            }
                            else if ( requestRes.statusCode === 500 ) {
                                res.status(500).end(resBody);
                            }

                            res.end(JSON.stringify({
                                "status": "-ERR",
                                "msg": "Unhandled UI error"
                            }));
                        });
            }

            /**
             * PUBLIC
             */
            else if ( schema === "public" ) {
                res.end(JSON.stringify({
                    "status": "-ERR",
                    "msg": "Not implemented"
                }));
            }

            /**
             * EXTENSIONS
             */
            else if ( schema === "extensions" ) {
                res.end(JSON.stringify({
                    "status": "-ERR",
                    "msg": "Not implemented"
                }));
            }
        })
};









