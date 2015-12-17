/**
 * Допоміжний модуль, для побудови схеми в дизайнері по вебітел конфігу
 *
 * used:
 *      - https://github.com/nervgh/recursive-iterator
 */

define("buildSchemaTools", ["observe"], function(observe) {

    var
        _recursiveIterator = {
            "MAX_DEPTH": 100,                           //  максивальна глибина вкладення. Починається з 0
            "getKeys"  : Object.keys,                   //  повертає масив властивостей обєкта першого(0) рівня, не включаючи прототипа
            "isNaN"    : window.isNaN                   //  Not-a-Number
        },
        bst = { };

    _recursiveIterator.traverse = function(object, callback, context, mode, ignoreCircularReferences, maxDepth) {
        var cb = callback;
        var ctx = context;
        var _mode = mode === 1;                     //  як потрібно проходитися по дереу, по вертикалі чи по горизонталі
        var ignore = !!ignoreCircularReferences;    //  якщо будь-яка із властивостей буде силатися на сам обєкт, тоді получається замкнутісь. Можна генерувати помилку, або пропускати цей крок
        var max = this.isNumber(maxDepth) ? maxDepth : this.MAX_DEPTH;

        return this.walk(object, cb, ctx, _mode, ignore, max);
    };
    _recursiveIterator.isObject = function(any) {
        return any instanceof Object;
    };
    _recursiveIterator.isNumber = function(any) {
        return typeof any === 'number' && !this.isNaN(any);
    };
    _recursiveIterator.walk = function(object, cb, ctx, mode, ignore, max) {


        //
        //  STACK -
        //
        //  оголошується початкове значення стеку, для стартового занурення в обєкт. Далі в циклі він динамічно буде змінюватися
        //  перший аргумент, чисто для додаткової інформації
        //  другий - також
        //  третій і четверти - це основа, по якій все відбувається
        var stack = [[], 0, this.getKeys(object).sort(), object];
        var cache = [];                                                     //  ???

        do {
            //  вузол, поточний обєкт
            var node = stack.pop();         //  витягує з стека останнє значення. Переданий обєкт
            var keys = stack.pop();         //  ключі переданого обєкта
            var depth = stack.pop();        //  глибина
            var path = stack.pop();         //  тут походу буде зберігатися шлях до властивості. Спочатку це пустий масив

            cache.push(node);               //  зберігає силку на поточний обєкт по якому проходиться

            //  поки ключі відомі, доти шарити по обєкту
            while(keys[0]) {
                var key = keys.shift();     //  вирізати перший ключ
                var value = node[key];      //  витягнути значення з обєкта по першому ключю
                var way = path.concat(key); //  поточний шлях

                //  в залежності, що поверне моя функція callback, буде видно подальший напрямок
                var strategy ;//= cb.call(ctx, node, value, key, way, depth);

                //  якщо функція верне true, перейти до наступного кроку
                if ( strategy === true ) {
                    continue;
                }

                else if ( strategy === false ) {
                    stack.length = 0;       //  затерти масив із даними, щоб вийти з верхнього циклу
                    break;
                }

                else {
                    //  depth - поточна глибина
                    //  max - максимально домустима
                    //  якщо значення по даному ключю є простим, тоді перейти до наступної властивості
                    if ( max <= depth || !this.isObject(value) ) {
                        continue;
                    }
                    //  перевіряє чи в закешованому обєкті, одна з властивостей часом не силкою на самий обєкт
                    //  якщо є, тоді в залежності від вибраного режиму, видати помилку, або проігнорити і перейти до наступного кроку
                    if ( cache.indexOf(value) !== -1 ) {
                        if ( ignore ) {
                            continue;
                        }
                        throw new Error('Circular reference');
                    }


                    //  стратегія подальшого проходження по обєкту
                    //  true - по вертикально
                    //  false - по горизонталі
                    if ( mode ) {
                        //  цього поки що не розглядаю
                        stack.unshift(way, depth + 1, this.getKeys(value).sort(), value);
                    } else {
                        //  спочатку засетати
                        stack.push(path, depth, keys, node);
                        //  потім добавити характеристики поточного обєкта
                        stack.push(way, depth + 1, this.getKeys(value).sort(), value);
                        break;
                    }
                }
            }

        }
        while(stack[0]);

        return object;
    };
    _recursiveIterator.customWalk = function(webitelSchema) {

        var
            stack = [ [], 0, Object.keys(webitelSchema), webitelSchema ];


        do {
            var
                node = stack.pop(),     //  поточний вузол
                keys = stack.pop(),     //  ключі поточного вузла
                depth = stack.pop(),    //  глибина вкладення
                path = stack.pop();     //  масив, який містить шлях вкладення



            while( keys[0] ) {
                var
                    key = keys.shift(),
                    value = node[key],
                    way = path.concat(key),     //  масив, який містить шлях вкладення

                    i,                          //  для проходження циклом по внутрішніх елементах масива if.else, if.then
                    checkAppTypeRes;





                checkAppTypeRes = this.checkAppType(value);

                //  1. Якщо це простий аплікейшен, тоді просто витягнути його дані, добавити його на канвас, продовжити цикл
                if ( checkAppTypeRes.continue ) {
                    observe.trigger("addElByType", checkAppTypeRes.type, {
                        visual: {
                            way: way,
                            depth: depth
                        }
                    });
                    continue;
                }
                //  2. Якщо аплікейшен if, тоді ...
                //  TODO як побудувати IF_END
                else if ( checkAppTypeRes.type === "if" ) {

                    observe.trigger("addElByType", "IF_START", {
                        visual: {
                            way: way,
                            depth: depth
                        }
                    });
                }


                //  2. Якщо це if елемент
                /*if ( key === "if" ) {
                    if ( value.expression ) {

                    }

                    if ( value.then ) {
                        for ( i = 0; i < value.then.length; i++ ) { }
                    }

                    if ( value.else ) {
                        for ( i = 0; i < value.else.length; i++ ) { }
                    }
                    continue;
                }*/




                if ( typeof value === "object" ) {
                    stack.push(path, depth, keys, node);
                    stack.push(way, depth + 1,  Object.keys(value), value);
                    break;
                }
                else {
                    console.log(key + ":" + value);
                    console.log("way: " + way);
                    console.log("depth: " + depth);
                    continue;
                }
            }

        } while( stack[0] );
    };




    /**
     * Проходиться лише по елементах першого рівня, при попадінні на if,
     *      викликається функція для рекурсивного проходження по if і всіх його вкладеннях
     */
    _recursiveIterator.walkByFirstLevel = function(webitelSchema) {

        var
            i,
            checkAppTypeRes;


        for ( i = 0; i < webitelSchema.length; i++ ) {

            checkAppTypeRes = this.checkAppType(webitelSchema[i]);

            if ( checkAppTypeRes.continue ) {
                observe.trigger("addElByType", checkAppTypeRes.type, calcFirstLevelPos(i));
                continue;
            }
            else if ( checkAppTypeRes.type === "if" ) {
                this.walkByIF(webitelSchema[i].if, i)
            }
        }


        /**
         * TODO: переробити, розміри елемента впливають на його позицію. Розумніше створити елемент,
         *      подивитися на його розміри і вже тоді корегувати його позицю. Краще це робити на канвасі
         *
         * @param shapesCount
         * @returns {{x: number, y: number}}
         */
        function calcFirstLevelPos(shapesCount) {

            var
                x = 200,
                y = 0,
                marginTop = 20,                         //  відступ від верху до фігури
                shapeHeight = 40;                       //  дефолтна висота фігури

            y = shapeHeight * shapesCount + marginTop * shapesCount + marginTop;

            return {
                x: x,
                y: y
            }
        }
    };

    /**
     * Призначення ...
     *
     * @param {object} level_1 Обєкт з властивостями else, then, expression
     * @param {number} positionByLevel_1 Позиція елемента на першому рівні, починаться від 0
     */
    _recursiveIterator.walkByIF = function(level_1, positionByLevel_1) {
        debugger;



        var
            IF_HEIGHT = 50,
            IF_WIDTH = 50,
            stack = [
                {
                    "level": 1,
                    "thenCount": 0,
                    "elseCount": 0,
                    "expression": "",
                    "if_start_pos": {
                        x: 0,
                        y: 0
                    },
                    "if_end_pos": {
                        x: 0,
                        y: 0
                    }
                }
            ];

        do {
            /**
             * Основна задача, це підготовити зручний конфіг, а потім по ньому будувати схему.
             *
             * 1. Проходимся циклом по вітках then, else і шукаємо if елемент
             */

            var
                element;                //  поточний if елемент, який опрацьовується

            element = stack.pop();


            break;
        } while (5)
    };


    /**
     * Визначає до якого типу аплікейшина належить переданий обєкт
     *
     * @param {object} obj Певний тип аплікейшена
     * @returns {object} type: тип аплікейшена, continue: чи слід переходити до наступного елемента
     */
    _recursiveIterator.checkAppType = function(obj) {
        var
            response = {
                type: undefined,
                continue: false
            };

        if ( obj.hasOwnProperty("answer") ) {
            response.type = "answer";
            response.continue = true;
        }
        else if ( obj.hasOwnProperty("pause") ) {
            response.type = "pause";
            response.continue = true;
        }
        else if ( obj.hasOwnProperty("recordSession") ) {
            response.type = "recordSession";
            response.continue = true;
        }
        else if ( obj.hasOwnProperty("setVar") ) {
            response.type = "setVar";
            response.continue = true;
        }
        else if ( obj.hasOwnProperty("if") ) {
            response.type = "if";
            response.continue = false;
        }

        return response;
    };
});









































