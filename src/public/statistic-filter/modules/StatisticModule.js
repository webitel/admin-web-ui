/**
 * Created by s.fedyuk on 22.12.2015.
 */

define("StatisticModule",["angular", "session"], function(angular, session) {
    showFilter();
    var staticticModule = angular.module("statisticModule",[]);

    staticticModule.controller("statisticController", function($scope, $http) {

        //івент на ентер
        $(document).keypress(function (e) {

            if (e.which == 13) {

                //отримаємо активний елемент форми
                var focusElement = $(":focus");

                //знімаємо з нього фокус
                focusElement.blur();

                //чи ми знаходимся на сторінці статистики
                if($("#builder-import_export").length > 0) {
                    $scope.useFilter();
                }
            }
        });

        $scope.credentials ={login: "root", password: "ROOT_PASSWORD", token: "", key: ""};
        $scope.server = { loginUrl: session.getWebitelServer() + "/login", dataUrl: session.getWebitelServer() + "/api/v2/cdr/searches",
            countUrl: session.getWebitelServer() + "/api/v2/cdr/counts", getJsonUrl: session.getWebitelServer() + "/api/v2/files"};

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

        var cdrServerUrl = session.getWebitelServer() + "/api/v2/files/";
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
                    answeredTime = data[i].callflow[0].times.answered_time > 0 ? new Date(data[i].callflow[0].times.answered_time / 1000).toLocaleString() : 0;
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
                                    answeredTime = data[i].callflow[k].times.answered_time > 0 ? new Date(data[i].callflow[k].times.answered_time / 1000).toLocaleString() : 0;
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
                alert.warning("","Error connection to " + session.getWebitelServer());
            });
        }

        $scope.clickRowTable = function(uuid) {
            if($scope.currentRowId == uuid) {
                return;
            }

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
                "url": session.getWebitelServer() + "/getCdrJSON",
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
                                    $("#" + $scope.currentRowId + " div.row:eq(5) div:eq(1)").append("<div id='applyFilter2'><a role='button' href='" + src + "' style='float: left;margin-right: 5px;' class='btn btn-primary btn-xs' id='downloadAudio' download>Download</a></div>");
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
                                                        removeRequest();
                                                    }
                                                }
                                            }
                                        });

                                        function removeRequest() {
                                            var
                                                uuid = $scope.currentRowId.slice(2);

                                            $.ajax({
                                                "url": session.getWebitelServer() + "/removeAudioRecord",
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
        $("#headerTable").show();
        $("#data-content").show();
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
});

