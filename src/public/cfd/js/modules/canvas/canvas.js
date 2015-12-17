/**
 * ПРИЗНАЧЕННЯ CANVAS
 *      - валідація лінків
 *      - добавлення елементів по переданому конфігу
 *      - добавлення елементів по переданому типу
 *
 *
 */


/**
 * Canvas constructor
 *
 * Triggered events:
 *      - canvas_elementSelected
 *      - canvas_elementDeleted
 *
 * Subscribe on:
 *      - elements_endDrop
 *      - property_setSelectedElementLabel
 *      - property_setSelectedLinkLabel
 *      - exportJson_getCells
 *      - importJson_loadCells
 *      - tools_clearCanvas
 *      - toolbar_expandRight
 *      - toolbar_expandDown
 */


define('canvas', ['observe', 'cfdElLinks', 'constants'], function(observe, cfdElLinks, constants) {

    function Canvas() {

        var
            that = this;

        this.cfdEl = cfdElLinks.cfdEl;
        this.paperEl = cfdElLinks.canvasEl;
        this.selectEl = cfdElLinks.selectEl;
        this.selectButtonsEl = cfdElLinks.selectButtonsEl;

        this.graph = null;
        this.paper = null;
        this.selectedElement = null;
        this.selectedLink = null;
        this.dragLink = null;
        this.isFF = navigator.userAgent.indexOf('Firefox') != -1;
        this.gridRect = null;

        this.CellType = {
            link: 'link',
            element: 'basic.Rect'
        };

        /**
         * Initialize canvas
         */
        this.init = function() {

            this.initGraph();
            this.initPaper();
            this.initGrid();
            this.initEvents();

            this.graph.on('add', this.onGraphAddElement.bind(this));
            this.graph.on('remove', this.onGraphRemoveElement.bind(this));
            this.paper.on('blank:pointerclick', this.onPaperClick.bind(this));

            this.paperEl.mousemove(this.onPaperMouseMove.bind(this));
            this.paperEl.mouseup(this.onPaperMouseUp.bind(this));
            this.paperEl.scroll(this.onPaperScroll.bind(this));

            this.selectButtonsEl.click(this.onSelectButtonClick.bind(this));
            this.selectButtonsEl.mousedown(this.onSelectButtonMouseDown.bind(this));
            this.selectButtonsEl.mouseup(this.onSelectButtonMouseUp.bind(this));

            $(document).keyup(this.onDocumentKeyPress.bind(this));

            $(window).on('resize', this.fitCanvasToContainer.bind(this));
        };

        /**
         * Initialize canvas events
         * Subscribe on events from other modules
         */
        this.initEvents = function() {

            // Elements events
            observe.on('elements_endDrop', function(config, event) {
                if ( !config ) {
                    console.error("Bad config");
                    return;
                }

                var paperOffset = this.paperEl.offset(),
                    paperWidth = this.paperEl.width(),
                    paperHeight = this.paperEl.height();

                if (event.pageX <= paperOffset.left || event.pageX >= paperOffset.left + paperWidth ||
                    event.pageY <= paperOffset.top || event.pageY >= paperOffset.top + paperHeight) {
                    // out of canvas container - cancel add element
                    return;
                }

                config.x = event.pageX - paperOffset.left - 10;
                config.y = event.pageY - paperOffset.top - 10;

                this.addElement(config);
            }, this);

            // Property events
            observe.on('property_setSelectedElementLabel', function(text) {
                this.setSelectedElementLabel(text);
            }, this);
            observe.on('property_setSelectedLinkLabel', function(text) {
                this.setSelectedLinkLabel(text);
            }, this);

            // ExportJson events
            observe.on('exportJson_getCells', function(callback, scope) {
                if (callback) {
                    var cells = this.graph.get('cells');
                    callback.call(scope, cells.models);
                }
            }, this);

            // ImportJson events
            observe.on('importJson_loadCells', function(cfdConfig, webitelConfig, autoGenerate) {

                this.clearCanvas();

                if (autoGenerate) {
                    this.buildSchemaByWebitelConfig(webitelConfig);
                } else {
                    this.buildSchemaByCFDConfig(cfdConfig);
                }

            }, this);

            // Tools events
            observe.on("tools_clearCanvas", function() {
                this.clearCanvas();
            }, this);


            //
            observe.on("addElByType", this.addElByType, this);

            // Toolbar events
            observe.on("toolbar_expandWidth", function(value) {
                this.expandWidth(value);
            }, this);
            observe.on("toolbar_expandHeight", function(value) {
                this.expandHeight(value);
            }, this);

            // Inspector
            observe.on('inspector_fitCanvasToContainer', this.fitCanvasToContainer, this);

        };


        /**
         * Добавляє елемент певного типу на канвас
         * @param type тип елемента, який потрібно відобразити
         */
        this.addElByType = function(type, position) {



            var
                shape;


            shape = joint.shapes.wtel[type] && new joint.shapes.wtel[type]({
                position: position
            });

            //  TODO remove this costil :) with default
            if ( !shape ) {
                shape = new joint.shapes.wtel["default"]({
                    position: position
                });
            }

            this.graph.addCell(shape);

        };

        /**
         * Initialize canvas graph
         */
        this.initGraph = function() {
            this.graph = new joint.dia.Graph;
        };

        /**
         * Initialize canvas paper
         */
        this.initPaper = function() {
            this.paper = new joint.dia.Paper({
                el: this.paperEl,
                width: cfdElLinks.canvasEl.width(),
                height: cfdElLinks.canvasEl.height(),
                perpendicularLinks: false,
                gridSize: 10,
                model: this.graph,
                snapLinks: {
                    radius: 25          //  default=50
                },
                markAvailable: false,
                async: false,
                embeddingMode: false,
                defaultLink: new joint.dia.Link({
                    attrs: {
                        '.marker-target': {
                            d: 'M 10 0 L 0 5 L 10 10 z'
                        },
                        '.marker-arrowhead': {
                            d: 'M 15 0 L 0 8 L 15 15 z'
                        },
                        '.marker-vertex': {
                            r: 8
                        }
                    }
                }),

                validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
                    return true;
                }


            });
        };

        /**
         * Initialize canvas grid
         */
        this.initGrid = function() {

            this.gridRect = this.createSvg('rect', [
                { name: 'fill', value: 'url(#grid)' },
                { name: 'width', value: '100%' },
                { name: 'height', value: '100%' }
            ]);

            var pattern = this.createSvg('pattern', [
                { name: 'id', value: 'grid' },
                { name: 'width', value: 10 },
                { name: 'height', value: 10 },
                { name: 'patternUnits', value: 'userSpaceOnUse' }
            ]);

            var path = this.createSvg('path', [
                { name: 'd', value :'M 10 0 L 0 0 0 10' },
                { name: 'fill', value: 'none' },
                { name: 'stroke', value: '#e0e0e0' },
                { name: 'stroke-width', value: '1' }
            ]);
            pattern.appendChild(path);

            $(this.paper.svg).prepend(this.gridRect);
            $(this.paper.defs).append(pattern);
        };

        /**
         * Create SVG HTMLElement
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
         * Add Link to canvas
         * @param {Object} config
         */
        this.addLink = function(config) {
            var link = new joint.dia.Link(config);
            link.set('attrs', this.paper.options.defaultLink.get('attrs'));
            this.graph.addCell(link);
        };

        /**
         * Add Element to canvas
         * @param {Object} config
         */
        this.addElement = function(config) {

            if ( !config.x ) {
                config.x = 0;
            }

            if ( !config.y ) {
                config.y = 0;
            }

            // Move element xy-position accordingly to grid
            if (this.gridRect) {
                while (config.x % 10 != 0) {
                    config.x += 1;
                }
                while (config.y % 10 != 0) {
                    config.y += 1;
                }
            }

            // Add canvas container scroll left and top
            config.x += this.paperEl.scrollLeft();
            config.y += this.paperEl.scrollTop();

            var element = new joint.shapes.basic.Rect({
                position: {
                    x: config.x,
                    y: config.y
                },
                size: {
                    width: config.size.width,
                    height: config.size.height
                },
                attrs: {
                    text: {
                        //text: config.caption,
                        fill: config.attr.text.fill
                    },
                    rect: {
                        fill: config.attr.rect.fill,
                        stroke: config.attr.rect.stroke,
                        'stroke-width': config.attr.rect['stroke-width']
                    }
                },
                connectionInfo: {
                    inbound: [],
                    outbound: []
                }
            });

            // Set element id. Important for correct import
            if (config.id) {
                element.set('id', config.id);
            }

            element.set('itemType', config.elType);
            element.set('itemLabel', config.text);
            element.set('itemConfig', config);

            this.graph.addCell(element);

            var view = element.findView(this.paper),
                $element = view.$el;

            // On cell click event used instead of "cell:pointerdown" event
            $element.click(this.onCellClick.bind(this, view));

            this.prepareElementText($element, element, config);
            this.prepareElementImage($element, config);

            if (config.shapeType == constants.ShapeType.circle) {
                this.roundElementRect($element, config);
            }
        };

        /**
         * Prepare element text
         * @param {Object} $element
         * @param {Object} model
         * @param {Object} config
         */
        this.prepareElementText = function($element, model, config) {

            var $text = $(this.createSvg('text', [
                { name: 'text-anchor', value: 'middle' },
                { name: 'text-model-id', value: model.id }
            ]));
            $text.text(config.text);
            $text.appendTo(this.paper.viewport);

            this.moveElementText(model, $text);

            // Move text when element position changed
            model.on('change:position', function(model, value) {
                var $text = $('text[text-model-id=' + model.id + ']', this.paper.viewport);
                this.moveElementText(model, $text);
            }.bind(this));
        };

        /**
         * Prepare element image
         * @param {Object} $element
         * @param {Object} config
         */
        this.prepareElementImage = function($element, config) {

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

        /**
         * Move element text according to element position
         * @param {Object} model
         * @param {Object} $text
         */
        this.moveElementText = function(model, $text) {
            var position = model.get('position'),
                size = model.get('size'),
                x = position.x + size.width / 2,
                y = position.y + size.height + 15;

            $text.attr('transform', 'translate(' + x + ',' + y + ')');
        };

        /**
         * Round element rectangle
         * @param {Object} $element
         * @param {Object} config
         */
        this.roundElementRect = function($element, config) {
            var rect = $('rect', $element);
            rect.attr('rx', rect.attr('width'));
        };

        /**
         * Move select element
         */
        this.moveSelectEl = function() {
            var cellSize = this.selectedElement.model.get('size'),
                rectOffset = $('rect', this.selectedElement.$el).offset(),
                cfdOffset = this.cfdEl.offset(),
                left = rectOffset.left - cfdOffset.left - 5,
                top = rectOffset.top - cfdOffset.top - 5;

            if (this.isFF) {
                left += 1;
                top += 1;
            }

            this.selectEl.css({
                width: cellSize.width + 8 + 'px',
                height: cellSize.height + 8 + 'px',
                left: left + 'px',
                top: top + 'px'
            });
        };

        /**
         * On cell click event
         * @param {Object} cell
         * @param {Object} event
         */
        this.onCellClick = function(cell, event) {

            var type = cell.model.get('type');

            if (type == this.CellType.element) {

                this.selectedLink = null;
                this.selectedElement = cell;
                this.selectEl.show();
                this.moveSelectEl();

                observe.trigger(
                    'canvas_elementSelected',
                    this.CellType.element,
                    cell.model,
                    event
                );
            }

            event.preventDefault();
        };

        /**
         * On paper click event
         * @param {Object} event
         */
        this.onPaperClick = function(event) {
            this.selectedElement = null;
            this.selectedLink = null;
            this.selectEl.hide();

            observe.trigger(
                'canvas_elementSelected',
                'paper',
                this.paper.model,
                event
            );
        };

        /**
         * On paper mouse move event
         * @param {Object} event
         */
        this.onPaperMouseMove = function(event) {
            if (this.selectedElement) {
                this.moveSelectEl();
            }

            event.preventDefault();
        };

        /**
         * On paper mouse up event
         * @param {Object} event
         */
        this.onPaperMouseUp = function(event) {
            if (this.dragLink) {

                var isLinkValid = this.validateDragLinkTargetSource();
                if (isLinkValid) {
                    this.prepareConnectionInfo();
                } else {
                    this.dragLink.remove();
                }

                this.dragLink = null;
            }

            event.preventDefault();
        };

        /**
         * On paper scroll event
         * @param {Object} event
         */
        this.onPaperScroll = function(event) {
            if (this.selectedElement) {
                this.moveSelectEl();
            }
        };

        /**
         * On select button click event
         * @param {Object} event
         */
        this.onSelectButtonClick = function(event) {
            var tag = $(event.target).attr('data-tag');

            switch (tag) {
                case 'delete':
                    this.removeSelectedElement(event);
                    break;
            }
        };

        /**
         * On select button mouse down event
         * @param {Object} event
         */
        this.onSelectButtonMouseDown = function(event) {
            var tag = $(event.target).attr('data-tag');

            switch (tag) {
                case 'createLink':

                    //  знаходиться вюха даного елемента і викликається його метод pointerDown
                    //  якщо в вюхи є атрибут target і пройдена валідації
                    //  тоді створюється лінк, source якого є модель вюхи, далі запускається метод
                    //  вюхи лінка startArrowheadMove
                    var model = this.selectedElement.model,
                        view = this.paper.findViewByModel(model),
                        evt = joint.util.normalizeEvent(event),
                        localPoint = this.paper.snapToGrid({
                            x: evt.clientX,
                            y: evt.clientY
                        });

                    this.paper.sourceView = view;
                    view.pointerdown(evt, localPoint.x, localPoint.y);

                    break;
            }
        };

        /**
         * On select button mouse up event
         * @param {Object} event
         */
        this.onSelectButtonMouseUp = function(event) {
            var tag = $(event.target).attr('data-tag');

            switch (tag) {
                case 'createLink':
                    // Remove link when use makes single/double click on link button
                    if (this.dragLink) {
                        this.dragLink.remove();
                    }
                    break;
            }
        };

        /**
         * On add element to graph event
         * @param {Object} element
         */
        this.onGraphAddElement = function(element) {
            var type = element.get('type');

            switch (type) {
                case this.CellType.link:
                    this.onLinkAdded(element);
                    break;
            }
        };

        /**
         * On remove element event
         * @param element
         */
        this.onGraphRemoveElement = function(element) {
            var type = element.get('type');

            switch (type) {
                case this.CellType.element:
                    // Remove element text
                    $('text[text-model-id=' + element.id + ']', this.paper.viewport).remove();
                    break;
                case this.CellType.link:
                    this.onLinkDeleted(element);
                    break;
            }
        };

        /**
         * On link added event
         * @param {Object} link
         */
        this.onLinkAdded = function(link) {

            // Set current added link as dragged link
            this.dragLink = link;

            var linkEl = this.paper.findViewByModel(link).$el;

            // On link arrows (source/target) mouse down - set link as dragged link
            $('.marker-arrowhead-group', linkEl).mousedown(function(link, event) {
                this.dragLink = link;
            }.bind(this, link));

            this.prepareLinkRemoveIcon(linkEl);
            this.prepareLinkOptionsIcon(linkEl, link);
        };

        /**
         * On link deleted event
         */
        this.onLinkDeleted = function(link) {
            observe.trigger(
                'canvas_elementDeleted',
                this.CellType.link,
                link
            );
        };

        /**
         * On document key press event
         * @param {Object} event
         */
        this.onDocumentKeyPress = function(event) {
            if (event.keyCode == 46 /*DEL*/ && this.selectedElement) {
                this.removeSelectedElement(event);
            }
        };

        /**
         * On link options click event
         * @param {Object} link
         * @param {Object} linkEl
         * @param {Object} event
         */
        this.onLinkOptionsClick = function(link, linkEl, event) {
            this.selectedElement = null;
            this.selectedLink = link;
            this.selectEl.hide();

            observe.trigger(
                'canvas_elementSelected',
                this.CellType.link,
                link,
                event
            );
        };

        /**
         * Prepare link target/source elements connection info
         */
        this.prepareConnectionInfo = function() {
            var linkTarget = this.dragLink.get('target'),
                linkSource = this.dragLink.get('source');

            if (linkTarget.id && linkSource.id) {

                var modelS = this.paper.getModelById(linkSource.id),
                    viewS = this.paper.findViewByModel(modelS),
                    modelT = this.paper.getModelById(linkTarget.id),
                    viewT = this.paper.findViewByModel(modelT);

                modelS.get("connectionInfo").outbound.push({
                    model  : modelT,
                    view   : viewT,
                    linkModel: this.dragLink,
                    linkView : this.paper.findViewByModel(this.dragLink)
                });

                modelT.get("connectionInfo").inbound.push({
                    model  : modelS,
                    view   : viewS,
                    linkModel: this.dragLink,
                    linkView : this.paper.findViewByModel(this.dragLink)
                });
            }
        };

        /**
         * Remove selected element and hide select border
         * @param {Object} event
         */
        this.removeSelectedElement = function(event) {

            this.graph.removeLinks(this.selectedElement.model);

            var model = this.selectedElement.model;

            this.selectedElement.model.remove();
            this.selectedElement.remove();
            this.selectedElement = null;
            this.selectEl.hide();

            observe.trigger(
                'canvas_elementDeleted',
                this.CellType.element,
                model,
                event
            );
        };

        /**
         * Prepare link remove icon
         * @param {Object} linkEl
         */
        this.prepareLinkRemoveIcon = function(linkEl) {
            var removeEl = $('.link-tools .tool-remove', linkEl);

            $('circle', removeEl).attr({
                r: 8
            });

            $('path', removeEl).attr({
                transform: 'scale(.6) translate(-16, -16)'
            });

            $('title', removeEl).text('Remove link');
        };

        /**
         * Prepare link options icon
         * @param {Object} linkEl
         * @param {Object} link
         */
        this.prepareLinkOptionsIcon = function(linkEl, link) {
            var optionsEl = $('.link-tools .tool-options', linkEl);

            optionsEl.click(this.onLinkOptionsClick.bind(this, link, linkEl));

            $('circle', optionsEl).attr({
                r: 8,
                transform: 'translate(20)'
            });

            $('path', optionsEl).attr({
                transform: 'scale(.40) translate(34, -16)'
            });

            $('title', optionsEl).text('Link properties');
        };

        /**
         * Set link label
         * @param {Object} linkModel
         * @param {String} text
         */
        this.setLinkLabel = function(linkModel, text) {
            text = text || '';

            linkModel.label(0, {
                position: .5,
                attrs: {
                    text: { fill: 'black', text: text }
                }
            });
        };

        /**
         * Set element label
         * @param {Object} elementModel
         * @param {String} text
         */
        this.setElementLabel = function(elementModel, text) {
            text = text || '';

            var textEl = $('text[text-model-id=' + elementModel.id + ']', this.paper.viewport),
                lines = text.split('\n');

            textEl.empty();

            $.each(lines, function(index, item) {
                var tSpan = this.createSvg('tspan', [
                    { name: 'dy', value: ((index == 0)? 0: 1) + 'em' },
                    { name: 'x', value: 0 }
                ]);
                tSpan.innerHTML = item;
                textEl.append(tSpan);
            }.bind(this));

            elementModel.set('itemLabel', text);
        };

        /**
         * Set selected element label
         * @param {String} labelText
         */
        this.setSelectedElementLabel = function(labelText) {
            if (this.selectedElement) {
                this.setElementLabel(this.selectedElement.model, labelText);
            }
        };

        /**
         * Set selected link label
         * @param {String} labelText
         */
        this.setSelectedLinkLabel = function(labelText) {
            if (this.selectedLink) {
                this.setLinkLabel(this.selectedLink, labelText);
            }
        };

        /**
         * Get selected element label
         * @returns {String}
         */
        this.getSelectedElementLabel = function() {
            if (this.selectedElement) {
                return this.selectedElement.model.get('itemLabel');
            }
            return null;
        };

        /**
         * Get selected link label
         * @returns {String}
         */
        this.getSelectedLinkLabel = function() {
            if (this.selectedLink) {

                var labels = this.selectedLink.get('labels') || [],
                    text = '';

                $.each(labels, function(intex, item) {
                    text += item.attrs.text.text;
                }.bind(this));

                return text;
            }
            return null;
        };

        /**
         * Validate drag link source and target
         */
        this.validateDragLinkTargetSource = function() {
            var source = this.dragLink.get('source'),
                target = this.dragLink.get('target');

            // Validate source and target
            if (!source || !target) {
                console.warn('Link must have target and source');
                return false;
            }

            // Validate source id and target id
            if (!source.id || !target.id) {
                console.warn('Link must have target.id and source.id');
                return false;
            }

            // Validate source and target equality
            if (source.id == target.id) {
                console.warn('Link cannot have same source and target');
                return false;
            }

            var sourceModel = this.paper.getModelById(source.id),
                targetModel = this.paper.getModelById(target.id);

            if (!sourceModel || !targetModel) {
                return false;
            }

            var sourceType = sourceModel.get('itemType'),
                targetType = targetModel.get('itemType');

            // Validate source
            if (!this.validateLinkSource(sourceModel, sourceType)) {
                return false;
            }

            // Validate target
            if (!this.validateLinkTarget(targetModel, targetType)) {
                return false;
            }

            return true;
        };

        /**
         * Validate link source
         * @param {Object} model
         * @param {String} type
         * @returns {Boolean}
         */
        this.validateLinkSource = function(model, type) {

            if (type == constants.ElType.terminate) {
                console.warn("Terminate element cannot have outbound links");
                return false;
            }

            if (type == constants.ElType.start) {
                var links = this.getLinksBySourceId(model.id);
                if (links.length > 1) {
                    console.warn('Start element cannot have more than one outbound link');
                    return false;
                }
            }

            return true;
        };

        /**
         * Validate link target
         * @param {Object} model
         * @param {String} type
         * @returns {Boolean}
         */
        this.validateLinkTarget = function(model, type) {

            if (type == constants.ElType.start) {
                console.warn("Start element cannot have inbound links");
                return false;
            }

            return true;
        };

        /**
         * Get links by source
         * @param  {String} sourceId
         * @return {Array}
         */
        this.getLinksBySourceId = function(sourceId) {
            var result = [],
                links = this.graph.getLinks();

            _.each(links, function(link) {
                var source = link.get('source');
                if (source && source.id == sourceId) {
                    result.push(link);
                }
            }, this);

            return result;
        };

        /**
         * Clear canvas
         */
        this.clearCanvas = function() {
            this.selectedElement = null;
            this.selectedLink = null;
            this.selectEl.hide();
            this.graph.clear();
        };

        /**
         * Build schema by CFD config
         * @param {Array} cfdConfig
         */
        this.buildSchemaByCFDConfig = function(cfdConfig) {
            // First add elements
            _.each(cfdConfig, function(config) {
                if (!config.link) {
                    this.addElement(config);
                }
            }, this);
            // Then add links
            _.each(cfdConfig, function(config) {
                if (config.link) {
                    this.addLink(config);
                }
            }, this);
        };

        /**
         * Build (auto generate) schema by Webitel config
         * @param {Array} webitelConfig
         */
        /*
         Usage:
         requirejs(['canvas'], function(canvas) {
         var webitelConfig = [
         { "answer": "" },
         { "setVar": "" },
         { "recordSession": "" },
         { "sleep": "" }
         ];
         canvas.clearCanvas();
         canvas.buildSchemaByWebitelConfig(webitelConfig);
         });
         */
        this.buildSchemaByWebitelConfig = function(webitelConfig) {
            this.getElementsConfig(function(config) {

                var element,
                    elType,
                    x = 100,
                    y = 10,
                    offset = 150;

                // Add start element
                element = this.getConfigByType(config, constants.ElType.start);
                element = $.extend(true, {}, constants.StencilConfig, element);
                element.x = x;
                element.y = y;
                this.addElement(element);

                // Add elements
                _.each(webitelConfig, function(item) {

                    // Find out element type
                    elType = null;
                    _.each(item, function(value, key) {
                        if (_.has(constants.ElType, key)) {
                            elType = key;
                        }
                    }, this);

                    // Add element
                    element = this.getConfigByType(config, elType);
                    element = $.extend(true, {}, constants.StencilConfig, element);
                    element.x = x;
                    element.y = y += offset;
                    if (elType == null) {
                        element.text = "unknown type";
                    }
                    this.addElement(element);

                }, this);

                // Add terminate element
                element = this.getConfigByType(config, constants.ElType.terminate);
                element = $.extend(true, {}, constants.StencilConfig, element);
                element.x = x;
                element.y = y + offset;
                this.addElement(element);

                // Add links
                var sourceCell,
                    targetCell,
                    elements = this.graph.getElements();
                for (var i = 0; i < elements.length - 1; ++i) {
                    sourceCell = elements[i];
                    targetCell = elements[i + 1];
                    this.addLink({
                        source: { id: sourceCell.id },
                        target: { id: targetCell.id }
                    });
                }

            }, this);

        };

        /**
         * Get elements config (elements.json)
         * @param {Function} callback
         * @param {Object}   scope
         */
        this.getElementsConfig = function(callback, scope) {
            $.post('conf/elements.json', callback.bind(scope));
        };

        /**
         * Get config by element type
         * @param {Array}  config
         * @param {String} type
         * @result {Object}
         */
        this.getConfigByType = function(config, type) {
            var result = {};

            // group
            _.each(config, function(group) {
                // group's items
                _.each(group.items, function(item) {
                    if (item.elType == type) {
                        result = item;
                    }
                });
            }, this);

            return result;
        };

        /**
         * Fit canvas to container if canvas dimensions lower than container dimensions
         */
        this.fitCanvasToContainer = function() {
            var contWidth = this.paperEl.width(),
                contHeight = this.paperEl.height(),
                svgBox = this.paper.svg.getBBox(),
                width = null,
                height = null;

            if (svgBox.width < contWidth) {
                width = contWidth;
            }
            if (svgBox.height < contHeight) {
                height = contHeight;
            }

            this.paper.setDimensions(width, height);
        };

        /**
         * Expand canvas width
         * @param {Number} value
         */
        this.expandWidth = function(value) {
            var canvasContWidth = this.paperEl.width(),
                svgWidth = this.paper.svg.getBBox().width,
                newWidth;

            if (value > 0) {
                newWidth = svgWidth + value;
            } else {
                value = Math.abs(value);
                if ((svgWidth - value) <= canvasContWidth) {
                    newWidth = canvasContWidth;
                } else {
                    newWidth = svgWidth - value;
                }
            }

            this.paper.setDimensions(newWidth, null);
        };

        /**
         * Expand canvas height
         * @param {Number} value
         */
        this.expandHeight = function(value) {
            var canvasContHeight = this.paperEl.height(),
                svgHeight = this.paper.svg.getBBox().height,
                newHeight;

            if (value > 0) {
                newHeight = svgHeight + value;
            } else {
                value = Math.abs(value);
                if ((svgHeight - value) <= canvasContHeight) {
                    newHeight = canvasContHeight;
                } else {
                    newHeight = svgHeight - value;
                }
            }

            this.paper.setDimensions(null, newHeight);
        };

        this.init();





        /**
         * TODO
         *      - створити полігон на SVG
         */

        this.createIF = function() {
            debugger;
            that;
        };

        window.createIfEl = this.createIF;

        window.C = this;

    }

    return new Canvas();

});




































