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
                        require(["statisticsSection"], function(statisticsSection) {
                            statisticsSection.createWebitel();
                        });
                        require(['angular', 'session'], function(angular, session) {
                            showFilter();
                            var staticticModule = angular.module("statisticModule",[]);

                            staticticModule.controller("statisticController", function($scope, $http) {

                                //івент на ентер
                                $(document).keypress(function (e) {
                                    if (e.which == 13) {
                                        $scope.useFilter();
                                    }
                                });
                                $scope.credentials ={login: "root", password: "ROOT_PASSWORD", token: "", key: ""};
                                $scope.server = { loginUrl: "https://pre.webitel.com:10022/login", dataUrl: "https://pre.webitel.com:10022/api/v2/cdr/searches",
                                    countUrl: "https://pre.webitel.com:10022/api/v2/cdr/counts", getJsonUrl: "https://pre.webitel.com:10022/api/v2/files"};

                                $scope.calls = [];
                                $scope.rows = 0;
                                $scope.currentRowId = "";

                                $scope.currentfilters = $("#builder-import_export").queryBuilder("getMongo");
                                $scope.filterRules = {rules: {}};
                                $scope.currentPage = 1;
                                $scope.sortCaptions = [{caption: "Caller name", sortType: 0, id: 0, sortColumn: "callflow.caller_profile.caller_id_name"},
                                    {caption: "Caller number", sortType: 0, id: 1, sortColumn: "callflow.caller_profile.caller_id_number"},
                                    {caption: "Destination number", sortType: 0, id: 2, sortColumn: "callflow.caller_profile.destination_number"},
                                    {caption: "\u25BC" + "Created time", sortType: -1, id: 3, sortColumn: "callflow.times.created_time"},
                                    {caption: "Billsec", sortType: 0, id: 4, sortColumn: "variables.billsec"},
                                    {caption: "Duration", sortType: 0, id: 5, sortColumn: "variables.duration"},
                                    {caption: "Direction", sortType: 0, id: 6, sortColumn: "variables.direction"},
                                    {caption: "Hangup cause", sortType: 0, id: 7, sortColumn: "variables.hangup_cause"}];
                                $scope.currentSortId = 3;
                                $scope.currentSortFilter = {"callflow.times.created_time": -1};

                                $scope.defaultColumns = {
                                    "variables.domain_name": 1,
                                    "variables.uuid": 1,
                                    "callflow.caller_profile.caller_id_name": 1,
                                    "callflow.caller_profile.caller_id_number": 1,
                                    "callflow.caller_profile.destination_number": 1,
                                    "callflow.times.created_time": 1,
                                    "variables.billsec": 1,
                                    "variables.duration": 1,
                                    "variables.direction": 1,
                                    "variables.hangup_cause": 1,
                                    "callflow.times.answered_time": 1,
                                    "callflow.times.bridged_time": 1,
                                    "callflow.times.hangup_time": 1
                                }

                                var cdrServerUrl = "https://pre.webitel.com:10022/api/v2/files/";
                                var token = "access_token=" + session.getToken();
                                var key = "x_key=" + session.getKey();

                                $scope.useFilter = function() {
                                    var result = $('#builder-import_export').queryBuilder('getMongo');
                                    if (!$.isEmptyObject(result)) {
                                        $("#data-content").hide();
                                        $("#loadText").show();
                                        $scope.calls = [];
                                        $scope.currentPage = 1;
                                        $scope.sortCaptions[$scope.currentSortId]["caption"] = $scope.sortCaptions[$scope.currentSortId]["caption"].substr(1);
                                        $scope.currentSortId = 3;
                                        $scope.sortCaptions[3]["sortType"] = -1;
                                        if($scope.sortCaptions[3]["caption"][0] != "\u25BC") {
                                            $scope.sortCaptions[3]["caption"] = $scope.sortCaptions[3]["caption"].insertAt(0, "\u25BC");
                                        }
                                        $scope.filterRules = $('#builder-import_export').queryBuilder('getRules');
                                        $scope.currentfilters = result;
                                        $scope.getRowsCount();
                                        $scope.getStartData(1, {"callflow.times.created_time": -1});
                                    }
                                }
                                $scope.getStartData = function(pageNumber, sort) {
                                        var startFilter = {};
                                        startFilter.columns = $scope.defaultColumns;
                                        startFilter.fields = {};
                                        convertFilterToTimestamp($scope.currentfilters);
                                        startFilter.filter = $scope.currentfilters;
                                        startFilter.limit = 10;
                                        startFilter.sort = sort;
                                        startFilter.pageNumber = pageNumber;

                                        var data = {
                                            method: "POST",
                                            url: $scope.server.dataUrl,
                                            headers: {
                                                'x-key': $scope.credentials.key,
                                                'x-access-token': $scope.credentials.token
                                            },
                                            data: startFilter
                                        };

                                        $http(data).then(function (response) {
                                            var callerName, callerNumber, destinationNumber,
                                                createdTime, answeredTime, bridgedTime, hangupTime;
                                            var data = response.data;
                                            for (var i = 0; i < data.length; i++) {
                                                callerName = data[i].callflow[0].caller_profile.caller_id_name;
                                                callerNumber = data[i].callflow[0].caller_profile.caller_id_number;
                                                destinationNumber = data[i].callflow[0].caller_profile.destination_number;
                                                createdTime = data[i].callflow[0].times.created_time > 0 ? new Date(data[i].callflow[0].times.created_time / 1000).toLocaleString() : 0;
                                                answeredTime = data[i].callflow[0].times.answered_time > 0 ? new Date(data[i].callflow[0].times.answered_time / 1000).toLocaleDateString() : 0;
                                                bridgedTime = data[i].callflow[0].times.bridged_time > 0 ? new Date(data[i].callflow[0].times.bridged_time / 1000).toLocaleString() : 0;
                                                hangupTime = data[i].callflow[0].times.hangup_time > 0 ? new Date(data[i].callflow[0].times.hangup_time / 1000).toLocaleString() : 0;
                                                for (var j = 0; j < $scope.filterRules.rules.length; j++) {
                                                    if ($scope.filterRules.rules[j].id == "callflow.caller_profile.caller_id_name") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].caller_profile.caller_id_name) {
                                                                callerName = data[i].callflow[k].caller_profile.caller_id_name;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if ($scope.filterRules.rules[j].id == "callflow.caller_profile.caller_id_number") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].caller_profile.caller_id_number) {
                                                                callerNumber = data[i].callflow[k].caller_profile.caller_id_number;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if ($scope.filterRules.rules[j].id == "callflow.caller_profile.destination_number") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].caller_profile.destination_number) {
                                                                destinationNumber = data[i].callflow[k].caller_profile.destination_number;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if ($scope.filterRules.rules[j].id == "callflow.times.created_time") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].times.created_time) {
                                                                createdTime = data[i].callflow[k].times.created_time > 0 ? new Date(data[i].callflow[k].times.created_time / 1000).toLocaleString() : 0;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if ($scope.filterRules.rules[j].id == "callflow.times.answered_time") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].times.answered_time) {
                                                                answeredTime = data[i].callflow[k].times.answered_time > 0 ? new Date(data[i].callflow[k].times.answered_time / 1000).toLocaleDateString() : 0;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if ($scope.filterRules.rules[j].id == "callflow.times.bridged_time") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].times.bridged_time) {
                                                                bridgedTime = data[i].callflow[k].times.bridged_time > 0 ? new Date(data[i].callflow[k].times.bridged_time / 1000).toLocaleString() : 0;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    if ($scope.filterRules.rules[j].id == "callflow.times.hangup_time") {
                                                        for (var k = 0; k < data[i].callflow.length; k++) {
                                                            if ($scope.filterRules.rules[j].value == data[i].callflow[k].times.hangup_time) {
                                                                hangupTime = data[i].callflow[k].times.hangup_time > 0 ? new Date(data[i].callflow[k].times.hangup_time / 1000).toLocaleString() : 0;
                                                                break;
                                                            }
                                                        }
                                                    }
                                                }
                                                $scope.calls.push({
                                                    uuid: "el" + data[i].variables.uuid,
                                                    domainName: data[i].variables.domain_name,
                                                    callerName: callerName,
                                                    callerNumber: callerNumber,
                                                    destinationNumber: destinationNumber,
                                                    createdTime: createdTime,
                                                    billSeconds: data[i].variables.billsec.toString().toHHMMSS(),
                                                    duration: data[i].variables.duration.toString().toHHMMSS(),
                                                    direction: data[i].variables.direction,
                                                    hangupCause: data[i].variables.hangup_cause,
                                                    answeredTime: answeredTime,
                                                    bridgedTime: bridgedTime,
                                                    hangupTime: hangupTime
                                                });
                                            }
                                            $("#loadText").hide();
                                            $("#data-content").show();
                                        }, function (response) {
                                        });
                                }

                                $scope.clickRowTable = function(uuid) {
                                    if($scope.currentRowId != "") {
                                        $("#" + $scope.currentRowId + " div.row:eq(4)").empty();
                                        $("#" + $scope.currentRowId + " div.row:eq(5)").empty();
                                        $("#" + $scope.currentRowId).hide();
                                        $("#showPdf").remove();
                                    }
                                    for(var i = 0; i < $scope.calls.length; i++) {
                                        if ($scope.calls[i].uuid == uuid) {
                                            $("#" + uuid).show("fast");
                                            $scope.currentRowId = $scope.calls[i].uuid;
                                        }
                                    }
                                        getCdrFileInfo(cdrServerUrl + $scope.currentRowId.slice(2) + "?" + token + "&" + key,
                                            //  callback приймає тип доступного файлу
                                            function (type, srcPdf) {
                                                if (type === "audio/mpeg") {
                                                    showAudioPlayer();
                                                }
                                                else if (type === "application/pdf") {
                                                    showPdfFile(srcPdf);
                                                }
                                                else if (type === "video/mp4") {

                                                }

                                            },
                                            //  error callback, для підтримки старого функціоналу
                                            function () {
                                                //  якщо в користувача FF || SAFARI відправити ajax запит для перевірки чи доступний аудіо ресурс
                                                if (typeof InstallTrigger !== 'undefined' || Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
                                                    /*checkCanPlayAjax(cdrServerUrl + row["Uuid"] + "?" + token + "&" + key, function() {
                                                     showAudioPlayer();
                                                     });*/
                                                } else {
                                                    /*checkCanPlay(cdrServerUrl + row["Uuid"] + "?" + token + "&" + key, function() {
                                                     showAudioPlayer();
                                                     });*/
                                                }
                                            }
                                        );
                                }
                                $scope.getRowsCount = function() {
                                        var startFilter = {};
                                        startFilter.columns = $scope.defaultColumns;
                                        startFilter.fields = {};
                                        convertFilterToTimestamp($scope.currentfilters);
                                        startFilter.filter = $scope.currentfilters;
                                        startFilter.sort = $scope.currentSortFilter;

                                        var data = {
                                            method: "POST",
                                            url: $scope.server.countUrl,
                                            headers: {
                                                'x-key': $scope.credentials.key,
                                                'x-access-token': $scope.credentials.token
                                            },
                                            data: startFilter
                                        };

                                        $http(data).then(function (response) {
                                            $scope.rows = response.data;
                                        }, function (response) {
                                        });
                                }
                                $scope.showMore = function() {
                                    $scope.currentPage++;
                                    $scope.getStartData($scope.currentPage, $scope.currentSortFilter);
                                }
                                $scope.makeSort = function(sortId) {
                                    if($scope.calls.length == 0) {
                                        return;
                                    }
                                    $("#data-content").hide();
                                    $("#loadText").show();
                                    if($scope.currentSortId == sortId) {
                                        if ($scope.sortCaptions[sortId]["sortType"] == 0) {
                                            $scope.sortCaptions[sortId]["sortType"] = -1;
                                            $scope.currentSortFilter = {};
                                            $scope.currentSortFilter[$scope.sortCaptions[sortId]["sortColumn"]] = -1;
                                            $scope.calls = [];
                                            //$scope.sortCaptions[sortId]["caption"] = $scope.sortCaptions[sortId]["caption"].insertAt(0,"\u25BC");
                                            $scope.getStartData(1, $scope.currentSortFilter);
                                            $scope.currentSortId = sortId;
                                            return;
                                        }
                                        if ($scope.sortCaptions[sortId]["sortType"] == -1) {
                                            $scope.sortCaptions[sortId]["sortType"] = 1;
                                            $scope.currentSortFilter = {};
                                            $scope.currentSortFilter[$scope.sortCaptions[sortId]["sortColumn"]] = 1;
                                            $scope.calls = [];
                                            $scope.sortCaptions[sortId]["caption"] = $scope.sortCaptions[sortId]["caption"].substr(1);
                                            $scope.sortCaptions[sortId]["caption"] = $scope.sortCaptions[sortId]["caption"].insertAt(0,"\u25B2");
                                            $scope.getStartData(1, $scope.currentSortFilter);
                                            $scope.currentSortId = sortId;
                                            return;
                                        }
                                        if ($scope.sortCaptions[sortId]["sortType"] == 1) {
                                            $scope.sortCaptions[sortId]["sortType"] = -1;
                                            $scope.currentSortFilter = {};
                                            $scope.currentSortFilter[$scope.sortCaptions[sortId]["sortColumn"]] = -1;
                                            $scope.calls = [];
                                            $scope.sortCaptions[sortId]["caption"] = $scope.sortCaptions[sortId]["caption"].substr(1);
                                            $scope.sortCaptions[sortId]["caption"] = $scope.sortCaptions[sortId]["caption"].insertAt(0,"\u25BC");
                                            $scope.getStartData(1, $scope.currentSortFilter);
                                            $scope.currentSortId = sortId;
                                            return;
                                        }
                                    }
                                    else {
                                        $scope.sortCaptions[$scope.currentSortId]["sortType"] = 0;
                                        $scope.sortCaptions[sortId]["sortType"] = -1;
                                        $scope.currentSortFilter = {};
                                        $scope.currentSortFilter[$scope.sortCaptions[sortId]["sortColumn"]] = -1;
                                        $scope.calls = [];
                                        $scope.sortCaptions[$scope.currentSortId]["caption"] = $scope.sortCaptions[$scope.currentSortId]["caption"].substr(1);
                                        $scope.sortCaptions[sortId]["caption"] = $scope.sortCaptions[sortId]["caption"].insertAt(0,"\u25BC");
                                        $scope.getStartData(1, $scope.currentSortFilter);
                                        $scope.currentSortId = sortId;
                                        return;
                                    }
                                }
                                $scope.getJson = function() {
                                    /*var login = {
                                     method: "POST",
                                     url: $scope.server.loginUrl,
                                     headers: {
                                     'Content-Type': "application/json;charset=utf-8"
                                     },
                                     data: JSON.stringify({
                                     "username": $scope.credentials.login,
                                     "password": $scope.credentials.password
                                     })
                                     };

                                     $http(login).then(function(response) {
                                     $scope.credentials.token = response.data.token;
                                     $scope.credentials.key = response.data.key;
                                     $scope.getRowsCount();
                                     $scope.getStartData($scope.currentPage);
                                     }, function(response) {
                                     });*/
                                    $.ajax({
                                        "url": window.location.href + "/getCdrJSON",
                                        "method": "POST",
                                        "contentType": "application/json",
                                        "timeout": 10000,
                                        "data": JSON.stringify({
                                            "uuid": $scope.currentRowId.slice(2)
                                        }),
                                        "dataType": "json",
                                        "success": function (data) {
                                            showCdrJsonWindow(JSON.stringify(data));
                                        },
                                        "error": function (jqXHR, textStatus, errorThrown) {
                                            this.alert("Can not read data");
                                        }
                                    });
                                }

                                $scope.openPdf = function(src) {
                                    window.open(src);
                                }
                                $scope.resetFilter = function() {
                                    $("#builder-import_export").queryBuilder("reset");
                                }
                                function convertFilterToTimestamp(obj) {
                                    var properties = [];
                                    for (var p in obj) {
                                        if (typeof(obj[p]) == 'object') {
                                            for(var i = 0; i < obj[p].length; i++) {
                                                if(isDate(obj[p][i])) {
                                                    var el = obj[p][i][Object.keys(obj[p][i])[0]];
                                                    el = el.split(".");
                                                    var newDate = el[2]+"/"+ el[1]+"/" + el[0];
                                                    obj[p][i][Object.keys(obj[p][i])[0]] = new Date(newDate).getTime() * 1000;
                                                }
                                                if(obj[p][i]["callflow.times.created_time"] ||
                                                    obj[p][i]["callflow.times.answered_time"] ||
                                                    obj[p][i]["callflow.times.bridged_time"] ||
                                                    obj[p][i]["callflow.times.hangup_time"]) {
                                                    if(obj[p][i][Object.keys(obj[p][i])]["$gte"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$gte"]) != "number") {
                                                        var el1 = obj[p][i][Object.keys(obj[p][i])]["$gte"];
                                                        el1 = el1.split(".");
                                                        var newDate = el1[2] + "/" + el1[1] + "/" + el1[0];
                                                        obj[p][i][Object.keys(obj[p][i])]["$gte"] = new Date(newDate).getTime() * 1000;
                                                    }

                                                    if(obj[p][i][Object.keys(obj[p][i])]["$lte"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$lte"]) != "number") {
                                                        var el2 = obj[p][i][Object.keys(obj[p][i])]["$lte"];
                                                        el2 = el2.split(".");
                                                        var newDate = el2[2] + "/" + el2[1] + "/" + el2[0];
                                                        obj[p][i][Object.keys(obj[p][i])]["$lte"] = new Date(newDate).getTime() * 1000;
                                                    }

                                                    if(obj[p][i][Object.keys(obj[p][i])]["$lt"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$lt"]) != "number") {
                                                        var el2 = obj[p][i][Object.keys(obj[p][i])]["$lt"];
                                                        el2 = el2.split(".");
                                                        var newDate = el2[2] + "/" + el2[1] + "/" + el2[0];
                                                        obj[p][i][Object.keys(obj[p][i])]["$lt"] = new Date(newDate).getTime() * 1000;
                                                    }

                                                    if(obj[p][i][Object.keys(obj[p][i])]["$gt"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$gt"]) != "number") {
                                                        var el2 = obj[p][i][Object.keys(obj[p][i])]["$gt"];
                                                        el2 = el2.split(".");
                                                        var newDate = el2[2] + "/" + el2[1] + "/" + el2[0];
                                                        obj[p][i][Object.keys(obj[p][i])]["$gt"] = new Date(newDate).getTime() * 1000;
                                                    }
                                                }
                                            }
                                            properties = properties.concat( convertFilterToTimestamp(obj[p]) );
                                        } else {
                                            properties.push(p);
                                        }
                                    }
                                    return properties;
                                }
                                function showCdrJsonWindow(jsonData) {

                                    var jsonWindow = window.open("", "jsonWindow", "width=800, height=600");

                                    if ( jsonWindow ) {

                                        jsonWindow.document.write(
                                            '<button id="save-cdrJSON" style="position: fixed; right: 0; z-index: 1;">Save</button>' +
                                            '<div id="cdr-jsonViewver"></div>' +
                                            '<link href="/js/libs &amp; plugins/jsonViewver/dist/jquery.jsonview.css" rel="stylesheet" type="text/css">' +
                                            '<style type="text/css">' +
                                            'body { margin: 0; padding: 0; background: #e7ebee; }' +
                                            '</style>'
                                        );

                                        $('#cdr-jsonViewver', jsonWindow.document).JSONView(JSON.parse(jsonData, { collapsed: false }));

                                        $('#save-cdrJSON', jsonWindow.document).off("click");
                                        $('#save-cdrJSON', jsonWindow.document).on("click", function() {

                                            var textFileAsBlob = new Blob([jsonData], {type:'application/json'}),
                                                downloadLink = document.createElement("a");

                                            downloadLink.download = $scope.currentRowId.slice(2) + ".json";
                                            downloadLink.innerHTML = "Download File";

                                            if ( window.webkitURL !== null ) {
                                                // Chrome allows the link to be clicked
                                                // without actually adding it to the DOM.
                                                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                                            }
                                            else {
                                                // Firefox requires the link to be added to the DOM
                                                // before it can be clicked.
                                                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                                                downloadLink.onclick = destroyClickedElement;
                                                downloadLink.style.display = "none";
                                                document.body.appendChild(downloadLink);
                                            }
                                            downloadLink.click();
                                        });
                                    }
                                    else {
                                        alert.warning("", "Please, allow popup window!", 3000);
                                        return;
                                    }
                                }
                                function isDate(date) {
                                    var resultDate = date[Object.keys(date)[0]];
                                    var newDate;
                                    try {
                                        resultDate = resultDate.split(".");
                                        if(resultDate[0] == undefined || resultDate[1] == undefined || resultDate[2] == undefined || resultDate[3] != undefined) {
                                            return false;
                                        }
                                        newDate = resultDate[2]+ "/" + resultDate[1] + "/" + resultDate[0];
                                    }
                                    catch(err) {
                                    }
                                    return (new Date(newDate) !== "Invalid Date" && !isNaN(new Date(newDate))) ? true : false;
                                }
                                //  відобразити аудіоплеєр, якщо є доступний запис розмови
                                function showAudioPlayer() {
                                    var createdTime;
                                    var callerNumber;
                                    var destinationNumber;
                                    for(var i = 0; i < $scope.calls.length; i++) {
                                        if($scope.calls[i].uuid == $scope.currentRowId) {
                                            createdTime = $scope.calls[i].createdTime;
                                            callerNumber = $scope.calls[i].callerNumber;
                                            destinationNumber = $scope.calls[i].destinationNumber;
                                        }
                                    }
                                    var filename = "";
                                    var createdTimeCopy = createdTime.split(/[\s,]+/);
                                    var date = createdTimeCopy[0];
                                    var time = createdTimeCopy[1];
                                    filename += date.split(".")[2] + date.split(".")[1] + date.split(".")[0];
                                    filename += "-";
                                    filename += time.split(":")[0] + time.split(":")[1];
                                    filename += "_" + callerNumber + "_" + destinationNumber;
                                    var src = cdrServerUrl + $scope.currentRowId.slice(2) + "?" + token + "&" + key + "&file_name=" + filename + ".mp3";
                                    /*if($("#" + $scope.currentRowId + " div.row:eq(4)").length == 1) {
                                        $("#" + $scope.currentRowId + " div.row:eq(4)").append("<div class='col-md-2'><audio style='width: 300px;margin-left: 100px;float: left;' controls='controls' src=" + "'" + src + "'" + " preload='none'></audio></div>");
                                        if (session.getRole() === "root" || session.getRole() === "admin") {
                                            $("#" + $scope.currentRowId + " div.row:eq(5)").append("<div style='margin-left: 113px;margin-top: 5px;'><div id='applyFilter2'><button style='float: left;' class='btn btn-primary btn-xs' id='deleteAudio'>Delete</button></div></div>");
                                            $("#" + $scope.currentRowId + " div.row:eq(5) div:eq(1)").append("<div id='applyFilter2'><a role='button' href='" + src + "' style='float: left;margin-right: 5px;' class='btn btn-primary btn-xs' id='downloadAudio'>Download</a></div>");
                                            $("#deleteAudio").on("click", function () {

                                                bootbox.dialog({
                                                    message: "Do you want to remove this audio record ?",
                                                    size: 'small',
                                                    title: "Remove audio record?",
                                                    className: "remove-audio-record-modal",
                                                    onEscape: function () {
                                                    },
                                                    buttons: {
                                                        danger: {
                                                            label: "Cancel",
                                                            className: "btn-default",
                                                            callback: function () {
                                                            }
                                                        },
                                                        success: {
                                                            label: "Ok",
                                                            className: "btn-success",
                                                            callback: function () {
                                                                //removeRequest();
                                                            }
                                                        }
                                                    }
                                                });

                                                function removeRequest() {
                                                    var
                                                        uuid = $scope.currentRowId.slice(2);

                                                    $.ajax({
                                                        "url": "https://pre.webitel.com:10022" + "/removeAudioRecord",
                                                        "method": "POST",
                                                        "contentType": "application/json",
                                                        "timeout": 10000,
                                                        "data": JSON.stringify({
                                                            "uuid": uuid
                                                        }),
                                                        "dataType": "json",
                                                        "success": function (data, textStatus, jqXHR) {
                                                            if (textStatus === "success") {
                                                                alert.success("", "Audio record has been removed", 3000);
                                                                console.log("Audio record (" + data.uuid + ") has been removed");
                                                                //$("#statisticsBootstrapTable  tr.statMoreInfoTr").remove();
                                                                $("#" + $scope.currentRowId + " div.row:eq(4)").empty();
                                                                $("#" + $scope.currentRowId + " div.row:eq(5)").empty();
                                                            }
                                                        },
                                                        "error": function (jqXHR, textStatus, errorThrown) {
                                                            alert.error("", "Audio record has not been removed", 5000);
                                                            console.error("Audio record (" + data.uuid + ") has not been removed");
                                                            return;
                                                        }
                                                    });
                                                }

                                            });
                                        }
                                    }*/
                                }
                                function showPdfFile(src) {
                                    var ngClick = "openPdf('" + src + "')";
                                    $("#el" + $scope.currentRowId + " #applyFilter").append("<button id='showPdf' style='float: right;' class='btn btn-success btn-xs'>PDF</button>");
                                    $("#showPdf").on("click", function() {
                                        window.open(src);
                                    });
                                }
                                function getCdrFileInfo(src, success, error) {
                                    $.ajax({
                                        url: src + "&type=all",
                                        type: 'GET',
                                        success: function(data) {

                                            var
                                                isAudioDefined = false,
                                                isContentTypeDefined = false;


                                            if ( data.length > 0 ) {
                                                //  якщо масив не пустий і ніодин обєкт не має властивості "content-type", тоді реалізувати стару логіку
                                                for ( var i = 0; i < data.length; i++ ) {
                                                    if ( data[i]["content-type"] ) {
                                                        isContentTypeDefined = true;
                                                    }
                                                    //  якщо ніодин із обєктів не аудіо, тоді виводилось повідомлення про audio not found
                                                    /*if ( data[i]["content-type"] === "audio/mpeg" ) {
                                                     isAudioDefined = true;
                                                     }*/
                                                }

                                                /*if ( !isAudioDefined ) {
                                                 alert.error("", "Audio file not found", 3000);
                                                 }*/

                                                if ( !isContentTypeDefined ) {
                                                    error();
                                                    return;
                                                }

                                                for ( var i = 0; i < data.length; i++ ) {
                                                    if ( data[i]["content-type"] === "audio/mpeg" ) {
                                                        $("#" + $scope.currentRowId + " div.row:eq(4)").append("<div class='col-md-2'><audio style='width: 300px;margin-left: 100px;float: left;' controls='controls' src=" + "'" + src + "'" + " preload='none'></audio></div>");
                                                        if (session.getRole() === "root" || session.getRole() === "admin") {
                                                            $("#" + $scope.currentRowId + " div.row:eq(5)").append("<div style='margin-left: 113px;margin-top: 5px;'><div id='applyFilter2'><button style='float: left;' class='btn btn-primary btn-xs' id='deleteAudio'>Delete</button></div></div>");
                                                            $("#" + $scope.currentRowId + " div.row:eq(5) div:eq(1)").append("<div id='applyFilter2'><a role='button' href='" + src + "' style='float: left;margin-right: 5px;' class='btn btn-primary btn-xs' id='downloadAudio'>Download</a></div>");
                                                            $("#deleteAudio").on("click", function () {

                                                                bootbox.dialog({
                                                                    message: "Do you want to remove this audio record ?",
                                                                    size: 'small',
                                                                    title: "Remove audio record?",
                                                                    className: "remove-audio-record-modal",
                                                                    onEscape: function () {
                                                                    },
                                                                    buttons: {
                                                                        danger: {
                                                                            label: "Cancel",
                                                                            className: "btn-default",
                                                                            callback: function () {
                                                                            }
                                                                        },
                                                                        success: {
                                                                            label: "Ok",
                                                                            className: "btn-success",
                                                                            callback: function () {
                                                                                //removeRequest();
                                                                            }
                                                                        }
                                                                    }
                                                                });

                                                                function removeRequest() {
                                                                    var
                                                                        uuid = $scope.currentRowId.slice(2);

                                                                    $.ajax({
                                                                        "url": "https://pre.webitel.com:10022" + "/removeAudioRecord",
                                                                        "method": "POST",
                                                                        "contentType": "application/json",
                                                                        "timeout": 10000,
                                                                        "data": JSON.stringify({
                                                                            "uuid": uuid
                                                                        }),
                                                                        "dataType": "json",
                                                                        "success": function (data, textStatus, jqXHR) {
                                                                            if (textStatus === "success") {
                                                                                alert.success("", "Audio record has been removed", 3000);
                                                                                console.log("Audio record (" + data.uuid + ") has been removed");
                                                                                //$("#statisticsBootstrapTable  tr.statMoreInfoTr").remove();
                                                                                $("#" + $scope.currentRowId + " div.row:eq(4)").empty();
                                                                                $("#" + $scope.currentRowId + " div.row:eq(5)").empty();
                                                                            }
                                                                        },
                                                                        "error": function (jqXHR, textStatus, errorThrown) {
                                                                            alert.error("", "Audio record has not been removed", 5000);
                                                                            console.error("Audio record (" + data.uuid + ") has not been removed");
                                                                            return;
                                                                        }
                                                                    });
                                                                }

                                                            });
                                                        }
                                                        success("audio/mpeg");
                                                    }
                                                    else if ( data[i]["content-type"] === "application/pdf" ) {
                                                        success("application/pdf", src + "&type=application/pdf");
                                                    }
                                                    else if ( data[i]["content-type"] === "video/mp4" ) {
                                                        success("video/mp4");
                                                    }
                                                }
                                            } else {
                                                error();
                                            }
                                        },
                                        error: function(err) {
                                            if ( err.status === 400 ) {
                                                try {
                                                    res = JSON.parse(err.responseText)
                                                } catch (e) {}

                                                if ( res ) {
                                                    if ( res.status === 400 && res.message === "Token Expired" ) {
                                                        console.error("====================");
                                                        console.error("Token Expired");
                                                        console.error("====================");

                                                        alert.error("", "Token Expired. Please, relogin", 3000);
                                                    } else {
                                                        console.error("Unhandled error. Error code=400. Check response message !");
                                                    }
                                                } else {
                                                    console.error("Unhandled error. Error code=400. Response from server is empty");
                                                }
                                            }
                                            else if (err.status === 401 && err.statusText === "Unauthorized") {
                                                console.error("====================");
                                                console.error("Invalid token or key");
                                                console.error("====================");

                                                alert.error("", "Invalid token or key. Please, relogin", 3000);
                                            }
                                            else if (err.status === 404) {
                                                console.error("====================");
                                                console.error("Audio file not found");
                                                console.error("====================");

                                                alert.error("", "Audio file not found", 3000);
                                            }
                                            else if (err.status === 500) {

                                                console.error("================");
                                                console.error("Bad token or key");
                                                console.error("================");

                                                alert.error("", "Bad token or key. Please, relogin", 3000);
                                            }
                                            else if (err.readyState === 0 && err.responseText === "" && err.statusText === "error") {
                                                success("audio/mpeg");
                                            }
                                            else {
                                                console.error("Unhandled error after GET hardbitUrl. responseText=" + err.responseText + ", code=" + err.status);
                                            }
                                        }
                                    });
                                }

                                //  створює audio тег, передає йому src
                                function checkCanPlay(src, callback) {
                                    var audio = new Audio();
                                    audio.setAttribute("preload", 'none');
                                    audio.setAttribute("src", src);
                                    audio.oncanplay = function() {
                                        audio.setAttribute("src",'');
                                        audio.pause();
                                        delete audio;
                                        callback();
                                    };
                                    audio.load();
                                }

                                //  для FF && SAFARI
                                function checkCanPlayAjax(url, success_callback) {
                                    $.ajax({
                                        url: url,
                                        type: 'GET',
                                        success: function(data) {
                                            success_callback();
                                        },
                                        error: function(err) {
                                            if ( err.status === 400 ) {
                                                try {
                                                    res = JSON.parse(err.responseText)
                                                } catch (e) {}

                                                if ( res ) {
                                                    if ( res.status === 400 && res.message === "Token Expired" ) {
                                                        console.error("====================");
                                                        console.error("Token Expired");
                                                        console.error("====================");

                                                        alert.error("", "Token Expired. Please, relogin", 3000);
                                                    } else {
                                                        console.error("Unhandled error. Error code=400. Check response message !");
                                                    }
                                                } else {
                                                    console.error("Unhandled error. Error code=400. Response from server is empty");
                                                }
                                            }
                                            else if (err.status === 401 && err.statusText === "Unauthorized") {

                                                console.error("====================");
                                                console.error("Invalid token or key");
                                                console.error("====================");

                                                alert.error("", "Invalid token or key. Please, relogin", 3000);
                                            }
                                            else if (err.status === 404) {
                                                console.error("====================");
                                                console.error("Audio file not found");
                                                console.error("====================");

                                                alert.error("", "Audio file not found", 3000);
                                            }
                                            else if (err.status === 500) {

                                                console.error("================");
                                                console.error("Bad token or key");
                                                console.error("================");

                                                alert.error("", "Bad token or key. Please, relogin", 3000);
                                            }
                                            else if (err.readyState === 0 && err.responseText === "" && err.statusText === "error") {

                                                success_callback();
                                            }
                                            else {
                                                console.error("Unhandled error after GET hardbitUrl. responseText=" + err.responseText + ", code=" + err.status);
                                            }
                                        }
                                    });
                                }
                                //INITIALIZATION//////////////////////////////////////////////////////////
                                /*var login = {
                                    method: "POST",
                                    url: $scope.server.loginUrl,
                                    headers: {
                                        'Content-Type': "application/json;charset=utf-8"
                                    },
                                    data: JSON.stringify({
                                        "username": $scope.credentials.login,
                                        "password": $scope.credentials.password
                                    })
                                };*/

                                /*$http(login).then(function(response) {
                                    $scope.credentials.token = response.data.token;
                                    $scope.credentials.key = response.data.key;
                                    $scope.getRowsCount();
                                    $scope.getStartData($scope.currentPage);
                                }, function(response) {
                                });*/
                                $scope.credentials.token = session.getToken();
                                $scope.credentials.key = session.getKey();
                                $("#headerTable").hide();
                                $("#data-content").hide();
                                $("#loadText").show();
                                $scope.getRowsCount();
                                $scope.getStartData($scope.currentPage);
                                $("#headerTable").show('fast');
                                $("#data-content").show('fast');
                                $("#loadText").hide();
                                //INITIALIZATION//////////////////////////////////////////////////////////
                            });


                            staticticModule.directive('scrolly', function () {
                                return {
                                    restrict: 'A',
                                    link: function (scope, element, attrs) {
                                        var raw = element[0];
                                        console.log('loading directive');

                                        element.bind('scroll', function () {
                                            if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                                                scope.$apply(attrs.scrolly);
                                            }
                                        });
                                    }
                                };
                            });
                            angular.element(document).ready(function () {
                                angular.bootstrap(document.getElementById("page-content"), ['statisticModule']);
                            });
                        });
                        /*require(["StatisticModule"], function () {
                            
                        })*/
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
                    else if ( url === "/cdr" ) {
                        require(["CdrModule"], function (CdrModule) {
                            CdrModule.init();
                        });
                    }
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

        function showFilter() {
            var today_date = new Date();
            var first_date = new Date(today_date.getFullYear(), today_date.getMonth(), 1).toLocaleDateString();
            var basic_rules = {
                condition: 'AND',
                rules: [{
                    id: 'callflow.times.created_time',
                    operator: 'between',
                    value: [first_date,today_date.toLocaleDateString()]
                }]
            };
            $('#builder-import_export').queryBuilder({
                plugins: ['bt-tooltip-errors'],

                filters: [{
                    id: 'callflow.caller_profile.caller_id_number',
                    label: 'Caller number',
                    type: 'string',
                    operators: ["equal","not_equal","in","not_in","begins_with","not_begins_with","contains","not_contains","ends_with","not_ends_with","is_empty","is_not_empty"]
                },
                    {
                        id: 'variables.domain_name',
                        label: 'Domain',
                        type: 'string',
                        operators: ["equal","not_equal","in","not_in","begins_with","not_begins_with","contains","not_contains","ends_with","not_ends_with","is_empty","is_not_empty"]
                    },
                    {
                        id: 'callflow.caller_profile.caller_id_name',
                        label: 'Caller name',
                        type: 'string',
                        operators: ["equal","not_equal","in","not_in","begins_with","not_begins_with","contains","not_contains","ends_with","not_ends_with","is_empty","is_not_empty"]
                    },
                    {
                        id: 'callflow.caller_profile.destination_number',
                        label: 'Destination number',
                        type: 'string',
                        operators: ["equal","not_equal","in","not_in","begins_with","not_begins_with","contains","not_contains","ends_with","not_ends_with","is_empty","is_not_empty"]
                    },
                    {
                        id: 'variables.direction',
                        label: 'Direction',
                        type: 'string',
                        input: 'select',
                        operators: ["equal","not_equal","in","not_in","begins_with","not_begins_with","contains","not_contains","ends_with","not_ends_with","is_empty","is_not_empty"],
                        values: {
                            inbound: 'inbound',
                            outbound: 'outbound'
                        }
                    },
                    {
                        id: 'variables.hangup_cause',
                        label: 'Hangup cause',
                        type: 'string',
                        input: 'select',
                        values: {
                            CALL_REJECTED: 'CALL_REJECTED',
                            DESTINATION_OUT_OF_ORDER: 'DESTINATION_OUT_OF_ORDER',
                            NORMAL_CLEARING: 'NORMAL_CLEARING',
                            RECOVERY_ON_TIMER_EXPIRE: 'RECOVERY_ON_TIMER_EXPIRE',
                            ORIGINATOR_CANCEL: 'ORIGINATOR_CANCEL',
                            USER_NOT_REGISTERED: 'USER_NOT_REGISTERED',
                            UNALLOCATED_NUMBER: 'UNALLOCATED_NUMBER',
                            MANAGER_REQUEST: 'MANAGER_REQUEST',
                            INCOMPATIBLE_DESTINATION: 'INCOMPATIBLE_DESTINATION',
                            SYSTEM_SHUTDOWN: 'SYSTEM_SHUTDOWN',
                            USER_BUSY: 'USER_BUSY',
                            NO_ANSWER: 'NO_ANSWER',
                            USER_CHALLENGE: 'USER_CHALLENGE',
                            NO_ROUTE_DESTINATION: 'NO_ROUTE_DESTINATION',
                            EXCHANGE_ROUTING_ERROR: 'EXCHANGE_ROUTING_ERROR',
                            INVALID_GATEWAY: 'INVALID_GATEWAY',
                            LOSE_RACE: 'LOSE_RACE',
                            CHAN_NOT_IMPLEMENTED: 'CHAN_NOT_IMPLEMENTED',
                            SUBSCRIBER_ABSENT: 'SUBSCRIBER_ABSENT',
                            NORMAL_UNSPECIFIED: 'NORMAL_UNSPECIFIED',
                            MEDIA_TIMEOUT: 'MEDIA_TIMEOUT',
                            INCOMING_CALL_BARRED: 'INCOMING_CALL_BARRED',
                            NONE: 'NONE',
                            NORMAL_TEMPORARY_FAILURE: 'NORMAL_TEMPORARY_FAILURE',
                            MANDATORY_IE_MISSING: 'MANDATORY_IE_MISSING',
                            UNKNOWN: 'UNKNOWN',
                            ATTENDED_TRANSFER: 'ATTENDED_TRANSFER',
                            INVALID_NUMBER_FORMAT: 'INVALID_NUMBER_FORMAT',
                            SERVICE_NOT_IMPLEMENTED: 'SERVICE_NOT_IMPLEMENTED',
                            ALLOTTED_TIMEOUT: 'ALLOTTED_TIMEOUT'
                        }
                    },
                    {
                        id: 'callflow.times.created_time',
                        label: 'Created time',
                        type: 'date',
                        validation: {
                            format: 'DD.MM.YYYY'
                        },
                        plugin: 'datepicker',
                        plugin_config: {
                            format: 'dd.mm.yyyy',
                            todayBtn: 'linked',
                            todayHighlight: true,
                            autoclose: true
                        },
                        operators: ['less', 'less_or_equal','greater','greater_or_equal','between','not_between']
                    },
                    {
                        id: 'callflow.times.hangup_time',
                        label: 'Hangup time',
                        type: 'date',
                        validation: {
                            format: 'DD.MM.YYYY'
                        },
                        plugin: 'datepicker',
                        plugin_config: {
                            format: 'dd.mm.yyyy',
                            todayBtn: 'linked',
                            todayHighlight: true,
                            autoclose: true
                        },
                        operators: ['less', 'less_or_equal','greater','greater_or_equal','between','not_between']
                    },
                    {
                        id: 'callflow.times.answered_time',
                        label: 'Answered time',
                        type: 'date',
                        validation: {
                            format: 'DD.MM.YYYY'
                        },
                        plugin: 'datepicker',
                        plugin_config: {
                            format: 'dd.mm.yyyy',
                            todayBtn: 'linked',
                            todayHighlight: true,
                            autoclose: true
                        },
                        operators: ['less', 'less_or_equal','greater','greater_or_equal','between','not_between']
                    },
                    {
                        id: 'callflow.times.bridged_time',
                        label: 'Bridged time',
                        type: 'date',
                        validation: {
                            format: 'DD.MM.YYYY'
                        },
                        plugin: 'datepicker',
                        plugin_config: {
                            format: 'dd.mm.yyyy',
                            todayBtn: 'linked',
                            todayHighlight: true,
                            autoclose: true
                        },
                        operators: ['less', 'less_or_equal','greater','greater_or_equal','between','not_between']
                    },
                    {
                        id: 'variables.billsec',
                        label: 'Billsec',
                        type: 'integer',
                        operators: ['equal','not_equal','less', 'less_or_equal','greater','greater_or_equal','between','not_between']
                    },
                    {
                        id: 'variables.duration',
                        label: 'Duration',
                        type: 'integer',
                        operators: ['equal','not_equal','less', 'less_or_equal','greater','greater_or_equal','between','not_between']
                    }],
                rules: basic_rules
            });
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