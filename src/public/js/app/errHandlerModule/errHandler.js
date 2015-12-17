/**
 * Модуль обробляє помилки від:
 *      - обєкта xhr
 *      - помилку в відповідь від Core сервера
 *      - помилки вебсокет зєднання
 *
 *
 *
 *      response: "{"status":400,"message":"Token Expired"}
 *      responseText: "{"status":400,"message":"Token Expired"}"
 */



define("errHandler", ["alert"], function(alert) {

    var c = console,
        a = alert;

    function handleXhr(code, xhr) {

        var res;

        if ( code === 400 ) {
            try { res = JSON.parse(xhr.responseText) } catch (e) {}

            if ( res ) {
                if ( res.status === 400 && res.message === "Token Expired" ) {

                } else {
                    console.error("Unhandled error. Error code=400. Check response message !");
                }
            } else {
                console.error("Unhandled error. Error code=400. Response from server is empty");
            }
        }
        else if ( code === 401 ) {
            c.error("You are unauthorized. Please, relogin");
            a.error("", "You are unauthorized. Please, relogin", 5000);
        }
        else if ( code === 500 ) {
            if ( xhr.statusText === "Internal Server Error" ) {
                try { res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return; }

                if ( res.info ) {
                    c.error(res.info);
                    a.error("", res.info, 5000);
                }
                else {
                    debugger;
                }
            }
            else {
                debugger;
            }
        }
    }

    function handleCore(coreResponse) {
        if ( coreResponse.info ) {
            if ( coreResponse.info === "-ERR Parse parameters!\n" ) {
                c.error(coreResponse.info);
                a.error("", coreResponse.info, 5000);
            }
            else if ( coreResponse.info === "-ERR queue Invalid [parameter] name!\n" ) {
                c.error(coreResponse.info);
                a.error("", coreResponse.info, 5000);
            }
            else if ( coreResponse.info === "-ERR Bad request: name or domain is required!\n" ) {
                c.error(coreResponse.info);
                a.error("", coreResponse.info, 5000);
            }
            else {
                c.error(coreResponse.info);
                a.error("", coreResponse.info, 5000);
            }
        }
        else {
            debugger;
        }
    }

    function handleWS() {

    }

    //  подумати чи потрібно !!!
    function handleJQueryAjax() {

    }





    function resCoreErr(errObj) {

        if ( errObj.status === 401 && errObj.message === "Invalid credentials" ) {
            c.error("Incorrect login or password. Invalid credentials");
            a.error("", "Incorrect login or password", null);
        }

    }


    return {
        handleXhr : handleXhr,
        handleCore: handleCore,
        handleWS  : handleWS,

        resCoreErr: resCoreErr
    }
});
