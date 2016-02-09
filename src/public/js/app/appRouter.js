/**
 * TODO перенести цей модуль до CORE модулів
 * Модуль маршрутизації
 *      - основне призначення розгрібати загрузку складних URI, з відкриттям потрібної карточки
 *      - підтримує стару маршрутизацію
 */


define("appRouter", [
            "session", "webitelConnector",
            "backbone",
            "errHandler",
            "OpenAcdModelView",
            "AcdModel",
            "webitelConnector",
            "fieldValidator",
            "alert"
    ],
    function(
            session, webitelConnector,
            backbone,
            errHandler,
            OpenAcdModelView,
            AcdModel,
            webitelConnector,
            fieldValidator,
            alert
    ) {

        var router,
            selectedDomains = [],
            bsDomainsTable;

        (function() {
            if ( !window.webitel ) {
                webitelConnector.autoConnect(init);
            } else {
                init();
            }
        }());


        function init() {

            initRouter();

            subscribeOnEvents();

            showDomainTable({
                "showModal": false
            });
        }


        function initRouter() {
            var Router = Backbone.Router.extend({
                "initialize": function() {
                    console.info("App router was initialized");
                },
                "routes": {
                    "dashboard" : "dashboard",
                    "account"   : "account",
                    "gateways"  : "gateways",
                    "callflow"  : "callflow",
                    "statistics": "statistics",
                    "media"     : "media",
                    "acd"       : "acd",
                    "cdr"       : "cdr",
                    "acd/open/:name": "openAcd",

                    "profile"   : "profile"
                },
                "dashboard" : function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/dashboard");
                },
                "account": function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/account");
                },
                "gateways": function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/gateways");
                },
                "callflow": function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/callflow");
                },
                "statistics": function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/statistics");
                },
                "media": function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/media");
                },
                "profile": function() {
                    $("body").trigger("destroyAcd");
                    loadPartialView("/profile");
                },
                "acd": function() {
                    //  підгрузити стилі до модуля і контейнери
                    require(["AcdSection"], function(AcdSection) {
                        AcdSection.createWebitel();
                    });
                },
                "openAcd": function(queueName, yriParams) {
                    $("body").trigger("destroyAcd");

                    var queueModel,
                        openQueueView;

                    //  check collection, find model in collection, render view for model
                    if ( app.collections.acdCollection ) {
                        queueModel = app.collections.acdCollection.findWhere({ "name": queueName });

                        //  кожного разу при ініціалізації вюхи, вона привязує функцію обробник на івент моделі.
                        //  Потрібно обовязково відписатися від усіх попередніх функції обробників
                        queueModel.off("paramsReceived");
                        queueModel.off("renderAgents");

                        openQueueView = new OpenAcdModelView({
                            "model": queueModel
                        });
                    }
                    //  create queue model, render view for model
                    else {

                        if ( !window.webitel ) {
                            webitelConnector.autoConnect(openQueue);
                        } else {
                            openQueue();
                        }

                        function openQueue() {
                            //  TODO improve it
                            queueModel = new AcdModel({
                                "name": queueName
                            }, {
                                "auth": {
                                    "domain": session.getDomain(),
                                    "token": session.getToken(),
                                    "key": session.getKey(),
                                    "host": session.getWebitelServer()
                                }
                            });

                            openQueueView = new OpenAcdModelView({
                                "model": queueModel
                            });
                        }
                    }
                },
                "cdr": function() {
                    $("body").trigger("destroyAcd");
                    $("#content-container").off();
                    $("#content-container").children().remove();
                    loadModule("CdrModule");
                }
            });

            router = new Router();
            window.app.router = router;

            Backbone.history.start({
                "pushState": true,
                "hashChange": false         //  перегружати повністю торінку, якщо не підтримується pushState
            }); 
        }


        //  Використовую лише для підтримки старого функціоналу  старого функціоналу
        //  Звертається на сервер для отримання часткового представлення. Результат вставляє в #content-container
        function loadPartialView(url) {

            changeActiveMenu($("#mainnav-menu").find("a[href='"+ url + "']")[0]);

            $.ajax({
                url: url,
                dataType: 'text',
                type: 'POST',
                success: function(data) {
                    document.getElementById("content-container").innerHTML = data;

                    if ( url === "/dashboard" ) {
                        //  ініціалізувати модуль dashboard
                    }
                    else if ( url === "/account" ) {
                        require(["accountSection"], function(accountSection) {
                            accountSection.createWebitel();
                        });
                    }
                    else if ( url === "/statistics" ) {

                        // показуємо що йде загрузка даних
                        $("#data-content").hide();
                        $("#loadText").show();
                        require(['angular', 'session'], function(angular, session) {

                            require(["StatisticModule"], function(statisticModule) {
                                statisticModule.init();

                                require(["statisticsSection"], function(statisticsSection) {
                                    statisticsSection.createWebitel();
                                });
                            });
                        });

                    }
                    else if ( url === "/callflow" ) {
                        require(["callflowSection"], function(callflowSection) {
                            callflowSection.createWebitel();
                        });
                    }
                    else if ( url === "/gateways" ) {
                        require(["gatewaySection"], function(gatewaySection) {
                            gatewaySection.createWebitel();
                        });
                    }
                    else if ( url === "/profile" ) {
                        require(["profilePage"], function(profilePage) {
                            profilePage.createWebitel();
                        });
                    }
                    else if ( url === "/media" ) {
                        require(["mediaSection"], function(mediaSection) {
                            mediaSection.createWebitel();
                        });
                    }
                    else if ( url === "/profile" ) {
                        require(["profilePage"], function (profilePage) {
                            profilePage.createWebitel();
                        });
                    }
                    /*else if ( url === "/cdr" ) {
                        require(["CdrModule"], function (CdrModule) {
                            CdrModule.init();
                        });
                    }*/
                },
                error: function(err) {
                    errHandler.handleXhr(err.status);
                }
            });
        }

        function loadModule(name) {
            require([name], function(module) {
                module.init();
            })
        }








        //  TODO винести в окремий модуль

        /**                                      ADDITIONAL FUNC FOR SELECT DOMAIN
         **************************************************************************************************************/
        function showDomainTable(options) {

            if ( session.getRole() !== "root" ) {
                return;
            }

            var showModal = true;

            if ( options ) {
                if ( options.showModal === false ) {
                    showModal = false;
                }
            }


            webitel.domainList(function(res) {
                if (res.status === 0) {
                    var domainData = this.parseDataTable();

                    //  якщо нема створених доменів, відобразити модальне вікно для створення домена
                    if ( domainData.data.length === 0 ) {
                        showModalWin();
                    }

                    var domainDataHeaders = prepareHeadersToDomTable(domainData.headers);
                    initDomTable(domainDataHeaders);

                    selectedDomains = prepareDataForLoadToDomTable(domainData.headers, domainData.data);

                    $(bsDomainsTable).bootstrapTable("load", selectedDomains);

                    //  в деякий випадках непотрібно показувати список домені, а тільки обновити його
                    if ( showModal ) {
                        $("#mainnav-domain-modal").modal("show");
                    }

                }
                else if (res.status === 1) {
                    alert.error(null, this.responseText, null);
                }
            });
        }
        function prepareHeadersToDomTable(headers) {
            var columnHead = [];
            for(var i = 0; i < headers.length; i++) {
                if (headers[i] === "domain") {
                    columnHead.push({
                        field: headers[i],
                        title: headers[i],
                        align: 'left',
                        valign: 'middle',
                        sortable: true,
                        formatter: function(value, row) {
                            return '<div class="tdDomainDiv" name="domain" value="' + value + '"></div>' + value;
                        }
                    });
                } else if (headers[i] === "customer") {
                    columnHead.push({
                        field: headers[i],
                        title: headers[i],
                        align: 'left',
                        valign: 'middle',
                        sortable: true
                    });
                }
                else {
                    columnHead.push({
                        field: headers[i],
                        title: headers[i],
                        align: 'center',
                        valign: 'middle',
                        sortable: true
                    });
                }
            }

            return columnHead;
        }
        function prepareDataForLoadToDomTable(headers, rows) {

            var rowsData = [];

            for(var i = 0; i < rows.length; i++) {

                var row = {};

                for(var j = 0; j < headers.length; j++) {
                    row[headers[j]] = rows[i][j];
                }

                rowsData.push(row);
            }
            return rowsData;
        }
        function initDomTable(domainColumns) {
            bsDomainsTable = $('#mainnav-domainListTable').bootstrapTable({
                cache: false,
                striped: true,
                pagination: true,
                pageSize: 10,
                pageList: [],
                search: true,
                columns: domainColumns
            });
        }


        /**                                      Перепиcати застарілі функції
         **************************************************************************************************************/

         function subscribeOnEvents() {
            //  Головне меню. Перехід між розділами
            $("#mainnav-menu a.main-manu-link").click(function(){

                if ( session.getRole() === "root" && !$(this.parentElement).hasClass("active-link")) {
                    $("#content-container").hide();
                }

                router.navigate($(this).attr("pushState"), {trigger: true});
                changeActiveMenu(this);
                return false;
            });

            //  меню для юзера. Відкривання додаткових сторінок
            $("#userDropdownMenu li.profile a").on("click", function(e) {
                router.navigate($(this).attr("pushState"), {trigger: true});
                changeActiveMenu(this);
                return false;
            });


            $("#logout").off("click");
            $("#logout").on("click", function(e) {
                var xhr,
                    xhrUrl;

                    xhr = new XMLHttpRequest();
                    xhrUrl = session.getWebitelServer() + "/logout";


                    xhr.open("POST", xhrUrl, true);
                    xhr.setRequestHeader("x-key", session.getKey());
                    xhr.setRequestHeader("x-access-token", session.getToken());
                    xhr.onreadystatechange = function() {
                        var res;

                        if (xhr.readyState != 4)
                            return;

                        if (this.status === 200) {
                            res = JSON.parse(this.responseText);
                            if (res.status === "OK") {
                                console.info(res.info);
                            } else {
                                console.error(res.info);
                            }
                        } else {
                            console.error("Bad request on core server. url=/logout, status=" + this.status + ", responseText=" + this.responseText);
                        }
                    };
                    xhr.send();
            });

            //  вибір домена
            $("#select-domain").off("click");
            $("#select-domain").on("click", function() {

                if (bsDomainsTable && selectedDomains.length > 0) {
                    $(bsDomainsTable).bootstrapTable("load", selectedDomains);
                    $("#mainnav-domain-modal").modal("show");
                    return;
                }
                showDomainTable();
            });

            //  двойний клік по lookup доменів.
            $('#mainnav-domainListTable').unbind("dblclick");
            $('#mainnav-domainListTable').bind("dblclick", function(e) {
                if ($(this).find("tbody tr:hover").length === 1) {
                    var tr = $(this).find("tbody tr:hover"),
                        domain = $(tr).find("td div").attr("value");

                    if ( domain ) {
                        $("#select-domain").text(domain);
                        $("#select-domain").attr("selectedDomain", domain);
                        //  генерить івент і передає вибраний домені
                        $("#select-domain").trigger("domainSelected", [domain]);

                        session.setDomain(domain);

                        var builder_import = $("#builder-import_export");
                        if(builder_import.length > 0) {
                            var prevRulesFilter = $("#builder-import_export").queryBuilder('getRules');
                            prevRulesFilter.rules.push({
                                field: "variables.domain_name",
                                id: "variables.domain_name",
                                input: "text",
                                operator: "equal",
                                value: domain
                            });
                            $("#builder-import_export").queryBuilder("setRules", prevRulesFilter);
                        }
                    }

                    $("#mainnav-domain-modal").modal("hide");
                }
            });

            //  обновити lookup доменів
            $("#reloadDomainLookup").off("click");
            $("#reloadDomainLookup").on("click", function() {
                showDomainTable({
                    "showModal": false
                });
            });


            $("#select-domain").off("domainRemoved");
            $("#select-domain").on("domainRemoved", function() {

                $("#select-domain").text("Select domain");
                $("#select-domain").attr("selecteddomain", "");
                showDomainTable({
                    "showModal": false
                });
            });
         }


        /**
         * У всіх елементів головного меню, видаляє клас .active-link і задає його елементу по якому був ініціалізований клік.
         */
        function changeActiveMenu(aEl) {

            var activeLi = $("#mainnav-menu li.active-link");

            for (var i = 0; i < activeLi.length; i++) {
                if ($(activeLi[i]).hasClass("active-link")) {
                    $(activeLi[i]).removeClass("active-link");
                }
            }

            $(aEl).parent().addClass("active-link");
        }





        //  показати модальне вікно для створення першого домена
        function showModalWin() {

            $("#firstDomainModal").modal("show");

            $("#createFirstDomain").on("click", function() {
                
                var 
                    name = $("#firstDomainName input").val(),
                    customerID = $("#firstDomainCustomerID input").val(),
                    language = $("#first-domain-language").find(":selected").attr("value"),
                    provider = $("#first-domain-provider").find(":selected").attr("value");


                fieldValidator.config = {
                    "name": ["isNotEmpty", "hasNotSpaces", "hasNotCyrillic"],
                    "customerID": ["isNotEmpty", "hasNotSpaces", "hasNotCyrillic"]
                };
                fieldValidator.validate({
                    "name": name,
                    "customerID": customerID
                });

                if ( fieldValidator.hasErrors() ) {
                    $("#firstDomainName").addClass("warning");
                    $("#firstDomainCustomerID").addClass("warning");

                    if ( fieldValidator.messages["name"] ) {
                        $("#firstDomainName .error-block").text(fieldValidator.messages["name"].msg);
                    } else {
                        $("#firstDomainName .error-block").text("");
                    }

                    if ( fieldValidator.messages["customerID"] ) {
                        $("#firstDomainCustomerID .error-block").text(fieldValidator.messages["customerID"].msg);
                    } else {
                        $("#firstDomainCustomerID .error-block").text("");
                    }

                    return;
                } else {
                    $("#firstDomainName").removeClass("warning");
                    $("#firstDomainCustomerID").removeClass("warning");
                }

                createDomain({
                    "name": name,
                    "customerID": customerID,
                    "language": language,
                    "provider": provider
                });
            });
        }

        function createDomain(options) {


            var 
                name = options.name,
                customerID = options.customerID,
                lang = options.language,
                provider = options.provider,
                opts = {
                    "parameters": [],
                    "variables": []
                };

            if ( lang ) {
                opts.variables.push("default_language=" + lang);
            }

            if ( provider ) {
                opts.parameters.push("provider=" + provider);
            }

            webitel.domainCreate(name, customerID, opts, function(res) {
                
                if ( res.status === 0 ) {
                    alert.success("#firstDomainForm", this.responseText, 3000);

                    $("#select-domain").text(name);
                    $("#select-domain").attr("selectedDomain", name);
                    //  генерить івент і передає вибраний домені
                    $("#select-domain").trigger("domainSelected", [name]);

                    $("#reloadDomainLookup").trigger("click");
                } 
                else if ( res.status === 1 ) {
                    alert.error("#firstDomainForm", this.responseText, 5000);
                } 
                else {
                    alert.error("#firstDomainForm", this.responseText, 5000);
                }
            });
        }
});