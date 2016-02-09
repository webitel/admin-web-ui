
var request = require('request'),
    log     = require(global["APP_ROOT_PATH"] + '/boot/winston.js')(module),
    defaultColumns = {
        fields: {
            "variables.uuid": 1,
            "variables.domain_name": 1,
            "variables.direction": 1,
            "variables.webitel_direction": 1,
            "variables.hangup_cause": 1,

            "variables.last_bridge_to": 1,
            "variables.effective_caller_id_name": "1",
            "variables.effective_caller_id_number": "1",

            "variables.duration": 1,
            "variables.billsec": 1,

            "callflow.caller_profile.caller_id_name": 1,
            "callflow.caller_profile.caller_id_number": 1,
            "callflow.caller_profile.callee_id_number": 1,
            "callflow.caller_profile.callee_id_name": 1,
            "callflow.caller_profile.destination_number": 1,

            "callflow.times.created_time": 1,
            "callflow.times.answered_time": 1,
            "callflow.times.bridged_time": 1,
            "callflow.times.hangup_time": 1
        }
    },
    CORE_URL = {
        "getListACount"  : "/api/v2/cdr/counts",
        "getListA"       : "/api/v2/cdr/searches",
        "getCdrJSON"     : "/api/v2/cdr/searches",
        "getDataForExcel": "/api/v2/cdr/searches",
        "delAudioRecord" : "/api/v2/files"                      //  +  /uuid ? db=true
    },
    cdrCli;

module.exports = cdrCli = {
    "getListACount"  : getListACount,
    "getListA"       : getListA,
    "getCdrJSON"     : getCdrJSON,
    "getDataForExcel": getDataForExcel,
    "delAudioRecord" : delAudioRecord
};

function getListACount(param, callback) {
    var sort = {},
        filterObj;

    if (param.sort !== undefined && param.order !== undefined) {
        sort[param.sort] = param.order;
    }

    filterObj = {
        "columns"    : param["columns"]    || defaultColumns,
        "filter"     : param["filter"]     || { },
        "limit"      : param["limit"]      || { },
        "pageNumber" : param["pageNumber"] || 1,
        "sort"       : sort
    };

    console.log(sort);

    request.post({
        "url"               : param.webitelServer + CORE_URL.getListACount,
        "body"              : JSON.stringify(filterObj),
        "followAllRedirects": true,
        "maxRedirects"      : 25,
        "headers": {
            "Content-Type"  : "application/json",
            "x-access-token": param.token,
            "x-key"         : param.key
        }
    }, function(err, res, resBody) {
        var cdrCount,
            errBody;

        if (typeof res != "object") {
            log.error("Core server Unavailable");
            callback({
                "code": 503,
                "message": "Core server Unavailable"
            }, null);
            return;
        }

        if (!err && res.statusCode === 200) {
            try {
                cdrCount = Number(JSON.parse(resBody));
            }
            catch (e) {
                log.error("Cant parse JSON or lead to Number");
                callback({
                    "code": 1000,
                    "message": "Server error. Cant parse JSON or lead to Number"
                }, null);
                return;
            }

            //  якщо нема ніяких помилок продовжити роботу
            log.info("Request to Core server: method=post, url=" + CORE_URL.getListACount + ", statusCode=200, response=" + cdrCount);
            callback(null, cdrCount);
            return;
        }
        else if (res.statusCode === 401) {
            log.error("Request to Core server Unauthorized");
            callback({
                "code": 401,
                "message": "Unauthorized"
            }, null);
            return;
        }
        else if (res.statusCode === 500) {
            try {
                errBody = JSON.parse(resBody);
            }
            catch (e) {
                log.error("Cant parse JSON");
                callback({
                    "code": 500,
                    "message": "Server error. Cant parse JSON"
                }, null);
                return;
            }

            if (errBody) {
                if (errBody["status"] === 500 && errBody["message"] === "Oops something went wrong") {
                    log.error("Request to Core server Unauthorized");
                    callback({
                        "code": 401,
                        "message": errBody["message"]
                    }, null);
                    return;
                }
                else {
                    log.error("No handled error. Core server responseStatus=500, message=" + errBody["message"]);
                    callback({
                        "code": 501,
                        "message": "No handled error. Core server responseStatus=500, message=" + errBody["message"]
                    }, null);
                    return;
                }
            }
            else {
                log.error("No handled error. Core server response body empty");
                callback({
                    "code": 501,
                    "message": "No handled error. Core server response body empty"
                }, null);
                return;
            }
        }
        else {
            log.error("No handled response from Core server. statusCode=" + res.statusCode);
            callback({
                "code": 500,
                "message": "No handled response from Core server. statusCode=" + res.statusCode
            }, null)
        }
    });
}

