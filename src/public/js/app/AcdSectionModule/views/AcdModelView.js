define([
    "backbone",
    "text!/js/app/AcdSectionModule/tpl/AcdModelViewBlockTpl.html",
    "errHandler"
], function(Backbone, AcdModelViewBlockTpl, errHandler) {

    var router = app.router;

    var AcdModelView = Backbone.View.extend({
        initialize: function() {
            console.info("AcdModelView " + this.model.get("name") + " was initialized");

            this.listenTo(this.model, "remove", this.remove);
            this.listenTo(this.model, "change:agentsCounter", this.renderPartial);
            this.listenTo(this.model, "change:members", this.renderPartial);

        },
        tagName  : "div",
        className: "acd-model-view-wrap",
        templateBlock : _.template(AcdModelViewBlockTpl),
        render: function() {
            this.$el.html(this.templateBlock(this.model.toJSON()));
            return this;
        },
        renderPartial: function() {
            var htmlTpl = this.templateBlock(this.model.toJSON());
            $(this.$el.children()).replaceWith(htmlTpl);
        },
        events: {
            "click .open-acd-model": "openAcdModel",
            "click .remove-acd-model": "removeModel",
            "click .onoffswitch-checkbox": "switchQueue"
        },
        openAcdModel: function() {
            router.navigate("/acd/open/" + this.model.get("name"), { trigger: true });
        },
        removeModel: function() {
            console.log("%c CustomEvent: removeModel ", 'background: #518EC5; color: white');
            this.model.trigger("removeModel");
        },
        switchQueue: function(e) {
            this.model.switchQueue(e.currentTarget);
        }

    });

    return AcdModelView;
});
