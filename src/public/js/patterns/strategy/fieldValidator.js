/**
 * Описати конфіг
 *      fieldValidator.config = {
 *          "field_name": ["isNotEmpty", "isNumber"]
 *      }
 * Викликати метод, передати дані
 *      fieldValidator.validate({ "name": "some text for validation" })
 *
 * Невалідні поля зберігаються в this.messages[field_name]. Якщо в поля декілька помилок, зберігається тільки остання
 *
 *
 *
 */

define("fieldValidator", [], function() {
    return {
        "types"    : {
            //  значення не пусте
            "isNotEmpty": {
                "validate": function (value) {
                    return value !== "";
                },
                "instructions": "Field cannot be empty"
            },
            //  тільки число
            "isNumber": {
                "validate": function(value) {
                    var patt = "^[0-9]*$",
                        found;

                    found = value.match(patt);

                    if ( found ) {
                        return true;
                    }
                    return false;
                },
                "instructions": "Field must be only number"
            },

            //  не містить пробілів
            "hasNotSpaces": {
                "validate": function(value) {
                    if ( value.indexOf(" ") !== -1 ) {
                        return false;
                    }
                    return true;
                },
                "instructions" : "Field cannot contain spaces"
            },
            //  не містить символів кирилиці
            "hasNotCyrillic": {
                "validate": function(value) {
                    var patt = "[а-яА-Я]";

                    if ( value.match(patt) ) {
                        return false;
                    }
                    return true;
                },
                "instructions": "Field must contain only latin symbol"
            },
            "hasNotSpecialSymbol": {
                "validate": function(value) {
                    //  TODO написати регулярний вираз, який описує, які символи допустимі
                    return true;
                },
                "instructions": "Field cannot contain special symbol"
            },

            //  макс кількість символів
            "maxLength_3": {
                "validate": function(value) {
                    if ( value.length > 3 ) {
                        return false;
                    }
                    return true;
                },
                "instructions": "Field too long. Max length 3 symbols"
            },
            "maxLength_20": {
                "validate": function(value) {
                    if ( value.length > 20 ) {
                        return false;
                    }
                    return true;
                },
                "instructions": "Field too long. Max length 20 symbols"
            },
            "maxLength_50": {
                "validate": function(value) {
                    if ( value.length > 50 ) {
                        return false;
                    }
                    return true;
                },
                "instructions": "Field too long. Max length 50 symbols"
            }

        },
        "messages" : {},
        "config"   : {},
        "validate" : function(data) {

            try {

                var propName, k, msg, receivedType, receivedTypes, checker, result_ok;

                this.messages = {};

                //  цикл по властивостях обєкта валідації
                for ( propName in data ) {

                    if ( !data.hasOwnProperty(propName) ) {
                        continue;
                    }

                    if ( data[propName] === undefined ) {
                        throw {
                            type: "ValidatorIncorrectData",
                            message: "Incorrect data for validation"
                        }
                    }

                    receivedTypes = this.config[propName];

                    if ( !(receivedTypes instanceof Array) ) {
                        throw {
                             type: "ValidatorConfigError",
                             message: "Bad config = {key: value} instance. Config value must be Array"
                         }
                    }

                    //  цикл по всіх переданих типах валідації
                    for ( k = 0; k < receivedTypes.length; k++ ) {
                        receivedType = receivedTypes[k];

                        if ( !this.types[receivedType] ) {
                            throw {
                                type: "ValidatorTypeError",
                                message: "No handler to validate type " + receivedType
                            }
                        }

                        checker = this.types[receivedType];

                        result_ok = checker.validate(data[propName]);

                        if ( !result_ok ) {
                            //  TODO зберігається тільки остання найдена помилка по полю
                            this.messages[propName] = {
                                "msg": checker.instructions
                            }
                        }
                    }
                }

            } catch (e) {
                if ( e.type === "ValidatorConfigError" ) {
                    console.error(e.type + ": " + e.message );
                }
                else if ( e.type === "ValidatorTypeError" ) {
                    console.error(e.type + ": " + e.message );
                }
                else if (e.type === "ValidatorIncorrectData" ) {
                    console.error(e.type + ": " + e.message );
                }
                else {
                    console.error(e);
                }
            }
        },
        "hasErrors": function() {
            for ( var prop in this.messages ) {
                if ( this.messages.hasOwnProperty(prop) ) {
                    return true;
                }
            }
            return false;
        }
    };
});



