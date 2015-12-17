define("CdrModel", [], function() {

    var CdrModel = Backbone.Model.extend({
        default: {
            columns: null,

        },
        initialize: function() {
            console.log("CdrModel has been initialized");
        }
    });

    return CdrModel;
});