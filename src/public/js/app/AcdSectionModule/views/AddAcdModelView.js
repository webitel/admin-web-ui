

/**
 *
 * Івенти на які підписаний модуль:
 *      - showAgents [ custom ]                 вставляє всіх отриманих операторів в список
 *
 * які генерить:
 *      - showAgents [ custom ]                 після отримання списку всіх операторів
 *
 * TODO
 *      - жостка привязка івентів по id
 */

define([
    "backbone",
    "text!/js/app/AcdSectionModule/tpl/AddAcdModelViewTpl.html",
    "fieldValidator",
    "alert",
    "errHandler"
], function(Backbone, AddAcdModelViewTpl, fieldValidator, alert, errHandler) {

    //  strategy | moh-sound | announce-sound | announce-frequency | record-template | time-base-score | tier-rules-apply | tier-rule-wait-second | tier-rule-no-agent-no-wait
    //  discard-abandoned-after | abandoned-resume-allowed | tier-rule-wait-multiply-level | max-wait-time | max-wait-time-with-no-agent | max-wait-time-with-no-agent-time-reached

    var REQUEST_TIMEOUT = 5000,
        CREATE_QUEUE = {
            "method": "POST",
            "path"  : "/api/v2/callcenter/queues"
        },
        CREATE_TIER = {
            "method": "POST",
            "path"  : "/api/v2/callcenter/queues/"
        };


    var AddAcdModelView = Backbone.View.extend({
        initialize: function(options) {
            //  зберегти силку на батька, а через нього є доступ до колекції
            this.options = options;

            console.info("AddAcdModelView was initialized");

            this.on("showAgents", this.showAgents, this);

            this.getAgents(this);
        },
        id: "addAcdPageContainer",
        tagName: "div",
        className: "",
        template: _.template(AddAcdModelViewTpl),
        fields: {
            name: {
                id: "add-acd-name-field",
                name: "name",
                defValue: "",
                currValue: {
                    value: "",
                    isValid: false,
                    errMsg: "Field cannot be empty"
                },
                description: "",
                validatorConf: ["maxLength_20", "isNotEmpty", "hasNotSpaces", "hasNotCyrillic"]
            },
            description: {
                id: "add-acd-description-field",
                name: "description",
                fsName: "description",
                defValue: "",
                currValue: {
                    value: "",
                    isValid: true
                },
                description: "",
                validatorConf: ["maxLength_50", "hasNotSpecialSymbol"]
            },

            maxWaitTime: {
                id: "add-acd-maxWaitTime-field",
                name: "maxWaitTime",
                fsName: "max-wait-time",
                defValue: 0,
                currValue: {
                    value: 0,
                    isValid: true
                },
                description: "",
                validatorConf: ["maxLength_3", "isNumber"]
            },
            maxWaitTimeWithNoAgent: {
                id: "add-acd-maxWaitTimeWithNoAgent-field",
                name: "maxWaitTimeWithNoAgent",
                fsName: "max-wait-time-with-no-agent",
                defValue: 120,
                currValue: {
                    value: 120,
                    isValid: true
                },
                description: "",
                validatorConf: ["maxLength_3", "isNumber"]
            },
            maxWaitTimeWithNoAgentTimeReached: {
                id: "add-acd-maxWaitTimeWithNoAgentTimeReached-field",
                name: "maxWaitTimeWithNoAgentTimeReached",
                fsName: "max-wait-time-with-no-agent-time-reached",
                defValue: 5,
                currValue: {
                    value: 5,
                    isValid: true
                },
                description: "",
                validatorConf: ["maxLength_3", "isNumber"]
            },

            mohSound: {
                id: "add-acd-mohSound-field",
                name: "mohSound",
                fsName: "moh-sound",
                defValue: "$${hold_music}",
                currValue: {
                    value: "$${hold_music}",
                    isValid: true
                },
                description: "",
                validatorConf: ["maxLength_50"]
            },
            discardAbandonedAfter: {
                id: "add-acd-discardAbandonedAfter-field",
                name: "discardAbandonedAfter",
                fsName: "discard-abandoned-after",
                defValue: "",
                currValue: {
                    value: "",
                    isValid: true
                },
                description: "",
                validatorConf: ["maxLength_3", "isNumber"]
            }
        },
        buttons: {
            saveBtn: {
                id: "add-acd-page-save",
                text: "Save"
            },
            closeBtn: {
                id: "add-acd-page-cancel",
                text: "Cancel"
            }
        },

        getAgents: function(scope) {
            webitel.userList(this.options.parentView.collection.auth.domain, function(res) {
                var users,
                    prop,
                    agents = [];

                if (res.status == 0) {
                    try {
                        users = JSON.parse(this.responseText);
                    } catch (e) { console.error("Cannot parse JSON response from webitel.userList"); return; }

                    for ( prop in users ) {
                        if ( users[prop]["agent"] === "true" ) {
                            agents.push(users[prop]);
                        }
                    }
                    console.log("%c CustomEvent: showAgents. Target: AddAcdModelView ", 'background: #518EC5; color: white');
                    scope.trigger("showAgents", agents);
                }
                else if (res.status == 1) {
                    console.error(this.responseText);
                    alert.error("", this.responseText, 5000);
                }
            });
        },
        //  за допомогою класів ONHOOK, NONREG, ISBUSY відмальовую статус оператора
        showAgents: function(agents) {
            var i,
                elements = [],
                element,
                spanName,
                spanStatus;

            //  приховати панель загрузки
            //$("#addAcdPageContainer #operators-tab-load").hide();
            $("#operators-tab-load").hide();

            if ( agents.length === 0 ) {
                //  приховати контейнери для операторів
                $("#agentsListForm").hide();
                //  показати пусте повідомлення
                $("#agentsListEmpty").show();
                return;
            }
            else {
                //  показати форму для перекидування операторів
                $("#agentsListForm").show();

                for ( i = 0; i < agents.length; i++ ) {
                    element    = $("<li>").attr({ "agentId": agents[i].id });
                    spanName   = $("<span>").attr({"class": "agent-name"}).text(agents[i]["id"]);
                    spanStatus = $("<span>").attr({"class": "agent-status fa fa-circle"});

                    if ( agents[i]["state"] === "ONHOOK" ) {
                        $(spanStatus).addClass("ONHOOK")
                    }
                    else if ( agents[i]["state"] === "NONREG" ) {
                        $(spanStatus).addClass("NONREG")
                    }
                    else if ( agents[i]["state"] === "ISBUSY" ) {
                        $(spanStatus).addClass("ISBUSY")
                    }

                    $(element).append(spanName);
                    $(element).append(spanStatus);

                    elements.push(element);
                }
                $("#agentsList").append(elements);
            }
        },

        render: function() {
            this.$el.html(this.template({
                "fieldNameId": this.fields.name.id,
                "fieldDescriptionId": this.fields.description.id,

                "fieldMaxWaitTimeId": this.fields.maxWaitTime.id,
                "fieldMaxWaitTimeDefValue": this.fields.maxWaitTime.defValue,
                "fieldMaxWaitTimeWithNoAgentId": this.fields.maxWaitTimeWithNoAgent.id,
                "fieldMaxWaitTimeWithNoAgentDefValue": this.fields.maxWaitTimeWithNoAgent.defValue,
                "fieldMaxWaitTimeWithNoAgentTimeReachedId": this.fields.maxWaitTimeWithNoAgentTimeReached.id,
                "fieldMaxWaitTimeWithNoAgentTimeReachedDefValue": this.fields.maxWaitTimeWithNoAgentTimeReached.defValue,

                "fieldMohSoundId": this.fields.mohSound.id,
                "fieldMohSoundDefValue": this.fields.mohSound.defValue,
                "fieldDiscardAbandonedAfterId": this.fields.discardAbandonedAfter.id,

                "saveBtnId"  : this.buttons.saveBtn.id,
                "saveBtnText": this.buttons.saveBtn.text,

                "closeBtnId"  : this.buttons.closeBtn.id,
                "closeBtnText": this.buttons.closeBtn.text
            }));
            return this;
        },
        events: {
            "click #add-acd-page-save"   : "save",
            "click #add-acd-page-cancel" : "cancel",

            //  валідація полів
            "change #add-acd-name-field"                             : "checkName",
            "change #add-acd-description-field"                      : "checkDescription",


            "change #add-acd-maxWaitTime-field"                      : "checkMaxWaitTime",
            "change #add-acd-maxWaitTimeWithNoAgent-field"           : "checkMaxWaitTimeWithNoAgent",
            "change #add-acd-maxWaitTimeWithNoAgentTimeReached-field": "checkMaxWaitTimeWithNoAgentTimeReached",

            "change #add-acd-mohSound-field": "checkMohSound",
            "change #add-acd-discardAbandonedAfter-field"            : "checkDiscardAbandonedAfter",

            //  опрацьовує клік по чекбоксу поля, задає клас active
            "change #add-acd-abandonedResumeAllowed-field input": "abandonedResumeAllowed",

            // Додає додатковий клас для позначення вибраного елемента
            "click #agentsList li"     : "makeAgentActive",
            "click #queueAgentsList li": "makeAgentActive",

            // Перміщає операторіву у або з черги
            "click #agentsListCont .agents-list-footer .move-all"          : "moveAllAgentsInQueue",
            "click #agentsListCont .agents-list-footer .move-selected"     : "moveSelAgentsInQueue",
            "click #queueAgentsListCont .agents-list-footer .move-all"     : "moveAllAgentsFromQueue",
            "click #queueAgentsListCont .agents-list-footer .move-selected": "moveSelAgentsFromQueue"
        },

        save: function() {
            var f = this.fields,
                c = this.options.parentView.collection,

                name,
                strategy = "strategy=" + $("#add-acd-strategy-field").find(":selected").text().toLowerCase(),
                description,

                maxWaitTime,
                maxWaitTimeWithNoAgent,
                maxWaitTimeWithNoAgentTimeReached,

                mohSound,
                timeBaseScore = "time-base-score=" + $("#add-acd-timeBaseScore-field").find(":selected").text().toLowerCase(),
                discardAbandonedAfter,
                abandonedResumeAllowed = "abandoned-resume-allowed=" + $("#add-acd-abandonedResumeAllowed-field input")[0].checked,

                params = [],
                agents = [],
                xhr,
                that = this,
                showErrField = function(fieldName) {
                    alert.error("", "Field " + fieldName + " is not valid", 3000);
                };

            if ( !f.name.currValue.isValid ) {
                $("#" + f.name.id).parent().addClass("warning");
                $("#" + f.name.id).parent().find(".error-block").text(f.name.currValue.errMsg);
                showErrField("name");
                return;
            }
            name = f.name.currValue.value;

            if ( !f.description.currValue.isValid ) {
                showErrField("description");
                return;
            }
            //  екранувати поле description
            description = f.description.fsName + "='" + f.description.currValue.value + "'";


            if ( !f.maxWaitTime.currValue.isValid ) {
                showErrField("max wait time");
                return;
            }
            maxWaitTime = f.maxWaitTime.fsName + "=" + f.maxWaitTime.currValue.value;

            if ( !f.maxWaitTimeWithNoAgent.currValue.isValid ) {
                showErrField("max wait time with no agent");
                return;
            }
            maxWaitTimeWithNoAgent = f.maxWaitTimeWithNoAgent.fsName + "=" + f.maxWaitTimeWithNoAgent.currValue.value;

            if ( !f.maxWaitTimeWithNoAgentTimeReached.currValue.isValid ) {
                showErrField("max wait time with no agent time reached");
                return;
            }
            maxWaitTimeWithNoAgentTimeReached = f.maxWaitTimeWithNoAgentTimeReached.fsName + "=" + f.maxWaitTimeWithNoAgentTimeReached.currValue.value;


            if ( !f.mohSound.currValue.isValid ) {
                showErrField("moh sound");
                return;
            }
            mohSound = f.mohSound.fsName + "=" + f.mohSound.currValue.value;

            if ( !f.discardAbandonedAfter.currValue.isValid ) {
                showErrField("discard abandoned after");
                return;
            }
            discardAbandonedAfter = f.discardAbandonedAfter.fsName + "=" + f.discardAbandonedAfter.currValue.value;

            $("#queueAgentsList li").each(function(item, elem) {
                 agents.push($(elem).attr("agentId"));
            });

            params.push(strategy);
            params.push(description);

            params.push(maxWaitTime);
            params.push(maxWaitTimeWithNoAgent);
            params.push(maxWaitTimeWithNoAgentTimeReached);

            params.push(mohSound);
            params.push(timeBaseScore);
            params.push(discardAbandonedAfter);
            params.push(abandonedResumeAllowed);

            xhr = new XMLHttpRequest();
            xhr.open(CREATE_QUEUE.method, c.auth.host + CREATE_QUEUE.path + "?domain=" + c.auth.domain, true);

            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
            xhr.setRequestHeader("X-Access-Token", c.auth.token);
            xhr.setRequestHeader("X-Key", c.auth.key);

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;

                if (xhr.status === 200) {
                    try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return; }

                    if ( res.status === "OK" ) {
                        alert.success("", res.info, 3000);
                        that.createTier(name, agents);
                    }
                    else if ( res.status === "error") {
                        errHandler.handleCore(res);
                    }
                } else {
                    errHandler.handleXhr(xhr.status, xhr);
                }
            };
            xhr.timeout = REQUEST_TIMEOUT;
            xhr.ontimeout = function(e) {
                console.error("Cannot create queue. Request timeout");
                alert.error("", "Cannot create queue. Request timeout", 3000);
                return;
            };
            xhr.send(JSON.stringify({
                "name": name,
                "params": params
            }));
        },

        //  створення тірів через рекурсію
        createTier: function(queueName, agents) {
            var xhr,
                agent,
                that = this;

            if ( agents.length > 0 ) {
                agent = agents.splice(0, 1);

                xhr = new XMLHttpRequest();
                xhr.open(CREATE_TIER.method, this.options.parentView.collection.auth.host + CREATE_TIER.path + queueName + "/tiers" + "?domain=" + this.options.parentView.collection.auth.domain, true);

                xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                xhr.setRequestHeader("X-Access-Token", this.options.parentView.collection.auth.token);
                xhr.setRequestHeader("X-Key", this.options.parentView.collection.auth.key);

                xhr.onreadystatechange = function () {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return;}

                        if (res.status === "OK") {
                            alert.success("", "Agent " + agent + " added to " + queueName, 5000);
                            that.createTier(queueName, agents);
                        }
                        else if (res.status === "error") {
                            if ( res.info === "-ERR Tier exists!\n" ) {
                                alert.error("", "Agent " + agent + " exists in " + queueName, 5000);
                                that.createTier(queueName, agents);
                            }
                            else {
                                errHandler.handleCore(res)
                            }
                        }
                    }
                    else {
                        errHandler.handleXhr(xhr.status, xhr);
                    }
                };
                xhr.timeout = REQUEST_TIMEOUT;
                xhr.ontimeout = function (e) {
                    console.error("Cannot create tier. Request timeout");
                    alert.error("", "Cannot create tier. Request timeout", 3000);
                    return;
                };
                xhr.send(JSON.stringify({
                    "agent": agent
                }));
            } else {
                that.cancel();
            }
        },
        cancel: function() {
            var f = this.fields;

            //  затерти локальні змінені поля вюхи
            f.name.currValue.value = "";
            f.name.currValue.isValid = false;
            f.name.currValue.errMsg = "Field cannot be empty";

            f.description.currValue.value = "";
            f.description.currValue.isValid = true;

            f.maxWaitTime.currValue.value = f.maxWaitTime.defValue;
            f.maxWaitTime.currValue.isValid = true;

            f.maxWaitTimeWithNoAgent.currValue.value = f.maxWaitTimeWithNoAgent.defValue;
            f.maxWaitTimeWithNoAgent.currValue.isValid = true;

            f.maxWaitTimeWithNoAgentTimeReached.currValue.value = f.maxWaitTimeWithNoAgentTimeReached.defValue;
            f.maxWaitTimeWithNoAgentTimeReached.currValue.isValid = true;

            f.mohSound.currValue.value = f.mohSound.defValue;
            f.mohSound.currValue.isValid = true;

            f.discardAbandonedAfter.currValue.value = f.discardAbandonedAfter.defValue;
            f.discardAbandonedAfter.currValue.isValid = true;

            //  видалити вюху створення моделі. Згенерувати кастомний івент показу вюхи колекції
            this.remove();

            this.options.parentView.show()
        },

        //  валідація полів
        checkName: function(e) {
            var nameField   = this.fields.name.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),            //  контейнер який містить поле введення і попередження
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[nameField] = fieldValue;

            fieldValidator.config[nameField] = this.fields.name.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[nameField]["msg"]);

                this.fields.name.currValue.value = "";
                this.fields.name.currValue.isValid = false;
                this.fields.name.currValue.errMsg = fieldValidator.messages[nameField]["msg"];
            } else {
                $(parentEl).removeClass("warning");

                this.fields.name.currValue.value = fieldValue;
                this.fields.name.currValue.isValid = true;
                this.fields.name.currValue.errMsg = "";
            }
        },
        checkDescription: function(e) {
            var fieldName   = this.fields.description.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[fieldName] = fieldValue;

            fieldValidator.config[fieldName] = this.fields.description.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[fieldName]["msg"]);

                this.fields.description.currValue.value = "";
                this.fields.description.currValue.isValid = false;
            } else {
                $(parentEl).removeClass("warning");

                this.fields.description.currValue.value = fieldValue;
                this.fields.description.currValue.isValid = true;

            }
        },

        checkMaxWaitTime: function(e) {
            var fieldName   = this.fields.maxWaitTime.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[fieldName] = fieldValue;

            fieldValidator.config[fieldName] = this.fields.maxWaitTime.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[fieldName]["msg"]);

                this.fields.maxWaitTime.currValue.value = "";
                this.fields.maxWaitTime.currValue.isValid = false;
            } else {
                $(parentEl).removeClass("warning");

                this.fields.maxWaitTime.currValue.value = fieldValue;
                this.fields.maxWaitTime.currValue.isValid = true;

            }
        },
        checkMaxWaitTimeWithNoAgent: function(e) {
            var fieldName   = this.fields.maxWaitTimeWithNoAgent.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[fieldName] = fieldValue;

            fieldValidator.config[fieldName] = this.fields.maxWaitTimeWithNoAgent.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[fieldName]["msg"]);

                this.fields.maxWaitTimeWithNoAgent.currValue.value = "";
                this.fields.maxWaitTimeWithNoAgent.currValue.isValid = false;
            } else {
                $(parentEl).removeClass("warning");

                this.fields.maxWaitTimeWithNoAgent.currValue.value = fieldValue;
                this.fields.maxWaitTimeWithNoAgent.currValue.isValid = true;
            }
        },
        checkMaxWaitTimeWithNoAgentTimeReached: function(e) {
            var fieldName   = this.fields.maxWaitTimeWithNoAgentTimeReached.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[fieldName] = fieldValue;

            fieldValidator.config[fieldName] = this.fields.maxWaitTimeWithNoAgentTimeReached.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[fieldName]["msg"]);

                this.fields.maxWaitTimeWithNoAgentTimeReached.currValue.value = "";
                this.fields.maxWaitTimeWithNoAgentTimeReached.currValue.isValid = false;
            } else {
                $(parentEl).removeClass("warning");

                this.fields.maxWaitTimeWithNoAgentTimeReached.currValue.value = fieldValue;
                this.fields.maxWaitTimeWithNoAgentTimeReached.currValue.isValid = true;
            }
        },

        checkMohSound: function (e) {
            var fieldName   = this.fields.mohSound.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[fieldName] = fieldValue;

            fieldValidator.config[fieldName] = this.fields.mohSound.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[fieldName]["msg"]);

                this.fields.mohSound.currValue.value = "";
                this.fields.mohSound.currValue.isValid = false;
            } else {
                $(parentEl).removeClass("warning");

                this.fields.mohSound.currValue.value = fieldValue;
                this.fields.mohSound.currValue.isValid = true;
            }
        },
        checkDiscardAbandonedAfter: function(e) {
            var fieldName   = this.fields.discardAbandonedAfter.name,
                fieldValue  = $(e.target).val(),
                parentEl    = $(e.target.parentElement),
                errEl       = $(parentEl).find("small"),
                data        = {};

            data[fieldName] = fieldValue;

            fieldValidator.config[fieldName] = this.fields.discardAbandonedAfter.validatorConf;
            fieldValidator.validate(data);

            if ( fieldValidator.hasErrors() ) {
                $(parentEl).addClass("warning");
                $(errEl).text(fieldValidator.messages[fieldName]["msg"]);

                this.fields.discardAbandonedAfter.currValue.value = "";
                this.fields.discardAbandonedAfter.currValue.isValid = false;
            } else {
                $(parentEl).removeClass("warning");

                this.fields.discardAbandonedAfter.currValue.value = fieldValue;
                this.fields.discardAbandonedAfter.currValue.isValid = true;
            }
        },

        //  Опрацьовує клік по полю Abandoned resume allowed, типу checkbox
        abandonedResumeAllowed: function(e) {
            var parent         = e.target.parentElement,            //  містить в собі прихований checkBox
                hiddenCheckbox = e.target;

            if ( hiddenCheckbox.checked ) {
                $(parent).addClass("active");
            } else {
                $(parent).removeClass("active");
            }
        },

        // Додає або видаляє клас active до елементів списку агентів і агентів в черзі
        makeAgentActive: function(e) {
            var parent = e.currentTarget;

            if ( $(parent).hasClass("active") ) {
                $(parent).removeClass("active");
            } else {
                $(parent).addClass("active");
            }
        },

        // Візуально переміщає агентів у/з чергу(и)
        moveAllAgentsInQueue: function(e) {
            $("#agentsList li").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#queueAgentsList"));
            });
        },
        moveSelAgentsInQueue: function(e) {
            $("#agentsList li.active").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#queueAgentsList"));
            });
        },
        moveAllAgentsFromQueue: function(e) {
            $("#queueAgentsList li").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#agentsList"));
            });
        },
        moveSelAgentsFromQueue: function(e) {
            $("#queueAgentsList li.active").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#agentsList"));
            });
        }
    });

    return AddAcdModelView;
});

