function getListA(param, callback) {
    var sort = {},
        filterObj;

    if (param.sort != undefined && param.order != undefined) {
        sort[param.sort] = param.order;
    }

    filterObj = {
        "columns"    : param["columns"]    || defaultColumns,
        "filter"     : param["filter"]     || {},
        "limit"      : param["limit"]      || {},
        "pageNumber" : param["pageNumber"] || 1,
        "sort"       : sort
    };

    console.log(filterObj);

    request.post({
        url: param.webitelServer + CORE_URL.getListA,
        body: JSON.stringify(filterObj),
        followAllRedirects: true,
        maxRedirects: 25,
        headers: {
            "Content-Type": "application/json",
            "x-access-token": param["token"],
            "x-key": param["key"]
        }
    }, function(err, res, resBody) {
        var cdrList,
            errBody;

        if (typeof res != "object") {
            callback({
                "code": 503,
                "message": "Core server Unavailable"
            }, null);
            return;
        }

        if (!err && res.statusCode === 200) {
            try {
                cdrList = JSON.parse(resBody);
            }
            catch (e) {
                log.error("Cant parse JSON");
                callback({
                    "code": 1000,
                    "message": "Server error. Cant parse JSON"
                }, null);
                return;
            }

            callback(null, cdrList);
            return;
        }
        else if (res.statusCode === 401) {
            log.error("Request to Core server Unauthorized");
            callback({
                "code": 401,
                "message": "Unauthorized"
            }, null);
            return;
        }
        else if (res.statusCode === 500) {
            try {
                errBody = JSON.parse(resBody);
            }
            catch (e) {
                log.error("Cant parse JSON");
                callback({
                    "code": 500,
                    "message": "Server error. Cant parse JSON"
                }, null);
                return;
            }

            if (errBody) {
                if (errBody["status"] === 500 && errBody["message"] === "Oops something went wrong") {
                    log.error("Request to Core server Unauthorized");
                    callback({
                        "code": 401,
                        "message": errBody["message"]
                    }, null);
                    return;
                }
                else {
                    log.error("No handled error. Core server responseStatus=500, message=" + errBody["message"]);
                    callback({
                        "code": 501,
                        "message": "No handled error. Core server responseStatus=500, message=" + errBody["message"]
                    }, null);
                    return;
                }
            }
            else {
                log.error("No handled error. Core server response body empty");
                callback({
                    "code": 501,
                    "message": "No handled error. Core server response body empty"
                }, null);
                return;
            }
        }
        else {
            log.error("No handled response from Core server. statusCode=" + res.statusCode);
            callback({
                "code": 500,
                "message": "No handled response from Core server. statusCode=" + res.statusCode
            }, null);
            return;
        }
    });
}

