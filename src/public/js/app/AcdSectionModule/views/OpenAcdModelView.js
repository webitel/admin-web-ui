

/**
 * Бажано мати кожне поле як обєкт
 *
 * 1. Створити вюху карточки
 * 1. Відправити запит з вюхи на отримання даних по черзі
 *  - відобразити загрузку даних
 * 2. Відправити запит на загрузку операторів в черзі
 *  - відобразити загрузку операторів
 * 3.
 * 4. При видаленні вюхи очисти все
 * */


/**
 *
 * Івенти на які підписаний модуль:
 *      - paramsReceived [ custom ] означає, що модель отримала параметри, зберегла їх і можна починати відмальовувати модель
 *      - renderAgents [ custom ] відмалювати агентів в карточці черги
 *
 * які генерить:
 *      -
 *
 */

define([
    "backbone",
    "text!/js/app/AcdSectionModule/tpl/OpenAcdModelViewTpl.html",
    "text!/js/app/AcdSectionModule/tpl/AcdTpl.html"
], function(Backbone, OpenAcdModelViewTpl, AcdTpl) {

    var OpenAcdModelView = Backbone.View.extend({
        initialize: function(options) {

            console.info("OpenAcdModelView was initialized. Model: " + this.model.get("name"));

            //  коли модель отримає параметри, тоді відмалювати вюху
            //  TODO неправильно привязувати функцію обробник до обєкта
            this.model.on("paramsReceived", this.render, this);
            this.model.on("renderAgents", this.renderAgents, this);

            //  послати запит, щоб отримати параметри черги
            this.model.getParams();
        },
        id: "acdPageContainer",
        tagName  : "div",
        className: "",
        template : _.template(OpenAcdModelViewTpl),
        render   : function() {

            var p = this.model.params,
                that = this,
                contentContLayout;

            this.$el.html(this.template({
                "name": that.model.get("name"),
                "nameID": "open-acd-name-field",

                "strategyID": p.strategy.id,

                "description": p.description.currValue,
                "descriptionID": p.description.id,

                "maxWaitTime": p.maxWaitTime.currValue,
                "maxWaitTimeID": p.maxWaitTime.id,

                "maxWaitTimeWithNoAgent": p.maxWaitTimeWithNoAgent.currValue,
                "maxWaitTimeWithNoAgentID": p.maxWaitTimeWithNoAgent.id,

                "maxWaitTimeWithNoAgentTimeReached": p.maxWaitTimeWithNoAgentTimeReached.currValue,
                "maxWaitTimeWithNoAgentTimeReachedID": p.maxWaitTimeWithNoAgentTimeReached.id,

                "mohSound": p.mohSound.currValue,
                "mohSoundID": p.mohSound.id,

                "discardAbandonedAfter": p.discardAbandonedAfter.currValue,
                "discardAbandonedAfterID": p.discardAbandonedAfter.id,

                "abandonedResumeAllowedID": p.abandonedResumeAllowed.id,

                "timeBaseScoreID": p.timeBaseScore.id

            }));


            //  якщо колекція відмальована, значить контейнер для карточи готовий
            /* if ( this.model.collection ) {
                //  приховати контейнер розділу
                $("#acdSectionContainer").hide();

                $("#page-content div.row").append(this.$el);
            }*/
            //  вставити layout

            contentContLayout = _.template(AcdTpl);
            $("#content-container").html( contentContLayout({}) );
            $("#page-content div.row").append(this.$el);


            setSomeFields.call(this);
            //  встановлює значення для тих полів, які не можна передати через шаблон
            function setSomeFields() {

                //  В селекті стратегій, засетати потрібне значення
                $("#" + p.strategy.id).val(p.strategy.currValue);

                //  ще один селект для поля timeBaseScore
                $("#" + p.timeBaseScore.id).val(p.timeBaseScore.currValue);


                //  Для поля abandonedResumeAllowed вказати потрібне значення checkbox
                if ( p.abandonedResumeAllowed.currValue === "true" ) {
                    $("#" + p.abandonedResumeAllowed.id).prop('checked', true);
                    $("#" + p.abandonedResumeAllowed.id).parent().addClass("active");
                } else {
                    $("#" + p.abandonedResumeAllowed.id).prop('checked', false);
                    $("#" + p.abandonedResumeAllowed.id).parent().addClass("remove");
                }
            }

            return this;
        },
        renderAgents: function (queueAgents, allAgents) {
            var i;


            //  приховати контейнер загрузки
            $("#allAgentsLoading").hide();

            //  якщо два масива з операторами пусті, показати пустий контейнер
            if ( queueAgents.length === 0 && allAgents.length === 0) {
                $("#allAgentsEmpty").show();
                return;
            }

            //  пройтися циклом по всіх операторах в черзі і відмалювати їх
            for ( i = 0; i < queueAgents.length; i++ ) {
                $("#queueAgentsList").append(createLiEl(queueAgents[i].name.split("@")[0], queueAgents[i].state));
            }


            //  пройтися циклом по всіх операторах і відмалювати їх
            for ( i = 0; i < allAgents.length; i++ ) {
                $("#agentsList").append(createLiEl(allAgents[i].id, allAgents[i].state));
            }

            //  відобразити форму з списками агентів
            $("#agentsListForm").show();


            //  шаблон створення елемента списку із внутрішньою структурою
            function createLiEl(agentName, state) {

                //  TODO задати класи для додаткових статусів
                if ( state === "Waiting" ) {
                    state = "WAITING";
                }

                var liEl = $("<li>").attr({ "agentid": agentName }),
                    spanName = $("<span>").attr({ "class": "agent-name" }).text(agentName),
                    spanStatus = $("<span>").attr({ "class": "agent-status fa fa-circle " + state });

                $(liEl).append(spanName);
                $(liEl).append(spanStatus);

                return liEl;
            }

        },
        events: {
            "click .acd-open-close": "close",
            "click .acd-open-save" : "save",

            "change #open-acd-strategy-field": "changeStrategy",
            "change #open-acd-description-field": "changeDescription",


            "change #open-acd-maxWaitTime-field": "changeMaxWaitTime",
            "change #add-acd-maxWaitTimeWithNoAgent-field": "changeMaxWaitTimeWithNoAgent",
            "change #add-acd-maxWaitTimeWithNoAgentTimeReached-field": "changeMaxWaitTimeWithNoAgentTimeReached",

            "change #open-acd-mohSound-field": "changeMohSound",
            "change #open-acd-discardAbandonedAfter-field": "changeDiscardAbandonedAfter",
            "change #open-acd-abandonedResumeAllowed-field": "changeAbandonedResumeAllowed",
            "change #open-acd-timeBaseScore-field": "changeTimeBaseScore",

            "click #agentsList li": "setActiveAgent",
            "click #queueAgentsList li": "setActiveAgent",

            "click #queueAgentsListCont .move-all": "moveAllAgentsFromQueue",
            "click #queueAgentsListCont .move-selected": "moveAgentsFromQueue",

            "click #agentsListCont .move-all": "moveAllAgentsInQueue",
            "click #agentsListCont .move-selected": "moveAgentsInQueue"
        },

        close: function() {
            this.remove();
            app.router.navigate("/acd", { trigger: true });
        },
        save: function() {
            this.model.save();
        },




        //  обробники івентів UI
        changeStrategy: function(e) {
            this.model.changeStrategy(e.currentTarget.value, e.currentTarget);
        },
        changeDescription: function(e) {
            this.model.changeDescription(e.currentTarget.value, e.currentTarget);
        },
        changeMaxWaitTime: function(e) {
            this.model.changeMaxWaitTime(e.currentTarget.value, e.currentTarget);
        },
        changeMaxWaitTimeWithNoAgent: function(e) {
            this.model.changeMaxWaitTimeWithNoAgent(e.currentTarget.value, e.currentTarget);
        },
        changeMaxWaitTimeWithNoAgentTimeReached: function(e) {
            this.model.changeMaxWaitTimeWithNoAgentTimeReached(e.currentTarget.value, e.currentTarget);
        },
        changeMohSound: function(e) {
            this.model.changeMohSound(e.currentTarget.value, e.currentTarget);
        },
        changeDiscardAbandonedAfter: function(e) {
            this.model.changeDiscardAbandonedAfter(e.currentTarget.value, e.currentTarget);
        },
        changeAbandonedResumeAllowed: function(e) {
            //  обробити клік по чекбоксу. Зберегти нове значення
            var parentLabel = e.currentTarget.parentElement,
                isActive = e.currentTarget.checked;

            if ( isActive ) {
                $(parentLabel).addClass("active");
            } else {
                $(parentLabel).removeClass("active");
            }

            this.model.changeAbandonedResumeAllowed(isActive, e.currentTarget);
        },
        changeTimeBaseScore: function(e) {
            this.model.changeTimeBaseScore(e.currentTarget.value, e.currentTarget);
        },

        //  додає або видаляє клас active для елемента списку li
        setActiveAgent: function(e) {
            var liEl = e.currentTarget;

            if ( $(liEl).hasClass("active") ) {
                $(liEl).removeClass("active")
            } else {
                $(liEl).addClass("active")
            }
        },

        //  обробляє перекидання елементів списку в інший список
        moveAllAgentsFromQueue: function(e) {
            $("#queueAgentsList li").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#agentsList"));
            });
        },
        moveAgentsFromQueue: function(e) {
            $("#queueAgentsList li.active").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#agentsList"));
            });
        },
        moveAllAgentsInQueue: function(e) {
            $("#agentsList li").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#queueAgentsList"));
            });
        },
        moveAgentsInQueue: function(e) {
            $("#agentsList li.active").each(function(element){
                $(this).removeClass("active");
                $(this).appendTo($("#queueAgentsList"));
            });
        }
    });

    return OpenAcdModelView;
});
