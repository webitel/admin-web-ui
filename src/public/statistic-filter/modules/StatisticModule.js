/**
 * Created by s.fedyuk on 22.12.2015.
 */

define("StaticticModule",[], function() {

var staticticModule = angular.module("statisticModule",[]);

    staticticModule.controller("statisticController", function($scope, $http) {

        $scope.credentials ={login: "root", password: "ROOT_PASSWORD", token: "", key: ""};
        $scope.server = { loginUrl: "https://pre.webitel.com:10022/login", dataUrl: "https://pre.webitel.com:10022/api/v2/cdr/searches",
            countUrl: "https://pre.webitel.com:10022/api/v2/cdr/counts"};

        $scope.calls = [];
        $scope.rows = 0;
        $scope.currentRowId = "";

        $scope.currentfilters = {};
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

        $scope.useFilter = function() {
            $scope.calls = [];
            $scope.currentPage = 1;
            $scope.sortCaptions[$scope.currentSortId]["caption"] = $scope.sortCaptions[$scope.currentSortId]["caption"].substr(1);
            $scope.currentSortId = 3;
            $scope.sortCaptions[3]["sortType"] = -1;
            if($scope.sortCaptions[3]["caption"][0] != "\u25BC") {
                $scope.sortCaptions[3]["caption"] = $scope.sortCaptions[3]["caption"].insertAt(0, "\u25BC");
            }
            var result = $('#builder-import_export').queryBuilder('getMongo');
            if (!$.isEmptyObject(result)) {
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

            $http(data).then(function(response) {
                var callerName, callerNumber, destinationNumber,
                    createdTime, answeredTime, bridgedTime, hangupTime;
                var data = response.data;
                for(var i = 0; i < data.length; i++) {
                    callerName = data[i].callflow[0].caller_profile.caller_id_name;
                    callerNumber = data[i].callflow[0].caller_profile.caller_id_number;
                    destinationNumber = data[i].callflow[0].caller_profile.destination_number;
                    createdTime = data[i].callflow[0].times.created_time > 0 ? new Date(data[i].callflow[0].times.created_time / 1000).toLocaleString() : 0;
                    answeredTime = data[i].callflow[0].times.answered_time > 0 ? new Date(data[i].callflow[0].times.answered_time / 1000).toLocaleDateString() : 0;
                    bridgedTime = data[i].callflow[0].times.bridged_time > 0 ? new Date(data[i].callflow[0].times.bridged_time / 1000).toLocaleString() : 0;
                    hangupTime = data[i].callflow[0].times.hangup_time > 0 ? new Date(data[i].callflow[0].times.hangup_time / 1000).toLocaleString() : 0;
                    for(var j = 0; j < $scope.filterRules.rules.length; j++) {
                        if($scope.filterRules.rules[j].id == "callflow.caller_profile.caller_id_name") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].caller_profile.caller_id_name) {
                                    callerName = data[i].callflow[k].caller_profile.caller_id_name;
                                    break;
                                }
                            }
                        }
                        if($scope.filterRules.rules[j].id == "callflow.caller_profile.caller_id_number") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].caller_profile.caller_id_number) {
                                    callerNumber = data[i].callflow[k].caller_profile.caller_id_number;
                                    break;
                                }
                            }
                        }
                        if($scope.filterRules.rules[j].id == "callflow.caller_profile.destination_number") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].caller_profile.destination_number) {
                                    destinationNumber = data[i].callflow[k].caller_profile.destination_number;
                                    break;
                                }
                            }
                        }
                        if($scope.filterRules.rules[j].id == "callflow.times.created_time") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].times.created_time) {
                                    createdTime = data[i].callflow[k].times.created_time > 0 ? new Date(data[i].callflow[k].times.created_time / 1000).toLocaleString() : 0;
                                    break;
                                }
                            }
                        }
                        if($scope.filterRules.rules[j].id == "callflow.times.answered_time") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].times.answered_time) {
                                    answeredTime = data[i].callflow[k].times.answered_time > 0 ? new Date(data[i].callflow[k].times.answered_time / 1000).toLocaleDateString() : 0;
                                    break;
                                }
                            }
                        }
                        if($scope.filterRules.rules[j].id == "callflow.times.bridged_time") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].times.bridged_time) {
                                    bridgedTime = data[i].callflow[k].times.bridged_time > 0 ? new Date(data[i].callflow[k].times.bridged_time / 1000).toLocaleString() : 0;
                                    break;
                                }
                            }
                        }
                        if($scope.filterRules.rules[j].id == "callflow.times.hangup_time") {
                            for(var k = 0; k < data[i].callflow.length; k++) {
                                if($scope.filterRules.rules[j].value == data[i].callflow[k].times.hangup_time) {
                                    hangupTime = data[i].callflow[k].times.hangup_time > 0 ? new Date(data[i].callflow[k].times.hangup_time / 1000).toLocaleString() : 0;
                                    break;
                                }
                            }
                        }
                    }
                    $scope.calls.push({uuid: "el" + data[i].variables.uuid,
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
                        hangupTime: hangupTime});
                }
            }, function(response) {
            });
        }

        $scope.clickRowTable = function(uuid) {
            $("#"+$scope.currentRowId).hide();
            for(var i = 0; i < $scope.calls.length; i++) {
                if($scope.calls[i].uuid == uuid) {
                    $("#"+uuid).show("fast");
                    $scope.currentRowId = $scope.calls[i].uuid;
                }
            }
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

            $http(data).then(function(response) {
                $scope.rows = response.data;
            }, function(response) {
            });
        }
        $scope.showMore = function() {
            $scope.currentPage++;
            $scope.getStartData($scope.currentPage, $scope.currentSortFilter);
        }
        $scope.makeSort = function(sortId) {
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
        //INITIALIZATION//////////////////////////////////////////////////////////
        var login = {
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
        });
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
});

