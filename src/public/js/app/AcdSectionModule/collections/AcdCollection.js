/**
 mod_callcenter
     STATUS
         Logged Out	            Cannot receive queue calls.
         Available	            Ready to receive queue calls.
         Available (On Demand)	State will be set to 'Idle' once the call ends (not automatically set to 'Waiting').
         On Break	            Still Logged in, but will not receive queue calls.

     STATE
         Idle	            Does nothing, no calls are given.
         Waiting	        Ready to receive calls.
         Receiving	        A queue call is currently being offered to the agent.
         In a queue call	Currently on a queue call.

 Інформація про агентів в черзі:
    доступний: [Available/Available (On Demand)]
    занятий: [Available/Available (On Demand)] / [Idle/Receiving/In a queue call]
    перерив: [On Break]
    недоступний: [Logged Out]

 *
 * Івенти на які підписаний модуль:
 *      - add                           коли в колекцію додана модель
 *      - reset                         коли все що є в колекції замінюється
 *      - reloadCollection [ custom ]   потрібно послати запит для отримання нового списку черг
 *
 * які генерить:
 *      - renderCollection [ custom ]   потрібно перемалювати колекцію. Переважно вюха слухає такі івенти колекції
 *      - collectionFilled [ custom ]   повідомляє, що колекція заповнена даними і готова для подальшої роботи
 */


define(["AcdModel", "errHandler", "webitelApi"], function(AcdModel, errHandler, webitelApi) {


    var AcdColl = (function(){
        return Backbone.Collection.extend({
            model: AcdModel,
            initialize: function(models, options) {
                this.auth = {
                    key: options.key,
                    token: options.token,
                    host: options.host,
                    domain: options.domain
                };

                //  region костиль
                var self = this;
                $("body").on("destroyAcd", function() {
                    self.remove(self.models);
                    self.unWebitelEvents();
                    $("body").off("destroyAcd");
                });
                //  endregion

                this.on("add", this.onAdd, this);
                this.on("reset", this.onReset, this);

                this.onWebitelEvents();
                this.getData();
                console.info("AcdCollection has been initialized");
            },
            getData: function() {
                var self = this;
                webitelApi.getQueues.apply(this, [
                    {
                        "uri": this.auth.host,
                        "domain": this.auth.domain,
                        "token": this.auth.token,
                        "key": this.auth.key
                    },
                    function(error, response) {
                        if ( error ) {
                            console.error(error.msg);
                            return;
                        }

                        if ( response.status === "OK" ) {
                            self.fill(response.info);
                        }
                        else if ( response.status === "error") {
                            errHandler.handleCore(response);
                        }
                    }
                ]);
            },
            /**
             * @param {Array} data сирі (необроблені) дані сервера
             */
            fill: function(data) {

                //  якщо колекція має дані, видалити їх і їхні вюхи
                if ( this.models.length > 0 ) {

                    return;
                }

                this.reset(data, {
                    "validate": true
                });
            },
            refresh: function() {
                this.remove(this.models);
                this.getData();
            },

            //  region Events handlers
            onAdd: function() {},
            onReset: function() {},

            onWebitelEvents: function() {
                var that = this;
                webitel.onServerEvent('cc::agent-status-change', function(event) {
                    var agentName = event["CC-Agent"];
                    var status = event["CC-Agent-Status"];

                    _.each(that.models, function(queueModel) {

                        _.each(queueModel.get("agentsList"), function(element) {
                            if ( element.name === agentName) {
                                element.status = status;
                            }
                        }, this);

                        queueModel.updateAgentsCounter();

                    }, that);
                }, { all: 1 });
                webitel.onServerEvent('cc::agent-state-change', function(event) {
                    var agentName = event["CC-Agent"];
                    var state = event["CC-Agent-State"];

                    _.each(that.models, function(queueModel) {

                        _.each(queueModel.get("agentsList"), function(element) {
                            if ( element.name === agentName) {
                                element.state = state;
                            }
                        }, this);

                        queueModel.updateAgentsCounter();

                    }, that);
                }, { all: 1 });
                webitel.onServerEvent('CC::MEMBERS-COUNT', function(event) {
                    var membersCount = event["CC-Count"];
                    var queueName = event["CC-Queue"].split("@")[0];

                    _.each(that.models, function(queueModel) {
                        if ( queueModel.get("name") === queueName ) {
                            queueModel.set("members", membersCount);
                        }
                    }, that);

                }, {all: 1})
            },
            unWebitelEvents: function() {
                webitel.unServerEvent('cc::agent-status-change', { all: 1 });
                webitel.unServerEvent('cc::agent-state-change', { all: 1 });
                webitel.unServerEvent('cc::MEMBERS-COUNT', { all: 1 });
            }
            //  endregion


        });
    }());

    return AcdColl;

});