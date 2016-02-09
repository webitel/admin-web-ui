/**
 * TODO
 * 1. Вивести список всіх шлюзів webitel.gatewayList
 *      - root показати всі, + фільтрація по домену (бажано додавати @ перед доменом)
 *      - admin || user автоматом на сервері підставить домен користувача
 * 2. В візарді використовується список доменів для
 */

/**
 * EVENTS
 *      - enDisGw $(".gatewayPanelBody").on("enDisGw");
 */


define("gatewaySection", ["webitelConnector", "session", "alert", "bsWizard", "roleChecker"], function(webitelConnector, session, alert, _bsWizard, roleChecker) {

    var gwList = [],
        addGwWizard,
        GW_USER_PARAMETERS = {
            "auth-username"     : "1",
            "caller-id-in-from" : "1",
            "extension"         : "1",
            "proxy"             : "1",
            "expire-seconds"    : "1",
            "retry-seconds"     : "1",
            "from-user"         : "1",
            "from-domain"       : "1",
            "register-proxy"    : "1",
            "contact-params"    : "1",
            "register-transport": "1",
            "outbound-proxy"    : "1"
        },
        finishedAddGwObj;

    function createWebitel() {
        if ( !window.webitel ) {
            webitelConnector.autoConnect(init);
        } else {
            init();
        }
    }

    function init() {

        //  показати головний контенер із контентом
        $("#content-container").show();

        getGwList();

        //  ініціалізувати візард добавлення шлюза. Підписатися на його івенти
        initAddGwWizard();
        subsribeOnAddGwWizardEvent();

        // приховуємо при необхідності кнопку для додавання шлюзу
        roleChecker.gatewayAccess.hideAddGatewayButton();
    }

    //  init bootstrap-wizard for addGwModal
    function initAddGwWizard() {
        //  через замикання перевіряю, який попередній вибраний шлюз
        var preSelGw,
            currSelGw,
            requiredValuTab_2,
            parametersTab_3;

        addGwWizard = $('#addGwWizardModal #addGwWizard').bootstrapWizard({
            tabClass		 : 'wz-classic',
            nextSelector	 : '.next',
            previousSelector : '.previous',
            firstSelector    : '.button-first',
            onTabClick: function(tab, navigation, index) {
                return false;
            },
            onNext: function(liCont, ulCont, index) {
                var i;

                //  розділяє логіку по isSkypeConnect || isSipTrunk || isSipProvider
                if (index === 1) {
                    //  перевірити чи вибраний провайдер, якщо ні, не переходити далі
                    if (!$("#addGwWizardModal #addGwWizard #addGw-cls-tab1 div div img").hasClass("selectGw"))
                        return false;

                    currSelGw = $("#addGwWizardModal #addGwWizard #addGw-cls-tab1 div div img.selectGw").attr("gwType");

                    //  перевірити, який шлюз вибраний
                    if (currSelGw === "isSkypeConnect") {
                        if (preSelGw === currSelGw)
                            return true;

                        preSelGw = currSelGw;
                        //  видалити всі елементи форми Tab-2
                        $("#addGw-cls-tab2 .form-horizontal").children().remove();
                        //  видалити всі елементи форми Tab-3
                        $("#addGw-cls-tab3 .form-horizontal").children().remove();
                        $("#addGw-cls-tab3 .addParamsCont button.addParams").show();

                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Gateway name"));
                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("SIP user name"));
                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Password"));

                        return true;
                    }
                    else if (currSelGw === "isSipTrunk") {
                        if (preSelGw === currSelGw)
                            return true;

                        preSelGw = currSelGw;
                        //  видалити всі елементи форми Tab-2
                        $("#addGw-cls-tab2 .form-horizontal").children().remove();
                        //  видалити всі елементи форми Tab-3
                        $("#addGw-cls-tab3 .form-horizontal").children().remove();
                        $("#addGw-cls-tab3 .addParamsCont button.addParams").show();

                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Gateway name"));
                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Host/IP"));

                        return true;
                    }
                    else if (currSelGw === "isSipProvider") {
                        if (preSelGw === currSelGw)
                            return true;

                        preSelGw = currSelGw;
                        //  видалити всі елементи форми Tab-2
                        $("#addGw-cls-tab2 .form-horizontal").children().remove();
                        //  видалити всі елементи форми Tab-3
                        $("#addGw-cls-tab3 .form-horizontal").children().remove();
                        $("#addGw-cls-tab3 .addParamsCont button.addParams").show();

                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Gateway name"));
                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Host/IP"));
                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("User name"));
                        $("#addGw-cls-tab2 .form-horizontal").append(createSimpleField("Password"));

                        return true;
                    }

                    return true;
                }
                else if (index === 2) {
                    requiredValuTab_2 = $("#addGwWizardModal #addGwWizard #addGw-cls-tab2 .form-horizontal").serializeArray();

                    //  перевірка чи всі поля заповненні
                    for (i = 0; i < requiredValuTab_2.length; i++) {
                        if (requiredValuTab_2[i].value === "")
                            return false;
                    }

                }
                else if (index === 3) {
                    parametersTab_3 = $("#addGwWizardModal #addGwWizard #addGw-cls-tab3 .form-horizontal").serializeArray();

                    //  перевірка чи всі вибрані параметри заповненні
                    for (i = 0; i < parametersTab_3.length; i++) {
                        if (parametersTab_3[i].value === "")
                            return false;
                    }

                    finishedAddGwObj = {
                        tab2: requiredValuTab_2,
                        tab3: parametersTab_3,
                        type: currSelGw
                    };

                    //  TODO add select domain
                    showDomainTable();
                    $("#addGw-cls-tab4 .selectedDomain").text("no domain");
                }
            },
            onInit : function(){
                $('#addGwWizard').find('.finish').hide().prop('disabled', true);
            },
            onTabShow: function(tab, navigation, index) {
                var $total = navigation.find('li').length;
                var $current = index+1;
                var $percent = ($current/$total) * 100;
                var wdt = 100/$total;
                var lft = wdt*index;
                $('#addGwWizard').find('.progress-bar').css({width:$percent+'%'});

                // If it's the last tab then hide the last button and show the finish instead
                if($current >= $total) {
                    $('#addGwWizard').find('.next').hide();
                    $('#addGwWizard').find('.finish').show();
                    $('#addGwWizard').find('.finish').prop('disabled', false);
                } else {
                    $('#addGwWizard').find('.next').show();
                    $('#addGwWizard').find('.finish').hide().prop('disabled', true);
                }
            }
        });
    }

    //  вішає обробники на елементи інтерфейсу, підписується на інші івенти модуля
    function subscribeOnEvent() {

        //  CUSTOM EVENT ENABLE / DISABLE gateway
        $(".gatewayPanelBody").unbind("enDisGw");
        $(".gatewayPanelBody").on("enDisGw", function(e, gwName, isGwChecked) {
            console.info("Custom event=enDisGw, gatewayName=" + gwName);
            console.log(isGwChecked);


            var
                profileName,
                gatewayName;

            //  prepare gwName
            if ( gwName.indexOf("::") !== -1 ) {
                profileName = gwName.split("::")[0];
                gatewayName = gwName.split("::")[1];
            }
            else {
                gatewayName = gwName;
            }

            // отримуємо доступ до редагування шлюзу
            var isGatewayAccessUpdate = roleChecker.checkPermission("u", "gateway");

            if(!isGatewayAccessUpdate) {

                alert.error("", "Permission denied!", 5000);
                return;
            }
            if ( isGwChecked ) {
                webitel.gatewayUp(gatewayName, profileName, function(res) {
                    if ( res.status === 0 && this.responseText === "+OK attached\n" ) {
                        setTimeout(function() {
                            $(".gatewayPanelBody .refGatewayList").trigger("click");
                        }, 1000);
                    }
                    else {
                        alert.error(null, this.responseText, null);
                    }
                });
            }
            else {
                webitel.gatewayDown(gatewayName, profileName, function(res) {
                    if ( res.status === 0 && this.responseText === "+OK detached\n" ) {
                        setTimeout(function() {
                            $(".gatewayPanelBody .refGatewayList").trigger("click");
                        }, 1000);
                    }
                    else {
                        alert.error(null, this.responseText, null);
                    }
                });
            }
        });

        //  RELOAD GW LIST
        $(".gatewayPanelBody .refGatewayList").unbind("click");
        $(".gatewayPanelBody .refGatewayList").on("click", function() {

            //  відписатися від івента видалення шлюза
            $(".gatewayPanelBody .gatewayList .gwElemet .gwRemoveGrid").unbind("click");
            $("#remove-gw-modal .agreeRemGw").unbind("click");

            //  клік по кнопці збереження карточки шлюза
            $(".gwCardCont #saveGwCard").unbind("click");

            var el = $(this);
            el.niftyOverlay('show');


            webitel.gatewayList(session.getDomain() || "", function(res) {
                if ( res.status === 0) {

                    el.niftyOverlay('hide');

                    //  видалити всі шлюзи, відмалювати нові
                    $(".gatewayPanelBody .gatewayList").children().remove();

                    var
                        x = this.parseDataTable(),
                        headers,
                        data,
                        i,
                        k,
                        gwElObj;


                    headers = x.headers;        //  ["Gateway", "Domain", "Data", "State"]
                    data = x.data;              //  [[], [], [], []]

                    //  очистити список всіх шлюзів
                    gwList = [];

                    //  проходимся по всіх шлюзах
                    for ( i = 0; i < data.length; i++ ) {
                        gwElObj = {};
                        for ( k = 0; k < headers.length; k++ ) {
                            gwElObj[headers[k]] = data[i][k];
                        }
                        gwList.push(gwElObj);
                    }

                    renderReloadGwList();
                }
                else if (res.status === 1) {
                    alert.error(null, this.responseText, null);
                    el.niftyOverlay('hide');
                }
                else {
                    alert.error(null, this.responseText, null);
                    el.niftyOverlay('hide');
                }
            })
        });

        //  ADD GW клік по кнопці створення нового шлюза. Показує модальне вікно
        $(".gatewayPanelBody .addGateway").unbind("click");
        $(".gatewayPanelBody .addGateway").on("click", function() {
            $("#addGwWizardModal").modal("show");
        });

        $("#addGwWizardModal").unbind("hidden.bs.modal");
        $("#addGwWizardModal").on("hidden.bs.modal", function() {
            //  видалити у всіх шлюзів клас
            $("#addGwWizardModal #addGwWizard #addGw-cls-tab1 div div img").removeClass("selectGw");
            $("#addGwWizardModal #addGwWizard .button-first").trigger("click");
        });
    }
    function subscribeOnGwListEvent() {

        //  OPEN GW
        $(".gatewayPanelBody .gatewayList .gwElemet .gwOpenGrid").unbind("click");
        $(".gatewayPanelBody .gatewayList .gwElemet .gwOpenGrid").on("click", function() {


            var gwName = $(".gatewayPanelBody .gatewayList .gwElemet.gwActive .gwName span").text();

            webitel.gatewayChange(gwName, "params", "", function(res) {
                var gwLogo   = $(".gatewayPanelBody .gatewayList .gwElemet.gwActive .gwLogo img").attr("src"),
                    gwDomain = $(".gatewayPanelBody .gatewayList .gwElemet.gwActive .gwDomain span").text(),
                    gwStatus = $(".gatewayPanelBody .gatewayList .gwElemet.gwActive .gwStatus span").text();

                if (res.status === 0) {
                    var specialParams = getParamsAccordingToType(this.responseText),
                        paramObj = parseGwParamsOrVariables(this.responseText);

                    layoutGwParams(paramObj);
                    layoutGwSpecialParams(specialParams);

                    layoutGwCardHeader(gwLogo, gwName, gwDomain, gwStatus);
                    $(".gatewayPanelBody").hide();
                    $(".gwCardCont").show();

                    //  bugFix 01.04 ↓↓↓    ****************************************************************************
                    //  показати всі параметри в блоці додаткових параметрів
                    $(".wrapAddParamCont #addParamsToGwInCard").children().show();

                    var paramsArr  = $(".gwCardBody .gwParamsCont .gwParams input"),
                        parName,
                        i;

                    //  пройтися по всіх параметрах в карточці шлюза. Приховати всі співпвдіння в контейнері з параметрами
                    for (i = 0; i < paramsArr.length; i++) {
                        parName = paramsArr[i].name;
                        $(".wrapAddParamCont #addParamsToGwInCard").find("[paramname='" + parName + "']").hide();
                    }
                    //  bugFix 01.04 ↑↑↑    ****************************************************************************

                } else if (res.status === 1) {
                    alert.error("", this.responseText, "");
                    console.error("Unhandled error!");
                }
            });
        });

        //  CLICK PARAM BTN
        $(".wrapAddParamCont #addParamsToGwInCard button").unbind("click");
        $(".wrapAddParamCont #addParamsToGwInCard button").on("click", function() {
            $(".gwCardBody .gwParamsCont .gwParams").append(addParamFieldInCard($(this).attr("paramname")));
            $(this).hide();
        });

        //  REMOVE MODAL SHOW
        $(".gatewayPanelBody .gatewayList .gwElemet .gwRemoveGrid").unbind("click");
        $(".gatewayPanelBody .gatewayList .gwElemet .gwRemoveGrid").on("click", function() {
            var gwName = $(".gatewayPanelBody .gatewayList .gwElemet.gwActive .gwName span").text();

            $("#remove-gw-modal .gwName").text(gwName);
            $("#remove-gw-modal").modal("show");
        });
        //  REMOVE GW
        $("#remove-gw-modal .agreeRemGw").unbind("click");
        $("#remove-gw-modal .agreeRemGw").on("click", function() {

            var gwName = $("#remove-gw-modal .gwName").text();

            if ( gwName.indexOf("::") !== -1 ) {
                gwName = gwName.split("::")[1];
            }

            webitel.gatewayRemove(gwName, function(res) {
                if (res.status === 0) {
                    alert.success("", this.responseText, 3000);
                    setTimeout(function() {
                        $(".gatewayPanelBody .refGatewayList").trigger("click");
                    }, 2000);
                } else {
                    alert.error("", this.responseText, 3000);
                }
            });
        });

        //  CLOSE GW CARD
        $(".gwCardCont .closeGwCard").unbind("click");
        $(".gwCardCont .closeGwCard").on("click", function() {
            $(".gwCardCont").hide();
            $(".gatewayPanelBody").show();

            //  видалити параметри і змінні із карточки шлюза
            //$(".gwCardCont .gwCardBody .gwVariablesCont .gwVariables").children().remove();
            $(".gwCardCont .gwCardBody .gwParamsCont .gwParams").children().remove();
            $(".gwCardCont .gwCardBody .gwSpecialParams .gwValues").children().remove();
        });

        //  SAVE GW CARD
        $(".gwCardCont #saveGwCard").unbind("click");
        $(".gwCardCont #saveGwCard").on("click", function() {

            //  спочатку проходимся по базових параметрах, а потім по додаткових
            (function checkSpecialParams() {
                var changedSpecParArr    = $(".gwCardBody .gwSpecialParams .gwValues .changed"),
                    specParams = {};

                //  витягуємо всі змінені поля і зберігаємо в обєкт
                for (i = 0; i < changedSpecParArr.length; i++) {
                    if (changedSpecParArr[i].value === "") {
                        alert.warning("", "All fields must be fill", 3000);
                        return;
                    }
                    specParams[changedSpecParArr[i].name] = changedSpecParArr[i].value;
                    $(changedSpecParArr[i]).removeClass("changed");
                }

                checkAllParams(specParams);
            })();

            function checkAllParams(specParams) {
                var changedParArr = $(".gwCardBody .gwParamsCont .gwParams .changed"),
                    removedParArr = $(".gwCardBody .gwParamsCont .gwParams .removedParam"),
                    paramVal, paramName,
                    i, property,
                    changedParam = {}, removedParam = {}, sendParams = [],
                    gwName = $(".gwCardHeader .gwName span").text();

                //  витягуємо всі змінені поля і зберігаємо в обєкт
                for (i = 0; i < changedParArr.length; i++) {
                    if (changedParArr[i].value === "") {
                        alert.warning("", "All fields must be fill", 3000);
                        return;
                    }
                    changedParam[changedParArr[i].name] = changedParArr[i].value;
                    $(changedParArr[i]).removeClass("changed");
                }
                //  додаєм до змінених параметрів, спеціальні параметри
                for (property in specParams) {
                    changedParam[property] = specParams[property];
                }

                //  витягуєм всі видалені поля і зберігаємо їх в обєкт
                for (i = 0; i < removedParArr.length; i++) {
                    removedParam[removedParArr[i].name] = "1";
                    $(removedParArr[i]).removeClass("removedParam");
                }

                //  якщо є спільне змінене і видалене поле, тоді видалене поле видаляєм
                for (property in changedParam) {
                    if (removedParam[property]) {
                        delete removedParam[property];
                    }
                }

                //  формуєм масив із видалиних і змінених полів
                for (property in removedParam) {
                    sendParams.push({
                        "name": property,
                        "value": ""
                    })
                }
                for (property in changedParam) {
                    sendParams.push({
                        "name": property,
                        "value": changedParam[property]
                    })
                }

                if (sendParams.length === 0) {
                    alert.warning("", "Params has not changed", 3000);
                    return;
                }

                webitel.gatewayChange(gwName, "params", sendParams, function (res) {
                    if (res.status === 0) {
                        alert.success("", "Params edited", 3000)
                    } else {
                        alert.error("", "Cant edit params", 3000)
                    }
                });
            }
        });

        //  клік по перемикачу. Генерить кастомний івент
        $(".gatewayPanelBody .gatewayList .enableDisableGw").unbind("change");
        $(".gatewayPanelBody .gatewayList .enableDisableGw").bind("change", function(e) {
            var gwName = $(".gatewayPanelBody .gatewayList .gwElemet.gwActive .gwUtils .gwName span").text();
            $(".gatewayPanelBody").trigger("enDisGw", [gwName, this.checked]);
        });

        //  клік по елементу із списку шлюзів. Зробити його активним або неактивним
        $(".gatewayPanelBody .gatewayList .gwElemet").unbind("click");
        $(".gatewayPanelBody .gatewayList .gwElemet").on("click", function() {
            if ($(this).hasClass("gwActive")) {
                //$(this).removeClass("gwActive");
                //  показати додаткову панель з кнопками
            } else {
                $(".gatewayPanelBody .gatewayList .gwElemet").removeClass("gwActive");
                $(this).addClass("gwActive")
            }
        });
    }
    function subsribeOnAddGwWizardEvent() {
        //  GW WIZARD IMAGE CLICK
        $("#addGwWizardModal #addGwWizard #addGw-cls-tab1 div div img").unbind("click");
        $("#addGwWizardModal #addGwWizard #addGw-cls-tab1 div div img").on("click", function() {
            if ($(this).hasClass("selectGw")) {
                $(this).removeClass("selectGw");
            } else {
                $("#addGwWizardModal #addGwWizard #addGw-cls-tab1 div div img").removeClass("selectGw");
                $(this).addClass("selectGw");
            }
        });

        //  ADD PARAM TO GATEWAY
        $("#addGwWizardModal #addGwWizard #addGw-cls-tab3 button.addParams").unbind("click");
        $("#addGwWizardModal #addGwWizard #addGw-cls-tab3 button.addParams").on("click", function() {
            //  додати анімацію приховування
            $(this).hide();
            $("#addGwWizardModal #addGwWizard #addGw-cls-tab3 form.form-horizontal").append(addParamField($(this).attr("paramName")));
        });

        //  FINISH ADD GATEWAY
        $("#addGwWizardModal #addGwWizard .finish").unbind("click");
        $("#addGwWizardModal #addGwWizard .finish").on("click", function() {

            var userParams = $("#addGw-cls-tab3 form").serializeArray(),
                domain = $("#addGw-cls-tab4 .selectedDomain").text();

            if (domain === "no domain")
                domain = "";

            addNewGw(finishedAddGwObj.tab2, finishedAddGwObj.type, userParams, domain,
                function(msg) {
                    $("#addGwWizardModal").modal("hide");
                    alert.success("", msg, 3000);
                    setTimeout(function() {
                        $(".gatewayPanelBody .refGatewayList").trigger("click");
                    }, 1000);
                },
                function(msg) {
                    $("#addGwWizardModal").modal("hide");
                    alert.error("", msg, 10000);
                }
            );

        });
    }


    /**                                     GATEWAY LIST
     ******************************************************************************************************************/
    /**
     * Отримати список всіх шлюзів. Для user && admin сервак автоматом відфільтрує по домену
     */
    function getGwList() {
        webitel.gatewayList(session.getDomain() || "", function(res) {
            if (res.status === 0) {
                var x = this.parseDataTable(),
                    headers,
                    data,
                    i,
                    k,
                    gwElObj;

                headers = x.headers;        //  ["Gateway", "Domain", "Data", "State"]
                data = x.data;              //  [[], [], [], []]

                //  очистити список всіх шлюзів
                gwList = [];

                //  проходимся по всіх шлюзах
                for (i = 0; i < data.length; i++) {
                    gwElObj = {};
                    for (k = 0; k < headers.length; k++) {
                        gwElObj[headers[k]] = data[i][k];
                    }
                    gwList.push(gwElObj);
                }

                renderGwList();
            }
            else if (res.status === 1) {
                alert.error(null, this.responseText, null);
            }
            else {
                alert.error(null, this.responseText, null);
            }
        })
    }

    //  render весь спиоок шлюзів. Підписатися на івенти
    function renderGwList() {
        var i,
            state,
            gwDomain,
            gwName,
            stripClass;


        for (i = 0; i < gwList.length; i++) {
            var li = $("<li>").attr({"class": "gwElemet"});

            if (i % 2 === 0) {
                stripClass = "strip";
            } else {
                stripClass = "unStrip";
            }
            state = gwList[i].State;
            gwDomain = gwList[i].Domain;
            gwName = gwList[i].Gateway;

            gwName = gwName.replace("external::", "");

            $(li).addClass(stripClass);

            $(li).append(layoutGwUtils("", gwName, gwDomain, state, i));
            $(li).append(layoutGwActions());

            $(".gatewayPanelBody .gatewayList").append(li);
        }
        subscribeOnEvent();
        subscribeOnGwListEvent();
    }
    function renderReloadGwList() {
        var i,
            state,
            gwDomain,
            gwName,
            stripClass;


        for (i = 0; i < gwList.length; i++) {
            var li = $("<li>").attr({"class": "gwElemet"});

            if (i % 2 === 0) {
                stripClass = "strip";
            } else {
                stripClass = "unStrip";
            }
            state = gwList[i].State;
            gwDomain = gwList[i].Domain;
            gwName = gwList[i].Gateway;

            gwName = gwName.replace("external::", "");

            $(li).addClass(stripClass);

            $(li).append(layoutGwUtils("", gwName, gwDomain, state, i));
            $(li).append(layoutGwActions());

            $(".gatewayPanelBody .gatewayList").append(li);
        }
        subscribeOnGwListEvent();
    }

    //  Шаблон дій над грідом open, edit, remove
    function layoutGwActions() {
        var gwActions = $("<div>").attr({"class": "gwActions"}).css({"margin-top": "20px;"}),
            div = $("<div>").attr({"class": "gwOpenEditRem"}),
            btnOpen   = $("<button>").attr({"class": "gwOpenGrid btn btn-success btn-sm"}).text("Open"),
            btnRemove = $("<button>").attr({"class": "gwRemoveGrid btn btn-danger btn-sm"}).text("Remove");

        $(div).css({"width": "200px;"});

        $(div).append(btnOpen);
        $(div).append(btnRemove);

        $(gwActions).append(div);

        return gwActions;
    }
    //  Шаблон вигляду гріда
    function layoutGwUtils(img, info, domain, stat, i) {
        var statLabelType,
            checked;

        //  визначаєм тип картинки
        if (img === "" || img === null || img === undefined) {
            img = "img/gateways/logo_webitel_sm.png";
        }

        //  виводим додаткову інформацію
        if (info === "" || info === null || info === undefined) {
            info = "No info";
        }

        //  визначаєм тип статусу
        if (stat === "" || stat === null || stat === undefined) {
            stat = "No status";
        }

        //  визначаєм як відобразити статус
        /**
         gwEnumState ["DOWN - gray",
         "UNREGED            - red ",
         "TRYING             - ",
         "REGISTER           - ",
         "REGED              - green ",
         "UNREGISTER         - ",
         "FAILED             - ",
         "FAIL_WAIT          - ",
         "EXPIRED            - ",
         "NOREG              - green register=false",
         "TIMEOUT            - "
         ];
         */
        //


        if ( stat === "DOWN" ) {
            statLabelType = "label-danger";
            checked = false;
        } else {
            checked = true;
            if ( stat === "FAIL_WAIT" ) {
                statLabelType = "label-warning";
            }
            else if ( stat === "NOREG" ) {
                statLabelType = "label-warning";
            }
            else if ( stat === "REGED" ) {
                statLabelType = "label-success";
            }
            else {
                statLabelType = "label-default";
            }
        }

        /*switch (stat) {
            case "DOWN":
                statLabelType = "label-danger";
                break;
            case "FAIL_WAIT":
                statLabelType = "label-danger";
                break;
            case "NOREG":
                statLabelType = "label-warning";
                checked = true;
                break;
            case "REGED":
                statLabelType = "label-success";
                checked = true;
                break;
            case "No status":
                statLabelType = "label-default";
                checked = false;
                break;
            default:
                stat = "Can not define status";
                statLabelType = "label-default";
                checked = false;
                break;
        }*/

        var gwUtils = $("<div>").attr({"class": "gwUtils"}),
            gwLogo   = $("<div>").attr({"class": "gwLogo"}),
            img  = $("<img>").attr({"src": img}),
            gwName   = $("<div>").attr({"class": "gwName"}),
            span = $("<span>").text(info),
            gwSwitch = $("<div>").attr({"class": "gwSwitch"}),
            onoffswitch = $("<div>").attr({"class": "onoffswitch"}),
            checkBox = $("<input>").attr({"class": "enableDisableGw onoffswitch-checkbox", "id": "myonoffswitch" + i, "type": "checkbox", "name": "onoffswitch"}),
            labelOnOff = $("<label>").attr({"class": "onoffswitch-label", "for": "myonoffswitch" + i}),
            spanOnOff = $("<span>").attr({"class": "onoffswitch-inner"}),
            spanAct = $("<span>").attr({"class": "onoffswitch-active"}),
            spanOn = $("<span>").attr({"class": "onoffswitch-switch"}).text("ON"),
            spanInAct = $("<span>").attr({"class": "onoffswitch-inactive"}),
            spanOff = $("<span>").attr({"class": "onoffswitch-switch"}).text("OFF"),
            gwDomain = $("<div>").attr({"class": "gwDomain"}),
            spanDomain = $("<span>").attr({"class": "label label-mint"}).text(domain),


            gwStatus = $("<div>").attr({"class": "gwStatus"}),
            spanStatus = $("<span>").attr({"class": "label " + statLabelType}).text(stat);

        //  checked/unChecked gateway
        if (checked)
            $(checkBox).attr("checked", "");

        //  Append checkBox
        $(spanAct).append(spanOn);
        $(spanInAct).append(spanOff);

        $(spanOnOff).append(spanAct);
        $(spanOnOff).append(spanInAct);
        $(labelOnOff).append(spanOnOff);

        $(onoffswitch).append(checkBox);
        $(onoffswitch).append(labelOnOff);
        /////////////////////////////////

        //  якщо домен відомий, відобразитий його
        if (domain)
            $(gwDomain).append(spanDomain);

        $(gwLogo).append(img);
        $(gwName).append(span);
        $(gwStatus).append(spanStatus);
        $(gwSwitch).append(onoffswitch);

        $(gwUtils).append(gwLogo);
        $(gwUtils).append(gwName);
        $(gwUtils).append(gwSwitch);
        $(gwUtils).append(gwStatus);

        if (domain)
            $(gwUtils).append(gwDomain);

        return gwUtils;
    }

    //  парсить строку отриманих параметрів і повертає обєкт з тими параметрами, які потрібні для юзера
    function parseGwParamsOrVariables(strParams) {
        var res = {},
            lastEmptyElPos,
            paramReqRes,
            paramsArr = strParams.split("\n"),
            i,
            keyValArr,
            property;

        //  якщо результат не +ОК  вернути помилку
        paramReqRes = paramsArr.indexOf("+OK");
        if (paramReqRes === -1) {
            console.error("Bad response params. Check request and response from core server");
            return;
        } else {
            paramsArr.splice(paramReqRes, 1);
        }

        //  видалити останій пустий елемент
        lastEmptyElPos = paramsArr.indexOf("");
        if (lastEmptyElPos !== -1) {
            paramsArr.splice(lastEmptyElPos, 1);
        }

        //  повернути пустий обєкт
        if (paramsArr.length < 1) {
            return res;
        }

        //  проходимся по масиву і розбиваєм його на пари key: value
        for (i = 0; i < paramsArr.length; i++) {
            if (paramsArr[i].indexOf("=") !== -1) {
                keyValArr = paramsArr[i].split("=");
                res[keyValArr[0]] = keyValArr[1];
            }
        }

        //  повертає лише ті параметри, які потрібні для юзера, всі решта видаляє з обєкта res
        for (property in res) {
            if (!GW_USER_PARAMETERS[property]) {
                delete res[property];
            }
        }
        return res;
    }
    /**
     * парсить строку отриманих параметрів і витягує лише ті, які стосуються певного типу шлюза
     * sipTrunk - realm
     * sipProvider - realm, username, password
     * skypeConnect - username, password
     */
    function getParamsAccordingToType(strParams) {
        var res = {},
            lastEmptyElPos,
            paramReqRes,
            paramsArr = strParams.split("\n"),
            i,
            keyValArr,
            property;

        //  якщо результат не +ОК  вернути помилку
        paramReqRes = paramsArr.indexOf("+OK");
        if (paramReqRes === -1) {
            console.error("Bad response params. Check request and response from core server");
            return;
        } else {
            paramsArr.splice(paramReqRes, 1);
        }

        //  видалити останій пустий елемент
        lastEmptyElPos = paramsArr.indexOf("");
        if (lastEmptyElPos !== -1) {
            paramsArr.splice(lastEmptyElPos, 1);
        }

        //  повернути пустий обєкт
        if (paramsArr.length < 1) {
            return res;
        }

        //  проходимся по масиву і розбиваєм його на пари key: value
        for (i = 0; i < paramsArr.length; i++) {
            if (paramsArr[i].indexOf("=") !== -1) {
                keyValArr = paramsArr[i].split("=");
                res[keyValArr[0]] = keyValArr[1];
            }
        }

        //  визначити тип шлюза і витягнути потрібні параметри
        //  sipProvider
        if (res.realm && res.username && res.password && res.realm.indexOf("skype") == -1) {
            res = {
                "realm"   : res.realm,
                "username": res.username,
                "password": res.password
            };
            console.info("This gateway uses SipProvider");
        }
        //  skypeConnect
        else if (res.username && res.password) {
            res = {
                "username": res.username,
                "password": res.password
            };
            console.info("This gateway uses SkypeConnect");
        }
        //  sipTrunk
        else if (res.realm) {
            res = {
                "realm": res.realm
            };
            console.info(" This gateway uses SipTrunk");
        }
        return res;
    }


    /**                                     GATEWAY CARD
     ******************************************************************************************************************/

    //  створює контейнер із параметрами і вставляєв його в HTML
    function layoutGwParams(paramsObj) {
        var field, divKey, spanName, divValue, inputValue, property, divIco, spanIco;

        for (property in paramsObj) {
            field = $("<div>").attr({"class": "col-sm-12"});
                divKey = $("<div>").attr({"class": "col-sm-4"}).css({"text-align": "right"});
                    spanName = $("<span>").attr({"class": "control-label"}).css({"line-height": "31px" }).text(property);
                divValue = $("<div>").attr({"class": "col-sm-7"});
                    inputValue = $("<input>").attr({"class": "form-control baseEdit", "type": "text", "name": property, "value": paramsObj[property]})
                        //  add change Event on all input
                        .on("change", function() {
                            //  задати клас по якому потім буду витягувати зміннені параметри
                            if (!$(this).hasClass("changed")) {
                                $(this).addClass("changed");
                            }

                            //  якщо значення не задано, виділити input
                            if (this.value === "") {
                                $(this).css({"border": "1px solid #FF0000"});
                                alert.warning("", "All fields are required!", 3000);
                                return;
                            } else {
                                $(this).css({"border": "1px solid #e9e9e9"});
                            }

                            var paramsArr = $(".gwCardBody .gwParamsCont .gwParams .changed"),
                                i;

                            for (i = 0; i < paramsArr.length; i++) {
                                if (paramsArr[i].value === "") {
                                    return;
                                }
                            }
                        }),

                divIco = $("<div>").attr({"class": "col-sm-1"}),
                    spanIco = $("<img>").attr({"src": "./img/addGateway/DeleteIcon.png"}).css({"cursor": "pointer"})
                        .on("click", function() {
                            var field = this.parentElement.parentElement,
                                paramInput = $(field).find("input"),
                                paramName  = $(field).find("input")[0].name;

                            if ($(paramInput).hasClass("changed")) {
                                $(paramInput).removeClass("changed")
                            }

                            if (!$(paramInput).hasClass("removedParam")) {
                                $(paramInput).addClass("removedParam");
                                //  приховати параметр в карточці
                                $(field).hide();
                                //  показати його в контейнері параметрів
                                $(".wrapAddParamCont #addParamsToGwInCard").find("[paramname='" + paramName+ "']").show();
                            }
                        });

            $(divKey).append(spanName);
            $(divValue).append(inputValue);
            $(divIco).append(spanIco);

            $(field).append(divKey);
            $(field).append(divValue);
            $(field).append(divIco);

            $(".gwCardCont .gwCardBody .gwParamsCont .gwParams").append(field);
        }
    }
    function layoutGwSpecialParams(paramsObj) {
        var field, divKey, spanName, divValue, inputValue, property, divIco, spanIco;

        for (property in paramsObj) {
            field = $("<div>").attr({"class": "col-sm-12"});
                divKey = $("<div>").attr({"class": "col-sm-4"}).css({"text-align": "right"});
                    spanName = $("<span>").attr({"class": "control-label"}).css({"line-height": "31px" }).text(property);
                divValue = $("<div>").attr({"class": "col-sm-7"});
                    inputValue = $("<input>").attr({"class": "form-control baseEdit", "type": "text", "name": property, "value": paramsObj[property]})
                        //  add change Event on all input
                        .on("change", function() {
                            //  задати клас по якому потім буду витягувати зміннені параметри
                            if (!$(this).hasClass("changed")) {
                                $(this).addClass("changed");
                            }

                            //  якщо значення не задано, виділити input
                            if (this.value === "") {
                                $(this).css({"border": "1px solid #FF0000"});
                                alert.warning("", "All fields are required!", 3000);
                                return;
                            } else {
                                $(this).css({"border": "1px solid #e9e9e9"});
                            }

                            var paramsArr = $(".gwCardBody .gwSpecialParams .gwValues .changed"),
                                i;

                            for (i = 0; i < paramsArr.length; i++) {
                                if (paramsArr[i].value === "") {
                                    return;
                                }
                            }
                        });

            $(divKey).append(spanName);
            $(divValue).append(inputValue);

            $(field).append(divKey);
            $(field).append(divValue);

            $(".gwCardCont .gwCardBody .gwSpecialParams .gwValues").append(field);
        }
    }

    //  створює контейнер із змінними і вставляєв його в HTML
    function layoutGwVariables(variablesObj) {
        var field, divKey, spanName, divValue, inputValue, property;

        for (property in variablesObj) {
            field = $("<div>").attr({"class": "col-sm-12"});
            divKey = $("<div>").attr({"class": "col-sm-4"}).css({"text-align": "right"});
            spanName = $("<span>").attr({"class": "control-label"}).css({"line-height": "31px" }).text(property);
            divValue = $("<div>").attr({"class": "col-sm-8"});
            inputValue = $("<input>").attr({"class": "form-control", "type": "text", "value": variablesObj[property]});


            $(divKey).append(spanName);
            $(divValue).append(inputValue);

            $(field).append(divKey);
            $(field).append(divValue);


            $(".gwCardCont .gwCardBody .gwVariablesCont .gwVariables").append(field);
        }
    }

    //  вставляє значення для заголовка карточки
    function layoutGwCardHeader(logoSrc, gwName, gwDomain, gwStatus) {

        if (logoSrc === "" || logoSrc === null || logoSrc === undefined) {
            logoSrc = "img/gateways/noGwLogo.png";
        }

        if (gwName === "" || gwName === null || gwName === undefined) {
            gwName = "No gateway name";
        }

        if (gwDomain === "" || gwDomain === null || gwDomain === undefined) {
            $(".gwCardCont .gwCardHeader .pull-right .gwDomain").hide();
        } else {
            $(".gwCardCont .gwCardHeader .pull-right .gwDomain").show();
            $(".gwCardCont .gwCardHeader .pull-right .gwDomain span").text(gwDomain);
        }


        $(".gwCardCont .gwCardHeader .pull-left .gwLogo img").attr({"src": logoSrc});
        $(".gwCardCont .gwCardHeader .pull-left .gwName span").text(gwName);


        //  bugFix add span class
        if (gwStatus === "" || gwStatus === null || gwStatus === undefined) {
            gwStatus = "No gateway status";
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").text(gwStatus);
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").removeClass();
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label");
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label-default");
        }
        else if (gwStatus === "NOREG") {
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").text(gwStatus);
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").removeClass();
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label");
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label-warning");
        }
        else if (gwStatus === "DOWN") {
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").text(gwStatus);
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").removeClass();
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label");
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label-danger");
        }
        else if (gwStatus === "REGED") {
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").text(gwStatus);
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").removeClass();
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label");
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label-success");
        }
        else if (gwStatus === "FAIL_WAIT") {
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").text(gwStatus);
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").removeClass();
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label");
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").addClass("label-danger");
        }
        else {
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").text(gwStatus);
            $(".gwCardCont .gwCardHeader .pull-right .gwStatus span").removeClass();
        }
    }


    /**                             ADD GATEWAY WIZARD ADDITIONAL FUNCTIONS
     ******************************************************************************************************************/

    /**
     * labelName - col-md-4
     * divInput - col-md-5
     *
     * В кінці добавив блок з clear: both щоб забрати ефект схлопування
     */
    function createSimpleField(fieldName) {

        var divField = $("<div>").attr({"class": "form-group"}),
            divName = $("<div>").attr({"class": "col-sm-4"}).css({"text-align": "right"}),
            labelName = $("<label>").attr({"class": "control-label"}).css({"font-weight": "bold"}).text(fieldName),
            divValue = $("<div>").attr({"class": "col-sm-5"}),
            inputValue = $("<input>").attr({"class": "form-control input-sm", "name": fieldName}),

            divClear = $("<div>").css({"clear": "both"});

        $(divValue).append(inputValue);
        $(divName).append(labelName);

        $(divField).append(divName);
        $(divField).append(divValue);
        $(divField).append(divClear);

        return divField;
    }
    function addParamField(fieldName) {

        var divField = $("<div>").attr({"class": "form-group"}),
            divName = $("<div>").attr({"class": "col-sm-4"}).css({"text-align": "right"}),
            labelName = $("<label>").attr({"class": "control-label"}).css({"font-weight": "bold"}).text(fieldName),
            divValue = $("<div>").attr({"class": "col-sm-5"}),
            inputValue = $("<input>").attr({"class": "form-control input-sm", "name": fieldName}),

            divRem = $("<div>").attr({"class": "col-sm-1"}).css({"margin-left": "-15px"}),
            btnRem = $("<button>").attr({"class": "btn btn-danger btn-xs", "name": fieldName}).css({"margin-top": "5px"}).on("click", function() {
                //  показати кнопку у списку усіх параметрів
                $("#addGwWizardModal #addGwWizard #addGw-cls-tab3 .addParamsCont button[paramname='" + this.name + "']").show();
                //  видалити параметер із форми
                this.parentElement.parentElement.remove();
                return false;
            }),
            iRem = $("<i>").attr({"class": "fa fa-remove"}),

            divClear = $("<div>").css({"clear": "both"});

        $(btnRem).append(iRem);


        $(divValue).append(inputValue);
        $(divName).append(labelName);
        $(divRem).append(btnRem);

        $(divField).append(divName);
        $(divField).append(divValue);
        $(divField).append(divRem);


        $(divField).append(divClear);

        return divField;
    }
    function addParamFieldInCard(fieldName) {
        var divField = $("<div>").attr({"class": "col-sm-12"}),
                divName = $("<div>").attr({"class": "col-sm-4"}).css({"text-align": "right"}),
                    labelName = $("<span>").attr({"class": "control-label"}).css({"line-height": "31px"}).text(fieldName),

                divValue = $("<div>").attr({"class": "col-sm-7"}),
                    inputValue = $("<input>").attr({"class": "form-control baseEdit changed", "name": fieldName, "type": "text"}).css({"border": "1px solid rgb(255, 0, 0)"})
                        .on("change", function() {
                            //  якщо значення не задано, виділити input
                            if (this.value === "") {
                                $(this).css({"border": "1px solid #FF0000"});
                                alert.warning("", "All fields are required!", 3000);
                                return;
                            } else {
                                $(this).css({"border": "1px solid #e9e9e9"});
                            }

                            var paramsArr = $(".gwCardBody .gwParamsCont .gwParams .changed"),
                                i;

                            for (i = 0; i < paramsArr.length; i++) {
                                if (paramsArr[i].value === "") {
                                    return;
                                }
                            }
                    }),

                divIco = $("<div>").attr({"class": "col-sm-1"}),
                    spanIco = $("<img>").attr({"src": "./img/addGateway/DeleteIcon.png"}).css({"cursor": "pointer"})
                        .on("click", function() {
                            var field = this.parentElement.parentElement,
                                paramName = $(field).find("input")[0].name;

                            //  видалити добавлене поле з карточки
                            field.remove();
                            //  якщо відкрити карточку і додати новий параметр, зберегти зміні, потім видалити той параметр і знов зберегти, воно не збереже

                            /*if (!$(field).hasClass("removedParam")) {
                                $(field).find("input").addClass("removedParam");
                                $(field).hide();
                            }*/
                            //  знайти приховану кнопку в контейнері всіх можливих параметрів і відобразити її
                            $(".gwCardFooter .wrapAddParamCont #addParamsToGwInCard").find("[paramname='" + paramName + "']").show();
                    });


        $(divName).append(labelName);
        $(divValue).append(inputValue);
        $(divIco).append(spanIco);

        $(divField).append(divName);
        $(divField).append(divValue);
        $(divField).append(divIco);

        return divField;
    }

    //  додає новий шлюз,
    function addNewGw(gwValueObj, type, userParams, domain, succCb, errCb) {

        var REQUIRED_SIP_TRUNK_PARAMS = {
                "register": false,
                "extension-in-contact": true
            },
            REQUIRED_SIP_PROVIDER_PARAMS = {
                "register": true,
                "extension-in-contact": true
            },
            REQUIRED_SKYPE_CONNECT_PARAMS = {
                "register"            : true,
                "from-user"           : "",                         //  тут засетаю SIP user name, який введе користувач
                "from-domain"         : "sip.skype.com",
                "retry-seconds"       : 30,
                "contact-params"      : "@sip.skype.com",           //  перед @ добавлю SIP user name, який введе користувач
                "caller-id-in-from"   : false,
                "extension-in-contact": true
            },
            params,
            gwName,
            realm,
            sipUserName,
            pass,
            i;


        if ( type === "isSipTrunk" ) {

            for (i = 0; i < gwValueObj.length; i++) {
                if (gwValueObj[i].name === "Gateway name") {
                    gwName = gwValueObj[i].value;
                } else if (gwValueObj[i].name === "Host/IP") {
                    realm = gwValueObj[i].value;
                }
            }

            params = prepareParamsForGw(REQUIRED_SIP_TRUNK_PARAMS, userParams);

            webitel.gatewayCreate({
                "name": gwName,
                //"profile": "external",
                "profile": "nonreg",
                "domain": domain || "",
                "username": "webitel",
                "password": "",
                "realm": realm,
                "params": params,
                "var": [],
                "ivar": [],
                "ovar": []
            }, function (result) {

                var res = JSON.parse(result.response);

                if ( result.status === 0 ) {
                    if ( res.gateway === '+OK created\n+OK attached\n' ) {
                        succCb(res.gateway);
                    } else {
                        errCb(res.gateway);
                    }
                } else {
                    errCb(res.gateway);
                }
            });
        }
        else if (type === "isSkypeConnect") {

            for (i = 0; i < gwValueObj.length; i++) {
                if (gwValueObj[i].name === "Gateway name") {
                    gwName = gwValueObj[i].value;
                } else if (gwValueObj[i].name === "SIP user name") {
                    sipUserName = gwValueObj[i].value;
                } else if (gwValueObj[i].name === "Password") {
                    pass = gwValueObj[i].value;
                }
            }

            REQUIRED_SKYPE_CONNECT_PARAMS["from-user"] = sipUserName + REQUIRED_SKYPE_CONNECT_PARAMS["from-user"];
            REQUIRED_SKYPE_CONNECT_PARAMS["contact-params"] = sipUserName + REQUIRED_SKYPE_CONNECT_PARAMS["contact-params"];

            params = prepareParamsForGw(REQUIRED_SKYPE_CONNECT_PARAMS, userParams);

            webitel.gatewayCreate({
                "name": gwName,
                "profile": "external",
                "domain": domain || "",
                "username": sipUserName,
                "password": pass,
                "realm": "sip.skype.com",
                "params": params,
                "var": [],
                "ivar": [],
                "ovar": []
            }, function(result) {

                var res = JSON.parse(result.response);

                if ( result.status === 0 ) {
                    if ( res.gateway === '+OK created\n+OK attached\n' ) {
                        succCb(res.gateway);
                    } else {
                        errCb(res.gateway);
                    }
                } else {
                    errCb(res.gateway);
                }
            });
        }
        else if (type === "isSipProvider") {

            for (i = 0; i < gwValueObj.length; i++) {
                if (gwValueObj[i].name === "Gateway name") {
                    gwName = gwValueObj[i].value;
                } else if (gwValueObj[i].name === "Host/IP") {
                    realm = gwValueObj[i].value;
                } else if (gwValueObj[i].name === "User name") {
                    sipUserName = gwValueObj[i].value;
                } else if (gwValueObj[i].name === "Password") {
                    pass = gwValueObj[i].value;
                }
            }

            params = prepareParamsForGw(REQUIRED_SIP_PROVIDER_PARAMS, userParams);

            webitel.gatewayCreate({
                "name": gwName,
                "profile": "external",
                "domain": domain || "",
                "username": sipUserName,
                "password": pass,
                "realm": realm,
                "params": params,
                "var": [],
                "ivar": [],
                "ovar": []
            }, function (result) {

                var res = JSON.parse(result.response);

                if ( result.status === 0 ) {
                    if ( res.gateway === '+OK created\n+OK attached\n' ) {
                        succCb(res.gateway);
                    } else {
                        errCb(res.gateway);
                    }
                } else {
                    errCb(res.gateway);
                }
            });
        }
    }
    /**
     * задає обовязкові параметри, а потім параметри, які вибрав користувач
     *
     * requiredParams (Object)
     * userParams (Object)
     *
     * return (Array) масив із всіма параметрами, які потрібно засетати при створені шлюза
     */
    function prepareParamsForGw(requiredParams, userParams) {
        var params = [],
            property,
            i;

        for (property in requiredParams) {
            params.push({
                "name":  property,
                "value": requiredParams[property]
            });
        }

        for (i = 0; i < userParams.length; i++) {
            params.push({
                "name":  userParams[i].name,
                "value": userParams[i].value
            });
        }

        return params;
    }









    //  TODO Lookup доменів
    function showDomainTable() {

        if ( $("#gwDomainTable").children().length > 1 ) {
            return;
        }

        if ( session.getRole() === "admin" ) {
            return;
        }

        webitel.domainList(function(res) {
            if (res.status === 0) {
                var domainData = this.parseDataTable();

                var domainDataHeaders = prepareHeadersToDataTable(domainData.headers);
                initDomainTable(domainDataHeaders);

                var domainDataRow = prepareDataForLoadToDataTable(domainData.headers, domainData.data);
                $('#gwDomainTable').bootstrapTable("load", domainDataRow);


                $("#gwDomainTable").dblclick(function() {
                    if ($(this).find("tbody tr:hover").length === 1) {
                        var tr = $(this).find("tbody tr:hover"),
                            domain = $(tr).find("td div").attr("value");

                        if (domain) {
                            $("#addGw-cls-tab4 .selectedDomain").text(domain);
                        }
                    }
                })
            }
            else if (res.status === 1) {
                alert.error(null, this.responseText, null);
            }
        });
    }
    function prepareHeadersToDataTable(headers) {
        var columnHead = [];
        for(var i = 0; i < headers.length; i++) {
            if (headers[i] === "domain") {
                columnHead.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'left',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value, row) {
                        return '<div class="tdDomainDiv" name="domain" value="' + value + '"></div>' + value;
                    }
                })
            } else if (headers[i] === "customer") {
                columnHead.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'left',
                    valign: 'middle',
                    sortable: true
                })
            }
            else {
                columnHead.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true
                })
            }
        }
        return columnHead;
    }
    function prepareDataForLoadToDataTable(headers, rows) {

        var rowsData = [];

        for(var i = 0; i < rows.length; i++) {

            var row = {};

            for(var j = 0; j < headers.length; j++) {
                row[headers[j]] = rows[i][j];
            }

            rowsData.push(row);
        }
        return rowsData;
    }
    function initDomainTable(domainColumns) {
        $('#gwDomainTable').bootstrapTable({
            cache: false,
            striped: true,
            pagination: true,
            pageSize: 5,
            pageList: [],
            search: true,
            columns: domainColumns
        });


    }

    return {
        createWebitel: createWebitel
    }
});