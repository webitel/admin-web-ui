
requirejs.config({
	baseUrl: '/cfd',
	shim: {
		lodash: {
      		exports: "_"
	    },
        backbone: {
            deps: ["lodash", "jquery"],
            exports: "Backbone"
        },
        joint: {
            deps: ['geometry', 'vectorizer', 'jquery', 'backbone', 'lodash'],
            exports: 'joint',
            init: function(geometry, vectorizer) {
                this.g = geometry;
                this.V = vectorizer;
            }
        },
        webitelConnector: {
            deps: ["webitelLib"]
        },
        pnotify: {
            deps: ["jquery"]
        },
        bootstrap: {
            deps: ["jquery"]
        },
        jointWtel: {
            deps: ["joint"]
        },
        jointDevs: {
            deps: ["joint"]
        }
	},
	paths: {
		//	LIBS
		"lodash"	: "js/libs/Lodash/lodash",
		"backbone"  : "js/libs/Backbone/backboneWithComments",
		"jquery"    : "js/libs/jQuery/jquery-2.1.1",
		"geometry"	: "js/libs/Joint/geometry",
		"vectorizer": "js/libs/Joint/vectorizer",
		"joint"		: "js/libs/Joint/joint.clean",
        "webitelLib": "js/modules/webitelConnector/WebitelModule",          //  ліба вебітел для встановлення зєднання по вебсокету
        "bootstrap" : "js/libs/Bootstrap/bootstrap.min",                    //  ліба, для роботи класами bootstrap




		//	PLUGINS
		"text"      : "js/libs/Require/text",								//	для загрузки тексту, наприклад html шаблон воно загрузить як стрічку
        "jointDevs" : "js/libs/Joint/DEVS/joint.shapes.devs",
        "jointWtel" : "js/libs/Joint/WTEL/joint.shapes.wtel",
        "jsonViewer": "js/libs/jsonViewver/jquery.jsonview",
        "pnotify"   : "js/libs/pnotify/pnotify.custom",                     //  для виведення повідомлень юзеру




        //  BASIC MODULES
        "canvas"    : "js/modules/canvas/canvas",
        "stencil"   : "js/modules/stencil/stencil",
        "toolbar"   : "js/modules/toolbar/toolbar",
        "inspector" : "js/modules/inspector/inspector",
        "preview"   : "js/modules/preview/preview",



        //  ADDITIONAL MODULES
        "propertyViews": "js/modules/inspector/propertyViews",
        "observe"     : "js/modules/observe",
        "cfdElLinks"  : "js/modules/cfdElLinks",
        "alerts"      : "js/modules/alerts/alerts",
        "constants"   : "js/modules/constants",
        "exportJson"  : "js/modules/toolbar/old/exportJson",
        //"importJson"  : "js/modules/toolbar/importJson",
        "webitelConnector": "js/modules/webitelConnector/webitelConnector",             //  REMOVE: для роботи із сервером вебітел
        "modalBox"    : "js/modules/toolbar/modalBox"

	},
	waitSeconds: 0 
});


//  підключити всі необхідні ліби
require(
    [
        "jquery",
        "lodash",
        "backbone",
        "joint",
            "jointDevs",
            "jointWtel",
        "pnotify",
        "bootstrap"
    ],
    function (
        $,
        _,
        Backbone,
        joint,
            _jointDevs,
            _jointWtel,
        _pnotify,
        _bootstrap
    ) {

        require(["canvas"], function(canvas) {

            require(["stencil", "toolbar", "inspector", "preview"], function(_stencil, _toolbar, _inspector, _preview) {

                var
                    stencil;

                //  ініціалізація елементів з конфігу
                stencil = new joint.ui.Stencil({
                    graph: canvas.graph,
                    paper: canvas.paper,
                    width: 200,
                    height: 300
                });
                stencil.render(".stencil-container");

                /*var
                    newIF = new joint.shapes.wtel.IF_START({
                        position: {
                            x: 100,
                            y: 150
                        }
                    });

                canvas.graph.addCell(newIF);*/


            });
        });
});































































