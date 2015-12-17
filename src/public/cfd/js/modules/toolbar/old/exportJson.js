define('exportJson', ['observe', 'constants'], function(observe, constants) {

    /*
        Usage:
            requirejs(['exportJson'], function(exportJson) {
                exportJson.getJson(function(cfdConfig, webitelConfig) {
                    console.log(cfdConfig);
                    console.log(webitelConfig);
                });
            });
    */

    /**
     * ExportJson object
     * Triggered events:
     *   - exportJson_getCells
     */

    return {

        cfdConfig: null,
        webitelConfig: null,

        cells: null,

        serviceType: [
            constants.ElType.start,
            constants.ElType.terminate
        ],

        /**
         * Get CFD config and Webitel config
         * @param {Function} callback
         * @param {Object}   scope
         * @param {Boolean}  format
         */
        getJson: function(callback, scope, format) {
            this.getCanvasItems(function(cells) {
                this.cells = cells;
                this.prepareCFDConfig();
                this.prepareWebitelConfig();
                callback.call(
                    scope,
                    this.toJson(this.cfdConfig, format),
                    this.toJson(this.webitelConfig, format)
                );
            }, this);
        },

        /**
         * Get canvas items
         * @param {Function} callback
         * @param {Object}   scope
         */
        getCanvasItems: function(callback, scope) {
            observe.trigger('exportJson_getCells', callback, scope);
        },

        /**
         * Convert object to json-string with indent if format is true
         * @param {Object}  value
         * @param {Boolean} format
         * @returns {String}
         */
        toJson: function(value, format) {
            if (format) {
                return JSON.stringify(value, null, '\t');
            } else {
                return JSON.stringify(value);
            }
        },

        /**
         * Prepare CFD config
         */
        prepareCFDConfig: function() {
            this.cfdConfig = [];

            $.each(this.cells, function(index, item) {
                if (item.isLink()) {
                    this.cfdConfig.push(this.getCFDLinkConfig(item));
                } else {
                    this.cfdConfig.push(this.getCFDElementConfig(item));
                }
            }.bind(this));
        },

        /**
         * Get CFD element config from element model
         * @param {Object} model
         * @returns {Object}
         */
        getCFDElementConfig: function(model) {
            var position = model.get('position'),
                type = model.get('itemType'),
                text = model.get('itemLabel');

            return {
                id: model.id,
                elType: type,
                x: position.x,
                y: position.y,
                text: text
            };
        },

        /**
         * Get CFD link config from link model
         * @param {Object} model
         * @returns {Object}
         */
        getCFDLinkConfig: function(model) {
            return {
                id: model.id,
                link: true,
                labels: model.get('labels'),
                source: model.get('source'),
                target: model.get('target'),
                vertices: model.get('vertices')
            }
        },

        /**
         * Prepare Webitel config
         */
        prepareWebitelConfig: function() {
            this.webitelConfig = [];

            var start = this.getCellsByElementType(constants.ElType.start)[0];

            if (!start) {
                //TODO: Show this message in "Message panel"
                console.warn('Export error: Start element not found!');
                return;
            }

            this.buildWebitelConfig(start);
        },

        /**
         * Get elements from cells
         * @returns {Array}
         */
        getCellsElements: function() {
            var result = [];

            _.each(this.cells, function(cell) {
                if (!cell.isLink()) {
                    result.push(cell);
                }
            });

            return result;
        },

        /**
         * Get links from cells
         * @returns {Array}
         */
        getCellsLinks: function() {
            var result = [];

            _.each(this.cells, function(cell) {
                if (cell.isLink()) {
                    result.push(cell);
                }
            });

            return result;
        },


        /**
         * Get cells by element type
         * @param type
         * @returns {Array}
         */
        getCellsByElementType: function(type) {
            var result = [];

            _.each(this.cells, function(cell) {
                if (cell.get('itemType') == type) {
                    result.push(cell);
                }
            });

            return result;
        },

        /**
         * Build Webitel config recursively
         * @param {object} cell
         */
        buildWebitelConfig: function(cell) {

            // Add item if it not service type
            if (!this.isServiceElement(cell)) {
                var item = {};
                item[cell.get('itemType')] = this.getElementProperty(cell);
                item['designerElementId'] = cell.id;
                this.webitelConfig.push(item);
            }

            // Get child elements
            var childElements = this.getChildElements(cell);

            // Call function for each child
            _.each(childElements, function(child) {
                this.buildWebitelConfig(child);
            }, this);
        },

        /**
         * Get cell child elements
         * @param {Object} cell
         * @returns {Array}
         */
        getChildElements: function(cell) {
            var links = this.getCellsLinks(),
                elements = this.getCellsElements(),
                source,
                target,
                result = [];

            _.each(links, function(link) {

                source = link.get('source');
                target = link.get('target');

                if (!source || !target) {
                    return;
                }

                if (source.id == cell.id) {
                    _.each(elements, function(element) {
                        if (target.id == element.id) {
                            result.push(element);
                        }
                    }, this);
                }

            }, this);

            return result;
        },

        /**
         * Is service element
         * @param  {Object} cell
         * @return {Boolean}
         */
        isServiceElement: function(cell) {
            var type = cell.get('itemType');
            return (this.serviceType.indexOf(type) != -1);
        },

        /**
         * Get element property
         * @param   {Object} cell
         * @returns {Object}
         */
        getElementProperty: function(cell) {
            var type = cell.get('itemType');

            switch (type) {
                case constants.ElType.answer:
                    return this.getAnswerProperty(cell);
                case constants.ElType.setVar:
                    return this.getSetVarProperty(cell);
                case constants.ElType.recordSession:
                    return this.getRecordSessionProperty(cell);
                case constants.ElType.sleep:
                    return this.getSleepProperty(cell);
                default:
                    return {};
            }
        },

        /**
         * Get answer property
         * @param  {Object} cell
         * @return {String}
         */
        getAnswerProperty: function(cell) {
            var config = cell.get('itemConfig');

            return config.properties.status.value;
        },

        /**
         * Get setVar property
         * @param  {Object} cell
         * @return {Object}
         */
        getSetVarProperty: function(cell) {
            var config = cell.get('itemConfig');

            return config.properties.variables.value;
            return {};
        },

        /**
         * Get recordSession property
         * @param  {Object} cell
         * @return {Object}
         */
        getRecordSessionProperty: function(cell) {
            var config = cell.get('itemConfig');

            return config.properties.record.value;
        },

        /**
         * Get sleep property
         * @param  {Object} cell
         * @return {Object}
         */
        getSleepProperty: function(cell) {
            var config = cell.get('itemConfig');

            return config.properties.time.value;
        },


    };

});