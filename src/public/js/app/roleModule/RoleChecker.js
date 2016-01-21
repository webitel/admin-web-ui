/**
 * Created by s.fedyuk on 20.01.2016.
 */
define("roleChecker",["session"], function(session) {

    // всі можливі ресурси для ролей
    var roleResources = ["account",
                              "acl/resource",
                              "acl/roles",
                              "blackList",
                              "book",
                              "cc/members",
                              "cc/queue",
                              "cc/tiers",
                              "cdr",
                              "cdr/files",
                              "cdr/media",
                              "channels",
                              "domain",
                              "domain/item",
                              "gateway",
                              "gateway/profiles",
                              "outbound/list",
                              "rotes/default",
                              "rotes/domain",
                              "rotes/extension",
                              "rotes/public",
                              "system/reload"];

    // всі можливі операції для ролей
    var operations = ["c", "u", "r", "d", "co", "uo", "ro", "do"];

    var currentAcl = session.getAcl();

    // повертає чи можна виконати дану операцію для поточного користувача
    function checkPermission(operation, resourceName) {

        // якщо поточний користувач немає ресурсів для ролей
        if(Object.getOwnPropertyNames(currentAcl).length == 0) {

            throw new Error("Current user does not have acl resources");
        }

        else {

            // чи доступний ресурс для поточного користувача
            if(isResourseAvailable(resourceName)) {

                // чи доступна операція з відповідним ресорсом ролі для поточного користувача
                if(isOperationAvailable(resourceName, operation)) {

                    return true;
                }
            }
        }

        return false;

    }

    // перевіряє чи є конкретний ресурс ролі для поточного користувача адмінки
    function isResourseAvailable(resourceName) {

        // проходимя по всіх полях обєкта ресурсів ролі
        for(var resource in currentAcl) {

            // якщо поле ресурсу з таким іменем існує тоді повертаємо результат
            if(resource == resourceName) {

                return true;
            }
        }

        return false;
    }

    // перевіряє чи доступна операція для поточного користувпача
    function isOperationAvailable(resourceName, operation) {

        // проходимя по всіх операціях для ресурсів ролі
        for(var i = 0; i < currentAcl[resourceName].length; i++) {

            // якщо операція для поточного ресурсу ролі доступна
            if(currentAcl[resourceName][i] == operation) {

                return true;
            }
        }

        return false;
    }

    return {

        checkPermission: checkPermission
    }
});