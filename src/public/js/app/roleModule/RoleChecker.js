/**
 * Created by s.fedyuk on 20.01.2016.
 */
define("roleChecker",["session", "jquery"], function(session, jquery) {

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

    // операція яка показує доступ до всього
    var superAccess = "*";

    // поточні ресурси ролі для поточного користувача
    var currentAcl = session.getAcl();

    // повертає чи можна виконати дану операцію для поточного користувача
    function checkPermission(operation, resourceName) {

        // якщо поточний користувач немає ресурсів для ролей
        if(Object.getOwnPropertyNames(currentAcl).length == 0) {

            return false;
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
            if(currentAcl[resourceName][i] == operation || currentAcl[resourceName][i] == superAccess) {

                return true;
            }
        }

        return false;
    }

    var sectionPanel = {

        changeVisibilityLeftPanel: function() {

            // приховуємо розділ account
            this.hideSection("account", "account");

            // приховуємо розділ gateways
            this.hideSection("gateway", "gateways");

            // приховуємо розділ callflow
            this.hideCallflowSection();

            // приховуємо розділ cdr
            this.hideSection("cdr", "statistics");

            // приховуємо розділ media
            this.hideSection("cdr/media", "media");

            // приховуємо розділ acd
            this.hideSection("cc/queue", "acd");
        },

        hideSection: function(sectionName, sectionLink) {

            if(!(checkPermission("r", sectionName))) {

                // ховаємо конкретний розділ
                jquery("#mainnav-menu li a[href='/" + sectionLink + "']").parent().remove();

                return true;
            }

            return false;
        },

        hideCallflowSection: function() {

            var isHided = false;

            if(checkPermission("r", "rotes/domain")) {
                isHided = true;
            }
            if(checkPermission("r", "rotes/default")) {
                isHided = true;
            }
            if(checkPermission("r", "rotes/public")) {
                isHided = true;
            }
            if(checkPermission("r", "rotes/extension")) {
                isHided = true;
            }

            if(!isHided) {

                // приховуємо розділ якщо нема доступу до нього
                jquery("#mainnav-menu li a[href='/" + "callflow" + "']").parent().remove();
            }

        },

        hideDomainTab: function() {

            // перевіряємо чи користувач немає доступ до перегляду доменів
            if(!(checkPermission("r", "domain")||checkPermission("ro", "domain"))) {

                // приховуємо вкладку для перегляду доменів
                jquery(".accountTabs li a[isdomain='true']").hide();
            }
        }
    }

    var accountAccess = {

        // приховуємо кнопку для створення аккаунта
        hideCreateAccountButton: function() {

            var isAccountCreateAccess = checkPermission("c", "account");

            // якщо нема доступа на створення аккаунта
            if(!isAccountCreateAccess) {

                // приховуємо кнопку для створення аккаунта
                jquery(".addAccInTable").hide();
            }
        }
    }

    var domainAccess = {

        // приховуємо кнопку для створення аккаунта
        hideCreateDomainButton: function() {

            var isDomainCreateAccess = checkPermission("c", "domain/item");

            // якщо нема доступа на створення домена
            if(!isDomainCreateAccess) {

                // приховуємо кнопку для створення домена
                jquery("#.addNewDomainInTable").hide();
            }
        }
    }

    var mediaAccess = {

        // закриваємо доступ до кнопки додавання нових медіа файлів
        hideAddMediaButton: function() {

            // перевіряємо чи поточний користувач має досутп до додавання медіа файлів
            if(!checkPermission("c", "cdr/media")) {

                // приховуємо кнопку для додвання медіа файлів
                jquery(".addAudio").remove();
            }
        }
    }

    var gatewayAccess = {

        hideAddGatewayButton: function() {

            // перевіряємо чи поточний користувач має доступ до додавання
            if(!checkPermission("c", "gateway")) {

                // приховуємо кнопку для додавання
                jquery(".addGateway").remove();
            }
        }
    }

    var callflowAccess = {

        defaultPart: {

            hideAddButton: function() {

                // перевіряємо чи немає доступ до  для додавання callflow
                if(!checkPermission("c", "rotes/default")) {

                    // проиховуємо кнопку для додавання
                    jquery("#default-add-record").remove();
                }
            },

            hideTab: function() {

                if(!(checkPermission("r", "rotes/default"))) {

                    jquery("#default-tab-btn").hide();
                }
            }
        },
        publicPart: {

            hideAddButton: function() {

                // перевіряємо чи немає доступ до  для додавання callflow
                if(!checkPermission("c", "rotes/public")) {

                    // проиховуємо кнопку для додавання
                    jquery("#public-add-record").remove();
                }
            },

            hideTab: function() {

                if(!(checkPermission("r", "rotes/public"))) {

                    jquery("#public-tab-btn").hide();
                }
            }
        },
        extensionPart: {

            hideAddButton: function() {

                // перевіряємо чи немає доступ до  для додавання callflow
                if(!checkPermission("c", "rotes/extension")) {

                    // проиховуємо кнопку для додавання
                    jquery("#extension-add-record").remove();
                }
            },

            hideTab: function() {

                if(!(checkPermission("r", "rotes/extension"))) {

                    jquery("#extension-tab-btn").hide();
                }
            }
        },
        domainPart: {

            hideAddButton: function() {

                // перевіряємо чи немає доступу для додавання callflow domain
                if(!checkPermission("c", "rotes/domain")) {

                    // проиховуємо кнопку для додавання
                    jquery("#add-variables-btn").remove();
                }
            },

            hideVariablesButton: function() {

                // перевіряємо чи є доступ на перегляд варіблів
                if(!(checkPermission("r", "rotes/domain"))) {

                    // приховуємо доступ до кнопки варіаблів
                    jquery(".addVariablesBtn").remove();
                }
            },

            hideDeleteVariableButton: function() {

                // перевіряємо чи є доступ на перегляд варіблів
                if(!(checkPermission("d", "rotes/domain"))) {

                    // приховуємо доступ до кнопки варіаблів
                    jquery(".fa-remove").remove();
                }
            },


            hideFieldsForEditVariables: function() {

                // перевіряємо чи доступ до редагування варблів
                if(!(checkPermission("u", "rotes/domain"))) {

                    // приховуємо поля для редагування
                    jquery(".modal-body .form-control[variablestype='key']").attr("required", true);
                    jquery(".modal-body .form-control[variablestype='value']").attr("required", true);
                }
            }
        }

    }

    var acdAccess = {

        hideAddButton: function () {

            // перевіряємо чи є доступ до додавання нових черг
            if (!checkPermission("c", "cc/queue")) {

                // приховуємо доступ до кнопки додавання нової черги
                jquery(".add-acd-model").remove();
            }
        },
        hideRemoveButton: function () {

            // перевіряємо чи є доступ до видалення черг
            if (!(checkPermission("d", "cc/queue") || (checkPermission("do", "cc/queue")))) {

                // закриваємо досутп для видалення черг
                jquery(".remove-acd-model").remove();
            }
        },
        hideOnOffQueueButton: function () {

            // перевіряємо чи є доступ до видалення черг
            if (!(checkPermission("u", "cc/queue") || (checkPermission("uo", "cc/queue")))) {

                // закриваємо доступ для видалення черг
                jquery("label[class$='switch-label']").remove();
            }
        },
        hideSaveButton: function() {

            // перевіряємо чи є доступ на редагування черги
            if (!(checkPermission("u", "cc/queue") || (checkPermission("uo", "cc/queue")))) {

                // закриваємо доступ для видалення черг
                jquery(".acd-open-save").remove();
            }
        },
        hideTiersButtons: function() {

            // перевіряємо чи є доступ до редагування операторів
            if(!(checkPermission("u", "cc/tiers") ||(checkPermission("uo", "cc/tiers")))) {

                // закриваємо доступ для редагування операторів
                jquery(".move-all").remove();
                jquery(".move-selected").remove();
            }
        },
        hideTiersContent: function() {

            // перевіряємо чи є доступ до перегляду операторів
            if(!(checkPermission("r", "cc/tiers") ||(checkPermission("ro", "cc/tiers")))) {

                // закриваємо доступ для редагування операторів
                jquery("#allAgentsLoading").hide();
            }
        }
    }

    return {

        checkPermission: checkPermission,

        sectionPanel: sectionPanel,

        accountAccess: accountAccess,

        domainAccess: domainAccess,

        mediaAccess: mediaAccess,

        gatewayAccess: gatewayAccess,

        callflowAccess: callflowAccess,

        acdAccess: acdAccess
    }
});