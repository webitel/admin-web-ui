var config = require(global["APP_ROOT_PATH"] + '/config/index.js'),
    log    = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module),
    request = require('request');

module.exports = function(app) {
    app.route('/login')
        .get(function(req, res, next) {

            if ( req.session.user )  {
                log.debug("Check user in session. User are in session. Request redirect=/dashboard");
                res.redirect('/dashboard');
                return;
            }

            //  res.status(401).render('login/login.jade');

            res.render('login/login.jade');
        })

        .post(function(req, res, next) {

            var login  = req.body.login || "",
                pass   = req.body.pass || "",
                webSer = req.body.ws || "",
                authURI;


            //  ECMAScript 6
            if ( !String.prototype.endsWith ) {
                Object.defineProperty(String.prototype, 'endsWith', {
                    value: function(searchString, position) {
                        var subjectString = this.toString();

                        if ( position === undefined || position > subjectString.length ) {
                            position = subjectString.length;
                        }

                        position -= searchString.length;
                        var lastIndex = subjectString.indexOf(searchString, position);
                        return lastIndex !== -1 && lastIndex === position;
                    }
                });
            }

            //
            if ( webSer.endsWith("/") ) {
                webSer = webSer.substring(0, webSer.length - 1)
            }
            authURI = webSer + "/login";


            request.post({
                url: authURI,
                body: JSON.stringify({
                    "username": login,
                    "password": pass
                }),
                followAllRedirects: true,
                maxRedirects: 25,
                timeout: 10000,
                headers: {
                    "Content-Type": "application/json"
                }
            },  function(err, requestRes, resBody) {
                var response,
                    token, key, tokenExpire,
                    role, domain,
                    webitelServer, webSocket;


                //  переважно спрацьовує коли Core сервер недоступний (помилка запиту)
                if ( err ) {
                    //  requestRes більш інформативний обєкт ніж err
                    if ( requestRes ) {
                        res.end(JSON.stringify({
                            res: "-ERR",
                            code: requestRes.statusCode,
                            message: requestRes.statusMessage,
                            desc: "URI=" + authURI + ", method=POST, " + " body={'username': " + login + ", 'password': " + pass + "}"
                        }));
                    } else {
                        res.end(JSON.stringify({
                            res: "-ERR",
                            code: err.code || "",
                            message: err.toString(),
                            desc: "URI=" + authURI + ", method=POST, " + " body={'username': " + login + ", 'password': " + pass + "}"
                        }));
                    }
                    return;
                }

                //  перевірка відповіді від Core (помилка запиту)
                if ( requestRes ) {
                    if ( requestRes.statusCode !== 200 ) {
                        res.end(JSON.stringify({
                            res: "-ERR",
                            code: requestRes.statusCode,
                            message: requestRes.statusMessage,
                            desc: "URI=" + authURI + ", method=POST, " + " body={'username': " + login + ", 'password': " + pass + "}"
                        }));
                        return;
                    }
                }

                //  відповідь від Core повинна бути в json
                try {
                    response = JSON.parse(resBody);
                } catch (e) {
                    res.status(500).send("Cannot parse JSON body received from Core. Request info: URI=" + authURI + ", method=POST, " + " body={'username': " + login + ", 'password': " + pass + "}");
                    return;
                }

                //  якщо відповідь від Core має властивіть Status, значить операція не виконалась. Помилка передається в UI для подальшої обробки
                if ( response.status ) {
                    res.end(resBody);
                    return;
                }

                token = response.token || "";
                key   = response.key || "";
                tokenExpire = response.expires || "";
                role   = response.roleName || "";
                domain = response.domain || "";
                webitelServer = webSer;

                if ( webitelServer.indexOf("https://") !== -1 ) {
                    webSocket = webitelServer.replace("https://", "wss://");
                } else {
                    webSocket = webitelServer.replace("http://", "ws://");
                }

                //  забарти домен із логіну
                if ( login.indexOf("@") !== -1 ) {
                    login = login.split("@")[0];
                }

                req.session.user = {
                    "login": login,
                    "pass" : pass,
                    "role" : role,
                    "domain": domain,
                    "webSocket"    : webSocket,
                    "webitelServer": webitelServer,
                    "token": token,
                    "key"  : key,
                    "tokenExpire": tokenExpire,
                    "acl": response.acl
                };

                res.end(JSON.stringify({
                    res: "+OK"
                }));
            });
        })
};
