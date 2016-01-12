requirejs.config({
    baseUrl: '',
    shim: {
        "backbone": {
            deps: ['underscore'],
            exports: 'Backbone'
        },
        "session": {
            "deps": ["storage"]
        },
        "webitelConnector": {
            "deps": ["session"]
        },
        "angular": {exports: 'angular'},
        "StatisticModule": {"exports": "statisticModule",
            "deps": ["angular"]
        }
    },
    paths: {
        //  LIBS
        "backbone"     : "/js/libs/Backbone/backbone",
        "underscore"   : "/js/libs/Backbone/underscore",
        "jquery"       : "/js/common/jquery-2.1.1.min",
        "webitelLib"   : "/js/libs/webitel/WebitelModule",                      //  клієнтська ліба вебітел
        "detect"       : "/js/libs/Detect/detect.min",                          //  парсить стрічку navigator.userAgent
        "excel-builder": "/js/libs/ExcelBuilder/dist/excel-builder.compiled",   //  для створення excel файлів
        "audioPlayer"  : "/js/libs/MediaElement/MediaElement",                  //  для аудіо, відео
        "fileSaver"    : "/js/libs/ExcelBuilder/FileSaver",                     //  для скачування файлів з клієнта


        //  PLUGINS
        "rowSorted"   : "/js/libs/rowsorted/jquery.rowsorter",
        "bootbox"     : "/js/libs/bootbox/bootbox",
        "jQueryUI"    : "/js/libs/jQuery-UI/jquery-ui v1.11.4",
        "bsWizard"    : "/js/libs/bootstrap-wizard/jquery.bootstrap.wizard.min",
            //  jQuery
            "jsonViewver" : "/js/libs/jsonViewver/dist/jquery.jsonview",
            "jsoneditor"  : "/js/libs/jsoneditor/dist/jsoneditor",                          //  TODO стиснути лібу, дуже важка майже 1 Mb
            "chosen"      : "/js/libs/jQueryPlugins/chosen_v1.4.2/chosen.jquery.min",
            //  Bootstrap
            "tagInput"    : "/js/libs/bootstrap-tagsinput/bootstrap-tagsinput.min",
            "bsDatepicker": "/js/libs/bootstrap-datepicker/bootstrap-datepicker",   //  Bootstrap-datepicker
            //  Require
            'text'        : '/js/libs/RequireJS/text',                              //  використовую для загрузки html шаблонів як тексту




        //  SECTIONS and PAGES
        "statisticsSection": "/js/app/statisticsSectionModule/statisticsSection",
        "accountSection"   : "/js/app/accountSectionModule/accountSection",
        "mediaSection"     : "/js/app/mediaSectionModule/mediaSection",
        "gatewaySection"   : "/js/app/gatewaySectionModule/gatewaySection",
        "callflowSection"  : "/js/app/callflowSectionModule/callflowSection",
        "AcdSection"       : "/js/app/AcdSectionModule/AcdSection",
            "AcdModel"          : "/js/app/AcdSectionModule/models/AcdModel",
            "AcdModelView"      : "/js/app/AcdSectionModule/views/AcdModelView",
            "AddAcdModelView"   :"/js/app/AcdSectionModule/views/AddAcdModelView",
            "OpenAcdModelView"  :"/js/app/AcdSectionModule/views/OpenAcdModelView",
            "AcdCollection"     : "/js/app/AcdSectionModule/collections/AcdCollection",
            "AcdCollectionView" : "/js/app/AcdSectionModule/views/AcdCollectionView",
        "profilePage"      : "/js/app/profilePageModule/profilePage",

        "AccountModel": "/js/app/accountSectionModule/models/AccountModel",
        "AccountEditView": "/js/app/accountSectionModule/views/AccountEditView",

        "CdrModule": "/js/app/CdrModule/CdrModule",
        "CdrCollection": "/js/app/CdrModule/collections/CdrCollection",
        "CdrModel": "/js/app/CdrModule/models/CdrModel",

        //  ADDITIONAL MODULES
        "periodFilter"          : "/js/app/periodFilterModule/periodFilter",                      //  bootstap-datepicker і додатковий модуль для роботи з фільтром по даті
        "cookStor"              : "/js/app/cookieModule/cookStor",
        "locStor"               : "/js/app/localStorageModule/locStor",
        "browser"               : "/js/app/browserInfoModule/browser",
        "alert"                 : "/js/app/alertModule/alert",
        "errHandler"            : "/js/app/errHandlerModule/errHandler",


        "angular": "statistic-filter/angular.min",
        "StatisticModule": "statistic-filter/modules/StatisticModule",

        //  CORE
        "initCore": "/js/app/CORE/init",
            "storage": "/js/app/CORE/utils/storage",
            "session": "/js/app/CORE/utils/session",                        //  dep storage
            "webitelConnector" : "/js/app/CORE/utils/webitelConnector",     //  для здєнання по веб-сокету
            "webitelApi" : "/js/app/CORE/utils/webitelApi",     //  для здєнання по веб-сокету



            //  модуль для констант
            //  доробити ці модулі.
            "appRouter": "/js/app/appRouter",       //  важливий і обовязковий модуль


            "fieldValidator": "/js/patterns/strategy/fieldValidator"

    },
    waitSeconds: 30
});

//  використовую глобальний простір імен WAdmin і AccountSection для розділу акаунти
window.WAdmin = {};
window.WAdmin.AccountSection = {};
window.WAdmin.StatSection = {};

window.app = window.app || {};
window.app.router = window.app.router || {};
window.app.collections = window.app.collections || {};
window.app.views = window.app.views || {};




//  ініціалізувати модуль, який загрузить всі модулі CORE, які є необхідними для подальшої роботи
require(["initCore"], function(_initCore) {

});

