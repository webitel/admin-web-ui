/**
 * Вюха колекції моделей. Задає головний шаблон
 *
 * Івенти на які підписаний модуль:
 *      - renderCollection [ custom ]   потрібно перемалювати колекцію
 *      - show [ custom ]               відобразити вюху колекції
 *      - hide [ custom ]               приховати вюху колекції
 *
 * які генерить:
 *      - hide [ custom ]
 *      - reloadCollection [ custom ]   перегрузити дані колекції. Клік по кнопці оновити список
 *
 */


define(["text!/js/app/AcdSectionModule/tpl/AcdCollectionViewTpl.html"
        , "AcdModelView"
        , "AddAcdModelView"
        , "OpenAcdModelView"], function(AcdCollectionViewTpl
        , AcdModelView
        , AddAcdModelView
        , OpenAcdModelView) {


    var AcdCollView = (function(){
        return Backbone.View.extend({
            id: "acdSectionContainer",
            events: {
                "click .reload-acd-collection": "onRefresh",
                "click .add-acd-model": "onAdd"
            },
            template: _.template(AcdCollectionViewTpl),
            initialize: function() {
                this.prepareMarkup();

                this.listenTo(this.collection, "reset", this.onReset);

                console.info("AcdCollectionView has been initialized");
            },
            prepareMarkup: function() {
                this.$el.html(this.template());
                return this;
            },

            render: function() {
                _.each(this.collection.models, function(element, index, list) {
                    var acdModelView = new AcdModelView({ model: element });
                    this.$el.find("#acdSectionContent").append(acdModelView.render().el);
                }, this);


                //  якщо #acdSectionContent відсутній, вставити в розмітку вюху колекції
                if ( $("#page-content div.row #acdSectionContent").length === 0 ) {
                    $("#page-content div.row").html(this.$el);
                }


                return this;
            },

            show: function() {
                $(this.$el).show();
                this.collection.refresh();
            },
            hide: function() {
                $(this.$el).hide();
            },

            //  region Events handlers
            onReset: function() {
                this.render();
            },
            onRefresh: function() {
                this.collection.refresh();
            },
            onAdd: function() {
                //  створити вюху карточки нової черги
                var addAcdModelView = new AddAcdModelView({ parentView: this });

                $(this.$el).hide();

                $("#page-content .row:first-child").append(addAcdModelView.render().el);
            }
            //  endregion

        });
    }());

    return AcdCollView;
});