//  отримати всю інфу про дзвінок в json форматі
function getCdrJSON(param, callback) {
    var filterObj = {
        "columns": {},
        "fields" : {},
        "filter" : {
            "variables.uuid": param["uuid"]
        },
        "limit": 1,
        "pageNumber": param["pageNumber"] || 1,
        "sort": {}
    };

    request.post({
        url: param.webitelServer + CORE_URL.getCdrJSON,
        body: JSON.stringify(filterObj),
        followAllRedirects: true,
        maxRedirects: 25,
        headers: {
            "Content-Type": "application/json",
            "x-access-token": param["token"],
            "x-key": param["key"]
        }
    }, function(err, res, resBody) {
        callback(err, resBody);
    });
}

//  отримати дані для експорту в Excel
function getDataForExcel(param, callback) {
    var uri = param["webitelServer"] + CORE_URL.getCdrJSON;

    request.post({
        url: uri,
        body: JSON.stringify(param.body),
        followAllRedirects: true,
        maxRedirects: 25,
        headers: {
            "Content-Type": "application/json",
            "x-access-token": param["token"],
            "x-key": param["key"]
        }
    }, function(err, requestRes, resBody) {

        var response;


        //  переважно спрацьовує коли Core сервер недоступний (помилка запиту)
        if ( err ) {
            //  requestRes більш інформативний обєкт ніж err
            if ( requestRes ) {
                callback({
                    res: "-ERR",
                    code: requestRes.statusCode,
                    message: requestRes.statusMessage,
                    desc: "URI=" + uri + ", method=POST"
                });
            } else {
                callback({
                    res: "-ERR",
                    code: err.code || "",
                    message: err.toString(),
                    desc: "URI=" + uri + ", method=POST"
                });
            }
            return;
        }

        //  перевірка відповіді від Core (помилка запиту)
        if ( requestRes ) {
            if ( requestRes.statusCode !== 200 ) {
                callback({
                    res: "-ERR",
                    code: requestRes.statusCode,
                    message: requestRes.statusMessage,
                    desc: "URI=" + uri + ", method=POST"
                });
                return;
            }
        }

        //  відповідь від Core повинна бути в json
        try {
            response = JSON.parse(resBody);
        } catch (e) {
            callback({
                res: "-ERR",
                code: 500,
                message: "Cannot parse JSON body received from Core. Request info: URI=" + uri + ", method=POST",
                desc: ""
            });
            return;
        }

        //  якщо відповідь від Core має властивіть Status, значить операція не виконалась. Помилка передається в UI для подальшої обробки
        if ( response.status ) {
            callback(resBody);
            return;
        }

        //  якщо всі перевірки пройдені, просто повернути відповідь від сервеа
        callback(null, response);
    });
}

//  видалити аудіо запис
function delAudioRecord(param, callback) {

    var 
        uri,
        uuid  = param.body.uuid,
        token = param.token,
        key   = param.key,
        webitelServer = param.webitelServer;

    uri = webitelServer + CORE_URL.delAudioRecord + "/" + uuid + "?db=true";

    request.del({
        url: uri,
        followAllRedirects: true,
        maxRedirects: 25,
        headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
            "x-key": key
        }
    }, function(err, requestRes, resBody) {

        //  TODO обробити всі можливі помилки
        if ( err ) {
            callback(err);
            return;
        }

        var response = JSON.parse(resBody);

        if ( response.status === "error" ) {
            callback(response);
            return;
        }

        callback(null, response);
    });
}



/**
     app.post('/api/list'                       app.post('/api/v2/cdr/searches', cdr.showPostList);             +++
     app.post('/api/aggregate'					app.post('/api/v2/cdr/aggregates', cdr.aggregate);
     app.post('/api/listLegB'				    app.post('/api/v2/cdr/b/searches', cdr.showListB);
     app.post('/api/listACount'					app.post('/api/v2/cdr/counts', cdr.showListACount);             +++
     app.get('/api/list'						app.get ('/api/v2/cdr', cdr.showGetList);
     app.delete('/api/delFile?:id'				app.delete('/api/v2/files/:id', file.deleteResource);
     app.get('/api/getFile?:id'					app.get('/api/v2/files/:id', file.getResource);
 */
