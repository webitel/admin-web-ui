define("AccountModel", ["alert"], function(alert) {



    var AccountModel = (function() {

        var AGENT_PARAMS = [
            "cc-agent-contact",
            "cc-agent-wrap-up-time",
            "cc-agent-max-no-answer",
            "cc-agent-busy-delay-time",
            "cc-agent-reject-delay-time",
            "cc-agent-no-answer-delay-time"
        ];

        var HIDDEN_VARIABLES = [
            "account_role",
            "user_context",
            "w_domain",
            "user_scheme",
            "effective_caller_id_name",
            "outbound_caller_id_name"
        ];

        var contactReg = new RegExp('^[1-9]+$');

        var AccM = Backbone.Model.extend({
            defaults: {
                callerName: null,
                name: null,
                domain: null,
                extension: null,
                accessPin: null,
                useVoicemail: null,
                role: null,
                password: null,
                isAgent: null,
                variables: [],
                parameters: []
            },
            initialize: function() {
                console.info("AccountModel has been initialized");

                this.on("change:callerName",function() {
                    console.log(this.get("name") + " " + this.get("callerName"));

                    if (this.get("callerName")) {
                        this.replaceVariable("effective_caller_id_name", this.get("callerName"));
                    } else {
                        this.replaceVariable("effective_caller_id_name", "");
                    }

                }, this);

                this.on("change:useVoicemail",function() {
                    console.log(this.get("name") + " " + this.get("useVoicemail"));

                    this.replaceParameter("vm-enabled", this.get("useVoicemail"));

                    if (this.get("useVoicemail") === "true") {
                        this.replaceParameter("http-allowed-api", "voicemail")
                    } else {
                        this.replaceParameter("http-allowed-api", "");
                    }
                }, this);

                this.on("change:password",function() {
                    console.log(this.get("name") + " " + this.get("password"));

                    if (this.get("password")) {
                        this.replaceParameter("password", this.get("password"));
                    } else {
                        this.removeParameter("password");
                    }
                }, this);

                this.on("change:role",function() {
                    console.log(this.get("name") + " " + this.get("role"));

                    var currentRole = this.get("role");

                    if (currentRole === "admin") {
                        this.replaceParameter("account_role", "admin");
                    }
                    if(currentRole === "user"){
                        this.replaceParameter("account_role", "user");
                    }
                    if(currentRole === "qm") {
                        this.replaceParameter("account_role", "qm");
                    }
                    if(currentRole === "supervisor") {
                        this.replaceParameter("account_role", "supervisor");
                    }
                    if(currentRole === "agent") {
                        this.replaceParameter("account_role", "agent");
                    }
                }, this);

                this.on("change:extension",function() {
                    console.log(this.get("name") + " " + this.get("extension"));
                    this.replaceParameter("webitel-extensions", this.get("extension"));
                }, this);

                this.on("change:accessPin",function() {
                    console.log(this.get("name") + " " + this.get("accessPin"));
                    this.replaceParameter("vm-password", this.get("accessPin"));
                }, this);

                this.on("change:isAgent",function() {
                    console.log(this.get("name") + " " + this.get("isAgent"));

                    if (this.get("isAgent")) {
                        this.replaceParameter("cc-agent", "true");
                    } else {
                        this.replaceParameter("cc-agent", "false");
                    }
                }, this);


                this.removeVariables(HIDDEN_VARIABLES);

                this.modifyContactParameter();

                //  view will call this method after parameters be filled
                //  this.removeAllParameters();
            },

            //  region Action on variables
            /**
             * @param {Array} keys
             */
            removeVariables: function(keys) {
                _.each(keys, function (key) {
                    this.removeVariable(key);
                }, this);
            },
            removeVariable: function(key) {
                if ( !key ) return;

                var variables = this.get("variables");
                var variablesL = variables.length;

                for (var i = 0; i < variablesL; i++) {
                    if (variables[i].key === key) {
                        variables.splice(i, 1);
                        break;
                    }
                }
            },
            //  actually it only set empty variable, for example "variable_w_domain="
            setEmptyVariable: function (key) {
                if ( !key ) return;

                _.each(this.get("variables"), function (el) {
                    if ( el.key === key ) {
                        el.value = "";
                    }
                }, this);
            },
            addVariable: function (key, value) {
                this.get("variables").push({
                    key: key,
                    value: value
                });
            },
            //  try to replace variable, if it doesn't exist, it will be created
            replaceVariable: function (key, value) {
                var isReplaced = false;

                var variables = this.get("variables");
                var variablesL = variables.length;

                for (var i=0; i<variablesL; i++) {
                    if (variables[i].key === key) {
                        variables[i].value = value;
                        isReplaced = true;
                        break;
                    }
                }

                if ( !isReplaced ) {
                    this.addVariable(key, value);
                }
            },
            prepareEditedVariables: function () {
                var variables = [];
                var distinctKeys = {};

                //  at first convert array of object to object (acting as filter by distinct keys),
                _.each(this.get("variables"), function (el) {
                    if (el.key === "effective_caller_id_name") {
                        distinctKeys[el.key] = "'" + el.value + "'";
                    } else {
                        distinctKeys[el.key] = el.value;
                    }
                }, this);

                //  then convert object to array of string
                _.each(distinctKeys, function (value, key) {
                    variables.push(key + "=" + value);
                }, this);

                return variables;
            },
            //  endregion

            //  region Action on parameters
            addParameter: function (key, value) {
                this.get("parameters").push({
                    key: key,
                    value: value
                });
            },
            replaceParameter: function (key, value) {
                var isReplaced = false;

                var parameters = this.get("parameters");
                var parametersL = parameters.length;

                for (var i=0; i<parametersL; i++) {
                    if (parameters[i].key === key) {
                        parameters[i].value = value;
                        isReplaced = true;
                        break;
                    }
                }

                if ( !isReplaced ) {
                    this.addParameter(key, value);
                }
            },
            prepareEditedParameters: function () {
                var parameters = [];
                var distinctKeys = {};

                //  at first convert array of object to object (acting as filter by distinct keys),
                _.each(this.get("parameters"), function (el) {
                    distinctKeys[el.key] = el.value;
                }, this);

                //  then convert object to array of string
                _.each(distinctKeys, function (value, key) {
                    parameters.push(key + "=" + value);
                }, this);

                return parameters;
            },
            removeAllParameters: function() {
                this.set("parameters", []);
            },
            removeParameter: function(key) {
                if ( !key ) return;

                var parameters = this.get("parameters");
                var parametersL = parameters.length;

                for (var i = 0; i < parametersL; i++) {
                    if (parameters[i].key === key) {
                        parameters.splice(i, 1);
                        break;
                    }
                }
            },
            modifyContactParameter: function() {
                for(var i = 0; i < this.get("parameters").length; i++) {
                    if ( this.get("parameters")[i].key === "cc-agent-contact" ) {
                        var value = this.get("parameters")[i].value;

                        console.log("");
                        console.info(value);
                        console.log("");

                        if (value.indexOf("{originate_timeout=") !== -1) {
                            value = value.replace("{originate_timeout=", "");
                        }


                        if (value.indexOf(",presence_id") !== -1) {
                            value = value.split(",presence_id")[0];
                        } else if (value.indexOf("{presence_id") !== -1) {
                            value = "";
                        }

                        this.get("parameters")[i].value = value;
                        break;
                    }
                }
            },
            //  endregion



            updateData: function(callback, scope) {
                var self = this;
                var attrs = {
                    "parameters": this.prepareEditedParameters(),
                    "variables": this.prepareEditedParameters()
                };

                var name = this.get("name");
                var domain = this.get("domain");



                webitel.userUpdate(name, domain, attrs, function(res) {
                    if ( res.status !== 0 ) {
                        alert.error("", res.response.response, 5000);
                        console.error(res.response.response);
                        return;
                    }

                    alert.success("", "Account \"" + name + "\" has been updated", 3000);
                    callback.call(scope);
                });
            }
        });

        return AccM;
    })();


    return AccountModel;
});

