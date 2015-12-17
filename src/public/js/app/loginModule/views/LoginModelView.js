/**
 * subscribe
 *      -
 *
 * publish
 *      - viewRendered вюха відмалбована
 *
 */



define([
    "text!/js/app/loginModule/tpl/LoginModelViewTpl.html"
], function(LoginModelViewTpl) {


    var log = {
        "event": function(eventName, publisherName) {
            console.log("%c Event: " + (eventName || "") + "\t Publisher: " + (publisherName || "") + " ", 'background: #518EC5; color: white');
        }
    };

    var LoginModelView = Backbone.View.extend({
        initialize: function(attributes, options) {
            console.info("LoginModuleView has been initialized");
        },
        "tagName": "div",
        "id": "loginModelView-wrapper",
        "template": _.template(LoginModelViewTpl),
        render: function() {
            //  частину шаблону віддає сервер. Інша частина формується на клієнті
            this.$el.html(this.template());
            $(".cls-content .panel-body").html(this.$el);


            log.event("viewRendered", "LoginModelView");
            this.model.trigger("viewRendered");


        },
        "events": {
            "change #login"         : "changeLogin",
            "change #password"      : "changePass",
            "change #webitelServer" : "changeWebitelServer",
            "click  #rememberMe"    : "rememberMe",
            "click  #sendAuth"      : "sendAuth",

            //  обробка кліку по enter під час того коли курсор знаходится в полі input
            "keydown #login"        : "keyAction",
            "keydown #password"     : "keyAction",
            "keydown #webitelServer": "keyAction"
        },

        "keyAction": function(e) {
            var code = e.keyCode || e.which,
                elID = e.currentTarget.id;

            if( code === 13 ) {
                if (elID === "login") {
                    this.changeLogin(e);
                } else if (elID === "password") {
                    this.changePass(e);
                } else if (elID === "webitelServer") {
                    this.changeWebitelServer(e);
                }
                this.sendAuth();
            }
        },

        "changeWebitelServer": function(e) {
            var parentEl = e.currentTarget.parentElement,
                formEl = parentEl.parentElement,
                errorEl = formEl.getElementsByTagName("small")[0];

            this.model.changeWebitelServer(e.currentTarget.value, successCallback, errorCallback);

            function successCallback() {
                errorEl.textContent = "";
                $(formEl).removeClass("warning");
            }
            function errorCallback(errorMessage) {
                errorEl.textContent = errorMessage;
                $(formEl).addClass("warning");
            }
        },
        "changeLogin": function(e) {
            var parentEl = e.currentTarget.parentElement,
                formEl = parentEl.parentElement,
                errorEl = formEl.getElementsByTagName("small")[0];

            this.model.changeLogin(e.currentTarget.value, successCallback, errorCallback);

            function successCallback() {
                errorEl.textContent = "";
                $(formEl).removeClass("warning");
            }
            function errorCallback(errorMessage) {
                errorEl.textContent = errorMessage;
                $(formEl).addClass("warning");
            }
        },
        "changePass" : function(e) {
            var parentEl = e.currentTarget.parentElement,
                formEl = parentEl.parentElement,
                errorEl = formEl.getElementsByTagName("small")[0];

            this.model.changePass(e.currentTarget.value, successCallback, errorCallback);

            function successCallback() {
                errorEl.textContent = "";
                $(formEl).removeClass("warning");
            }
            function errorCallback(errorMessage) {
                errorEl.textContent = errorMessage;
                $(formEl).addClass("warning");
            }
        },
        "rememberMe" : function(e) {
            var inputEl = e.currentTarget,
                label = inputEl.parentElement;

            //  засетати в модель нове значення для поля
            this.model.set("rememberMe", inputEl.checked);

            if ( inputEl.checked ) {
                $(label).addClass("active");
            } else {
                $(label).removeClass("active");
            }
        },
        "sendAuth"   : function(e) {
            this.model.sendAuthOnHttps();
        }
    });

    return LoginModelView;
});