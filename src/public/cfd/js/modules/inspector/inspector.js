/**
 * Property constructor
 * Triggered events:
 *   - property_setSelectedElementLabel
 *   - property_setSelectedLinkLabel
 *   - inspector_fitCanvasToContainer
 */

define('inspector', ['observe', 'cfdElLinks', "propertyViews"], function(observe, cfdElLinks, propertyViews) {


    function Property() {

        /**
         * Initialize property
         */
        this.init = function() {
            this.initEvents();

            this.$cfdCanvas = $('#cfd-canvas');
            this.$cfdProperty = $('#cfd-property');
            this.$cfdPropertyClose = $('#cfd-property-close');
            this.$cfdPropertyCloseBtn = $('.property-close-btn');
            this.$cfdPreviewCont = $('#cfd-preview-container');

            this.$cfdPropertyCloseBtn.click(this.onCloseClick.bind(this));
        };

        /**
         * Initialize property events
         * Subscribe on events from other modules
         */
        this.initEvents = function() {

            // Canvas
            observe.on('canvas_elementSelected', this.onElementSelected, this);
            observe.on('canvas_elementDeleted', this.onElementDeleted, this);
        };

        /**
         * On element selected event
         * @param {String} type
         * @param {Object} model
         * @param {Object} event
         */
        this.onElementSelected = function(type, model, event) {
            propertyViews.createView(type, model);
        };

        /**
         * On element deleted event
         * @param {String} type
         * @param {Object} model
         */
        this.onElementDeleted = function(type, model) {
            propertyViews.removeCurrentView();
        };

        //observe.trigger('property_setSelectedElementLabel', 'abc');
        //observe.trigger('property_setSelectedLinkLabel', 'abc');

        /**
         * On close click event
         */
        this.onCloseClick = function() {
            if (this.$cfdPropertyClose.hasClass('property-closed')) {
                this.open();
            } else {
                this.close();
            }

            observe.trigger('inspector_fitCanvasToContainer');
        };

        /**
         * Open property container
         */
        this.open = function() {
            this.$cfdPropertyClose.removeClass('property-closed');

            this.$cfdPropertyCloseBtn.text('>');

            this.$cfdCanvas.css('right', '300px');
            this.$cfdProperty.css('width', '300px');

            cfdElLinks.propertyEl.show();
            this.$cfdPreviewCont.show();
        };

        /**
         * Close property container
         */
        this.close = function() {
            this.$cfdPropertyClose.addClass('property-closed');

            this.$cfdPropertyCloseBtn.text('<');

            this.$cfdCanvas.css('right', '8px');
            this.$cfdProperty.css('width', '8px');

            cfdElLinks.propertyEl.hide();
            this.$cfdPreviewCont.hide();
        };

        this.init();
    }

    return new Property();

});




