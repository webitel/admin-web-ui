/**
 * Будує схему по JSON, який не був модифікваний дизайнером
 *
 *
 *
 * ISSUES:
 *  - allocation vertexes around the levels, so all curves have the same direction
 *  - selection order of vertexes, that minimize count of cross curves
 *  - determining coordinates of vertexes for minimize overall length of curves and the number of bends
 *
 * EVENTS:
 *      subscribe
 *          - buildSchema
 *      trigger
 *          -
 *
 * АЛГОРТМ:
 *  1. Проходження по всіх елементах, розрахунок для if vertex_p
 *      Чому ? При зсуві легше поміняти лише головні точки, ніж сунути всі вкладені елементи
 *  2. Наступне проходження для обрахунку позицій елементів, лінків і т.п.
 *  3. Проходження з візуальною побудовою
 *
 * Важливі моменти:
 *  - схема будується зверху вниз, по центру канваса
 *  - канвас умовно розділяється на дві площини, ліву і праву, тобто
 *
 */


/**
 * TODO: FOR HOME
 *  - подивитися для яких точок краще визначати чи вони входять в площу
 *
 */


//  TODO: remove canvas from dependencies
define("buildSchema", ["observe", "canvas"], function(observe, canvas) {

    //  TODO: константи розмірів елементів можна винести в загальні константи
    var
        CONSTANTS = {
            def_el_size: {
                width : 40,
                height: 40
            },
            def_if_size: {
                width : 50,
                height: 50
            },
            def_margin_top: 40,
            def_margin_left_right: 40
        };

    function BuildSchema() {


        //  TODO: remove it
        return;

        var
            canvas_info = this.getCanvasInfo(),
            canvas_c = canvas_info.center_p,
            canvas_h = canvas_info.height,
            canvas_w = canvas_info.width;

        //  TODO: що буде якщо розміри канвасу будуть змінюватися динамічно
        //  змінні, які визначають область де можуть розміщуватися елементи
        this.left_area = {
            "top_left": {
                x: 0,
                y: 0
            },
            "top_right": {
                x: canvas_c.x - 100,
                y: 0
            },
            "bottom_left": {
                x: 0,
                y: canvas_h
            },
            "bottom_right": {
                x: canvas_c.x - 100,
                y: canvas_h
            }
        };
        this.right_area = {
            "top_left": {
                x: canvas_c + 100,
                y: 0
            },
            "top_right": {
                x: canvas_w,
                y: 0
            },
            "bottom_left": {
                x: canvas_c + 100,
                y: canvas_h
            },
            "bottom_right": {
                x: canvas_w,
                y: canvas_h
            }
        };

        observe.on("buildSchema", this.buildSchemaHandler, this);
    }

    //  обробник івента. На вхід приймає тільки масив обєктів
    BuildSchema.prototype.buildSchemaHandler = function(data) {
        var
            i;

        if (  Object.prototype.toString.call( data ) !== "[object Array]" ) {
            return;
        }

        if ( data.length < 1 ) {
            return;
        }


        //  головна точка першого рівня з якої починається вся побудова. Динамічно змінюється
        this["basic_p"] = {
            x: this.getCanvasInfo().center_p.x,
            y: 0
        };


        //  КРОК 1. Визначення всіх точок vertex
        console.group("Step 1. DefineVertexes");
        console.time("Execution time");

        for ( i = 0; i < data.length; i++ ) {
            this.defineVertexes(data[i]);
        }
        console.timeEnd("Execution time");
        console.groupEnd();

        debugger;
        //  2. Визначення позицій і центрів елементів відносно точок vertex

        //  КРОК 3. Рендеринг

    };



    /**
                                                        КРОК 1

        Головна задача - це вирахувати всі vertex, враховуючи можливі зміщення і відступ від центру
        Всі прості елементи ми просто проскакуєм зміщаючи basic_p
     */

    /**
     * +++
     * Основна рекурсивна функція
     */
    BuildSchema.prototype.defineVertexes = function(node) {
        var
            i,
            nodeType = this.getElType(node),
            basic_p = node.basic_p || this.basic_p;


        if ( !nodeType ) {
            console.error("Can not identify the type of element");
            return;
        }



        if ( nodeType === "if" ) {
            console.groupCollapsed(nodeType);

            this.setDefTopVertexes(node, basic_p);                  //  оприділити дефолтні vertex для елемента
            this.setVertexesBasic_p(node);                          //  опридіити початкові точки для кожної гілки

            //  TODO: remove it
            this.drawPoint(node.vertexes.right.top, "red");
            this.drawPoint(node.vertexes.left.top, "red");


            //
            //                              Опрацювання гілки true
            //
            if ( node.if.then && node.if.then.length > 0 ) {

                //
                if ( !node.hasOwnProperty("parent") ) {
                    node["area"] = this.right_area;
                }

                for ( i = 0; i < node.if.then.length; i++ ) {
                    node.if.then[i].basic_p = node.vertexes_basic_p.right;          //  передати початкову точку
                    node.if.then[i].parent = node;                                  //  передати силку на батька

                    this.defineVertexes(node.if.then[i]);
                }
            }

            //  вирахуват позицію нижнього vertex
            node.vertexes.right.bottom.x = node.vertexes.right.top.x;
            node.vertexes.right.bottom.y = node.vertexes_basic_p.right.y + CONSTANTS.def_margin_top;

            //  вирахувати висоту гілки
            node.vertexes.right.height = node.vertexes.right.bottom.y - node.vertexes.right.top.y;



            //
            //                              Опрацювання гілки false
            //
            if ( node.if.else && node.if.else.length > 0 ) {

                if ( !node.hasOwnProperty("parent") ) {
                    node["area"] = this.left_area;
                }

                for ( i = 0; i < node.if.else.length; i++ ) {
                    node.if.else[i].basic_p = node.vertexes_basic_p.left;          //  передати початкову точку
                    node.if.else[i].parent = node;                                  //  передати силку на батька

                    this.defineVertexes(node.if.else[i]);
                }
            }

            //  вирахуват позицію нижнього vertex
            node.vertexes.left.bottom.x = node.vertexes.left.top.x;
            node.vertexes.left.bottom.y = node.vertexes_basic_p.left.y + CONSTANTS.def_margin_top;

            //  вирахувати висоту гілки
            node.vertexes.left.height = node.vertexes.left.bottom.y - node.vertexes.left.top.y;


            //
            //                              Додаткові дії після всіх проходжень
            //

            //  Зміщення basic_p спочатку на один елемент, потім на висоту найвищого блоку
            this.moveBasic_p(basic_p);

            node.vertexes.right.height > node.vertexes.left.height
                ? this.moveBasic_pByBlock(basic_p, node.vertexes.right.height)
                : this.moveBasic_pByBlock(basic_p, node.vertexes.left.height)
            ;


            //  вирівнювання vertex між собою
            node.vertexes.right.bottom.y >= node.vertexes.left.bottom.y
                ? node.vertexes.left.bottom.y = node.vertexes.right.bottom.y
                : node.vertexes.right.bottom.y = node.vertexes.left.bottom.y
            ;



            //  TODO: remove it
            //  відмалювати нижні vertex
            this.drawPoint(node.vertexes.right.bottom, "red");
            this.drawPoint(node.vertexes.left.bottom, "red");


            console.groupEnd();
        }
        else if ( nodeType === "switch" ) { }
        else {
            console.log(nodeType);
            this.moveBasic_p(basic_p);
            //  TODO: remove it
            this.drawPoint(basic_p);
        }


    };

    /**
     * +++
     * Сетить для вузла значення верхніх vertex з дефолтною позицією
     * Вираховується відносно basic_p, яка в даний момент знаходиться на попередньому елементі або в нульовій точці
     */
    BuildSchema.prototype.setDefTopVertexes = function(node, basic_p) {
        var
            imaginary_center_p = {
                x: basic_p.x,
                y: basic_p.y + CONSTANTS.def_margin_top + CONSTANTS.def_if_size.height / 2
            };

        //  TODO: remove it
        this.drawPoint(imaginary_center_p);

        node.vertexes = {
            right: {
                top: {
                    x: imaginary_center_p.x + CONSTANTS.def_margin_left_right + CONSTANTS.def_el_size.width / 2,
                    y: imaginary_center_p.y
                },
                bottom: {
                    x: null,
                    y: null
                },
                height: null,
                width: null
            },
            left: {
                top: {
                    x: imaginary_center_p.x - CONSTANTS.def_margin_left_right - CONSTANTS.def_el_size.width / 2,
                    y: imaginary_center_p.y
                },
                bottom: {
                    x: null,
                    y: null
                },
                height: null,
                width: null
            }
        };

    };

    /**
     * +++
     * Сетить значення basic_p для лівої і правої гілки
     */
    BuildSchema.prototype.setVertexesBasic_p = function(node) {
        node.vertexes_basic_p = {
            right: _.clone(node.vertexes.right.top),
            left: _.clone(node.vertexes.left.top)
        }
    };

    /**
     * Перевіряє чи потрібно зміщувати даний вузол
     */
    BuildSchema.prototype.checkOffSet = function(node) {
        debugger;
    };






    /**
                                                ТЕСТОВІ ФУНКЦІЇ

        Головна задача - це вирахувати всі vertex, враховуючи можливі зміщення і відступ від центру
        Всі прості елементи ми просто проскакуєм зміщаючи basic_p
     */

    //  для відмальовування позицій basic_p
    BuildSchema.prototype.drawPoint = function(point, color) {

        var
            shape = new joint.shapes.wtel.basic_p({
                position: point
            });

        if ( color ) {
            shape.attr("rect", {fill: color});
        }

        canvas.graph.addCell(shape);
    };


    //  TODO: змістити початкову точку відносно дефолтного відступу і розміру фігури
    //  методи зміщення початкової точки
    BuildSchema.prototype.moveBasic_p = function(point) {
        point.y += 40 + 40;
    };
    BuildSchema.prototype.moveBasic_pByBlock = function(point, blockHeight) {
        point.y += blockHeight;
    };





    /**
                                ДОПОМІЖНІ ФУНКЦІЇ РОЗРАХУНКУ КООРДИНАТ ДЕЯКИХ ТОЧОК
     */

    //  Вираховує і повертає обєкт з додатковою інфою про канвас
    BuildSchema.prototype.getCanvasInfo = function() {
        //  TODO: це не самий кращий спосіб визначити ширину елемента через його ID
        var
            svgW = $("#cfd-canvas-container svg").width(),
            svgH = $("#cfd-canvas-container svg").height();

        return {
            center_p: {
                x: Math.round(svgW / 2),
                y: Math.round(svgH / 2)
            },
            height: svgH,
            width: svgW
        };
    };

    //  перевіряє чи елемент має певну властивість, по якій він визначає тип елемента
    BuildSchema.prototype.getElType = function(el) {
        if ( el.hasOwnProperty("answer") ) {
            return "answer";
        }
        else if ( el.hasOwnProperty("if") ) {
            return "if";
        }
    };


    //  перевіряє чи належить точка даній площині
    BuildSchema.prototype.checkPointInArea = function(point, area) {
        if (
            point.x >= area.top_left.x
                &&
            point.x <= area.top_right.x
                &&
            point.y >= area.top_left.y
                &&
            point.y <= area.bottom_left.y
        ) {
            return true;
        }

        return false;
    };




    new BuildSchema();
});




























