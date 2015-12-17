
define("accountSection", ["webitelConnector", "session", "alert", "fieldValidator", "AccountModel", "AccountEditView"],
    function(webitelConnector, session, alert, fieldValidator, AccountModel, AccountEditView) {

    var regOnlyNumbers = new RegExp('^[1-9]+$');

    var selectedDomain,
        USER_VARIABLES = {
            "variable_account_role": 1,
            "variable_user_context": 1,
            "variable_w_domain"    : 1,
            "variable_user_scheme" : 1
        },
        accEditRemovedVariables = [];




    //  підписатися на івент вибору домена після загрузки модуля
    //  $("#select-domain").off("domainSelected");
    $("#select-domain").on("domainSelected", function(e, domain) {

        if ( location.pathname === "/account" ) {
            selectedDomain = domain;
            init();
        }

    });


    //  Перед ініціалізацією будь-якого розділу повинен бути створений обєкт webitel
    function createWebitel() {
        if ( !window.webitel ) {
            webitelConnector.autoConnect(init);
        } else {
            init();
        }
    }

    /**
     * Місце входу в модуль
     */
    function init() {

        //  якщо домен невибраний, тоді нічого не відображати для юзера
        if ( !isDomainSelected() ) {
            alert.warning("", "Domain does not selected", 5000);
            return;
        }

        //  показати головний контенер із контентом
        $("#content-container").show();

        //  підписатися на івенти елементів розділу в залежності від ролі
        if ( session.getRole() === "root" ) {
            subsOnEvents();
            initAccountList(selectedDomain);
        } else {
            subsOnEvents();
            initAccountList(selectedDomain);
        }
    }

    function isDomainSelected() {
        if ( session.getRole() === "admin" || session.getRole() === "user" ) {
            selectedDomain = session.getDomain();
        }
        else {
            selectedDomain = $("#select-domain").attr("selectedDomain");
        }

        if ( selectedDomain ) {
            return true;
        } else {
            return false
        }
    }

    /**
     * Призначити і підписатися на івенти розділу
     */
    function subsOnEvents() {

        //  івент відображення модального вікна видалення акаунта
        $("#accountListTable").off("showRemAccModal");
        $("#accountListTable").on("showRemAccModal", function() {
            var tr = $(this).find("tbody tr:hover"),
                user = $(tr).find("td div.tdIdDiv").text(),
                domain = $(tr).find("td div.tdDomainDiv").text();

            //  ці класи в модальному вікні позначають поля акаунта, який ми хочемо видалити
            $(".remAccFormUser").text(user);
            $(".remAccFormDomain").text(domain);

            $("#rem-acc-modal").modal("show");
        });

        //  виникає коли видалений домен із списку доменів співпав із вибраним доменом у списку акаунтів
        $("#accountListTable").off("removedDomIsSelected");
        $("#accountListTable").on("removedDomIsSelected", function() {
            $('#accountListTable').bootstrapTable("destroy");
            $(".addAccInTable").prop('disabled', true);
            $(".refAccTable").prop('disabled', true);
            $(".noAccData").hide();
        });

        //  EDIT acc виникає коли потрібно відобразити модальне вікно редагування акаунта
        $("#accountListTable").off("showEditAccModal");
        $("#accountListTable").on("showEditAccModal", function() {

            var tr = $(this).find("tbody tr:hover"),
                name = $(tr).find("td div.tdIdDiv").text(),
                domain = $(tr).find("td div.tdDomainDiv").text(),
                role = $(tr).find("td div.tdRoleDiv").text().toLowerCase(),
                isAgent = ($(tr).find("td div.tdAgentDiv").text() === "true" ? true : false);

            getAccData(name, domain, function(variables, parameters) {
                var extension = "";
                var useVoicemail = false;
                var accessPin = "";
                var callerName = "";

                for (var i=0; i<parameters.length; i++) {
                    var elem = parameters[i];
                    if (elem.key === "webitel-extensions")
                        extension = elem.value;
                    else if (elem.key === "vm-enabled")
                        useVoicemail = elem.value;
                    else if (elem.key === "vm-password")
                        accessPin = elem.value;
                }

                for (var i=0; i<variables.length; i++) {
                    var elem = variables[i];
                    if (elem.key === "effective_caller_id_name") {
                        callerName = elem.value;
                    }
                }

                var accModel = new AccountModel({
                    name: name,
                    callerName: callerName,
                    domain: domain,
                    extension: extension,
                    accessPin: accessPin,
                    useVoicemail: useVoicemail,
                    role: role,
                    isAgent: isAgent,
                    variables: variables,
                    parameters: parameters
                });
                var accEditView = new AccountEditView({
                    model: accModel
                });
                //  показати модельне вікно
                $("#edit-acc-modal").modal("show");

                $("#edit-acc-modal").off("hide.bs.modal");
                $("#edit-acc-modal").on("hide.bs.modal", function() {
                    if ( $("#edit-acc-modal .modal-body").length > 0 ) {
                        accEditView.remove();
                    }
                });
                accEditView.render();
            });
        });

        //  клік по кнопці обновити таблицю акаунтів
        $(".refAccTable").off("click");
        $(".refAccTable").on("click", function() {
            var el = $(this);
            el.niftyOverlay('show');
            setTimeout(function() {
                el.niftyOverlay('hide');
            }, 1500);
            $("#accountListTable").trigger("refreshAccTable");
        });

        //  обновляє таблицю акаунтів
        $("#accountListTable").off("refreshAccTable");
        $("#accountListTable").on("refreshAccTable", function() {
            initAccountList(selectedDomain);
        });

        //  показати модальне вікно створення акаунта.
        $(".addAccInTable").off("click");
        $(".addAccInTable").on("click", function() {
            $("#add-acc-modal").modal("show");
        });

        //  перед показом модального вікна створення акаунті, підписатися на івенти
        $("#add-acc-modal").off("shown.bs.modal");
        $("#add-acc-modal").on("shown.bs.modal", function() {

            var variablesLayout = function() {
                return $.parseHTML('<div class="form-group acc-create-variables-field">' +
                                        '<label class="col-sm-1 control-label">Key</label>' +
                                        '<div class="col-sm-4">' +
                                            '<input class="form-control input-sm acc-create-var-key" type="text" >' +
                                        '</div>' +

                                        '<label class="col-sm-1 control-label">Value</label>' +
                                        '<div class="col-sm-4">' +
                                            '<input type="text" class="form-control input-sm acc-create-var-value">' +
                                        '</div>' +

                                        '<div class="col-sm-2" style="line-height: 29px;">' +
                                            '<span class="acc-create-var-remove btn btn-default btn-xs">remove</span>' +
                                        '</div>' +
                                    '</div>');
            };

            //  підписатися на клік по кнопці додавання нової варібли
            $("#acc-create-add-var").off("click");
            $("#acc-create-add-var").on("click", function() {
                $("#acc-create-variables-body").append(variablesLayout());

                $(".acc-create-var-remove").off("click");
                $(".acc-create-var-remove").on("click", function() {
                    this.parentElement.parentElement.remove();
                });
            });


        });

        //  івент переключення між табами
        $('.accountTabs a[data-toggle="tab"]').off('shown.bs.tab');
        $('.accountTabs a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            if ($(e.target).attr("isDomain")) {
                showDomainTable();
            }
        });

        //  оновити таблицю доменів
        $(".refDomTable").off("click");
        $(".refDomTable").on("click", function() {
            var el = $(this);
            el.niftyOverlay('show');
            var timer = setInterval(function() {
                el.niftyOverlay('hide');
            }, 1500);
            showDomainTable();
        });

        //  додати новий домен
        $(".addNewDomInTable").off("click");
        $(".addNewDomInTable").on("click", function() {
            $("#add-dom-modal").modal("show");
        });

        //  видаляє домен
        $("#domListTable").off("remDom");
        $("#domListTable").on("remDom", function() {
            var tr = $(this).find("tbody tr:hover"),
                domain = $(tr).find("td div.tdDomainDiv").attr("value");
            $(".remDomFormModal").text(domain);
            $("#rem-dom-modal").modal("show");
        });

        //  ініціалізація niftyOverlay
        $('.refAccTable').niftyOverlay({
            title: 'Loading...'
        });
        $('.refDomTable').niftyOverlay({
            title: 'Loading...'
        });

        //  Клік по checkBox при створенні акаунта
        $("#acc-agent-field").off("click");
        $("#acc-agent-field").on("click", function(e) {
            var parent         = e.target.parentElement,            //  містить в собі прихований checkBox
                hiddenCheckbox = e.target;

            if ( hiddenCheckbox.checked === true ) {
                $(parent).addClass("active");
                $("#paramsTab").show();
            } else if ( hiddenCheckbox.checked === false ) {
                $(parent).removeClass("active");
                $("#paramsTab").hide();
                $('#paramsVarsTab a[href="#acc1"]').tab('show');
            }
        });

        //  checkbox чи використовувати голосову пошту
        $("#acc-useVoiceMail-field").off("click");
        $("#acc-useVoiceMail-field").on("click", function(e) {
            var parent         = e.target.parentElement,            //  містить в собі прихований checkBox
                hiddenCheckbox = e.target;


            if ( hiddenCheckbox.checked ) {
                $(parent).addClass("active");
            } else {
                $(parent).removeClass("active");
            }
        });


        //  Parameters && Variables Tab
        $('#paramsVarsTab a').click(function (e) {
            e.preventDefault();
            $(this).tab('show')
        })
    }


