define('preview', ['observe', 'canvas'], function(observe, canvas) {

    /**
     * Preview
     */
    function Preview() {

        /**
         * Initialize preview graph and paper
         */
        this.init = function() {

            this.$previewCont = $('#cfd-preview-container');

            this.graph = canvas.graph;

            this.paper = new joint.dia.Paper({
                el: this.$previewCont,
                width: this.$previewCont.width(),
                height: this.$previewCont.height(),
                model: this.graph,
                interactive: false
            });
            this.paper.scale(0.4);

            this.graph.on('add', this.onGraphAddEvent, this);
            this.graph.on('all', this.onGraphAllEvent, this);
        };

        /**
         * On graph 'add' event
         * @param {Object} cell
         */
        this.onGraphAddEvent = function(cell) {
            if (!cell.isLink()) {
                this.addImage(cell);
            }
        };

        /**
         * On graph 'all' event
         */
        this.onGraphAllEvent = function() {
            this.paper.scaleContentToFit({
                maxScaleY: 0.4,
                maxScaleX: 0.4,
                padding: 5
            });
        };

        /**
         * Create SVG element
         * @param {String} name
         * @param {Object} attr
         * @returns {HTMLElement}
         */
        this.createSvg = function(name, attr) {
            var svgElement = document.createElementNS("http://www.w3.org/2000/svg", name);

            $.each(attr, function(index, item) {
                if (item.ns) {
                    svgElement.setAttributeNS(item.ns, item.name, item.value);
                } else {
                    svgElement.setAttribute(item.name, item.value);
                }
            });

            return svgElement;
        };

        /**
         * Add image to cell
         * @param {Object} cell
         */
        this.addImage = function(cell) {

            var $element = this.paper.findViewByModel(cell).$el,
                config = cell.get('itemConfig');

            if (!config) {
                return;
            }

            var img = this.createSvg('image', [
                { name: 'width', value: config.size.width - 20 },
                { name: 'height', value: config.size.height - 20 },
                { name: 'x', value: 10 },
                { name: 'y', value: 10 },
                { name: 'href', value: config.imgUrl, ns: 'http://www.w3.org/1999/xlink' }
            ]);

            // Prevent default behavior on mouse down
            // Needed for smoothly dragging element in Firefox browser
            img.onmousedown = function(event) {
                event.preventDefault();
            };

            $element.append(img);
        };

        this.init();

    }

    return new Preview();

});