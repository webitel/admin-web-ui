/**
 * Моделька слухає івенти видалення, редагування, збереження, простого перегляду і т.п.
 * Модель це основа. Спочатку вона може мати декілька полів, але потім модель по ходу виконання розширяється
 *
 * Модель повинна валідувати свої значення,
 *
 *
 * Івенти на які підписаний модуль:
 *      - removeModel [ custom ] - відправити запит на видалення моделі
 *
 * які генерить:
 *      - reloadCollection [ custom ] - обновити колекцію
 *      - paramsReceived [ custom ] - параметри черги отримані
 *      - renderAgents [ custom ] - відмалювати два списка з операторами
 *
 */



define(["backbone", "alert", "errHandler", "bootbox", "fieldValidator", "webitelApi"],
    function(Backbone, alert, errHandler, _bootbox, fieldValidator, webitelApi) {

        var REMOVE_QUEUE = {
                "method": "DELETE",
                "path"  : "/api/v2/callcenter/queues/"
            },
            GET_QUEUE_PARAMS = {
                "method": "GET",
                "path"  : "/api/v2/callcenter/queues/"
            },
            UPDATE_QUEUE_PARAMS = {
                "method": "PUT",
                "path"  : "/api/v2/callcenter/queues/"          //  :name
            },
            REMOVE_AGENT = {
                "method": "DELETE",
                "path"  : "/api/v2/callcenter/queues/"          //  :queueName/tiers/:agent?"
            },
            CREATE_TIER = {
                "method": "POST",
                "path"  : "/api/v2/callcenter/queues/"
            },
            SWITCH_QUEUE = {
                //"method": "PATCH",
                "method": "PUT",
                "path"  : "/api/v2/callcenter/queues/"      //  /:queue_name/:disable||?domain=..
            },
            REQUEST_TIMEOUT = 5000,
            router = app.router;


        var AcdModel = Backbone.Model.extend({
            initialize: function(attributes, options) {
                this.auth = options.auth;
                console.info("AcdModel " + attributes["name"] + " was initialized");

                //  підписка на івенти remove, open, enable
                this.on("removeModel", this.removeModel);
                this.on("change:agentsList", this.updateAgentsCounter, this);

                this.initAgentsCount();
                this.initMembersCount();

            },
            defaults: {
                "domain"  : "",
                "name"    : "",
                "enable"  : "",
                "strategy": "",
                "members": 0,
                "agentsList": [],
                "agentsCounter": {
                    "available": 0,
                    "busy": 0,
                    "onBreak": 0,
                    "offLine": 0
                }
            },
            params: {
                "strategy": {
                    "id": "open-acd-strategy-field",
                    "fsName"   : "strategy",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": []
                },
                "description": {
                    "id": "open-acd-description-field",
                    "htmlName" : "Description",
                    "fsName"   : "description",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": ["maxLength_50"]
                },

                "maxWaitTime": {
                    "id"       : "open-acd-maxWaitTime-field",
                    "htmlName" : "Max wait time",
                    "fsName"   : "max-wait-time",
                    "currValue": "",
                    "changed": "false",
                    "isValid": "true",
                    "validatorConf": ["isNumber", "maxLength_3"]
                },
                "maxWaitTimeWithNoAgent": {
                    "id": "add-acd-maxWaitTimeWithNoAgent-field",
                    "htmlName" : "Max wait time with no agent",
                    "fsName": "max-wait-time-with-no-agent",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": ["isNumber", "maxLength_3"]
                },
                "maxWaitTimeWithNoAgentTimeReached": {
                    "id": "add-acd-maxWaitTimeWithNoAgentTimeReached-field",
                    "htmlName" : "Max wait time with no agent time reached",
                    "fsName"   : "max-wait-time-with-no-agent-time-reached",
                    "currValue": "",
                    "changed": "false",
                    "isValid": "true",
                    "validatorConf": ["isNumber", "maxLength_3"]
                },

                "mohSound": {
                    "id": "open-acd-mohSound-field",
                    "htmlName" : "Moh sound",
                    "fsName"   : "moh-sound",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": ["maxLength_50"]
                },
                "discardAbandonedAfter": {
                    "id": "open-acd-discardAbandonedAfter-field",
                    "htmlName" : "Discard abandoned after",
                    "fsName"   : "discard-abandoned-after",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": ["isNumber", "maxLength_3"]
                },
                "abandonedResumeAllowed": {
                    "id": "open-acd-abandonedResumeAllowed-field",
                    "htmlName" : "Abandoned resume allowed",
                    "fsName"   : "abandoned-resume-allowed",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": []
                },
                "timeBaseScore": {
                    "id": "open-acd-timeBaseScore-field",
                    "htmlName" : "Time base score",
                    "fsName"   : "time-base-score",
                    "currValue": "",
                    "changed"  : "false",
                    "isValid"  : "true",
                    "validatorConf": []
                }
            },
            //  зберігає агентів, які є в черзі. В кінці на save цей масив буде порівнюватися із новим списком агентів
            agents: [],

            initMembersCount: function() {
                var queueName = this.get("name"),
                    domain, token, key, host;

                if ( this.collection && this.collection.auth ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.auth.domain;
                    token  = this.auth.token;
                    key    = this.auth.key;
                    host   = this.auth.host;
                }

                webitelApi.getQueueMembersCount.apply(this, [{
                    "uri": host,
                    "queueName": queueName,
                    "domain": domain,
                    "token": token,
                    "key": key
                }, function(err, resCount) {
                    this.set("members", resCount);
                }])
            },
            initAgentsCount: function() {
                this.getQueueAgents(function(data) {
                    if ( data.length === 0 )    return;

                    var agentsList = [];

                    _.each(data, function(element, index, list) {
                        agentsList.push(element);
                    }, this);

                    this.set("agentsList", agentsList);
                })
            },
            updateAgentsCounter: function() {
                var agents = this.get("agentsList");

                var agentsCounter = {
                    "available": 0,
                    "busy": 0,
                    "onBreak": 0,
                    "offLine": 0
                };

                _.each(agents, function(element) {
                    if ( element.status === "Logged Out" ) {
                        agentsCounter.offLine += 1;
                    } else if ( element.status === "On Break" ) {
                        agentsCounter.onBreak += 1;
                    } else if ( element.status === "Available" || element.status === "Available (On Demand)" ) {
                        if ( element.state === "Waiting" ) {
                            agentsCounter.available += 1;
                        } else {
                            agentsCounter.busy += 1;
                        }
                    }
                }, this);

                this.set("agentsCounter", agentsCounter);
            },

            //  послати запит для отримання всіх параметрів черги. Зберегти їх в "params"
            getParams: function() {
                var queueName = this.get("name"),
                    domain, token, key, host;

                if ( this.collection ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.auth.domain;
                    token  = this.auth.token;
                    key    = this.auth.key;
                    host   = this.auth.host;
                }

                if ( !domain ) {
                    console.warn("Domain was not select. Please, select the domain");
                    alert.warning("", "Domain is not selected", 3000);
                    return;
                }

                webitelApi.getQueueParams.apply(this, [
                    {
                        "uri": host,
                        "queueName": queueName,
                        "domain": domain,
                        "token": token,
                        "key": key
                    },
                    function(err, res) {
                        if ( err ) {
                            console.error(error.msg);
                            return;
                        }

                        //  отримані дані зберегти в властивості моделі this.params
                        this.setParams(res.info);

                        console.log("%c CustomEvent: paramsReceived ", 'background: #518EC5; color: white');
                        this.trigger("paramsReceived");


                        //  послати запити для отримання всіх операторів в черзі і всіх операторів в домені
                        this.getQueueAgents(function(data) {
                            this.setQueueAgents(data);
                        });

                        this.getAgents();
                    }
                ]);
            },
            setParams: function(receivedParams) {
                var param;

                /**
                 * Проходимся циклом по всіх параметрах моделі, і перевіряємо, якщо в отриманих параметрах є співпадіння з параметром моделі,
                 * тоді значення з отриманого параметра перезаписуєм в параметер моделі,
                 * якщо нема, записуєм в параметер моделі пусту стрічку
                 */
                for ( param in this.params ) {
                    if ( receivedParams[this.params[param].fsName] ) {
                        this.params[param].currValue = receivedParams[this.params[param].fsName];
                    } else {
                        this.params[param].currValue = "";
                    }

                    //  Якщо параметри моделі були зміннені в карточці, перезатерти їх тому що отримані нові дані
                    this.params[param].changed = false;
                    this.params[param].isValid = true;
                }
            },

            validate: function(attrs, options) {
                //  імя і домен обовязкові для створення моделі
                if ( !attrs.name ) {
                    console.error("Model was not validated  . Name is required");
                    return "err";
                }
                if ( !attrs.domain ) {
                    console.error("model was not validated. Domain is required");
                    return;
                }
            },

            //  валідація і перезаписування полів
            changeStrategy: function(value, htmlEl) {
                this.params.strategy.changed = true;
                this.params.strategy.currValue = value;
            },
            changeDescription: function(value, htmlEl) {
                var parentEl = $(htmlEl).parent(),
                    errEl = $(htmlEl).parent().find("small.error-block");


                fieldValidator.config = {
                    "description": this.params.description.validatorConf
                };
                fieldValidator.validate({
                    "description": value
                });

                //  не забути, якщо 1 раз не пройшов валідацію, а потім другий раз пройшов там є бага

                if ( fieldValidator.hasErrors() ) {
                    $(parentEl).addClass("warning");
                    $(errEl).text(fieldValidator.messages["description"].msg);

                    this.params.description.changed = true;
                    this.params.description.isValid = false;
                    this.params.description.currValue = value;

                } else {
                    $(parentEl).removeClass("warning");
                    $(errEl).text("");

                    this.params.description.changed = true;
                    this.params.description.isValid = true;
                    this.params.description.currValue = value;
                }
            },
            changeMaxWaitTime: function(value, htmlEl) {
                var parentEl = $(htmlEl).parent(),
                    errEl = $(htmlEl).parent().find("small.error-block");

                fieldValidator.config = {
                    "maxWaitTime": this.params.maxWaitTime.validatorConf
                };
                fieldValidator.validate({
                    "maxWaitTime": value
                });


                if ( fieldValidator.hasErrors() ) {
                    $(parentEl).addClass("warning");
                    $(errEl).text(fieldValidator.messages["maxWaitTime"].msg);

                    this.params.maxWaitTime.changed = true;
                    this.params.maxWaitTime.isValid = false;
                    this.params.maxWaitTime.currValue = value;

                } else {
                    $(parentEl).removeClass("warning");
                    $(errEl).text("");

                    this.params.maxWaitTime.changed = true;
                    this.params.maxWaitTime.isValid = true;
                    this.params.maxWaitTime.currValue = value;
                }
            },
            changeMaxWaitTimeWithNoAgent: function(value, htmlEl) {
                var parentEl = $(htmlEl).parent(),
                    errEl = $(htmlEl).parent().find("small.error-block");

                fieldValidator.config = {
                    "maxWaitTimeWithNoAgent": this.params.maxWaitTimeWithNoAgent.validatorConf
                };
                fieldValidator.validate({
                    "maxWaitTimeWithNoAgent": value
                });


                if ( fieldValidator.hasErrors() ) {
                    $(parentEl).addClass("warning");
                    $(errEl).text(fieldValidator.messages["maxWaitTimeWithNoAgent"].msg);

                    this.params.maxWaitTimeWithNoAgent.changed = true;
                    this.params.maxWaitTimeWithNoAgent.isValid = false;
                    this.params.maxWaitTimeWithNoAgent.currValue = value;

                } else {
                    $(parentEl).removeClass("warning");
                    $(errEl).text("");

                    this.params.maxWaitTimeWithNoAgent.changed = true;
                    this.params.maxWaitTimeWithNoAgent.isValid = true;
                    this.params.maxWaitTimeWithNoAgent.currValue = value;
                }
            },
            changeMaxWaitTimeWithNoAgentTimeReached: function(value, htmlEl) {
                var parentEl = $(htmlEl).parent(),
                    errEl = $(htmlEl).parent().find("small.error-block");

                fieldValidator.config = {
                    "maxWaitTimeWithNoAgentTimeReached": this.params.maxWaitTimeWithNoAgentTimeReached.validatorConf
                };
                fieldValidator.validate({
                    "maxWaitTimeWithNoAgentTimeReached": value
                });


                if ( fieldValidator.hasErrors() ) {
                    $(parentEl).addClass("warning");
                    $(errEl).text(fieldValidator.messages["maxWaitTimeWithNoAgentTimeReached"].msg);

                    this.params.maxWaitTimeWithNoAgentTimeReached.changed = true;
                    this.params.maxWaitTimeWithNoAgentTimeReached.isValid = false;
                    this.params.maxWaitTimeWithNoAgentTimeReached.currValue = value;

                } else {
                    $(parentEl).removeClass("warning");
                    $(errEl).text("");

                    this.params.maxWaitTimeWithNoAgentTimeReached.changed = true;
                    this.params.maxWaitTimeWithNoAgentTimeReached.isValid = true;
                    this.params.maxWaitTimeWithNoAgentTimeReached.currValue = value;
                }
            },
            changeMohSound: function(value, htmlEl) {
                var parentEl = $(htmlEl).parent(),
                    errEl = $(htmlEl).parent().find("small.error-block");


                fieldValidator.config = {
                    "mohSound": this.params.mohSound.validatorConf
                };
                fieldValidator.validate({
                    "mohSound": value
                });

                //  не забути, якщо 1 раз не пройшов валідацію, а потім другий раз пройшов там є бага

                if ( fieldValidator.hasErrors() ) {
                    $(parentEl).addClass("warning");
                    $(errEl).text(fieldValidator.messages["mohSound"].msg);

                    this.params.mohSound.changed = true;
                    this.params.mohSound.isValid = false;
                    this.params.mohSound.currValue = value;

                } else {
                    $(parentEl).removeClass("warning");
                    $(errEl).text("");

                    this.params.mohSound.changed = true;
                    this.params.mohSound.isValid = true;
                    this.params.mohSound.currValue = value;
                }
            },
            changeDiscardAbandonedAfter: function(value, htmlEl) {
                var parentEl = $(htmlEl).parent(),
                    errEl = $(htmlEl).parent().find("small.error-block");


                fieldValidator.config = {
                    "discardAbandonedAfter": this.params.discardAbandonedAfter.validatorConf
                };
                fieldValidator.validate({
                    "discardAbandonedAfter": value
                });

                //  не забути, якщо 1 раз не пройшов валідацію, а потім другий раз пройшов там є бага

                if ( fieldValidator.hasErrors() ) {
                    $(parentEl).addClass("warning");
                    $(errEl).text(fieldValidator.messages["discardAbandonedAfter"].msg);

                    this.params.discardAbandonedAfter.changed = true;
                    this.params.discardAbandonedAfter.isValid = false;
                    this.params.discardAbandonedAfter.currValue = value;

                } else {
                    $(parentEl).removeClass("warning");
                    $(errEl).text("");

                    this.params.discardAbandonedAfter.changed = true;
                    this.params.discardAbandonedAfter.isValid = true;
                    this.params.discardAbandonedAfter.currValue = value;
                }
            },
            changeAbandonedResumeAllowed: function(value, htmlEl) {
                this.params.abandonedResumeAllowed.changed = true;
                this.params.abandonedResumeAllowed.currValue = value;
            },
            changeTimeBaseScore: function(value, htmlEl) {
                this.params.timeBaseScore.changed = true;
                this.params.timeBaseScore.currValue = value;
            },

            //  отримати операторів в черзі і всіх операторів в домені
            getQueueAgents: function(callback) {
                var that = this,
                    queueName = this.get("name"),
                    domain, token, key, host;

                if ( this.collection && this.collection.auth ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.auth.domain;
                    token  = this.auth.token;
                    key    = this.auth.key;
                    host   = this.auth.host;
                }

                webitelApi.getQueueAgents.apply(this, [
                    {
                        "uri": host,
                        "queueName": queueName,
                        "domain": domain,
                        "token": token,
                        "key": key
                    }, function(err, res) {
                        if ( err ) {
                            console.error(err.msg);
                            return;
                        }

                        if ( res.status === "OK" ) {
                            callback.call(this, res.info);
                        }
                        else if ( res.status === "error" ) {
                            errHandler.handleCore(res);
                        }
                    }
                ]);
            },
            setQueueAgents: function(agents) {
                this.agents = agents;
                this.removeRepeatAgents["queueAgents"] = agents;
                this.removeRepeatAgents();
            },

            getAgents: function() {
                var that = this,
                    domain;

                if ( this.collection && this.collection.auth ) {
                    domain = this.collection.auth.domain;
                } else {
                    domain = this.auth.domain;
                }

                webitel.userList(domain, function(res) {
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
                        that.setAgents(agents);
                    }
                    else if (res.status == 1) {
                        console.error(this.responseText);
                        alert.error("", this.responseText, 5000);
                    }
                });
            },
            setAgents: function(agents) {
                this.removeRepeatAgents["allAgents"] = agents;
                this.removeRepeatAgents();
            },

            //  видаляє із списку всіх операторів, тих які вже є в даній черзі. Генерить івен для вюхи
            removeRepeatAgents: function() {

                var queueAgent,
                    allAgents,
                    i,
                    k;

                if ( !this.removeRepeatAgents.queueAgents || !this.removeRepeatAgents.allAgents ) {
                    return;
                }

                queueAgent = this.removeRepeatAgents.queueAgents;
                allAgents  = this.removeRepeatAgents.allAgents;

                for ( i = 0; i < queueAgent.length; i++ ) {
                    for ( k = 0; k < allAgents.length; k++ ) {
                        if ( queueAgent[i].name.indexOf( allAgents[k].id ) !== -1 ) {
                            allAgents.splice(k, 1);
                        }
                    }

                }

                console.log("%c CustomEvent: renderAgents. Model:" + this.get("name") + " ", 'background: #518EC5; color: white');
                this.trigger("renderAgents", queueAgent, allAgents);

                delete this.removeRepeatAgents.queueAgents;
                delete this.removeRepeatAgents.allAgents;
            },

            //  видалити чергу, перезагрузити колекцію
            removeModel: function() {
                var queueName = this.get("name"),
                    xhr,
                    that = this,
                    domain, token, key, host;

                if ( this.collection && this.collection.auth ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.auth.domain;
                    token  = this.auth.token;
                    key    = this.auth.key;
                    host   = this.auth.host;
                }


                bootbox.dialog({
                    message: "Do you really want to remove " + queueName + "?",
                    size: 'small',
                    title: "Remove queue?",
                    className: "remove-queue-modal",
                    onEscape: function() {},
                    buttons: {
                        danger: {
                            label: "Cancel",
                            className: "btn-default",
                            callback: function() {}
                        },
                        success: {
                            label: "Ok",
                            className: "btn-success",
                            callback: function() {
                                removeRequest();
                            }
                        }
                    }
                });

                function removeRequest() {
                    xhr = new XMLHttpRequest();
                    xhr.open(REMOVE_QUEUE.method, host + REMOVE_QUEUE.path + queueName + "?domain=" + domain, true);

                    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                    xhr.setRequestHeader("X-Access-Token", token);
                    xhr.setRequestHeader("X-Key", key);

                    xhr.onreadystatechange = function() {
                        if ( xhr.readyState !== 4 ) return;

                        if ( xhr.status === 200 ) {
                            try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return; }

                            if ( res.status === "OK" ) {
                                alert.success("", res.info, 3000);
                                that.collection.refresh();
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
                        alert.error("", "Cannot create queue. Request timeout", 5000);
                        return;
                    };
                    xhr.send();
                }
            },

            //  включити, відключити чергу
            switchQueue: function(checkboxEl) {
                var queueName = this.get("name"),
                    domain, token, key, host,
                    state;

                if ( checkboxEl.checked ) {
                    state = "enable"
                } else {
                    state = "disable"
                }

                if ( this.collection ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.get("currDomain");
                    token  = this.get("token");
                    key    = this.get("key");
                    host   = this.get("host");
                }

                webitelApi.enableDisableQueue.apply(this,[
                    {
                        "uri": host,
                        "queueName": queueName,
                        "state": state,
                        "domain": domain,
                        "token": token,
                        "key": key
                    },
                    function(err, res) {
                        if ( err ) {
                            setPreviousState();
                            errHandler.handleXhr(xhr.status, xhr);
                            console.error(err.msg);
                            return;
                        }

                        if ( res.status === "OK" ) {
                            alert.success("", "Queue " + queueName + " is " + state, 3000);
                            var that = this;
                            setTimeout(function() {
                                that.collection.refresh();
                            }, 500);
                        }
                        else if ( res.status === "error") {
                            setPreviousState();
                            errHandler.handleCore(res);
                        }

                        function setPreviousState() {
                            //  якщо будь-яка помилку, тоді вернути checkbox в попередній стан
                            if ( state === "enable" ) {
                                checkboxEl.checked = false;
                            } else {
                                checkboxEl.checked = true;
                            }
                        }
                    }
                ]);
            },
            save: function() {
                var param,
                    that = this,
                    p = this.params,
                    i,
                    agentId,
                    hasAgent,
                    updateParams = {},
                    addQueueAgents = [],
                    removeQueueAgents = [];


                // Прохожусь циклом по всіх параметрах моделі, і якщо є зміненні і невалідні параметри, тоді заборонити збереження
                for ( param in p ) {
                    if ( p[param].changed ) {
                        if ( !p[param].isValid ) {
                            alert.warning("", p[param].htmlName + " field is not valid", 5000);
                            return;
                        }
                    }
                }

                //  витягнути всі змінені параметри
                for ( param in p ) {
                    if ( p[param].changed ) {
                        updateParams[p[param]["fsName"]] = p[param].currValue;
                    }
                }


                //  екранувати поле description, щоб можна було передати текст з пробілами
                if ( updateParams.description ) {
                    updateParams.description = "'" + updateParams.description + "'";
                }

                //  спочатку зберігаєм зміни в черзі а потім вже пересечуєм операторів
                updateQueue.call(this);
                function updateQueue() {
                    var xhr       = new XMLHttpRequest(),
                        that      = this,
                        queueName = this.get("name"),
                        domain, token, key, host;

                    if ( this.collection && this.collection.auth ) {
                        domain = this.collection.auth.domain;
                        token  = this.collection.auth.token;
                        key    = this.collection.auth.key;
                        host   = this.collection.auth.host;
                    } else {
                        domain = this.auth.domain;
                        token  = this.auth.token;
                        key    = this.auth.key;
                        host   = this.auth.host;
                    }


                    xhr.open(UPDATE_QUEUE_PARAMS.method, host + UPDATE_QUEUE_PARAMS.path + queueName + "?domain=" + domain, true);

                    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                    xhr.setRequestHeader("X-Access-Token", token);
                    xhr.setRequestHeader("X-Key", key);

                    xhr.onreadystatechange = function() {
                        if (xhr.readyState !== 4) return;

                        if (xhr.status === 200) {
                            try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return; }

                            if ( res.status === "OK" ) {
                                alert.success("", "Queue was updated", 3000);

                                //  у всіх параметрах моделі поле changed = false
                                for ( param in that.params ) {
                                    that.params[param].changed = false;
                                    that.params[param].isValid = true;
                                }
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
                        console.error("Cannot update queue params. Request timeout");
                        alert.error("", "Cannot update queue params. Request timeout", 3000);
                        return;
                    };
                    xhr.send(JSON.stringify(updateParams));
                }

                /**
                 * Перший проходиться по масиву операторів UI і порівнює їх із локальним масивом операторів в черзі.
                 * Якщо значення не співпало, потрібно створити нового оператора
                 *
                 * Другий проходиться по локальному масиву всіх операторів і порівнює значення із масивом операторів в UI
                 * Якщо значення не співпало, потрібно видалити оператора
                 */
                $("#queueAgentsList li").each(function(element) {
                    agentId = $(this).attr("agentid");
                    hasAgent = false;

                    //  цикл по всіх агентах, які реально є в черзі
                    for ( i = 0; i < that.agents.length; i++ ) {
                        //  якщо оператор з UI співпав із локальними операторами, задати помітку, щоб не добавляти його
                        if ( agentId === that.agents[i].name.split("@")[0] ) {
                            hasAgent = true;
                            break;
                        }
                    }

                    if ( !hasAgent ) {
                        addQueueAgents.push(agentId);
                    }
                });
                for ( i = 0; i < this.agents.length; i++ ) {
                    agentId = this.agents[i].name.split("@")[0];
                    hasAgent = false;

                    $("#queueAgentsList li").each(function(element) {
                        if ( agentId === $(this).attr("agentid") ) {
                            hasAgent = true;
                        }
                    });

                    if ( !hasAgent ) {
                        removeQueueAgents.push(agentId);
                    }
                }

                this.removeAgents(removeQueueAgents);
                this.addAgents(addQueueAgents);
            },


            //  видалення і добавлення операторів через рекурсію
            removeAgents: function(agents) {
                var xhr,
                    agent,
                    that = this,
                    queueName = this.get("name"),
                    domain, token, key, host,
                    i;


                if ( this.collection ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.auth.domain;
                    token  = this.auth.token;
                    key    = this.auth.key;
                    host   = this.auth.host;
                }

                if ( agents.length > 0 ) {
                    agent = agents.splice(0, 1);


                    xhr = new XMLHttpRequest();
                    xhr.open(REMOVE_AGENT.method, host + REMOVE_AGENT.path + queueName + "/tiers/" + agent + "?domain=" + domain, true);

                    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                    xhr.setRequestHeader("X-Access-Token", token);
                    xhr.setRequestHeader("X-Key", key);

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState !== 4) return;

                        if (xhr.status === 200) {
                            try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return; }

                            if (res.status === "OK") {
                                alert.success("", "Agent " + agent[0] + " removed from " + queueName, 5000);

                                //  видалити агента із властивості agents
                                for ( i = 0; i < that.agents.length; i++) {
                                    if ( that.agents[i]["name"].indexOf(agent[0]) !== -1 ) {
                                        that.agents.splice(i, 1);
                                    }
                                }
                                //  рекурсія
                                that.removeAgents(agents);
                            }
                            else if (res.status === "error") {
                                errHandler.handleCore(res);
                            }
                        } else {
                            errHandler.handleXhr(xhr.status, xhr);
                        }
                    };
                    xhr.timeout = REQUEST_TIMEOUT;
                    xhr.ontimeout = function (e) {
                        console.error("Cannot remove agent from queue. Request timeout");
                        alert.error("", "Cannot remove agent from queue. Request timeout", 3000);
                        return;
                    };
                    xhr.send();
                } else {

                }
            },
            addAgents: function(agents) {
                var xhr,
                    agent,
                    queueName = this.get("name"),
                    that = this,
                    domain, token, key, host;

                if ( this.collection && this.collection.auth ) {
                    domain = this.collection.auth.domain;
                    token  = this.collection.auth.token;
                    key    = this.collection.auth.key;
                    host   = this.collection.auth.host;
                } else {
                    domain = this.auth.domain;
                    token  = this.auth.token;
                    key    = this.auth.key;
                    host   = this.auth.host;
                }

                if ( agents.length > 0 ) {
                    agent = agents.splice(0, 1);

                    xhr = new XMLHttpRequest();
                    xhr.open(CREATE_TIER.method, host + CREATE_TIER.path + queueName + "/tiers" + "?domain=" + domain, true);

                    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                    xhr.setRequestHeader("X-Access-Token", token);
                    xhr.setRequestHeader("X-Key", key);

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState !== 4) return;

                        if (xhr.status === 200) {
                            try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse xhr.responseText"); return; }

                            if (res.status === "OK") {
                                alert.success("", "Agent " + agent[0] + " added to " + queueName, 5000);

                                //  добавити агента в масив агентів
                                that.agents.push({
                                   "name": agent[0]
                                });

                                that.addAgents(agents);
                            }
                            else if (res.status === "error") {
                                if (res.info === "-ERR Tier exists!\n") {
                                    alert.error("", "Agent " + agent + " exists in " + queueName, 5000);
                                    that.addAgents(agents);
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
                }
            },

            getAuthData: function() {

            }

        });

    return AcdModel;
});