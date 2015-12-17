
define("CdrModule", ["CdrCollection"], function(CdrCollection) {

    var CdrModule = {
        version: "0.0.1",
        init: function() {
            console.info("CdrModule version: " + this.version);
            debugger;
            var cdrCollection = new CdrCollection();
        }
    };


    CdrModule.init = CdrModule.init.bind(CdrModule);

    return {
        init: CdrModule.init
    }
});