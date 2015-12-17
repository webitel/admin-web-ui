/**
 * Property Views
 *
 * EVENTS:
 *   triggered:
 * 	   - property_setSelectedElementLabel
 * 	   - property_setSelectedLinkLabel
 */

define("propertyViews", [
		"observe",
        "cfdElLinks",
        "text!tpl/property/start.html",
        "text!tpl/property/terminate.html",
		"text!tpl/property/answer.html",
        "text!tpl/property/hangup.html",
		"text!tpl/property/sleep.html",
		"text!tpl/property/recordSession.html",
		"text!tpl/property/setVar.html",
        "text!tpl/property/bridge.html",
        "text!tpl/property/playback.html",
		"text!tpl/link.html"
	], 
	function(
		observe,
        cfdElLinks,
        startHTML,
        terminateHTML,
		answerHTML,
        hangupHTML,
		sleepHTML,
		recordSessionHTML,
		setVarHTML,
        bridgeHTML,
        playbackHTML,
		linkHTML
	) {


	    var $propertyEl = cfdElLinks.propertyEl,
	    	currentPropView;

        // BASE PROPERTY VIEW
	    var BasePropView = Backbone.View.extend({

	        "tagName": "div",

	        "className" : "property-wrapper",

	        "events": {
                "change #text": "onChangeText"
	        },

	        initialize: function() { },

	        render: function() {
                // Apply template
                this.$el.html( this.template( this.model.toJSON() ) );

                // Render view to property container
                $propertyEl.html(this.$el);
            },

            onChangeText: function(event) {
                var text = event.target.value;

                observe.trigger(
                    "property_setSelectedElementLabel",
                    text
                );
            }
	    });

        // BASE LINK VIEW
	    var BaseLinkView = Backbone.View.extend({

	        "tagName": "div",

	        "className"  : "",

	        "events": {
                "change #text": "onChangeText"
	        },

            render: function() {
                // Apply template
                this.$el.html( this.template( this.model.toJSON() ) );

                // Render view to property container
                $propertyEl.html(this.$el);
            },

            onChangeText: function(event) {
                var text = event.target.value;

                observe.trigger(
                    "property_setSelectedLinkLabel",
                    text
                );
            }
	    });

        // START VIEW
        var StartPropView = BasePropView.extend({

            "template": _.template(startHTML),

            "events": { },

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);
            }
        });

        // TERMINATE VIEW
        var TerminatePropView = BasePropView.extend({

            "template": _.template(terminateHTML),

            "events": { },

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);
            }
        });

        // ANSWER VIEW
		var AnswerPropView = BasePropView.extend({

			"template": _.template(answerHTML),

            "events": {
                "change #status": "onChangeStatus"
            },

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);

                // Set status
                this.setStatus();
            },

			onChangeStatus: function(event) {
                var value = event.target.value;

                var itemConfig = $.extend(true, {}, this.model.get('itemConfig') );
                itemConfig.properties.status.value = value;

                this.model.set('itemConfig', itemConfig);
			},

            setStatus: function() {
                var itemConfig = this.model.get('itemConfig'),
                    status = itemConfig.properties.status.value;

                this.$('#status option').each(function() {
                    if (status == this.value) {
                        this.selected = true;
                    }
                });
            }
		});

        // HANGUP VIEW
        var HangupPropView = BasePropView.extend({

            "template": _.template(hangupHTML),

            "events": { },

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);
            }
        });

		// SLEEP VIEW
		var SleepPropView = BasePropView.extend({

			"template": _.template(sleepHTML),

			"events": {
				"change #time": "onChangeTime"
			},

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);

                this.setTime();
            },

            onChangeTime: function(event) {
                var value = event.target.value;

                var itemConfig = $.extend(true, {}, this.model.get('itemConfig') );
                itemConfig.properties.time.value = value;

                this.model.set('itemConfig', itemConfig);
			},

            setTime: function() {
                var itemConfig = this.model.get('itemConfig'),
                    time = itemConfig.properties.time.value;

                this.$('#time').val(time);
			}
		});

		// RECORD SESSION
		var RecordSessionPropView = BasePropView.extend({

			"template": _.template(recordSessionHTML),

			"events": {
				"change #record": "onChangeRecord"
			},

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);

                // Set record
                this.setRecord();
            },

            onChangeRecord: function(event) {
                var value = event.target.value;

                var itemConfig = $.extend(true, {}, this.model.get('itemConfig') );
                itemConfig.properties.record.value = value;

                this.model.set('itemConfig', itemConfig);
			},

            setRecord: function() {
                var itemConfig = this.model.get('itemConfig'),
                    record = itemConfig.properties.record.value;

                this.$('#record option').each(function() {
                    if (record == this.value) {
                        this.selected = true;
                    }
                });
			}
		});

		// SETVAR VIEW
		var SetVarPropView = BasePropView.extend({

			"template": _.template(setVarHTML),

			"events": {
                "click label.property-keyValueList-add": "onAddClick",
                "click label.property-keyValueList-remove": "onRemoveClick",
                "change input.property-keyValueList-item-key": "onKeyChange",
                "change input.property-keyValueList-item-value": "onValueChange"
			},

            itemTpl: [
                '<div class="property-keyValueList-item">',
                    '<input type="text" placeholder="key" class="form-control input-sm property-input property-keyValueList-item-key">',
                    '<input type="text" placeholder="value" class="form-control input-sm property-input property-keyValueList-item-value">',
                    '<label class="btn btn-link property-keyValueList-remove" title="Remove">x</label>',
                '</div>'
            ].join(''),

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);

                // Set variables
                this.renderVariables();
            },

            onAddClick: function() {
                this.renderItem('', '');
                this.addEmptyVariable();
            },

            onRemoveClick: function(event) {
                var item = $(event.target).parent();

                this.removeVariable(item);

                item.remove();
            },

            onKeyChange: function(event) {
                var item = $(event.target).parent();

                this.updateVariable(item);
            },

            onValueChange: function(event) {
                var item = $(event.target).parent();

                this.updateVariable(item);
            },

            renderItem: function(key, value) {
                var item = $(this.itemTpl);

                item.data('index', this.itemIndex++);
                item.find('input.property-keyValueList-item-key').val(key);
                item.find('input.property-keyValueList-item-value').val(value);

                this.$('.panel-body').append(item);
            },

            renderVariables: function() {
                var itemConfig = this.model.get('itemConfig'),
                    variables = itemConfig.properties.variables.value;

                _.each(variables, function(variable) {
                    variable = variable || '';
                    variable = variable.split('=');

                    var key = variable[0],
                        value = variable[1];

                    this.renderItem(key, value);
                }, this);
            },

            getItemIndex: function(item) {
                var itemIndex = 0;

                this.$('.panel-body .property-keyValueList-item').each(function(index, el) {
                    if (el == item[0]) {
                        itemIndex = index;
                    }
                });

                return itemIndex;
            },

            addEmptyVariable: function() {
                var itemConfig = $.extend(true, {}, this.model.get('itemConfig'));
                itemConfig.properties.variables.value.push('=');

                this.model.set('itemConfig', itemConfig);
            },

            updateVariable: function(item) {
                var index = this.getItemIndex(item),
                    key = item.find('input.property-keyValueList-item-key').val(),
                    value = item.find('input.property-keyValueList-item-value').val();

                var itemConfig = $.extend(true, {}, this.model.get('itemConfig'));
                itemConfig.properties.variables.value[index] = key + '=' + value;

                this.model.set('itemConfig', itemConfig);
            },

            removeVariable: function(item) {
                var index = this.getItemIndex(item);

                var itemConfig = $.extend(true, {}, this.model.get('itemConfig'));
                itemConfig.properties.variables.value.splice(index, 1);

                this.model.set('itemConfig', itemConfig);
            }

		});

        // BRIDGE VIEW
        var BridgePropView = BasePropView.extend({

            "template": _.template(bridgeHTML),

            "events": { },

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);
            }
        });

        // PLAYBACK VIEW
        var PlaybackPropView = BasePropView.extend({

            "template": _.template(playbackHTML),

            "events": { },

            initialize: function() {
                // Add base events
                _.extend(this.events, BasePropView.prototype.events);
            },

            render: function() {
                // Call base render
                BasePropView.prototype.render.apply(this, arguments);
            }
        });

        // LINK VIEW
		var LinkView = BaseLinkView.extend({

			"template": _.template(linkHTML),

			"events": { },

            initialize: function() {
                // Add base events
                _.extend(this.events, BaseLinkView.prototype.events);
            },

            render: function() {
                // Call base render
                BaseLinkView.prototype.render.apply(this, arguments);

                // Set text
                this.setText();
            },

            setText: function() {
                var labels = this.model.get('labels'),
                    text = '';

                _.each(labels, function(label) {
                    text += label.attrs.text.text;
                });

                this.$('#text').val(text);
            }

		});

		// Create view
	    function createView(type, model) {

            // Remove current view
            removeCurrentView();

            if (type == 'paper') {
                return;
            } else if (type == 'link') {
                currentPropView = new LinkView({ model: model });
                currentPropView.render();
                return;
            }

            var itemType = model.get('itemType');

			switch(itemType) {
				case 'start':
                    currentPropView = new StartPropView({ model: model });
					break;

                case 'terminate':
                    currentPropView = new TerminatePropView({ model: model });
                    break;

				case 'answer':
					currentPropView = new AnswerPropView({ model: model });
					break;

                case "hangup":
                    currentPropView = new HangupPropView({ model: model });
                    break;

				case 'sleep':
					currentPropView = new SleepPropView({ model: model });
					break;

				case "recordSession":
					currentPropView = new RecordSessionPropView({ model: model });
					break;

				case "setVar":
					currentPropView = new SetVarPropView({ model: model });
					break;

                case "bridge":
                    currentPropView = new BridgePropView({ model: model });
                    break;

                case "playback":
                    currentPropView = new PlaybackPropView({ model: model });
                    break;
            }

            if (currentPropView) {
                currentPropView.render();
            }
	    }

        // Remove current view
        function removeCurrentView() {
            if (currentPropView && currentPropView.render) {
                currentPropView.remove();
                currentPropView = null;
            }
        }

	    return {
	    	createView: createView,
            removeCurrentView: removeCurrentView
	    }

});