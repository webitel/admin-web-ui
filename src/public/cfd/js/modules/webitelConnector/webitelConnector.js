/**
 * TODO працюєм тільки з одним default extension з іменем cfdTest
 */


define("webitelConnector", ["webitelLib"], function(webitelLib) {


    var webitelConn = {
        "username": "root",
        "password": "ROOT_PASSWORD",
        "domain": "makaron",
        "token": "",
        "key": "",
        "role": "",
        "expires": 0,

        //  згенерувати новий токен і ключ
        "genTokenKey": function(callback) {
            var
                coreLoginURI = "https://pre.webitel.com:10022/login",
                token,
                key,
                xhr,
                that = this;


            xhr = new XMLHttpRequest();
            xhr.open("POST", coreLoginURI, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                if ( xhr.status !== 200 ) {
                    return;
                }

                var
                    res = JSON.parse(xhr.response);

                that.token = res.token;
                that.key  = res.key;
                that.role = res.role;
                that.expires = res.expires;

                console.info('%c Auth token and key received ', 'background: green; color: white');

                if ( typeof callback === "function" ) {
                    callback();
                }
            };
            xhr.send(JSON.stringify({
                "username": this.username,
                "password": this.password
            }));

        },

        //  створити зєднання по вебсокету з Core сервером
        "makeWsConn": function() {
            var
                coreWsServerURI = "wss://pre.webitel.com:10022";

            window.webitel = new Webitel({
                server : coreWsServerURI,
                account: this.username,
                secret : this.password,
                debug  : 1,
                reconnect: 15
            });
            webitel.onConnect(function(res) {
                console.info('%c Webitel connected! ', 'background: green; color: white');
            });
            webitel.onDisconnect(function(res) {
                if ( res ) {
                    if ( res.response === "FreeSWITCH connect error." ) {
                        console.error('FreeSWITCH connect error');
                    }
                    else if ( res.login === "-ERR user not found\n" ) {
                        console.error(res.login);
                    }
                    else if ( res.login == "auth error: secret incorrect" ) {
                        console.error(res.login);
                    }
                    else {
                        console.error("Webitel disconnected. No handler for this error");
                    }
                } else if ( res === undefined ) {
                    console.error("WS ERR_CONNECTION_REFUSED to " + server);
                } else {
                    console.error("Webitel disconnected. Bad or empty response. Unhandled error");
                }
            });
            webitel.connect();
        },


        /** CallFlow. Work with default extensions in 'makaron' domain */
        "getEx": function(callback) {

            var
                coreServerURI = "https://pre.webitel.com:10022",
                xhr;

            xhr = new XMLHttpRequest();
            xhr.open("GET", coreServerURI + "/api/v2/routes/default" + "?domain=" + this.domain, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('x-access-token', this.token);
            xhr.setRequestHeader('x-key', this.key);
            xhr.onreadystatechange = function() {

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                if ( xhr.status !== 200 ) {
                    console.error(xhr.statusText);
                    return;
                }

                var
                    res = JSON.parse(xhr.response);

                _.each(res, function(extension, index, exList) {
                    if ( extension.name === "cfdTest" ) {
                        if ( typeof callback === "function" ) {
                            console.info('%c Extension has been load ', 'background: green; color: white');
                            callback(extension.callflow, extension.cfd);
                        }
                    }
                });

            };
            xhr.send();
        },
        "createEx": function(callflow, cfd) {

            var
                coreServerURI = "https://pre.webitel.com:10022",
                data,
                xhr;

            data = {
                "name": "cfdTest",
                "destination_number": "0000",
                "domain": this.domain,
                "order": "0",
                "timezone": "",
                "timezonename": "",
                "callflow": callflow || [],
                "cfd": cfd || []
            };

            xhr = new XMLHttpRequest();
            xhr.open("POST", coreServerURI + "/api/v2/routes/default", true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('x-access-token', this.token);
            xhr.setRequestHeader('x-key', this.key);
            xhr.onreadystatechange = function() {

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                if ( xhr.status !== 200 ) {
                    console.error(xhr.statusText);
                    return;
                }

                console.info('%c New extension has benn created ', 'background: green; color: white');
            };
            xhr.send(JSON.stringify(data));
        },
        "changeEx": function(callflow, cfd) {

            var
                coreServerURI = "https://pre.webitel.com:10022",
                data,
                xhr;

            data = {
                "name": "cfdTest",
                "destination_number": "0000",
                "domain": this.domain,
                "order": "0",
                "timezone": "",
                "timezonename": "",
                "callflow": callflow || [],
                "cfd": cfd || []
            };

            xhr = new XMLHttpRequest();
            xhr.open("PUT", coreServerURI + "/api/v2/routes/default" + "/55ae2c819c9af115005394c6", true);      //  + uuid
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('x-access-token', this.token);
            xhr.setRequestHeader('x-key', this.key);
            xhr.onreadystatechange = function() {

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                if ( xhr.status !== 200 ) {
                    console.error(xhr.statusText);
                    return;
                }
                console.info('%c Extension has benn saved ', 'background: green; color: white');
            };
            xhr.send(JSON.stringify(data));

        }
    };


    //window.webitelConn = webitelConn;

    //webitelConn.genTokenKey();

    return webitelConn;
});