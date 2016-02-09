/**
 * Сторінка авторизації є незалежною від інших сторінок, тому для неї окремо потрібно підгружати стилі, скрипти, модулі.
 */


requirejs.config({
    baseUrl: '',
    paths: {
        "cookStor" : "/js/app/cookieModule/cookStor",
        "browser"  : "/js/app/browserInfoModule/browser",
        "locStor"  : "/js/app/localStorageModule/locStor",
        "alert"    : "/js/app/alertModule/alert",


        'text'     : '/js/libs/RequireJS/text',                              //  використовую для загрузки html шаблонів як тексту

        //  Ініціалізує модель, рендерить вюху
        "initLogin"  : "/js/app/loginModule/initLogin",
            "LoginModel"    : "/js/app/loginModule/models/LoginModel",
            "LoginModelView": "/js/app/loginModule/views/LoginModelView",


        //  CORE
        "storage"   : "/js/app/CORE/utils/storage",                                 //  один із модулів CORE, який необхійдний для подальшої роботи



        "errHandler": "/js/app/errHandlerModule/errHandler",
        "fieldValidator" : "/js/patterns/strategy/fieldValidator",
        "sectionRoleRouter": "/js/app/roleModule/sectionRoleRouter"
    },
    shim: {},
    waitSeconds: 20
});



//  обовязково ініціалізувати сховище. Без нього подальша робота неможлива
require(["storage"], function() {
    //  ініціалізує додаткові модулі для коректної роботи сторінки входу
    require(["initLogin"]);
});


