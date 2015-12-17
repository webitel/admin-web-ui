/**
 * TODO
 * 1. Закінчити з геолокацією, для визначення погоди (http://openweathermap.org/api)
 */


define("browser", [], function() {

    //  Чи підтримується в браузері клієнта localStorage
    function supportsHtml5Storage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    function isCookieEnabled() {
        return navigator.cookieEnabled;
    }


    /*******************************************************************************************************************
                                                  GEOLOCATION
             ___________________________________________________________________________________________
            |       |   IE  |  Firefox  |   Chrome  |   Safari  |   Opera   |   Safari iOS  |   Android |
            +===========================================================================================+
            |  MIN  |   9   |   3.5     |     5     |     5     |    10.6   |      3.2      |     2.1   |
            |===========================================================================================|
    *******************************************************************************************************************/
    function getBrowserGeolocation() {
        if (!navigator.geolocation) {
            console.eror("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(geolocSucc, geolocError, {
                                                                             "enableHighAccuracy": false,   //  use GPS
                                                                             "timeout"   : 0,
                                                                             "maximumAge": 0                //  ніколи не використовувати кешовані результати
                                                                          });

        function geolocSucc(position) {
            //  точність місцерозташування в метрах
            if (position.coords.accuracy > 50000) {
                //  Посетитель может быть где угодно на карте. This guess is all over the map.";
                return;
            }
        }
        function geolocError(err) {
            if (err.code === 1) {
                //  "Вы решили не предоставлять данные о своем местоположении, но это не проблема. Мы больше не будем запрашивать их у вас.";
                return;
            } else if (err.code === 2) {
                //  "Проблемы с сетью или нельзя связаться со службой определения местоположения по каким-либо другим причинам.";
            } else if (err.code === 3) {
                //  "Не удалось определить местоположение в течение установленного времени. ";
            } else {
                //  "Загадочная ошибка. Совершенно не понятно, что произошло.";
            }
        }
    }


    return {
        isLocalStorageSupport: supportsHtml5Storage,
        isCookieEnabled: isCookieEnabled
    }
});