


joint.shapes.wtel = { };


/**
 * TODO
 *      - описати спільні класи для елементів
 */
joint.shapes.wtel.Common = joint.dia.Element.extend({
    defaults: joint.util.deepSupplement({
        type: 'wtel.Common',
        size: {
            width: 1,
            height: 1
        },
        attrs: {
            '.': {
                fill: '#FFFFFF'
            }
        }
    }, joint.dia.Element.prototype.defaults)
});

joint.shapes.wtel.IF_START = joint.shapes.wtel.Common.extend({
    markup: '<g>' +
                '<path id="if_start" d="M25,0 L50,25 L25,50 L0,25 L25,0 Z"/>' +
                '<text class="if_start_label">IF_START</text>' +
            '</g>' +
            '<g>'  +
                '<rect class="falseOutPort" rx="5" ry="5"/>'      +
                '<text class="if_start_false_label">false</text>' +
            '</g>' +
            '<g>'  +
                '<rect class="trueOutPort" rx="5" ry="5"/>'     +
                '<text class="if_start_true_label">true</text>' +
            '</g>'
    ,
    defaults: joint.util.deepSupplement({
        type: 'wtel.IF_START',
        size: {
            width: 50,
            height: 50
        },
        attrs: {
            "#if_start": {
                stroke: "black",
                "stroke-width": 2,
                fill: "white"
            },

            ".if_start_label": {
                ref: "#if_start",
                "ref-x": 8,
                "ref-y": 27,
                stroke: "black",
                "font-size": 7
            },
            ".if_start_false_label": {
                fill: "red",
                "stroke-width": 1,
                "font-size": 10,
                ref: "#if_start",
                "ref-x": -16,
                "ref-y": 15
            },
            ".if_start_true_label": {
                fill: "green",
                "stroke-width": 1,
                "font-size": 10,
                ref: "#if_start",
                "ref-x": 42,
                "ref-y": 15
            },
            ".falseOutPort": {
                stroke: "black",
                "stroke-width": 2,
                width: 6,
                height: 6,
                ref: "#if_start",
                "ref-x": -1,
                "ref-y": 22,
                magnet: true,
                port: {
                    "id": joint.util.uuid()
                }
            },
            ".trueOutPort": {
                stroke: "black",
                "stroke-width": 2,
                width: 6,
                height: 6,
                ref: "#if_start",
                "ref-x": 45,
                "ref-y": 22,
                magnet: true,
                port: {
                    "id": joint.util.uuid()
                }
            }
        }
    }, joint.shapes.wtel.Common.prototype.defaults)
});

joint.shapes.wtel.IF_END = joint.shapes.wtel.Common.extend({
    markup: '<g>' +
                '<path id="if_end" d="M25,0 L50,25 L25,50 L0,25 L25,0 Z"/>' +
                '<text class="if_end_label">IF_END</text>' +
            '</g>' +
            '<g>'  +
                '<rect class="falseOutPort" rx="5" ry="5"/>'      +
                '<text class="if_end_false_label">false</text>' +
            '</g>' +
            '<g>'  +
                '<rect class="trueOutPort" rx="5" ry="5"/>'     +
                '<text class="if_end_true_label">true</text>' +
            '</g>'
    ,
    defaults: joint.util.deepSupplement({
        type: 'wtel.IF_END',
        size: {
            width: 50,
            height: 50
        },
        attrs: {
            "#if_end": {
                stroke: "black",
                "stroke-width": 2,
                fill: "white"
            },
            ".if_end_label": {
                ref: "#if_end",
                "ref-x": 12,
                "ref-y": 27,
                stroke: "black",
                "font-size": 7
            },
            ".if_end_false_label": {
                fill: "red",
                "stroke-width": 1,
                "font-size": 10,
                ref: "#if_end",
                "ref-x": -16,
                "ref-y": 15
            },
            ".if_end_true_label": {
                fill: "green",
                "stroke-width": 1,
                "font-size": 10,
                ref: "#if_end",
                "ref-x": 42,
                "ref-y": 15
            },
            ".falseOutPort": {
                stroke: "black",
                "stroke-width": 2,
                width: 6,
                height: 6,
                ref: "#if_end",
                "ref-x": -1,
                "ref-y": 22,
                magnet: true,
                port: {
                    "id": joint.util.uuid()
                }
            },
            ".trueOutPort": {
                stroke: "black",
                "stroke-width": 2,
                width: 6,
                height: 6,
                ref: "#if_end",
                "ref-x": 45,
                "ref-y": 22,
                magnet: true,
                port: {
                    "id": joint.util.uuid()
                }
            }
        }
    }, joint.shapes.wtel.Common.prototype.defaults)
});

joint.shapes.wtel.answer = joint.shapes.wtel.Common.extend({
    markup: '<g>'                     +
                '<rect/>'             +
                '<text>answer</text>' +
            '</g>',

    defaults: joint.util.deepSupplement({
        type: 'wtel.answer',
        size: {
            width: 60,
            height: 40
        },
        attrs: {
            rect: {
                fill: '#FFFFFF',
                stroke: 'black',
                width: 60,
                height: 40
            },
            text: {
                fill: "black",
                "stroke-width": 1,
                "font-size": 10,
                ref: "rect",
                "ref-x": 13,
                "ref-y": 23
            }
        }
    }, joint.shapes.wtel.Common.prototype.defaults)
});

joint.shapes.wtel.recordSession = joint.shapes.wtel.Common.extend({
    markup: '<g>'                     +
                '<rect/>'             +
                '<text>recSes</text>' +
            '</g>',

    defaults: joint.util.deepSupplement({
        type: 'wtel.recordSession',
        size: {
            width: 60,
            height: 40
        },
        attrs: {
            rect: {
                fill: '#FFFFFF',
                stroke: 'black',
                width: 60,
                height: 40
            },
            text: {
                fill: "black",
                "stroke-width": 1,
                "font-size": 10,
                ref: "rect",
                "ref-x": 13,
                "ref-y": 23
            }
        }
    }, joint.shapes.wtel.Common.prototype.defaults)
});

joint.shapes.wtel.default = joint.shapes.wtel.Common.extend({
    markup: '<g>'                     +
                '<rect/>'             +
                '<text>default</text>'+
            '</g>',

    defaults: joint.util.deepSupplement({
        type: 'wtel.default',
        size: {
            width: 60,
            height: 40
        },
        attrs: {
            rect: {
                fill: '#FFFFFF',
                stroke: 'black',
                width: 60,
                height: 40
            },
            text: {
                fill: "black",
                "stroke-width": 1,
                "font-size": 10,
                ref: "rect",
                "ref-x": 13,
                "ref-y": 23
            }
        }
    }, joint.shapes.wtel.Common.prototype.defaults)
});

joint.shapes.wtel.basic_p = joint.shapes.wtel.Common.extend({
    markup: '<g>'                     +
                '<rect/>'             +
            '</g>',

    defaults: joint.util.deepSupplement({
        type: 'wtel.default',
        size: {
            width: 5,
            height: 5
        },
        attrs: {
            rect: {
                fill: '#FFFFFF',
                stroke: 'black',
                width: 5,
                height: 5
            }
        }
    }, joint.shapes.wtel.Common.prototype.defaults)
});































