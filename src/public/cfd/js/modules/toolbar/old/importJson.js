/**
 * TODO
 *      цей модуль вже не потрібний ?
 */


define('importJson', ['observe', "constants"], function(observe, constants) {

    /**
     * ImportJson object
     * Triggered events:
     *   - importJson_loadCells
     */

    return {

        CellType: {
            element: 'basic.Rect',
            link: 'link'
        },

        cfdConfig: [],
        webitelConfig: [],
        elementsConfig: [],

        /**
         * Load (import) json
         * @param {String}  cfdConfig
         * @param {String}  webitelConfig
         * @param {Boolean} autoGenerate
         */
        loadJson: function(cfdConfig, webitelConfig, autoGenerate) {

            this.cfdConfig = JSON.parse(cfdConfig || "[]");
            this.webitelConfig = JSON.parse(webitelConfig || "[]");

            this.getElementsConfig(function(elementsConfig) {

                this.elementsConfig = elementsConfig;

                this.prepareCFDConfig();

                observe.trigger(
                    'importJson_loadCells',
                    this.cfdConfig,
                    this.webitelConfig,
                    autoGenerate
                );

            }, this);
        },

        /**
         * Get elements config
         * @param {Function} callback
         * @param {Object}   scope
         */
        getElementsConfig: function(callback, scope) {
            $.post('conf/elements.json', callback.bind(scope));
        },

        /**
         * Get element config by name
         * @param   {String} type
         * @returns {Object}
         */
        getElementConfigByType: function(type) {
            var config = {};

            // groups
            _.each(this.elementsConfig, function(group) {
                // group's items
                _.each(group.items, function(item) {
                    if (item.elType == type) {
                        config = item;
                    }
                }, this);
            }, this);

            return config;
        },

        /**
         * Prepare CFD config
         * Merge each item (except links) with appropriate element config and default element config
         */
        prepareCFDConfig: function() {
            var appropriateConfig;

            _.each(this.cfdConfig, function(item, index) {

                if (!item.link) {

                    // Get appropriate config for current item
                    appropriateConfig = this.getElementConfigByType(item.elType);
                    // Merge current item with appropriate config
                    this.cfdConfig[index] = $.extend(true, {}, appropriateConfig, this.cfdConfig[index]);
                    // Merge current item with default config
                    this.cfdConfig[index] = $.extend(true, {}, constants.StencilConfig, this.cfdConfig[index]);
                    // Set property
                    this.cfdConfig[index].properties = this.getElementProperty(item);
                }

            }, this);
        },





        /**
         * Get element property by item config
         * @param  {Object} item
         * @return {Object}
         */
        getElementProperty: function(item) {
            switch (item.elType) {
                case constants.ElType.answer:
                    return this.getAnswerProperty(item);
                case constants.ElType.setVar:
                    return this.getSetVarProperty(item);
                case constants.ElType.recordSession:
                    return this.getRecordSessionProperty(item);
                case constants.ElType.sleep:
                    return this.getSleepProperty(item);
                default:
                    return {};
            }
        },

        /**
         * Get answer property
         * @param  {Object} item
         * @return {Object}
         */
        getAnswerProperty: function(item) {
            var property = {};

            _.each(this.webitelConfig, function(itemConfig) {
                if (itemConfig.designerElementId == item.id) {
                    property = {
                        "status": {
                            "value": itemConfig.answer,
                            "visible": true
                        }
                    }
                }
            });

            return property;
        },

        /**
         * Get setVar property
         * @param  {Object} item
         * @return {Object}
         */
        getSetVarProperty: function(item) {
            var property = {};

            _.each(this.webitelConfig, function(itemConfig) {
                if (itemConfig.designerElementId == item.id) {
                    property = {
                        "variables": {
                            "value": itemConfig.setVar,
                            "visible": true
                        }
                    }
                }
            });

            return property;
        },

        /**
         * Get recordSession property
         * @param  {Object} item
         * @return {Object}
         */
        getRecordSessionProperty: function(item) {
            var property = {};

            _.each(this.webitelConfig, function(itemConfig) {
                if (itemConfig.designerElementId == item.id) {
                    property = {
                        "record": {
                            "value": itemConfig.recordSession,
                            "visible": true
                        }
                    }
                }
            });

            return property;
        },

        getSleepProperty: function(item) {
            var property = {};

            _.each(this.webitelConfig, function(itemConfig) {
                if (itemConfig.designerElementId == item.id) {
                    property = {
                        "time": {
                            "value": itemConfig.sleep,
                            "visible": true
                        }
                    }
                }
            });

            return property;
        }
    };
});