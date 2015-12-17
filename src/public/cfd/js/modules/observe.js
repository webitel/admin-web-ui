define('observe', [], function() {

    /**
     * Observe
     * Event manager - provide interaction between modules
     */
    var observe = {};

    observe = _.extend(observe, Backbone.Events);

    return observe;
});
