/**
 * Модель форми авторизації. Валідує поля, відправляє запит на сервер
 */

/**
 * subscribe
 *      - viewRendered вюха відмальована(щоб знати коли вставляти дані в UI)
 */

define(["storage", "alert", "errHandler", "fieldValidator"],function(storage, alert, errHandler, validator) {


    var LoginModel = Backbone.Model.extend({
        "initialize": function(attributes, options) {
            console.info("LoginModel has been initialized");

            this.on("viewRendered", this.getDataFromStorage);
        },
        "defaults": {
            "login": {
                "currentValue": {
                    "value": "",
                    "isValid": false,
                    "errorMessage": "Field cannot be empty"
                },
                "changed": false,
                "validConf": ["isNotEmpty", "hasNotSpaces", "maxLength_50"]
            },
            "pass": {
                "currentValue": {
                    "value": "",
                    "isValid": true,
                    "errorMessage": ""
                },
                "changed": false,
                "validConf": ["hasNotSpaces", "maxLength_50"]
            },
            "webitelServer": {
                "currentValue": {
                    "value": "",
                    "isValid": false,
                    "errorMessage": "Field cannot be empty"
                },
                "changed": false,
                "validConf": ["isNotEmpty", "hasNotSpaces", "maxLength_50"]
            },
            "rememberMe": false
        },

        //  пробує витягнути дані із сховища, якщо дані присутні, засетати їх в модель. Викликається після рендерингу вюхи
        "getDataFromStorage": function() {
            var loginForm;

            storage.get("loginForm", function(data) {
                loginForm = data;
            });

            //  засетати або очистити дані із форми фходу
            if ( loginForm ) {
                if ( loginForm.rememberMe ) {
                    this.pasteDataToLoginForm(loginForm.login || "", loginForm.pass || "", loginForm.webitelServer || "");
                } else {
                    this.clearLoginForm();
                }
            }
        },
        "setDataToStorage": function(data) {
            storage.set("loginForm", JSON.stringify(data));
        },
        "pasteDataToLoginForm": function(login, pass, webitelServer) {
            //  вставити дані в форму входу
            $("#login").val(login);
            $("#password").val(pass);
            $("#webitelServer").val(webitelServer);

            //  зробити активним checkbox Remember Me
            $("#rememberMe")[0].checked = true;
            $("#rememberMe").parent().addClass("active");


            //  засетати дані в модель
            this.attributes.login.currentValue.value = login;
            this.attributes.login.currentValue.isValid = true;

            this.attributes.pass.currentValue.value = pass;
            this.attributes.pass.currentValue.isValid = true;

            this.attributes.webitelServer.currentValue.value = webitelServer;
            this.attributes.webitelServer.currentValue.isValid = true;

            this.attributes.rememberMe = true;
        },
        "clearLoginForm": function() {
            $("#login").val("");
            $("#password").val("");
            $("#webitelServer").val("");
        },

        "changeLogin": function(value, successCallback, errorCallback) {

            validator.config = {
                "login": this.get("login").validConf
            };
            validator.validate({
                "login": value
            });

            this.attributes.login.currentValue.value = value;
            this.attributes.login.changed = true;


            if ( validator.hasErrors() ) {
                this.attributes.login.currentValue.isValid = false;
                this.attributes.login.currentValue.errorMessage = validator.messages.login.msg;
                errorCallback(validator.messages.login.msg);
                return;
            }

            this.attributes.login.currentValue.isValid = true;
            this.attributes.login.currentValue.errorMessage = "";
            successCallback();
        },
        "changePass" : function(value, successCallback, errorCallback) {
            validator.config = {
                "pass": this.get("pass").validConf
            };
            validator.validate({
                "pass": value
            });

            this.attributes.pass.currentValue.value = value;
            this.attributes.pass.changed = true;

            if ( validator.hasErrors() ) {
                this.attributes.pass.currentValue.isValid = false;
                this.attributes.pass.currentValue.errorMessage = validator.messages.pass.msg;
                errorCallback(validator.messages.pass.msg);
                return;
            }

            this.attributes.pass.currentValue.isValid = true;
            this.attributes.pass.currentValue.errorMessage = "";
            successCallback();
        },
        "changeWebitelServer": function(value, successCallback, errorCallback) {
            validator.config = {
                "webitelServer": this.get("webitelServer").validConf
            };
            validator.validate({
                "webitelServer": value
            });

            this.attributes.webitelServer.currentValue.value = value;
            this.attributes.webitelServer.changed = true;

            if ( validator.hasErrors() ) {
                this.attributes.webitelServer.currentValue.isValid = false;
                this.attributes.webitelServer.currentValue.errorMessage = validator.messages.webitelServer.msg;
                errorCallback(validator.messages.webitelServer.msg);
                return;
            }

            this.attributes.webitelServer.currentValue.isValid = true;
            this.attributes.webitelServer.currentValue.errorMessage = "";
            successCallback();
        },
        "modifyWebitelServer": function(value) {
            //  якщо порт не вказаний, підставити дефолтний         :(\d+)?\/?$
            if ( !value.match(":(\\d+)?\\/?$") ) {
                value += ":10022";
            }

            //  якщо протокол вказаний як ws або wss, замінити його на http або https
            if ( value.indexOf("wss://") > -1 ) {
                value = value.replace("wss://", "https://");
            } else if ( value.indexOf("ws://") > -1 ) {
                value = value.replace("ws://", "http://");
            }

            //  якщо ніякий протокол не вказаний, добавити https
            if ( value.indexOf("://") === -1 ) {
                value = "https://" + value;
            }

            console.log(value);

            return value;
        },

        //  запит для проходження авторизації. Якщо помилка, попробувати тоді відправити запит на інший протокол http://
        "sendAuthOnHttps": function() {

            var formEl,
                errorEl,
                that = this,
                rememberMe = this.get("rememberMe");


            if ( !this.get("login").currentValue.isValid ) {
                if ( !this.get("login").changed ) {
                    formEl = $("#login").parent().parent();
                    errorEl = $(formEl).find("small");

                    $(formEl).addClass("warning");
                    $(errorEl).text(this.get("login").currentValue.errorMessage);
                }
            }
            if ( !this.get("pass").currentValue.isValid ) {
                if ( !this.get("pass").changed ) {
                    formEl = $("#password").parent().parent();
                    errorEl = $(formEl).find("small");

                    $(formEl).addClass("warning");
                    $(errorEl).text(this.get("pass").currentValue.errorMessage);
                }
            }
            if ( !this.get("webitelServer").currentValue.isValid ) {
                if ( !this.get("webitelServer").changed ) {
                    formEl = $("#webitelServer").parent().parent();
                    errorEl = $(formEl).find("small");

                    $(formEl).addClass("warning");
                    $(errorEl).text(this.get("webitelServer").currentValue.errorMessage);
                }
            }

            if ( !this.get("login").currentValue.isValid || !this.get("webitelServer").currentValue.isValid) {
                alert.warning("", "Fields  are not valid", 3000);
                return;
            }


            var login = this.get("login").currentValue.value,
                pass  = this.get("pass").currentValue.value,
                webitelServer  = this.modifyWebitelServer(this.get("webitelServer").currentValue.value);


            //  якщо адрес сервера вебітел на http, відправити інший запит
            if ( webitelServer.indexOf("http://") > 0 ) {
                that.sendAuthOnHttp.call(that, login, pass, webitelServer, rememberMe);
                return;
            }

            var xhr = new XMLHttpRequest();

            xhr.open("POST", window.location.href, true);
            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

            xhr.onreadystatechange = function() {
                if ( xhr.readyState !== 4 ) return;

                if ( xhr.status === 200 ) {
                    var response;

                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (e) {
                        alert.error("", "Cannot parse responseText received from server UI", null);
                        console.error("Cannot parse responseText received from server UI");
                        return;
                    }

                    if ( !response ) {
                        alert.error("", "Bad response from server UI. Check server UI code", null);
                        console.error("Bad response from server UI. Check server UI code");
                        return;
                    }


                    //  оброблення помилки від Core в форматі json
                    if ( response.status ) {
                        errHandler.resCoreErr(response);
                        return;
                    }

                    //  оброблення помилки сервера UI
                    if ( response.res === "-ERR" ) {
                        console.error(response.code + " " + response.message + ". " + "Error request from Server UI to Core" + " \nRequest info: " + response.desc);

                        if ( response.code === "ECONNRESET" ) {
                            console.log("Try connecting to http");
                            that.sendAuthOnHttp.call(that, login, pass, webitelServer, rememberMe);
                        } else if ( response.code === "ENOTFOUND" ) {
                            console.log("Try connecting to http");
                            that.sendAuthOnHttp.call(that, login, pass, webitelServer, rememberMe);
                        } else if ( response.code === "ECONNREFUSED") {
                            console.log("Try connecting to http");
                            that.sendAuthOnHttp.call(that, login, pass, webitelServer, rememberMe);
                        } else if ( response.code === "ETIMEDOUT" ) {
                            console.log("Try connecting to http");
                            that.sendAuthOnHttp.call(that, login, pass, webitelServer, rememberMe);
                        } else {
                            alert.error("", response.code + " " + response.message + ". " + "Error request from Server UI to Core", null);
                            //  console.error(response.code + " " + response.message + ". " + "Error request from Server UI to Core" + " \nRequest info: " + response.desc);
                            return;
                        }
                    }

                    if ( response.res === "+OK" ) {
                        alert.success("", "+OK", 3000);

                        //  зберегти дані в сховищі
                        that.setDataToStorage({
                            "login": login,
                            "pass": pass,
                            "webitelServer": webitelServer,
                            "rememberMe": rememberMe
                        });
                        window.location.replace("/statistics");
                    }
                }
                else if ( xhr.status === 500 ) {
                    alert.error("", "Server UI error. " + xhr.responseText, null);
                    console.error("Server UI error. " + xhr.responseText);
                }
                else {
                    alert.error("", "Unhandled error", null);
                    console.error("Unhandled error");
                }
            };
            xhr.timeout = 20000;
            xhr.ontimeout = function(e) {
                console.error("Request timeout");
                alert.error("", "Request timeout", 3000);
            };
            xhr.send(JSON.stringify({
                "login": login,
                "pass" : pass,
                "ws"   : webitelServer
            }));
        },
        "sendAuthOnHttp": function(login, pass, webitelServer, rememberMe) {

            var that = this,
                xhr = new XMLHttpRequest();

            if ( webitelServer.indexOf("https://") !== -1 ) {
                webitelServer = webitelServer.replace("https://", "http://");
            }


            xhr.open("POST", window.location.href, true);
            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

            xhr.onreadystatechange = function() {
                if ( xhr.readyState !== 4 ) return;

                if ( xhr.status === 200 ) {
                    var response;

                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (e) {
                        alert.error("", "Cannot parse responseText received from server UI", null);
                        console.error("Cannot parse responseText received from server UI");
                        return;
                    }

                    if ( !response ) {
                        alert.error("", "Bad response from server UI. Check server UI code", null);
                        console.error("", "Bad response from server UI. Check server UI code", null);
                        return;
                    }


                    //  оброблення помилки від Core в форматі json
                    if ( response.status ) {
                        errHandler.resCoreErr(response);
                        return;
                    }

                    //  оброблення помилки сервера UI
                    if ( response.res === "-ERR" ) {
                        alert.error("", response.code + " " + response.message + ". " + "Error request from Server UI to Core", null);
                        console.error(response.code + " " + response.message + ". " + "Error request from Server UI to Core" + " \nRequest info: " + response.desc);
                        return;
                    }

                    if ( response.res === "+OK" ) {
                        alert.success("", "+OK", 3000);

                        //  зберегти дані в сховищі
                        that.setDataToStorage({
                            "login": login,
                            "pass": pass,
                            "webitelServer": webitelServer,
                            "rememberMe": rememberMe
                        });
                        window.location.replace("/dashboard");
                    }
                }
                else if ( xhr.status === 500 ) {
                    alert.error("", "Server UI error. " + xhr.responseText, null);
                    console.error("Server UI error. " + xhr.responseText);
                }
                else {
                    alert.error("", "Unhandled error", null);
                    console.error("Unhandled error");
                }
            };
            xhr.timeout = 20000;
            xhr.ontimeout = function(e) {
                console.error("Request timeout");
                alert.error("", "Request timeout", 3000);
            };
            xhr.send(JSON.stringify({
                "login": login,
                "pass" : pass,
                "ws"   : webitelServer
            }));
        }
    });

    return LoginModel;
});
