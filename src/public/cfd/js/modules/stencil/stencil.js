/**
 * Stencil модуль вичитує конфіг, динамічно будує панель із елементами.
 *
 * StencilConf конфігураційний файл всіх елементів, які повинні бути добавленні на панель
 *      - name || type
 *      ? element {
 *          "type": "",
 *          "name": "",
 *          "style": ""
 *      }
 *      - caption       підпис елемента на панельці
 *      - visible       чи видимий на панельці
 *      - properties    властивості елемента, які можна змінювати
 *      - group         опис групи і позиції для елемента
 *          * name назва групи, до якої входить елемент
 *          * position його позиція в групі
 *
 *
 *      TODO тип елемента для візуального ефекту і тип елемента для його конфігурації
 */


define("stencil", ["text!conf/elements.json", "observe", "constants"], function(stencilConf, observe, constants) {

    // Stencil
    joint.ui.Stencil = Backbone.View.extend({

        className: "stencil",

        events: {
            "click .group-label"        : "onGroupLabelClick", // toggle group
            "touchstart .group-label"   : "onGroupLabelClick", // toggle group
            "input .search"             : "onSearch"
        },

        // Default options
        options: {
            width: 200,
            height: 800,
            displayMode: constants.StencilDisplayMode.grid,
            listConfig: {
                startX: 5,
                startY: 5,
                distanceX: 5,
                distanceY: 5
            },
            gridConfig: {
                startX: 15,
                startY: 5,
                distanceX: 15,
                distanceY: 5
            }
        },

        /**
         * Initialize
         * @param {Object} options
         */
        initialize: function(options) {
            console.log("%c Stencil - Initialized ", 'background: #518EC5; color: white');

            // Merge default options with passed options
            this.options = _.extend({}, this.options, options || {});

            this.graphs = {};  // groups graphs
            this.papers = {};  // groups papers
            this.conf   = {};  // stencil config
            this.$groups = {}; // groups elements

            $(document.body).on({
                "mousemove.stencil touchmove.stencil": this.onDrag.bind(this),
                "mouseup.stencil touchend.stencil": this.onDragEnd.bind(this)
            });

            this.readConf();
            //this.addDemoGroups();
        },

        /**
         * Render
         * @returns {Stencil}
         */
        render: function() {

            this.$el.html('<div class="stencil-paper-drag"></div><div class="content"></div>');

            this.$content = this.$(".content");

            $('.stencil-container').append(this.el);

            this.renderOpenAllButton();
            this.renderCloseAllButton();

            // Important. First render groups. Then render elements into groups
            this.renderGroups();
            this.renderElements();

            // Initialize drag graph and paper
            this._graphDrag = new joint.dia.Graph;
            this._paperDrag = new joint.dia.Paper({
                el: this.$(".stencil-paper-drag"),
                width: 1,
                height: 1,
                model: this._graphDrag
            });

            // Set drag start event
            _.each(this.papers, function(paper) {
                this.listenTo(paper, "cell:pointerdown", this.onDragStart)
            }, this);

            return this;
        },

        /**
         * Render Open all (+) groups button
         */
        renderOpenAllButton: function() {
            $('<div>', {
                text: '+',
                class: 'btn btn-primary btn-xs stencil-group-button',
                click: this.openGroups.bind(this),
                title: 'Open all'
            }).appendTo('.stencil-container');
        },

        /**
         * Render Close all (-) groups button
         */
        renderCloseAllButton: function() {
            $('<div>', {
                text: '-',
                class: 'btn btn-primary btn-xs stencil-group-button',
                css: {
                    left: '17px'
                },
                click: this.closeGroups.bind(this),
                title: 'Close all'
            }).appendTo('.stencil-container');
        },

        /**
         * Render groups
         */
        renderGroups: function() {
            var
                sortedGroups,
                groupHTML = '<div class="group"><h3 class="group-label"></h3></div>',
                elementsHTML = '<div class="elements"></div>',
                paperOptions = {
                    width: this.options.width,
                    height: this.options.height,
                    interactive: false
                };

            // Sort groups by index
            sortedGroups = _.sortBy(this.conf, function(group) {
                return group.index || 0;
            }, this);

            // Render each group
            _.each(sortedGroups, function(group, gIndex, groupsList) {

                var groupName       = group.group || "",
                    groupCaption    = group.caption || "",
                    $group          = $(groupHTML),
                    groupGraph,
                    groupPaper;

                // Sat group name, caption, collapsed
                $group.attr("data-name", groupName);
                $group.find("h3").text(groupCaption);
                $group.toggleClass('closed', group.collapsed);

                // Add elements container to group
                $group.append($(elementsHTML));

                // Add group to content
                this.$content.append($group);

                // Save group element
                this.$groups[groupName] = $group;

                // Initialize group graph
                this.graphs[groupName] = groupGraph = new joint.dia.Graph;

                // Initialize group paper
                this.papers[groupName] = groupPaper = new joint.dia.Paper(_.extend({}, paperOptions, {
                    el: $group.find(".elements"),
                    model: groupGraph,
                    width: 150 || paperOptions.width,
                    height: 500 || paperOptions.height,
                    interactive: false
                }));

                // Scale paper to 0.8 if display mode is list
                if (this.options.displayMode == constants.StencilDisplayMode.list) {
                    groupPaper.scale(0.8);
                }

            }, this);
        },

        /**
         * Render group elements
         */
        renderElements: function() {
            var groups = this.conf;

            // Iterate each group
            _.each(groups, function(group, gIndex, groupsList) {

                var elements = group.items || [],
                    gGraph = this.getGraph(group.group),
                    gPaper = this.getPaper(group.group);

                var initPos = this.getInitialPosition(),
                    nextPos,
                    x = initPos.startX,
                    y = initPos.startY;

                // Iterate each group's element
                _.each(elements, function(elementConf, elIndex, elementsList) {

                    // Merge current element with default config
                    var mergeConf = _.extend({}, constants.StencilConfig, elementConf);

                    mergeConf.x = x;
                    mergeConf.y = y;

                    var element = new joint.shapes.basic.Rect({
                        position: {
                            x: mergeConf.x,
                            y: mergeConf.y
                        },
                        size: {
                            width: mergeConf.size.width,
                            height: mergeConf.size.height
                        },
                        attrs: {
                            text: {
                                text: mergeConf.caption
                            },
                            rect: {
                                fill: mergeConf.attr.rect.fill,
                                stroke: mergeConf.attr.rect.stroke,
                                'stroke-width': mergeConf.attr.rect['stroke-width']
                            }
                        }
                    });

                    element.set("oldConf", mergeConf);
                    gGraph.addCell(element);

                    var $element = element.findView(gPaper).$el;
                    $element.data('config', mergeConf);

                    // Prepare element image, text, shape type, tooltip
                    this.prepareElementImage($element, mergeConf);
                    this.prepareElementText($element, mergeConf);
                    this.prepareElementShapeType($element, mergeConf);

                    // Add tooltip if display mode is grid
                    if (this.options.displayMode == constants.StencilDisplayMode.grid) {
                        this.prepareElementToolTip($element, mergeConf);
                    }

                    // Prepare next element position
                    nextPos = this.getNextPosition(x, y, elIndex, mergeConf);
                    x = nextPos.x;
                    y = nextPos.y;

                }, this);

                // Set paper height according to viewport height
                var viewportHeight = gPaper.viewport.getBoundingClientRect().height;
                gPaper.setDimensions(null, viewportHeight + 7);

            }, this);

        },

        /**
         * Get element initial position
         * Depend on display mode
         */
        getInitialPosition: function() {
            switch (this.options.displayMode) {
                case constants.StencilDisplayMode.list:
                    return this.options.listConfig;
                case constants.StencilDisplayMode.grid:
                    return this.options.gridConfig;
                default:
                    return {};
            }
        },

        /**
         * Get next element x-y positon
         * Depend on display mode
         * @param {Number} x
         * @param {Number} y
         * @param {Number} elIndex
         * @param {Object} config
         * @returns {Object}
         */
        getNextPosition: function(x, y, elIndex, config) {
            switch (this.options.displayMode) {
                case constants.StencilDisplayMode.list:
                    return {
                        y: y + config.size.height + this.options.listConfig.distanceY,
                        x: this.options.listConfig.distanceX
                    };
                case constants.StencilDisplayMode.grid:
                    if (elIndex % 2 == 0) {
                        return {
                            y: y,
                            x: x + config.size.width + this.options.gridConfig.distanceX
                        };
                    } else {
                        return {
                            y: y + config.size.height + this.options.gridConfig.distanceY,
                            x: this.options.gridConfig.startX
                        };
                    }
                default:
                    return {};
            }
        },

        /**
         * Create SVG element
         * @param {String} name
         * @param {Object} attr
         */
        createSvg: function(name, attr) {
            var svgElement = document.createElementNS("http://www.w3.org/2000/svg", name);
            $.each(attr, function(index, item) {
                if (item.ns) {
                    svgElement.setAttributeNS(item.ns, item.name, item.value);
                } else {
                    svgElement.setAttribute(item.name, item.value);
                }
            });
            return svgElement;
        },

        /**
         * Prepare element image
         * @param {String} $element
         * @param {Object} config
         */
        prepareElementImage: function($element, config) {
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
        },

        /**
         * Prepare element text
         * @param {String} $element
         * @param {Object} config
         */
        prepareElementText: function($element, config) {
            var text = $('text', $element);
            switch (this.options.displayMode) {
                case constants.StencilDisplayMode.list:
                    text.attr('transform', 'translate(50,10)');
                    return;
                case constants.StencilDisplayMode.grid:
                    text.hide();
                    return;
            }
        },

        /**
         * Prepare element shape type
         * @param {Object} $element
         * @param {Object} config
         */
        prepareElementShapeType: function($element, config) {
            if (config.shapeType == 'circle') {
                var rect = $('rect', $element);
                rect.attr('rx', rect.attr('width'));
            }
        },

        /**
         * Prepare element tool tip
         * @param {Object} $element
         * @param {Object} config
         */
        prepareElementToolTip: function($element, config) {
            var timerId;
            $element.on({
                mouseenter: function(event) {
                    var target = $(event.target),
                        targetOffset = target.offset(),
                        top = targetOffset.top + 2;
                    timerId = setTimeout(function() {
                        $('body').append($('<div>', {
                            class: 'stencil-tooltip text-primary',
                            text: $element.find('text').text(),
                            css: {
                                top: top + 'px'
                            }
                        }));
                    }, 500);
                },
                mouseleave: function(event) {
                    $('.stencil-tooltip').remove();
                    clearTimeout(timerId);
                }
            });
        },

        /**
         * Get group graph by name
         * @param {String} group
         * @returns {Object}
         */
        getGraph: function(group) {
            return this.graphs[group || ""]
        },

        /**
         * Get group paper by name
         * @param {String} group
         * @returns {Object}
         */
        getPaper: function(group) {
            return this.papers[group || ""]
        },

        /**
         * On drag start event
         * @param {Object} cellView
         * @param {Object} evt
         */
        onDragStart: function(cellView, evt) {
            this.$el.addClass("dragging");
            this._paperDrag.$el.addClass("dragging");

            $(document.body).append(this._paperDrag.$el);

            this._clone = cellView.model.clone();
            this._cloneBbox = cellView.getBBox();

            var cellConfig = this._clone.get('oldConf'),
                cellSize = this._clone.get('size');

            this._clone.set('position', { x: 1, y: 1 });

            this._graphDrag.addCell(this._clone);

            var $element = this._paperDrag.findViewByModel(this._clone).$el;
            $element.off('mouseenter');
            this.prepareElementImage($element, cellConfig);
            this.prepareElementText($element, cellConfig);
            this.prepareElementShapeType($element, cellConfig);

            // Set paper drag dimensions according to cell size
            var width = cellSize.width + 2, height = cellSize.height + 2;
            this._paperDrag.setDimensions(width, height);
            this._paperDrag.$el.css({
                width: width + 'px',
                height: height + 'px'
            });

            this.movePaperDrag(evt);
        },

        /**
         * Move paper drag
         * Using cursor position from event
         * @param {Object} evt
         */
        movePaperDrag: function(evt) {
            this._paperDrag.$el.offset({
                left: evt.clientX - 10,
                top: evt.clientY - 10
            });
        },

        /**
         * On drag event
         * @param {Object} evt
         */
        onDrag: function(evt) {
            evt = joint.util.normalizeEvent(evt);

            if (this._clone) {
                var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

                this.movePaperDrag(evt);
            }
        },

        /**
         * On drag end event
         * @param {Object} evt
         */
        onDragEnd: function(evt) {
            evt = joint.util.normalizeEvent(evt);

            if (this._clone && this._cloneBbox) {
                this.drop(evt, this._clone.clone(), this._cloneBbox);
                this.$el.append(this._paperDrag.$el);
                this.$el.removeClass("dragging");
                this._paperDrag.$el.removeClass("dragging");
                this._clone.remove();
                this._clone = undefined
            }
        },

        /**
         * Drop element to canvas
         * @param {Object} evt
         * @param {Object} cell
         * @param {Object} cellViewBBox
         */
        drop: function(evt, cell, cellViewBBox) {
            var paper = this.options.paper;
            var graph = this.options.graph;
            var paperPosition = paper.$el.offset();
            var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
            var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;

            var paperArea = g.rect(
                paperPosition.left + parseInt(paper.$el.css("border-left-width"), 10) - scrollLeft,
                paperPosition.top + parseInt(paper.$el.css("border-top-width"), 10) - scrollTop,
                paper.$el.innerWidth(), paper.$el.innerHeight()
            );

            var p = paper.svg.createSVGPoint();
            p.x = evt.clientX;
            p.y = evt.clientY;

            if ( paperArea.containsPoint(p) ) {
                var fakeRect = V("rect", {
                    width: paper.options.width,
                    height: paper.options.height,
                    x: 0,
                    y: 0,
                    opacity: 0
                });
                V(paper.svg).prepend(fakeRect);

                var paperOffset = $(paper.svg).offset();
                fakeRect.remove();
                p.x += scrollLeft - paperOffset.left;
                p.y += scrollTop - paperOffset.top;

                var pointTransformed = p.matrixTransform(paper.viewport.getCTM().inverse());
                var cellBBox = cell.getBBox();

                pointTransformed.x += cellBBox.x - cellViewBBox.width / 2;
                pointTransformed.y += cellBBox.y - cellViewBBox.height / 2;

                cell.set("position", {
                    x: g.snapToGrid(pointTransformed.x, paper.options.gridSize),
                    y: g.snapToGrid(pointTransformed.y, paper.options.gridSize)
                });
                cell.unset("z");

                var mergedConf = cell.get("oldConf");
                mergedConf["x"] = cell.get("position").x;
                mergedConf["y"] = cell.get("position").y;

                observe.trigger("elements_endDrop", mergedConf, evt);
            }
        },

        /**
         * Filter
         * @param keyword
         * @param cellAttributesMap
         */
        filter: function(keyword, cellAttributesMap) {
            var lowerCaseOnly = keyword.toLowerCase() == keyword;
            var match = _.reduce(this.papers, function(wasMatch, paper, group) {
                var matchedCells = paper.model.get("cells").filter(function(cell) {
                    var cellView = paper.findViewByModel(cell);
                    var cellMatch = !keyword || _.some(cellAttributesMap, function(paths, type) {
                            if (type != "*" && cell.get("type") != type) {
                                return false
                            }
                            var attributeMatch = _.some(paths, function(path) {
                                var value = joint.util.getByPath(cell.attributes, path, "/");
                                if (_.isUndefined(value) || _.isNull(value)) {
                                    return false
                                }
                                value = value.toString();
                                if (lowerCaseOnly) {
                                    value = value.toLowerCase()
                                }
                                return value.indexOf(keyword) >= 0
                            });
                            return attributeMatch
                        });
                    V(cellView.el).toggleClass("unmatched", !cellMatch);
                    return cellMatch
                }, this);
                var isMatch = !_.isEmpty(matchedCells);
                var filteredGraph = (new joint.dia.Graph).resetCells(matchedCells);
                this.trigger("filter", filteredGraph, group);
                if (this.$groups[group]) {
                    this.$groups[group].toggleClass("unmatched", !isMatch)
                }
                paper.fitToContent(1, 1, this.options.paperPadding || 10);
                return wasMatch || isMatch
            }, false, this);
            this.$el.toggleClass("not-found", !match)
        },

        /**
         * On search event
         * @param {Object} evt
         */
        onSearch: function(evt) {
            console.log("onSearch");
            //this.filter(evt.target.value, this.options.search)
        },

        /**
         * On group label click event
         * @param {Object} event
         */
        onGroupLabelClick: function(event) {
            var group = $(event.target).parent().data('name');
            this.toggleGroup(group);
        },

        /**
         * Toggle (close or open) group by name
         * @param {String} name
         */
        toggleGroup: function(name) {
            this.$('.group[data-name="' + name + '"]').toggleClass("closed");
        },

        /**
         * Close group by name
         * @param {String} name
         */
        closeGroup: function(name) {
            this.$('.group[data-name="' + name + '"]').addClass("closed");
        },

        /**
         * Open group by name
         * @param {String} name
         */
        openGroup: function(name) {
            this.$('.group[data-name="' + name + '"]').removeClass("closed");
        },

        /**
         * Close groups
         */
        closeGroups: function() {
            this.$(".group").addClass("closed")
        },

        /**
         * Open groups
         */
        openGroups: function() {
            this.$(".group").removeClass("closed")
        },

        /**
         * Remove stencil
         */
        remove: function() {
            Backbone.View.prototype.remove.apply(this, arguments);
            $(document.body).off(".stencil", this.onDrag).off(".stencil", this.onDragEnd)
        },

        /**
         * Read and save stencil config
         */
        readConf: function() {
            this.conf = JSON.parse(stencilConf);
        },

        /**
         * Add demo group for testing purpose
         */
        addDemoGroups: function() {
            var i = 0, item;

            var group1 = {
                "group": "testGroup1",
                "caption": "Test group 1",
                "collapsed": true,
                "visible": true,
                "index": 2,
                "items": []
            };
            for (i = 0; i < 10; ++i) {
                item = _.clone(constants.StencilConfig);
                item.caption = 'Item 1-' + i;
                group1.items.push(item);
            }

            var group2 = {
                "group": "testGroup2",
                "caption": "Test group 2",
                "collapsed": true,
                "visible": true,
                "index": 3,
                "items": []
            };
            for (i = 0; i < 20; ++i) {
                item = _.clone(constants.StencilConfig);
                item.caption = 'Item 2-' + i;
                group2.items.push(item);
            }

            var group3 = {
                "group": "testGroup3",
                "caption": "Test group 3",
                "collapsed": true,
                "visible": true,
                "index": 4,
                "items": []
            };
            for (i = 0; i < 30; ++i) {
                item = _.clone(constants.StencilConfig);
                item.caption = 'Item 3-' + i;
                group3.items.push(item);
            }

            this.conf.push(group1);
            this.conf.push(group2);
            this.conf.push(group3);
        }

    });
});


























