/**
 * REQUIRED
 *
 * Основне призначення: збереження налаштувань для UI
 * Модуль визначає, що можна використовувати як сховище і надалі постійно працює із ним
 *
 * localStorage
 * Cookie
 * htmlText - не використовується
 *
 * Якщо модуль не може оприділитися із сховищем, він генерує помилку. Подальша робота неможлива
 */

/**
 *
 * loginForm - зберігє дані форми входу(чи потрібно зберігати пароль !!!???)
 */


define(["alert"], function(alert) {

    var usedStorage = "";

    defineStorage(function(){});

    //  Якщо сховище не визначенне, тоді викликається цей метод. Спочатку перевіряємо LocalStorage, Cookie
    function defineStorage(callback) {

        if ( checkLocalStorage() ) {
            usedStorage = "LS";         //  LS - LocalStorage
            callback();
        } else if ( checkCookie() ) {
            usedStorage = "CK";         //  CK - Cookie
            callback();
        } else {
            alert.error("", "Unavailable storage (LocalStorage, Cookie). Further work is impossible. Please, change browser or enable Cookie", null);
            throw new Error('Unavailable storage (LocalStorage, Cookie). Further work is impossible. Please, change browser or enable Cookie');
        }

        function checkLocalStorage() {
            var mod = 'modernizr';

            try {
                localStorage.setItem(mod, mod);
                localStorage.removeItem(mod);
                return true;
            } catch(e) {
                return false;
            }
        }
        //  Кукі це одна стрічка. maxSize = 4 Kb
        function checkCookie() {
            return navigator.cookieEnabled;
        }
    }

    //  витягнути із сховища дані по ключю
    function get(key, callback) {

        if ( !usedStorage ) {
            defineStorage(execute);
            return;
        }


        execute();
        function execute() {
            var result;

            switch(usedStorage) {
                case "LS":
                    if ( !localStorage[key] ) {
                        callback(undefined);
                        return;
                    }

                    try {
                        result = JSON.parse(localStorage[key]);
                        callback(result);
                        return;
                    } catch (e) {
                        console.error("Cannot parse JSON object from localStorage['" + key + "']");
                        //  localStorage.removeItem(key);
                        callback(undefined);
                        return undefined;
                    }
                    break;

                case "CK":
                    var i,
                        cookie = document.cookie.split(";");

                    for ( i = 0; i < cookie.length; i++ ) {
                        if ( cookie[i].indexOf(key + "=") !== -1 ) {
                            result = cookie[i].replace(key + "=", "");

                            try {
                                result = JSON.parse(result);
                                callback(result);
                                return;
                            } catch (e) {
                                console.error("Cannot parse JSON object from Cookie['" + key + "']");
                                //  document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                                callback(undefined);
                                return;
                            }
                        }
                    }

                    callback(undefined);
                    return;
                    break;

            }
        }
    }

    //  зберегти дані в сховищі по ключю
    function set(key, dataJson) {

        if ( !usedStorage ) {
            defineStorage(execute);
            return;
        }

        execute();
        function execute() {
            switch(usedStorage) {
                case "LS":
                    localStorage.setItem(key, dataJson);
                    break;

                case "CK":
                    document.cookie = key + "=" + dataJson;
                    break;
            }

        }
    }


    /**
     *
     * @param options
     *      - useDecodeURIComponent розкодувати закодовані кукі
     */
    function getCookie(key, options) {
        var result,
            useDecodeURIComponent = false,
            i,
            cookie = document.cookie.split(";");

        if ( options ) {
            if ( options.useDecodeURIComponent ) {
                useDecodeURIComponent = true;
            }
        }

        for ( i = 0; i < cookie.length; i++ ) {
            if ( cookie[i].indexOf(key + "=") !== -1 ) {

                result = cookie[i].replace(key + "=", "");

                if ( useDecodeURIComponent ) {
                    result = decodeURIComponent(result);
                }


                try {
                    result = JSON.parse(result);
                    return result;
                } catch (e) {
                    console.error("Cannot parse JSON object from Cookie['" + key + "']");
                    //  document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    return undefined;
                }
            }
        }
        return undefined;
    }
    function remCookie(key) {
        document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    return {
        //  для роботи із сховищем
        get: get,
        set: set,

        //  суто для роботи із кукі
        getCookie: getCookie,
        remCookie: remCookie
    };
});
