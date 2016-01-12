/**
 * Created by s.fedyuk on 24.12.2015.
 */
String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
};
String.prototype.insertAt=function(index, string) {
    return this.substr(0, index) + string + this.substr(index);
}
$("#builder-import_export").load(function() {
    var basic_rules = {
        condition: 'AND',
        rules: [{
            id: 'variables.domain_name',
            operator: 'contains',
            value: ''
        }]
    };
    $('#builder-import_export').queryBuilder({
        plugins: ['bt-tooltip-errors'],

        filters: [{
            id: 'callflow.caller_profile.caller_id_number',
            label: 'Caller number',
            type: 'string',
            operators: ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"]
        },
            {
                id: 'variables.domain_name',
                label: 'Domain',
                type: 'string',
                operators: ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"]
            },
            {
                id: 'callflow.caller_profile.caller_id_name',
                label: 'Caller name',
                type: 'string',
                operators: ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"]
            },
            {
                id: 'callflow.caller_profile.destination_number',
                label: 'Destination number',
                type: 'string',
                operators: ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"]
            },
            {
                id: 'variables.direction',
                label: 'Direction',
                type: 'string',
                input: 'select',
                operators: ["equal", "not_equal", "in", "not_in", "begins_with", "not_begins_with", "contains", "not_contains", "ends_with", "not_ends_with", "is_empty", "is_not_empty"],
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
                operators: ['less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
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
                operators: ['less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
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
                operators: ['less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
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
                operators: ['less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
            },
            {
                id: 'variables.billsec',
                label: 'Billsec',
                type: 'integer',
                operators: ['equal', 'not_equal', 'less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
            },
            {
                id: 'variables.duration',
                label: 'Duration',
                type: 'integer',
                operators: ['equal', 'not_equal', 'less', 'less_or_equal', 'greater', 'greater_or_equal', 'between', 'not_between']
            }]
    });
});