define("webitelApi", function() {

    var webitelApi = {
        "getQueueAgents": function(params, callback) {
            var that = this;
            $.ajax({
                "url": params.uri + "/api/v2/callcenter/queues/" + params.queueName + "/tiers" + ( params.domain ? "?domain=" + params.domain : ""),
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Access-Token": params.token,
                    "X-Key": params.key
                },
                "success": function(data, textStatus, jqXHR) {
                    if ( textStatus === "success" ) {
                        callback.apply(that, [null, data]);
                    }
                },
                "error": function(jqXHR, textStatus, errorThrown ) {
                    callback.call(that, {
                        "msg": textStatus
                    });
                }
            });
        },
        "getQueues": function(params, callback) {
            var that = this;
            $.ajax({
                "url": params.uri + "/api/v2/callcenter/queues" + ( params.domain ? "?domain=" + params.domain : ""),
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Access-Token": params.token,
                    "X-Key": params.key
                },
                "success": function(data, textStatus, jqXHR) {
                    if ( textStatus === "success" ) {
                        callback.apply(that, [null, data]);
                    }
                },
                "error": function(jqXHR, textStatus, errorThrown ) {
                    callback.call(that, {
                        "msg": textStatus
                    });
                }
            });
        },
        "getQueueParams": function(params, callback) {
            var that = this;
            $.ajax({
                "url": params.uri + "/api/v2/callcenter/queues/" + params.queueName + ( params.domain ? "?domain=" + params.domain : ""),
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Access-Token": params.token,
                    "X-Key": params.key
                },
                "success": function(data, textStatus, jqXHR) {
                    if ( textStatus === "success" ) {
                        callback.apply(that, [null, data]);
                    }
                },
                "error": function(jqXHR, textStatus, errorThrown ) {
                    callback.call(that, {
                        "msg": textStatus
                    });
                }
            });
        },
        "enableDisableQueue": function(params, callback) {
            var that = this;
            $.ajax({
                "url": params.uri + "/api/v2/callcenter/queues/" + params.queueName + "/" + params.state + ( params.domain ? "?domain=" + params.domain : ""),
                "method": "PUT",
                "headers": {
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Access-Token": params.token,
                    "X-Key": params.key
                },
                "success": function(data, textStatus, jqXHR) {
                    if ( textStatus === "success" ) {
                        callback.apply(that, [null, data]);
                    }
                },
                "error": function(jqXHR, textStatus, errorThrown ) {
                    callback.call(that, {
                        "msg": textStatus
                    });
                }
            });
        },
        "getQueueMembersCount": function(params, callback) {
            var that = this;
            $.ajax({
                "url": params.uri + "/api/v2/callcenter/queues/" + params.queueName + "/members" + ( params.domain ? "?domain=" + params.domain : ""),
                "method": "GET",
                "headers": {
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Access-Token": params.token,
                    "X-Key": params.key
                },
                "success": function(data, textStatus, jqXHR) {
                    if ( textStatus === "success" ) {
                        callback.apply(that, [null, data.info.length]);
                    }
                },
                "error": function(jqXHR, textStatus, errorThrown ) {
                    callback.call(that, {
                        "msg": textStatus
                    });
                }
            });
        }
    };

    return {
        "getQueueAgents": webitelApi.getQueueAgents,
        "getQueues": webitelApi.getQueues,
        "getQueueParams": webitelApi.getQueueParams,
        "enableDisableQueue": webitelApi.enableDisableQueue,
        "getQueueMembersCount": webitelApi.getQueueMembersCount
    }
});