/**                                     ACCOUNT TABLE
 * ********************************************************************************************************************/

    /**
     * Отримати список акаунтів. Ініціалізувати таблицю акаунтів
     */
    function initAccountList(domain) {
        webitel.userList(domain, function(res) {
            if (res.status == 0) {
                //  Якщо відповідь пуста, нема смислу ініціалізувати тиблицю, так як невідомо, які колонки в неї
                if (this.responseText.length > 2) {
                    $(".noAccData").hide();

                    var accCol = prepareAccCol(JSON.parse(this.responseText));
                    initAccountTable(accCol);

                    var accRow = prepareAccRow(JSON.parse(this.responseText));
                    loadRowToAccTable(accRow);
                } else {
                    //  видалити таблицю акаунтів, зробити недоступною кнопку оновлення, показати контейнер з повідомленням
                    $('#accountListTable').bootstrapTable("destroy");
                    if (!selectedDomain) {
                        $(".addAccInTable").prop('disabled', true);
                    }
                    $(".refAccTable").prop('disabled', true);
                    $(".noAccData").show();
                }
            }
            else if (res.status == 1) {
                alert.error(null, this.responseText, null);
            }
        })
    }

    /**
     * Ініціалізує таблицю акаунтів. Задає параметри dataTable
     * @param {Array} accColName масив обєктів, кожен із яких описує окрему колонку
     */
    function initAccountTable(accColName) {
        $('#accountListTable').bootstrapTable({
            cache: false,
            striped: true,
            pagination: true,
            pageSize: 10,
            pageList: [5, 10, 20, 50],
            search: true,
            //showColumns: true,
            //showRefresh: true,
            columns: accColName
        });
    }

    /**
     * Приводить масив назв колонок до потрібного формату
     * @param {Object} необроблені дані
     * @returns {Array} масив спеціально підготовлених колонок для DataTable
     */
    function prepareAccCol(data) {

        /**
         * 05.02.2015 BugFix Підготовлює масив колонок headers
         */
        var headers = [];

        for (var property in data) {

            var element = data[property];
            for (var p in element) {
                headers.push(p)
            }
            break;
        }
        /**********************************************************/

        var accColumnName = [];
        for(var i = 0; i < headers.length; i++) {
            if (headers[i] === "id") {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value) {
                        return '<div class="tdIdDiv">' + value + '</div>';
                    }
                })
            }
            else if (headers[i] === "domain") {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value) {
                        return '<div class="tdDomainDiv">' + value + '</div>';
                    }
                })
            }
            else if (headers[i] === "online") {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value) {
                        if (value === true) {
                            return '<div class="tdOnlineDiv label label-table label-success">' + value + '</div>';
                        } else if (value === false) {
                            return '<div class="tdOnlineDiv label label-table label-danger">' + value + '</div>';
                        } else {
                            return '<div class="tdOnlineDiv" name="">' + value + '</div>';
                        }
                    }
                })
            }
            else if (headers[i] === "state") {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value) {
                        if (value === "ONHOOK") {
                            return '<div class="tdStateDiv label label-table label-success">' + value + '</div>';
                        } else if (value === "NONREG") {
                            return '<div class="tdStateDiv label label-table label-default">' + value + '</div>';
                        } else if (value === "ISBUSY") {
                            return '<div class="tdStateDiv label label-table label-warning">' + value + '</div>';
                        } else {
                            return '<div class="tdStateDiv">' + value + '</div>';
                        }
                    }
                })
            }
            else if (headers[i] === "role") {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value) {
                        return '<div class="tdRoleDiv">' + value + '</div>';
                    }
                })
            }
            else if (headers[i] === "descript") {
                continue;
            }
            else if (headers[i] === "agent") {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true,
                    formatter: function(value) {
                        if (value === "true") {
                            return '<div class="tdAgentDiv label label-table label-success">' + value + '</div>';
                        } else if (value === "false") {
                            return '<div class="tdAgentDiv label label-table label-danger">' + value + '</div>';
                        } else {
                            return '<div name="">' + value + '</div>';
                        }
                    }
                })
            }
            else {
                accColumnName.push({
                    field: headers[i],
                    title: headers[i],
                    align: 'center',
                    valign: 'middle',
                    sortable: true
                })
            }
        }

        // Додаєм ще одну колонку, яка містить іконку видалення домена
        if ( session.getRole() === "root" || session.getRole() === "admin" ) {
            accColumnName.push({
                field: "actions",
                title: "",
                align: 'center',
                valign: 'middle',
                sortable: false,
                formatter: function () {
                    return '<button class="btn btn-xs btn-mint btn-icon icon-xs fa fa-pencil-square-o" onclick="WAdmin.AccountSection.showEditAccModal();"></button> ' +
                        '<button class="btn btn-xs btn-danger btn-icon icon-xs fa fa-times" onclick="WAdmin.AccountSection.showRemAccModal();"></button>';
                }
            });
        }
        return accColumnName;
    }

    /**
     * Приводить масив колонок до потрібного стану
     * @param {Array} необроблені дані
     * return {Array} масив підготовлених обєктів для заповнення даними dataTable
     */
    function prepareAccRow(data) {
        var rowsData = [];

        for (var p in data) {
            data[p].name = decodeURIComponent(data[p].name);
            rowsData.push(data[p]);
        }
        return rowsData;
    }

    /**
     * Загружає дані в таблицю акаунтів
     * @param {Array} rows масив підготовлених обєктів
     */
    function loadRowToAccTable(rows) {
        $('#accountListTable').bootstrapTable("load", rows);
    }

