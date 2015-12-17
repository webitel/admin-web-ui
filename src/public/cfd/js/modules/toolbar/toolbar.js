/**
 * Модуль toolbar, ініціалізує модель і вюху. Парсить даний URI, отримує дані по ньому, будує схему
 *
 * EVENTS
 *      - triggered
 *          buildSchema - коли в нас є конфіг в JSON і по ньому потрібно побудувати схему
 *          toolbar_expandWidth
 *          toolbar_expandHeight
 */

define("toolbar", [
    "alerts",
    "observe",
    "constants",
    "text!tpl/toolbar/toolbar.html"
], function(
    alerts,
    observe,
    constants,
    toolbarHTML
) {

    function log(value) {
        console.log('%c ' + value + ' ', 'background: #518EC5; color: white');
    }

    var
        ToolbarModel, toolbarModel,
        ToolbarView, toolbarView,
        toolbarViewCont = "#cfd-toolbar-container";

    /**
     * Toolbar model
     */
    ToolbarModel = Backbone.Model.extend({

        initialize: function(options) {

            this.getExFromURI();
        },

        /**
         * Викликається тільки при ініціалізації моделі
         * TODO
         *      - якщо помилка, обробити її, вивети повідомлення
         *      - можна зробити лоадер, для відображення загрузки і побудови схеми
         */
        getExFromURI: function() {
            var
                parameters = (function(){
                        var vars = {},
                            parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
                                vars[key] = value;
                            });
                        return vars;
                    }()),
                xhr,
                that = this;

            xhr = new XMLHttpRequest();
            xhr.open("GET", window.location.origin + "/callflow/designer/extension" + "?schemaType=" + (parameters["schemaType"] || "") + "&domain=" + (parameters["domain"] || "") + "&id=" + (parameters["id"] || ""), true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {

                if ( xhr.readyState !== 4 ) {
                    return;
                }

                if ( xhr.status !== 200 ) {
                    console.error(xhr.responseText);
                    return;
                }

                var exObj = JSON.parse(xhr.response);

                if ( exObj.status === "-ERR" ) {
                    console.error(exObj.msg);
                    return;
                }

                if ( exObj.status === "+OK" ) {
                    console.log('%c Extension _id: "' + parameters["id"] + '" has been received ', 'background: green; color: white');
                }

                console.log('%c\nEvent: buildSchema \nSource: ToolbarModel \n ', 'background: white; color: green');
                observe.trigger("buildSchema", exObj.data.callflow || []);
            };
            xhr.send();
        }
    });

    /**
     * Toolbar View
     */
    ToolbarView = Backbone.View.extend({

        "events": {
            "click #toolbar-json-tab label.btn": "onJsonTabButtonClick",
            "click #toolbar-view-tab label.btn": "onViewTabButtonClick"
        },

        "template": _.template(toolbarHTML),

        initialize: function(options) {
            log("Toolbar - Initialized");

            //  TODO повісити івент прослуховування моделі. Кожного разу перемальовувати вюху при зміні атрибутів моделі
        },

        render: function() {
            var
                tabsLayout = this.template({ "makaron": "123" });

            this.$el.append(tabsLayout);
        },

        onJsonTabButtonClick: function(event) {
            var tag = $(event.target).attr('data-tag');

            switch (tag) {
                case 'export':
                    this.onExportClick();
                    break;
                case 'import':
                    this.onImportClick();
                    break;
                case 'showJson':
                    this.onShowJsonClick();
                    break;
            }
        },

        onViewTabButtonClick: function(event) {
            var tag = $(event.target).attr('data-tag');

            switch (tag) {
                case 'widthExpand':
                    observe.trigger('toolbar_expandWidth', 100);
                    break;
                case 'widthShrink':
                    observe.trigger('toolbar_expandWidth', -100);
                    break;
                case 'heightExpand':
                    observe.trigger('toolbar_expandHeight', 100);
                    break;
                case 'heightShrink':
                    observe.trigger('toolbar_expandHeight', -100);
                    break;
            }
        },

        onExportClick: function() {
            log('Toolbar - Export click');
        },

        onImportClick: function() {
            log('Toolbar - Import click');
        },

        onShowJsonClick: function() {
            log('Toolbar - Show JSON click');

            require(['exportJson', 'modalBox', 'jsonViewer'], function(exportJson, modalBox, jsonViewer) {
                exportJson.getJson(function(cfdConfig, webitelConfig) {

                    modalBox.show({
                        title: 'JSON',
                        height: '80%',
                        width: '80%'
                    });

                    modalBox.$content.empty();

                    // Designer json
                    var $leftDivHeader = $('<div>', {
                        css: {
                            position: 'absolute',
                            top: '5px',
                            left: '5px',
                            width: '49%',
                            height: '20px',
                            'text-align': 'center',
                            'font-weight': 'bold',
                            color: 'gray'
                        },
                        text: 'Designer'
                    });
                    var $leftDiv = $('<div>', {
                        css: {
                            position: 'absolute',
                            top: '25px',
                            left: '5px',
                            width: '49%',
                            bottom: '5px',
                            overflow: 'auto'
                        }
                    });
                    $leftDiv.JSONView( JSON.parse(cfdConfig) );
                    modalBox.$content.append($leftDivHeader);
                    modalBox.$content.append($leftDiv);

                    // Callflow json
                    var $rightDivHeader = $('<div>', {
                        css: {
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            width: '49%',
                            height: '20px',
                            'text-align': 'center',
                            'font-weight': 'bold',
                            color: 'gray'
                        },
                        text: 'Callflow'
                    });
                    var $rightDiv = $('<div>', {
                        css: {
                            position: 'absolute',
                            top: '25px',
                            right: '5px',
                            width: '49%',
                            bottom: '5px',
                            overflow: 'auto'
                        }
                    });
                    $rightDiv.JSONView( JSON.parse(webitelConfig) );
                    modalBox.$content.append($rightDivHeader);
                    modalBox.$content.append($rightDiv);

                }, this);
            });
        }
    });


    //  create ToolbarModel and ToolbarView
    toolbarModel = new ToolbarModel();
    toolbarView = new ToolbarView({
        el: toolbarViewCont,
        model: toolbarModel
    });
    toolbarView.render();
});
























