

define("cookStor", [], function() {

    function saveInCookie(key, value) {
        document.cookie = key + "=" + JSON.stringify(value);
    }

    function getCookie(key) {
        var result,
            c,
            cookie = document.cookie.split(";");

        for (c = 0; c < cookie.length; c++) {
            if (cookie[c].indexOf(key + "=") != -1) {
                result = cookie[c].replace(key + "=", "");
                try {
                    result = JSON.parse(result);
                } catch (e) {
                    console.error("Cannot parse JSON object received from Cookie['" + key + "']. ");
                    clearCookie(key);
                    return undefined;
                }
                return result;
                break;
            }
        }

        return undefined;
    }

    function clearCookie(key) {
        document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    return {
        getCookie: getCookie,
        saveInCookie: saveInCookie,
        clearCookie: clearCookie
    }
})