define("AccountEditView", [
    "text!/js/app/accountSectionModule/tpl/AccEdit.html",
    "text!/js/app/accountSectionModule/tpl/EditAddVariable.html"
], function(tplAccEdit, tplEditAddVariable) {

    var AccountEditView = (function() {

        var contactReg = new RegExp('^[1-9]+$');

        var AccEditView = Backbone.View.extend({
            className: "accEditWrapper",
            initialize: function() {
                console.info("AccountEditView has been initialized");
            },
            events: {
                "click #editUseVoicemail input": "onUseVoicemailClick",
                "click #editIsAgent input": "onIsAgentClick",
                "change #editExtension input": "onExtensionChange",
                "change #editCallerName input": "onCallerNameChange",
                "change #editAccessPin input": "onAccessPinChange",
                "change #editRole select": "onRoleChange",
                "click .modal-footer .save": "onSaveClick",
                "click .modal-footer .cancel": "onCancelClick",
                "click .modal-header .close": "onCancelClick",
                "click #editAddVariable": "onAddVariableClick",
                "click #editVariablesContainer": "onEditVariablesContainerClick",
                "click #editPassword .passChangeBtn": "onPasswordChangeBtnClick",
                "click #editPassword .passCancelBtn": "onPasswordCancelBtnClick",
                "change #editPassInput": "onPasswordChange"
            },
            template: _.template(tplAccEdit),
            tplVariable: _.template(tplEditAddVariable),
            render: function() {
                this.$el.html(this.template(this.model.toJSON()));
                this.fillParametersTab();
                this.model.removeAllParameters();
                $("#edit-acc-modal .modal-content").append(this.$el);
            },
            fillParametersTab: function() {
                var parameters = this.model.get("parameters");

                _.each(parameters, function(el) {
                    if (el.key === "cc-agent-contact") {
                        this.$el.find("#editParametersCont").find("input[data-name='cc-agent-contact']").val(el.value);
                    } else if (el.key === "cc-agent-wrap-up-time") {
                        this.$el.find("#editParametersCont").find("input[data-name='cc-agent-wrap-up-time']").val(el.value);
                    } else if (el.key === "cc-agent-max-no-answer") {
                        this.$el.find("#editParametersCont").find("input[data-name='cc-agent-max-no-answer']").val(el.value);
                    } else if (el.key === "cc-agent-busy-delay-time") {
                        this.$el.find("#editParametersCont").find("input[data-name='cc-agent-busy-delay-time']").val(el.value);
                    } else if (el.key === "cc-agent-reject-delay-time") {
                        this.$el.find("#editParametersCont").find("input[data-name='cc-agent-reject-delay-time']").val(el.value);
                    } else if (el.key === "cc-agent-no-answer-delay-time") {
                        this.$el.find("#editParametersCont").find("input[data-name='cc-agent-no-answer-delay-time']").val(el.value);
                    }
                }, this);
            },

            //  region Events handlers
            onAddVariableClick: function (e) {
                this.$el.find("#editVariablesContainer").append(this.tplVariable());
            },
            onSaveClick: function(e) {
                //  gets all variables from UI
                var variablesCont = $("#editVariablesContainer .form-group");

                //  silently updates variables
                _.each(variablesCont, function (el) {
                    var key = $(el).find(".variableKey").val();
                    var value = $(el).find(".variableValue").val();

                    if ( !key ) {
                        $(el).remove();
                        return true;
                    }

                    this.model.replaceVariable(key, value);
                }, this);

                //  if isAgent true, then gets all parameters from UI and silently update it
                if (this.model.get("isAgent")) {
                    var parametersCont = $("#editParametersCont .form-group");

                    for(var i = 0; i < parametersCont.length; i++) {
                        var key = $(parametersCont[i]).find("input").data().name;
                        var value = $(parametersCont[i]).find("input").val();

                        if (key === "cc-agent-contact") {
                            if (contactReg.test(value) || value === "") {
                                value = "'{originate_timeout=" + value + ",presence_id=$[id]@$[domain]}$[dial-string]'";
                            } else {
                                continue;
                            }
                        }

                        this.model.replaceParameter(key, value);
                    }
                }

                this.model.updateData(function() {
                    this.onCancelClick();
                    //  refresh accounts table
                    $("#accountListTable").trigger("refreshAccTable");
                }, this);
            },
            onCancelClick: function () {
                this.remove();
                $("#edit-acc-modal").modal("hide");
            },
            onRoleChange: function(e) {
                var value = e.currentTarget.selectedOptions[0].value;
                this.model.set({role: value});
            },
            onExtensionChange: function(e) {
                var value = e.currentTarget.value;
                this.model.set({extension: value});
            },
            onAccessPinChange: function(e) {
                var value = e.currentTarget.value;
                this.model.set({accessPin: value});
            },
            onUseVoicemailClick: function(e) {
                var checkBox = e.currentTarget;

                if ( checkBox.checked ) {
                    $(checkBox.parentElement).addClass("active");
                    this.model.set({useVoicemail: "true"});
                } else {
                    $(checkBox.parentElement).removeClass("active");
                    this.model.set({useVoicemail: "false"});
                }
            },
            onIsAgentClick: function(e) {
                var checkBox = e.currentTarget;

                if ( checkBox.checked ) {
                    $(checkBox.parentElement).addClass("active");
                    this.model.set({isAgent: true});
                    //  show "Parameters" tab
                    $('#editParamsVarsTab a[href=".editParameters"]').parent().show();
                } else {
                    $(checkBox.parentElement).removeClass("active");
                    this.model.set({isAgent: false});

                    //  switch to "Variables" tab
                    $('#editParamsVarsTab a[href=".editVariables"]').tab('show');
                    //  hide "Parameters" tab
                    $('#editParamsVarsTab a[href=".editParameters"]').parent().hide();
                }
            },
            onEditVariablesContainerClick: function(e) {
                var el = e.target;

                if ( el.nodeName === "SPAN" ) {
                    if ( el.dataset && el.dataset.action === "removeVariable") {
                        var key = $(el.parentElement.parentElement).find(".variableKey").val();
                        var value = $(el.parentElement.parentElement).find(".variableValue").val();

                        this.model.setEmptyVariable(key, value);
                        el.parentElement.parentElement.remove();
                    }
                }
            },
            onPasswordChange: function(e) {
                this.model.set("password", e.currentTarget.value);
            },
            onPasswordChangeBtnClick: function(e) {
                $(e.currentTarget).hide();
                $("#editPassword .passCancelBtn").parent().show();
            },
            onPasswordCancelBtnClick: function(e) {
                this.model.set("password", null);
                $(e.currentTarget.parentElement).hide();
                $("#editPassword .passChangeBtn").show();
            },
            onCallerNameChange: function(e) {
                var value = e.currentTarget.value;
                this.model.set({callerName: value});
            }
            //  endregion
        });

        return AccEditView;
    })();


    return AccountEditView;

});











