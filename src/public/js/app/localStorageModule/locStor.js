

define("locStor", [], function() {

    /**
     * Додає в локальне сховище новий запис
     */
    function saveOne(key, value) {
        localStorage[key] = JSON.stringify(value);
    }

    /**
     * Витягує один запис по його ключу
     */
    function getOne(key) {
        var result;

        if (localStorage[key] != undefined) {
            try {
                result = JSON.parse(localStorage[key]);
                return result;
            } catch (e) {
                console.error("Cannot parse JSON object received from localStorage['" + key + "']. ");
                localStorage.removeItem(key);
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    return {
        saveOne: saveOne,
        getOne: getOne
    }
})