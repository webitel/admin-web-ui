

define("constants", [], function() {

    var shapeType = {
        rect: "rect",
        circle: "circle"
    };

    //  перелік всіх елементів
    //  для чого він ???
    var elType = {
        default: "default",
        start: "start",
        terminate: "terminate",
        answer: "answer",
        setVar: "setVar",
        recordSession: "recordSession",
        bridge: "bridge",
        sleep: "sleep"
    };

    //  цей конфіг мержиться з конфігом кожного елемента який добавляється на stencil
    var stencilConfig =  {
        "elType": elType.default,
        "shapeType": shapeType.rect,
        "caption": "Default",
        "text": "default",
        "description": "Default description",
        "imgUrl": "/cfd/img/element/default.png",
        "visible": true,
        "index": 0,
        "size": {
            "width": 40,
            "height": 40
        },
        "attr": {
            "rect": {
                "fill": "#f5f5f5",
                "stroke": "gray",
                "stroke-width": 2
            },
            "text": {
                "fill": "black"
            }
        },
        "properties": { },
        "addition": { }
    };






    //  конфіг для відображення кожного із елементів
    var webitelElDefConf = {
        "setVar": {
            "elType": "setVar",
            "shapeType": "rect",
            "caption": "setVar",
            "text": "setVar",
            "description": "",
            "imgUrl": "/cfd/img/element/setVar.png",
            "size": {
                "width": 40,
                "height": 40
            },
            "attr": {
                "rect": {
                    "fill": "#f5f5f5",
                    "stroke": "gray",
                    "stroke-width": 2
                },
                "text": {
                    "fill": "black"
                }
            },
            "properties": { },
            "addition": { }
        },
        "answer": {
            "elType": "answer",
            "shapeType": "rect",
            "caption": "answer",
            "text": "answer",
            "description": "",
            "imgUrl": "/cfd/img/element/answer.png",
            "size": {
                "width": 40,
                "height": 40
            },
            "attr": {
                "rect": {
                    "fill": "#f5f5f5",
                    "stroke": "gray",
                    "stroke-width": 2
                },
                "text": {
                    "fill": "black"
                }
            },
            "properties": { },
            "addition": { }
        },
        "recordSession": {
            "elType": "recordSession",
            "shapeType": "rect",
            "caption": "recordSession",
            "text": "recordSession",
            "description": "",
            "imgUrl": "/cfd/img/element/recordSession.png",
            "size": {
                "width": 40,
                "height": 40
            },
            "attr": {
                "rect": {
                    "fill": "#f5f5f5",
                    "stroke": "gray",
                    "stroke-width": 2
                },
                "text": {
                    "fill": "black"
                }
            },
            "properties": { },
            "addition": { }
        },
        "bridge": {
            "elType": "bridge",
            "shapeType": "rect",
            "caption": "bridge",
            "text": "bridge",
            "description": "",
            "imgUrl": "/cfd/img/element/bridge.png",
            "size": {
                "width": 40,
                "height": 40
            },
            "attr": {
                "rect": {
                    "fill": "#f5f5f5",
                    "stroke": "gray",
                    "stroke-width": 2
                },
                "text": {
                    "fill": "black"
                }
            },
            "properties": { },
            "addition": { }
        },
        "playback": {
            "elType": "playback",
            "shapeType": "rect",
            "caption": "playback",
            "text": "playback",
            "description": "",
            "imgUrl": "/cfd/img/element/default.png",
            "size": {
                "width": 40,
                "height": 40
            },
            "attr": {
                "rect": {
                    "fill": "#f5f5f5",
                    "stroke": "gray",
                    "stroke-width": 2
                },
                "text": {
                    "fill": "black"
                }
            },
            "properties": { },
            "addition": { }
        },
        "if": {
            "elType": "if",
            "shapeType": "rect",
            "caption": "if",
            "text": "if",
            "description": "",
            "imgUrl": "/cfd/img/element/default.png",
            "size": {
                "width": 40,
                "height": 40
            },
            "attr": {
                "rect": {
                    "fill": "#f5f5f5",
                    "stroke": "gray",
                    "stroke-width": 2
                },
                "text": {
                    "fill": "black"
                }
            },
            "properties": { },
            "addition": { }
        }
    };

    var stencilDisplayMode = {
        list: 'list',
        grid: 'grid'
    };

    return {
        WebitelElDefConf: webitelElDefConf,
        ShapeType: shapeType,
        ElType: elType,
        StencilConfig: stencilConfig,
        StencilDisplayMode: stencilDisplayMode
    }

});