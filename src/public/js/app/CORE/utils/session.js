/**
 * REQUIRED
 *
 * Основне призначення: легкий спосіб отримання потрібної інформації
 * Зберігає дані про юзера. Витягує їх із Cookie
 */


define(["storage", "alert"], function(storage, alert) {

    var login,
        pass,
        role,
        domain,
        webSocket,
        webitelServer,
        token,
        key,
        tokenExpire;


    //  витягнути ключ із сховища і по ключю отримати дані про юзера
    (function(){

        //  передати опцію, щоб розкодувати кукі
        var sessionData = storage.getCookie("sessionData", {
            "useDecodeURIComponent": true
        });

        //  видалити cookie
        storage.remCookie("sessionData");

        //  без цього обєкта, подальша робота неможлива
        if ( !sessionData ) {
            alert.error("", "Further work is impossible", "");
            throw new Error("Further work is impossible");
            return;
        }

        login  = sessionData.login || "";
        pass   = sessionData.pass || "";
        role   = sessionData.role || "";
        domain = sessionData.domain || "";
        webSocket     = sessionData.webSocket || "";
        webitelServer = sessionData.webitelServer || "";
        token = sessionData.token || "";
        key   = sessionData.key || "";
        tokenExpire = sessionData.tokenExpire || "";
    })();


    function getLogin() {
        return login;
    }
    function getPass() {
        return pass;
    }
    function getRole() {
        return role;
    }
    function setDomain(newDomain) {
        domain = newDomain;
    }
    function getDomain() {
        return domain;
    }
    function getWebSocket() {
        return webSocket;
    }
    function getWebitelServer() {
        return webitelServer;
    }
    function getToken() {
        return token;
    }
    function getKey() {
        return key;
    }
    function getTokenExpire() {
        return tokenExpire;
    }


    return {
        getLogin : getLogin,
        getPass  : getPass,
        getRole  : getRole,
        getDomain: getDomain,
        setDomain: setDomain,
        getWebSocket    : getWebSocket,
        getWebitelServer: getWebitelServer,
        getToken: getToken,
        getKey  : getKey,
        getTokenExpire: getTokenExpire
    }
});