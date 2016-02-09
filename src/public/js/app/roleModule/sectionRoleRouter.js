/**
 * Created by s.fedyuk on 27.01.2016.
 */
define("sectionRoleRouter", [], function() {

    // операція яка показує доступ до всього
    var superAccess = "*";

    // повертає чи можна виконати дану операцію для поточного користувача
    function checkPermission(operation, resourceName, currentAcl) {

        // якщо поточний користувач немає ресурсів для ролей
        if(Object.getOwnPropertyNames(currentAcl).length == 0) {

            return false;
        }

        else {

            // чи доступний ресурс для поточного користувача
            if(isResourseAvailable(resourceName, currentAcl)) {

                // чи доступна операція з відповідним ресорсом ролі для поточного користувача
                if(isOperationAvailable(resourceName, operation, currentAcl)) {

                    return true;
                }
            }
        }

        return false;

    }

    // перевіряє чи є конкретний ресурс ролі для поточного користувача адмінки
    function isResourseAvailable(resourceName, currentAcl) {

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
    function isOperationAvailable(resourceName, operation, currentAcl) {

        // проходимя по всіх операціях для ресурсів ролі
        for(var i = 0; i < currentAcl[resourceName].length; i++) {

            // якщо операція для поточного ресурсу ролі доступна
            if(currentAcl[resourceName][i] == operation || currentAcl[resourceName][i] == superAccess) {

                return true;
            }
        }

        return false;
    }

    var routeAccess = {

        // знаходимо перший розділ на лівій панельці який доступний для користувача
        findFirstAvailableSection: function(currentAcl) {

            // колекція всіх можливих розділів у системі
            var availableSections =  {"account" : "account",
                "gateways" : "gateway",
                "callflow" : "callflow",
                "statistics" : "cdr",
                "media" : "media",
                "acd" : "acd"};

            // проходимся по всіх ресурсах ролі поточного користувача
            for(var availableSection in availableSections) {

                // якщо для ресурса є доступ на перегляд розділу
                if(checkPermission("r", availableSections[availableSection], currentAcl)) {

                    // повертаємо url для першого доступного для перегляду користувачем розділу
                    return availableSection;
                }
            }

            // якщо користувач взагалі немає доступу до будь якого розділу системи
            return "dashboard";
        }

    }

    return {
        routeAccess: routeAccess
    }
});