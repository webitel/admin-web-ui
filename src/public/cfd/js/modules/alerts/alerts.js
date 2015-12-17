/**
 * Responsible for user notification
 */



//  TODO якщо клікнути по кнопці закривання, а потім різко відвести мишку, воно не пропаде
//  походу роботи допилювати його
//  розібртися з самим плагіном
//  "notice", "info", "success", or "error".


define("alerts", ["pnotify.buttons"], function() {

    //  вказати яку лібу юзати для відображення іконок
    PNotify.prototype.options.styling = "fontawesome";

    var
        alerts;

    alerts = {
        "success": function(opt) {
            new PNotify({
                delay: opt.delay || 5000,
                title: opt.title || false,
                text: opt.text || "+OK",
                type: "success",
                icon: false,

                buttons: {
                    closer: true,
                    sticker: false,
                    closer_hover: true
                }
            });
        },
        "error": {},
        "info": {}
    };

    return alerts;

});