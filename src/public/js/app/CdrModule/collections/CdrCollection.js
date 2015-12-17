define("CdrCollection", ["CdrModel"], function(CdrModel) {

    var CdrCollection = Backbone.Collection.extend({
        model: CdrModel,
        initialize: function() {
            console.log("CdrCollection has been initialized");
        }
    });

    return CdrCollection;
});