/**                                     DOMAIN TABLE
 **********************************************************************************************************************/

    function showDomainTable() {
        webitel.domainList(function(res) {
            if (res.status === 0) {
                var domainData = this.parseDataTable();

                var domainDataHeaders = prepareHeadersToDomTable(domainData.headers);
                initDomTable(domainDataHeaders);

                var domainDataRow = prepareDataForLoadToDomTable(domainData.headers, domainData.data);
                $('#domListTable').bootstrapTable("load", domainDataRow);
            }
            else if (res.status === 1) {
                alert.error(null, this.responseText, null);
            }
        });
    }
    function prepareHeadersToDomTable(headers) {
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

        columnHead.push({
            field: headers[i],
            title: headers[i],
            align: 'center',
            valign: 'middle',
            formatter: function() {
                return '<button class="btn btn-xs btn-danger btn-icon icon-xs fa fa-times" onclick="WAdmin.AccountSection.showRemDomModal();"></button>';
            }
        })
        return columnHead;
    }
    function prepareDataForLoadToDomTable(headers, rows) {

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
    function initDomTable(domainColumns) {
        $('#domListTable').bootstrapTable({
            cache: false,
            striped: true,
            pagination: true,
            pageSize: 10,
            pageList: [],
            search: true,
            columns: domainColumns
        })
    }

    // Генерує івент видалення акаунта
    window.WAdmin.AccountSection.showRemAccModal = function() {
        $("#accountListTable").trigger("showRemAccModal");
    };

    //  Виклкається з модального вікна видалення акаунта
    window.WAdmin.AccountSection.remAccModal = function() {
        var user = $(".remAccFormUser").text(),
            domain = $(".remAccFormDomain").text();

        webitel.userRemove(user, domain, function(res) {
             if (res.status === 0) {
                 $("#accountListTable").trigger("refreshAccTable");
                 $("#rem-acc-modal").modal("hide");
                 alert.success(null, this.responseText, 3000);
                 // обновити таблицю акаунтів
             }
             else if (res.status === 1) {
                 alert.error(null, this.responseText, 10000);
             } else {
                 alert.error(null, this.responseText, 10000);
            }
        })
    };

    //  Виклкається з модального вікна створення акаунта
    window.WAdmin.AccountSection.addNewAcc = function() {
        var accData = $(".addNewAccForm").serializeArray(),
            accRole = $("#acc-create-role").find(":selected").val(),
            accLogin,           //  обовязкове для заповнення
            accCallerName,      //  обовязкове для заповнення
            accPass,            //  необовязкове
            accExtension,       //  необовязкове, але тобу підставити значення логіна
            accIsVoicemail = $("#acc-useVoiceMail-field input")[0].checked,
            accAccessPIN,
            accIsAgent = $("#acc-agent-field input")[0].checked,
            i,
            attr = {
                parameters: [],
                variables: []
            },
            parentEl,
            accCreateVariables = $("#acc-create-variables-body .acc-create-variables-field"),
            variableKey,
            variableValue,
            dataForValid = {};


        for (i = 0; i < accData.length; i++) {
            if ( accData[i].name === "login" ) {
                accLogin = accData[i].value;
            }
            else if ( accData[i].name === "pass" ) {
                accPass = accData[i].value;
            }
            else if ( accData[i].name === "callerName" ) {
                accCallerName = accData[i].value;
            }
            else if ( accData[i].name === "extension" ) {
                accExtension = accData[i].value;
            }
            else if ( accData[i].name === "vm-password" ) {
                accAccessPIN = accData[i].value;
            }
        }

        dataForValid = {
            "login" : accLogin,
            "pass"  : accPass,
            "callerName"  : accCallerName
        };

        fieldValidator.config = {
            "login": ["isNotEmpty"],
            "callerName": ["isNotEmpty"],
            "pass" : ["isNotEmpty"]
        };
        fieldValidator.validate(dataForValid);


        //  видалити всі класи для показування помилок
        $(".addNewAccForm").find("div.warning").removeClass("warning");

        if ( fieldValidator.hasErrors() ) {
            for ( i in fieldValidator.messages ) {
                parentEl = $(".addNewAccForm").find("input[name=" + i +"]").parent();
                $(parentEl).addClass("warning");
                $(parentEl).find("small.error-block").text(fieldValidator.messages[i]["msg"]);
            }
            return;
        }

        if ( accCallerName ) {
            //attr.variables.push("effective_caller_id_name='" + encodeURIComponent(accCallerName) + "'");
            attr.variables.push("effective_caller_id_name='" + accCallerName + "'");
        }

        //  якщо extension не заданий, присвоїти йому значення логіна
        if ( !accExtension ) {
            accExtension = accLogin;
        }
        if ( accExtension ) {
            attr.parameters.push("webitel-extensions=" + accExtension);
        }


        //  parameters for VoiceMail
        if ( accIsVoicemail ) {
            attr.parameters.push("vm-enabled=true");
            attr.parameters.push("http-allowed-api=voicemail");
        } else {
            attr.parameters.push("vm-enabled=false");
            attr.parameters.push("http-allowed-api=");
        }

        //  parameter for AccessPIN
        attr.parameters.push("vm-password=" + accAccessPIN);


        //  вказати значення чи він оператор чи ні
        attr.parameters.push("cc-agent=" + accIsAgent);

        //  проходимся по всіх доданих варіблах. Якщо в UI не вказаний key - видалити це поле
        for ( i = 0; i < accCreateVariables.length; i++) {
            variableKey = $(accCreateVariables[i]).find(".acc-create-var-key").val();
            variableValue = $(accCreateVariables[i]).find(".acc-create-var-value").val();

            if ( variableKey ) {
                attr.variables.push(variableKey + "=" + variableValue);
            } else {
                $(accCreateVariables[i]).remove();
            }
        }

        //  region Add parameters if is agent
        if ( accIsAgent ) {
            var paramInputs = $("#agentDefParams input");
            for(var i = 0; i < paramInputs.length; i++) {
                var paramKey = paramInputs[i].dataset.name;
                var paramValue = paramInputs[i].value;

                //  cc-agent-contact can be only number > 0
                if (paramKey === "cc-agent-contact") {
                    if (regOnlyNumbers.test(paramValue)) {
                        paramValue = "'{originate_timeout=" + paramValue + ",presence_id=$[id]@$[domain]}$[dial-string]'";
                    } else {
                        continue;
                    }
                }

                attr.parameters.push(paramKey + "=" + paramValue);
            }
        }
        //  endregion

        webitel.userCreate(accRole, accLogin, accPass, selectedDomain, attr, function(res) {
            if (res.status === 0) {
                $("#accountListTable").trigger("refreshAccTable");
                $(".refAccTable").removeAttr("disabled");
                alert.success(".addNewAccForm", this.responseText, 3000);
            } else if (res.status === 1) {
                alert.error(".addNewAccForm", this.responseText, 5000);
            } else {
                alert.error(".addNewAccForm", this.responseText, 5000);
            }
        })
    };

    //  Виклкається з модального вікна створення домена
    window.WAdmin.AccountSection.addNewDom = function() {

        var domData = $(".addNewDomForm").serializeArray(),
            domName,
            domCust,
            language = $("#add-domain-language").find(":selected").attr("value"),
            provider = $("#add-domain-provider").find(":selected").attr("value"),
            options = {
                "parameters": [],
                "variables": []
            },
            i;

        for (i = 0; i < domData.length; i++) {
            if (domData[i].name === "name") {
                domName = domData[i].value;
            } else if (domData[i].name === "customer") {
                domCust = domData[i].value;
            }
        }

        if ( !domName ) {
            alert.warning(".addNewDomForm", "Domain is required", 3000);
            return;
        }

        if ( !domCust ) {
            alert.warning(".addNewDomForm", "CustomerId is required", 3000);
            return;
        }

        if ( language ) {
            options.variables.push("default_language=" + language);
        }

        if ( provider ) {
            options.parameters.push("provider=" + provider);
        }

        webitel.domainCreate(domName, domCust, options, function(res) {
            if (res.status === 0) {
                //  згенерувати клік по кнопці обновити таблицю доменів
                $(".refDomTable").trigger("click");
                alert.success(".addNewDomForm", this.responseText, 3000);
            } else if (res.status === 1) {
                alert.error(".addNewDomForm", this.responseText, 10000);
            } else {
                alert.error(".addNewDomForm", this.responseText, 10000);
            }
        })
    };

    //  Показати модальне вікно видалення домена
    window.WAdmin.AccountSection.showRemDomModal = function() {
        $("#domListTable").trigger("remDom");

    };

    //  Підтвердження видалення домена із модального вікна
    window.WAdmin.AccountSection.remDomModal = function() {
        var domain = $(".remDomFormModal").text();
        webitel.domainRemove(domain, function(res) {
            if (res.status === 0) {
                $("#rem-dom-modal").modal("hide");
                $(".refDomTable").trigger("click");
                alert.success(null, this.responseText, 3000);

                //  івент видалення домена. Потрібно перечитати lookup доменів
                $("#select-domain").trigger("domainRemoved");

                if ( selectedDomain === $(".remDomFormModal" ).text()) {
                    $("#accountListTable").trigger("removedDomIsSelected");
                }
            }
            else if (res.status === 1) {
                alert.error(null, this.responseText, null);
            } else {
                alert.error(null, this.responseText, null);
            }
        })
    };

    //  Показати модальне вікно редагування акаунта. Генерую цей івент для таблиці акаунтів, для того, щоб легко було витягнути дані по вибраному акаунту
    WAdmin.AccountSection.showEditAccModal = function() {
        $("#accountListTable").trigger("showEditAccModal");
    };



    WAdmin.AccountSection.editAccRoleModal = function(scope) {
        if ($('.editRoleLink').is(':visible')) {
            $('.editRoleLink').hide();
            $('.editRoleLinkCancel').show();

            $(".editRoleDiv").hide();
            $(".selectpickerRoleDiv").show();
        } else {
            $('.editRoleLink').show();
            $('.editRoleLinkCancel').hide();

            $(".editRoleDiv").show();
            $(".selectpickerRoleDiv").hide();
        }
    };
    WAdmin.AccountSection.editAccPassModal = function(scope) {
        if ($('.editPassLink').is(':visible')) {
            $('.editPassLink').hide();
            $('.editPassLinkCancel').show();

            $(".editPassDisabled").hide();
            $(".editPassEnabled").show();

        } else {
            $('.editPassLink').show();
            $('.editPassLinkCancel').hide();

            $(".editPassDisabled").show();
            $(".editPassEnabled").hide();
            $(".editPassEnabled").val("");
        }
    };
    WAdmin.AccountSection.editAccSaveModal = function() {
        var
            login  = $("#edit-acc-modal .editAccForm .acc-edit-name").val(),
            domain = $("#edit-acc-modal .editAccForm .acc-edit-domain").val(),
            role   = $("#edit-acc-modal .editAccForm .select-wrap").find(":selected").val(),

            pass = $(".acc-new-pass-input").val(),
            isChangePass = $(".acc-new-pass-wrap").css('display'),

            isAgent = $("#edit-acc-modal .editAccForm .acc-isAgent").find("input")[0].checked,

            extension = $(".acc-edit-extension").val(),
            isChangeExtension = $(".acc-edit-extension").attr("isChange"),

            accessPIN = $(".acc-edit-accessPIN").val(),
            isChangeAccessPIN = $(".acc-edit-accessPIN").attr("isChange"),

            useVMail = $("#edit-useVMail-label").find("input")[0].checked,

            atrs = {
                "parameters": [],
                "variables": []
            },
            updateVariables = $("#acc-variables-body .acc-variables-field"),
            variableKey,
            variableValue,
            i,
            dataForValid = {};


        //  зміна ролі в користувача
        if ( role === "user" ) {
            atrs.parameters.push("role=user");
        } else if ( role === "admin") {
            atrs.parameters.push("role=admin");
        }

        //  передати в параметрах чи він оператор чи ні
        atrs.parameters.push("cc-agent=" + isAgent);

        //  додати до параметрів extensions
        if ( isChangeExtension === "true" || isChangeExtension === true ) {
            atrs.parameters.push("webitel-extensions=" + extension);
        }

        //  set Access PIN
        if ( isChangeAccessPIN === "true" || isChangeAccessPIN === true ) {
            atrs.parameters.push("vm-password=" + accessPIN);
        }

        //  сетить в параметри значення голосової пошти
        if ( useVMail ) {
            atrs.parameters.push("vm-enabled=true");
            atrs.parameters.push("http-allowed-api=voicemail");
        } else {
            atrs.parameters.push("vm-enabled=false");
            atrs.parameters.push("http-allowed-api=");
        }

        //  задати пароль
        if ( isChangePass !== "none" ) {
            atrs.parameters.push("password=" + pass);
        }

        //  пройтися циклом по всіх варіблах
        for ( i = 0; i < updateVariables.length; i++ ) {
            variableKey = $(updateVariables[i]).find(".acc-var-key").val();
            variableValue = $(updateVariables[i]).find(".acc-var-value").val();

            //  перевірити variableKey у  масиві усіх видалених
            //  пройтися циклом по всіх видалених елементах
            for ( var g = 0; g < accEditRemovedVariables.length; g++ ) {
                if ( accEditRemovedVariables[g] === variableKey ) {
                    accEditRemovedVariables.splice(g, 1);
                }
            }

            atrs.variables.push(variableKey + "=" + variableValue);
        }

        //  добавити варібли які потрібно видалити
        for ( i = 0; i < accEditRemovedVariables.length; i++ ) {
            atrs.variables.push(accEditRemovedVariables[i] + "=");
        }

        webitel.userUpdate(login, domain, atrs, function(res) {

            if ( res.status === 0 ) {
                //  задати полю extension
                $(".acc-edit-extension").attr("isChange", "false");

                alert.success("#edit-acc-modal .editAccForm", "User was updated", 3000);
                $("#accountListTable").trigger("refreshAccTable");
            } else if ( res.status === 1 ) {
                alert.error("#edit-acc-modal .editAccForm", this.responseText, 10000);
            } else {
                alert.error("#edit-acc-modal .editAccForm", this.responseText, 10000);
            }
        });
    };


    /**
     * Gets account data by WebSocket
     * @param {String} name
     * @param {String} domain
     * @param callback pass variables and parameters
     */
    function getAccData(name, domain, callback) {
        webitel.user(name, domain || "", function(atrs) {
            if ( atrs.status !== 0 ) {
                alert.error(atrs.response);
                return;
            }

            var res = JSON.parse(atrs.response);
            var variables = [];
            var parameters = [];

            for (var prop in res) {
                if (prop.indexOf("variable_") !== -1) {
                    variables.push({
                        "key": prop.replace("variable_", ""),
                        "value": res[prop]
                    });
                } else {
                    parameters.push({
                        "key": prop,
                        "value": res[prop]
                    });
                }
            }

            callback(variables, parameters);
        });
    }



    return {
        createWebitel: createWebitel
    }
});