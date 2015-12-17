/**
 * REQUIRED
 *
 * Модуль для зєднання по веб-сокету із Core сервером
 */

define("webitelConnector", ["webitelLib", "session", "alert"], function(_webitelLib, session, alert) {

    function autoConnect(callback) {

        var login;

        if ( session.getRole() === "root" ) {
            login = session.getLogin();
        } else {
            login = session.getLogin() + "@" + session.getDomain();
        }

        window.webitel = new Webitel({
              server : session.getWebSocket()
            , account: login
            , secret : session.getPass()
            , debug  : 1
            , reconnect: 15
        });

        webitel.onConnect(function(res) {
            console.info('%c Webitel connected! ', 'background: green; color: white');

            if ( callback ) {
                callback(res)
            }
        });

        webitel.onDisconnect(function(res) {
            if ( res ) {
                if ( res.response === "FreeSWITCH connect error." ) {
                    console.error('FreeSWITCH connect error');
                    alert.error("", "FreeSWITCH connect error", "");
                } else if ( res.login === "-ERR user not found\n" ) {
                    console.error(res.login);
                    alert.error("", res.login, "");
                }
                else {
                    console.error("Webitel disconnected. No handler for this error");
                    alert.error("", "Webitel disconnected. Unhandled error", "");
                }
            } else if ( res === undefined ) {
                console.error("WS ERR_CONNECTION_REFUSED to " + session.getWebSocket());
                alert.error("", "WS ERR_CONNECTION_REFUSED to " + session.getWebSocket(), "");
            } else {
                console.error("Webitel disconnected. Bad or empty response. Unhandled error");
                alert.error("", "Webitel disconnected. Bad or empty response. Unhandled error" + session.getWebSocket(), "");
            }
        });
        webitel.connect();
    }

    //  TODO краще щоб цей метод визивав модуль appRouter
    //autoConnect(function() {});

    return {
        autoConnect: autoConnect
    }
});