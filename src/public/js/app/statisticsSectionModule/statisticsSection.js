
/**
 * TODO видалити старі модулі locStor і т.п.
 *
 *
 * Bugs
 * 1. Якщо відкрити статистику за великий період, перейти на останню сторінку, а потім вибрати показати статистику за сьогодні, воно нічого не покаже з 1 разу
 */


define("statisticsSection", ["webitelConnector", "session", "periodFilter", "locStor", "cookStor", "browser", "audioPlayer", "alert", "jsonViewver", "detect", "excel-builder", "fileSaver"],
    function(webitelConnector, session, periodFilter, locStor, cookStor, browser, _audioPlayer, alert, jsonViewver, detect, EB, fileSaver) {

        
        var 
            //  передаю цей контейнер в модуль фільтрації, щоб він знав для якого контейнера генерувати івенти, а таклж в цьому модулі підписуюсь на івенти цього контейнера
            CONT_FOR_DATE_FILTER_EVENT = ".periodFilterCont",
            defaultColumns = {
                "callflow.caller_profile.caller_id_name": "Caller name",
                "callflow.caller_profile.caller_id_number": "Caller number",
                "callflow.caller_profile.destination_number": "Destination number",

                "callflow.times.created_time": "Created time",

                "variables.billsec": "Billsec",
                "variables.duration": "Duration",
                "variables.webitel_direction": "Direction",

                "variables.effective_caller_id_name": "Effective caller id name",
                "variables.effective_caller_id_number": "Effective caller id number",


                //  не відображаються
                "variables.uuid": "Uuid",
                "variables.hangup_cause"  : "Hangup cause",
                "callflow.times.answered_time": "Answered time",
                "callflow.times.bridged_time": "Bridged time",
                "callflow.times.hangup_time": "Hangup time",
                "variables.last_bridge_to": "Last bridge to"


            },
            associativeColumns = {
                "Uuid": "variables uuid",
                "Billsec": "variables billsec",
                "Duration": "variables duration",
                "Direction": "variables webitel_direction",

                "Last bridge to": "variables last_bridge_to",
                "Effective caller id name": "variables effective_caller_id_name",
                "Effective caller id number": "variables effective_caller_id_number",


                "Answered time" : "callflow 0 times answered_time",
                "Bridged time"  : "callflow 0 times bridged_time",
                "Hangup time"   : "callflow 0 times hangup_time",
                "Hangup cause"  : "variables hangup_cause",

                "Created time"      : "callflow 0 times created_time",
                "Caller name"       : "callflow 0 caller_profile caller_id_name",
                "Caller number"     : "callflow 0 caller_profile caller_id_number",
                "Destination number": "callflow 0 caller_profile destination_number"
            },
            statDateFilter = {},
            statDomainFilter,
            statBsTable,
            cdrServerUrl,
            token,
            key,
            totalRow,
            generateNewExcelel = true,
            maxRowsToExport = 20000,

            hh, mm, ss;



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
            //showFilter();
            periodFilter.init(".periodFilterCont");
            periodFilter.setEventCont(CONT_FOR_DATE_FILTER_EVENT);

            //  повинен викликатися тільки після ініціалізації модуля фільтрації
            getDateFilterFromStorage();
            getDomainFilterFromStorage();

            var statisticsColumns = prepareStatColumns();
            initStatTable(statisticsColumns);

            subscribeOnEvent();

            initExportToExcel();
        }

        /**
         * Підписується на загальні івенти елементів інтерфейсу, бібліотек і на свої кастомні івенти
         */
        function subscribeOnEvent() {

            //  Підписується на івент зміни дати, для певного контейнера. Приходить від модуля фіксованого періоду дат
            $(CONT_FOR_DATE_FILTER_EVENT).on("customChangeDate", function(e, startDate, endDate) {
                
                //  при змінні дати, змінювати флаг, щоб згенерувати новий файл
                generateNewExcelel = true;

                setDateFilterInStorage(startDate, endDate);
                //  приводить дату з dd.mm.yy to mm/dd/yy, а потім до потрібного timestamp
                statDateFilter = {
                    "callflow.times.created_time": {
                        "$gte": new Date(startDate.replace(/(\d{2}).(\d{2}).(\d{4})/, "$2/$1/$3")).getTime() * 1000,
                        "$lte": new Date(endDate.replace(/(\d{2}).(\d{2}).(\d{4})/, "$2/$1/$3") + " 23:59:59").getTime() * 1000
                    }
                };
                $(statBsTable).bootstrapTable('refresh');
            });

            
            $(CONT_FOR_DATE_FILTER_EVENT).on("sortByDomain", function(e, domain){
                statDomainFilter = domain;
                $(statBsTable).bootstrapTable('refresh');
            });

            //  двойний клік по таблиці списку доменів, для вибору домена для фільтрації
            $("#statDomainListTable").dblclick(function() {
                //  при змінні, змінювати флаг, щоб згенерувати новий файл
                generateNewExcelel = true;
                alert("!!");
                var domain = $("#statDomainListTable tbody tr:hover td .tdDomainDiv").attr("value");
                $(CONT_FOR_DATE_FILTER_EVENT).trigger("sortByDomain",[domain]);
                //  показати на фільтрі вибраний домен
                $("#statDomainFilterValue").text(domain);

                setDomainFilterInStorage(domain);
                $("#stat-domain-lookup-modal").modal("hide");
            });

            //  показати таблицю доменів
            $(".domainFilterCont").on("click", function() {

                showDomainTable();
            });

            //  видалити фільтрацію по домену
            $("#statRemDomainFilterValue").on("click", function() {
                if (statDomainFilter) {

                    //  при змінні, змінювати флаг, щоб згенерувати новий файл
                    generateNewExcelel = true;

                    statDomainFilter = undefined;
                    $("#statDomainFilterValue").text("Domain");
                    //  зберегти в сховище, що домен видалений
                    setDomainFilterInStorage(undefined);
                    $(statBsTable).bootstrapTable('refresh');
                }
            });
        }



        /**                                 STATISTICS TABLE
         ******************************************************************************************************************/

        /**
         * Ініціалізує таблицю статистики. Задає початкові параметри, колонки і т.п. Відправляє запит за даними на віддалений
         * сервер. Отримай результат обробляє і далі працює ліба
         */
        function initStatTable(columns) {
            //  не працює пошук даних по таблиц. Походу це через те що задана серверна сторона. Тобто все відбувається на сервері
            statBsTable = $("#statisticsBootstrapTable").bootstrapTable({
                url: "/statistics/getData",
                method: 'post',
                cache: true,
                contentType: 'application/json',    //  формат запиту даних на віддалений сервер
                dataType: 'json',                   //  тип даних який очікуєм прийняти від віддаленого сервера
                pagination: true,
                sidePagination: 'server',
                pageSize: 10,
                pageList: [5, 10, 15, 20, 25, 50, 100],
                queryParams: function(params) {

                    //  находить потрібний ключ для колонки і записує його в обєкт параметрів
                    if ( params.sort !== undefined && params.order !== undefined ) {
                        for (var i in defaultColumns) {
                            if (defaultColumns[i] === params.sort) {
                                params.sort = i;
                                break;
                            }
                        }

                        if (params.order === "desc") {
                            params.order = -1;
                        } else if (params.order === "asc") {
                            params.order = 1;
                        } else {
                            console.error("Check this code.");
                        }
                    }

                    params.pageNumber = params.offset / params.limit + 1;
                    params.columns = null;
                    params.filter = statDateFilter;
                    
                    //  фильтрация по домену
                    if ( statDomainFilter ) {
                        params["filter"]["variables.domain_name"] = statDomainFilter;
                    } 
                    else {
                        if ( params["filter"].hasOwnProperty("variables.domain_name" )) {
                            delete params["filter"]["variables.domain_name"];
                        }
                    }

                    //  фільтрація по ролі
                    if ( session.getRole() === "user" ) {
                        //  додатково фільтрувати по 
                        //params["filter"]["variables.domain_name"] = statDomainFilter;
                    } 
                    else {

                    }

                    return params;
                },
                //  Приводим дані lо потрібної форми і вертаєм назад
                responseHandler: function(res) {
                    //cdrServerUrl = res.cdrServer + "getFile?uuid=";
                    cdrServerUrl = res.cdrServer + "/api/v2/files/";
                    token = "access_token=" +  res["x-access-token"];
                    key = "x_key=" + res["x-key"];

                    totalRow = res.total || "";

                    return prepareStatRows(res);
                },
                columns: columns
            })
            .on("load-error.bs.table", function(tableEvent, status) {
                /**
                 * Опис всіх помилок
                 *  - 400 токен просрочений
                 *  - 401, 500 токен або ключ просрочені або неправильні. Попросити користувача перезайти
                 *  - 501 Необроблена помилка на сервері. Попросити звернутися до адміністратора
                 *  - 503 Core server Unavailable
                 *  - 1000 коли відповідь від core, не може бути розпаршена
                 */

                if ( status === 400 ) {
                    console.error("You are unauthorized. Token expired!");
                    alert.error("", "You are unauthorized. Token expired!", null);
                }
                else if ( status === 401 ) {
                    console.error("You are unauthorized. Please relogin!");
                    alert.error("", "You are unauthorized. Please relogin!", null);
                }
                else if ( status === 500 ) {
                    console.error("You are unauthorized. Bad token or secret. Please relogin!");
                    alert.error("", "You are unauthorized. Bad token or secret. Please relogin!", null);
                }
                else if ( status === 501 ) {
                    //  сервер не знає як обробити помилку, тому вертаю 501
                    console.error("Not Implemented: server Webitel-UI does not support the capabilities required to process the request.");
                    alert.error("", "Not Implemented: server Webitel-UI does not support the capabilities required to process the request.", null);
                }
                else if ( status === 503 ) {
                    console.error("Core server Unavailable");
                    alert.error("", "Core server Unavailable", null);
                }
                else if ( status === 1000 ) {
                    console.error("Bad response from Core server. Cannot parse JSON");
                    alert.error("", "Bad response from Core server. Cannot parse JSON", null);
                }
                else {
                    console.error("Something went wrong! Unhandled error! status=" + status);
                    alert.error("", "Something went wrong ! Unhandled error! status=" + status, null);
                }
            })
            .on("dbl-click-row.bs.table", function(e, row, element) {
                if ($(element.next()).hasClass("statMoreInfoTr")) {
                    $(element.next()).remove();
                    return;
                }

                $("#statisticsBootstrapTable .statMoreInfoTr").remove();
                $("#statisticsBootstrapTable tbody tr").removeClass("last-bridge-to");



                var
                    moreInfoTr  = $("<tr>").attr({ "class": "statMoreInfoTr" }),
                    colSpan     = element.children().length,
                    td          = $('<td>').attr({ "colspan": colSpan }),
                    moreInfoCont= $('<div>').attr({ "id": "aditionalCdrInfo" }).css({ "width": "98%" }),
                    fieldsArray = [ "Answered time", "Bridged time", "Hangup time", "Hangup cause" ],
                    i, j,
                    audioPlayer,

                    allRows,
                    allTrs,
                    lastBridgeRow,
                    fileName, createdTime, callerNumber, destinationNumber, year, hour;


                //  27.07.2015  if variables.last_bridge_to exists, find field  with same uuid
                //  bad way.
                if ( row["Last bridge to"] ) {
                    allRows = $("#statisticsBootstrapTable").bootstrapTable("getData");
                    allTrs = $("#statisticsBootstrapTable tbody tr");

                    for ( i = 0; i < allRows.length; i++ ) {
                        if ( allRows[i].Uuid === row["Last bridge to"] ) {
                            lastBridgeRow = allRows[i];
                            for ( j = 0; j < allTrs.length; j++ ) {
                                if ( //$(allTrs[j]).find("td")[0].innerText === lastBridgeRow["Caller name"] &&
                                     //$(allTrs[j]).find("td")[1].innerText === lastBridgeRow["Caller number"] &&
                                     $(allTrs[j]).find("td")[2].innerText === lastBridgeRow["Destination number"] &&
                                     $(allTrs[j]).find("td")[3].innerText === lastBridgeRow["Created time"] &&
                                     $(allTrs[j]).find("td")[4].innerText === lastBridgeRow["Billsec"] &&
                                     $(allTrs[j]).find("td")[5].innerText === lastBridgeRow["Duration"] &&
                                     $(allTrs[j]).find("td")[6].innerText === lastBridgeRow["Direction"] &&
                                     $(allTrs[j]).find("td")[7].innerText === lastBridgeRow["Hangup cause"]
                                ) {
                                    $(allTrs[j]).addClass("last-bridge-to");
                                    break;
                                }
                            }
                            break;
                        }
                    }
                }
                ///////////////////////////////////////////////

                for ( i = 0; i < fieldsArray.length; i++ ) {

                    var fieldCont = $('<div>').attr({"class": "row"}),
                        fieldName = $('<label>').attr({"class": "col-sm-2 text-bold"}).css({"text-align": "right"}).text(fieldsArray[i] + ":"),
                        fieldValue = $('<label>').attr({"class": "col-sm-6"}).text(row[fieldsArray[i]]);

                    $(fieldCont).append(fieldName);
                    $(fieldCont).append(fieldValue);

                    $(moreInfoCont).append(fieldCont);
                }


                //  контейнер для кнопок JSON, PDF
                var btnCont = $("<div>").attr({ "id": "additionalTools" }).css({  });



                //  кнопка для перегляду всієї статистики у форматі JSON
                var showJSONBtn = $("<label>").attr({ "class": "showCdrJSON btn btn-success btn-xs" }).css({ "float": "right" }).text("JSON");
                $(showJSONBtn).on("click", function() {
                    $.ajax({
                        "url": window.location.href + "/getCdrJSON",
                        "method": "POST",
                        "contentType": "application/json",
                        "timeout": 10000,
                        "data": JSON.stringify({
                            "uuid": row["Uuid"]
                        }),
                        "dataType": "json",
                        "success": function(data, textStatus, jqXHR ) {
                            showCdrJsonWindow(JSON.stringify(data));
                        },
                        "error": function(jqXHR, textStatus, errorThrown ) {

                            if ( textStatus === "timeout" ) {
                                alert.error("", "Request timeout", "");
                                console.error("Request timeout");
                                return;
                            }

                            if ( jqXHR.status === 400 ) {
                                console.error("You are unauthorized. Token expired!");
                                alert.error("", "You are unauthorized. Token expired!", null);
                            } else if ( jqXHR.status === 401 ) {
                                console.error("You are unauthorized. Please relogin!");
                                alert.error("", "You are unauthorized. Please relogin!", null);
                            } else if ( jqXHR.status === 500 ) {
                                console.error("You are unauthorized. Bad token or secret. Please relogin!");
                                alert.error("", "You are unauthorized. Bad token or secret. Please relogin!", null);
                            } else if ( jqXHR.status === 501 ) {
                                //  сервер не знає як обробити помилку, тому вертаю 501
                                console.error("Not Implemented: server Webitel-UI does not support the capabilities required to process the request.");
                                alert.error("", "Not Implemented: server Webitel-UI does not support the capabilities required to process the request.", null);
                            } else if ( jqXHR.status === 503 ) {
                                console.error("Core server Unavailable");
                                alert.error("", "Core server Unavailable", null);
                            } else {
                                console.error("Something went wrong! Unhandled error! status=" + status);
                                alert.error("", "Something went wrong ! Unhandled error! status=" + status, null);
                            }
                        }
                    });

                    function showCdrJsonWindow(jsonData) {

                        var jsonWindow = window.open("", "jsonWindow", "width=800, height=600");

                        if ( jsonWindow ) {

                            jsonWindow.document.write(
                                '<button id="save-cdrJSON" style="position: fixed; right: 0; z-index: 1;">Save</button>' +
                                '<div id="cdr-jsonViewver"></div>' +
                                '<link href="/js/libs &amp; plugins/jsonViewver/dist/jquery.jsonview.css" rel="stylesheet" type="text/css">' +
                                '<style type="text/css">' +
                                    'body { margin: 0; padding: 0; background: #e7ebee; }' +
                                '</style>'
                            );

                            $('#cdr-jsonViewver', jsonWindow.document).JSONView(JSON.parse(jsonData, { collapsed: false }));

                            $('#save-cdrJSON', jsonWindow.document).off("click");
                            $('#save-cdrJSON', jsonWindow.document).on("click", function() {

                                var textFileAsBlob = new Blob([jsonData], {type:'application/json'}),
                                    downloadLink = document.createElement("a");

                                downloadLink.download = row["Uuid"] + ".json";
                                downloadLink.innerHTML = "Download File";

                                if ( window.webkitURL !== null ) {
                                    // Chrome allows the link to be clicked
                                    // without actually adding it to the DOM.
                                    downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
                                }
                                else {
                                    // Firefox requires the link to be added to the DOM
                                    // before it can be clicked.
                                    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                                    downloadLink.onclick = destroyClickedElement;
                                    downloadLink.style.display = "none";
                                    document.body.appendChild(downloadLink);
                                }
                                downloadLink.click();
                            });
                        }
                        else {
                            alert.warning("", "Please, allow popup window!", 3000);
                            return;
                        }
                    }
                });

                $(btnCont).append(showJSONBtn);


                /**
                 * bugFix 20.08.2015
                 * Change file name
                 */
                createdTime = row["Created time"];
                    year = createdTime.split(" ")[0];
                    hour = createdTime.split(" ")[1];

                    year = year.split(".")[2] + year.split(".")[1] + year.split(".")[0];
                    hour = hour.split(":")[0] + hour.split(":")[1];

                    createdTime = year + "-" + hour;

                callerNumber = row["Caller number"].toString().split("@")[0];
                destinationNumber = row["Destination number"];


                fileName = createdTime + "_" + callerNumber + "_" + destinationNumber;


                getCdrFileInfo(cdrServerUrl + row["Uuid"] + "?" + token + "&" + key,
                    //  callback приймає тип доступного файлу
                    function(type, srcPdf) {
                        if ( type === "audio/mpeg" ) {
                            showAudioPlayer();
                        }
                        else if ( type === "application/pdf" ) {
                            showPdfFile(srcPdf);
                        }
                        else if ( type === "video/mp4" ) {

                        }

                    },
                    //  error callback, для підтримки старого функціоналу
                    function() {
                        //  якщо в користувача FF || SAFARI відправити ajax запит для перевірки чи доступний аудіо ресурс
                        if ( typeof InstallTrigger !== 'undefined' || Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 ) {
                            checkCanPlayAjax(cdrServerUrl + row["Uuid"] + "?" + token + "&" + key, function() {
                                showAudioPlayer();
                            });
                        } else {
                            checkCanPlay(cdrServerUrl + row["Uuid"] + "?" + token + "&" + key, function() {
                                showAudioPlayer();
                            });
                        }
                    }
                );

                //  відобразити аудіоплеєр, якщо є доступний запис розмови
                function showAudioPlayer() {
                    //  засетати силку а атрибут на аудіоресурс
                    $("#cdrAudioPlayer").attr({"src": cdrServerUrl + row["Uuid"] + "?" + token + "&" + key  + "&file_name=" + fileName + ".mp3"});

                    $('#cdrAudioPlayer').mediaelementplayer({
                        features: ['playpause', 'progress', 'duration', 'volume', 'downloadAudio']
                    });
                    $('.mejs-container').css({
                        'margin-top':'0px',
                        'float': 'right',
                        'top': '-20px',
                        'left': '0'
                    });

                    //  07.07.2015 add
                    //  remove audio btn
                    if ( session.getRole() === "root" || session.getRole() === "admin" ) {
                        var removeAudioBtn = $("<label>").attr({ "class": "btn btn-danger btn-xs" }).css({ "float": "right", "margin": "0 2px" }).text("Remove audio");
                        $(removeAudioBtn).on("click", function() {

                            bootbox.dialog({
                                message: "Do you want to remove this audio record ?",
                                size: 'small',
                                title: "Remove audio record?",
                                className: "remove-audio-record-modal",
                                onEscape: function() {},
                                buttons: {
                                    danger: {
                                        label: "Cancel",
                                        className: "btn-default",
                                        callback: function() {}
                                    },
                                    success: {
                                        label: "Ok",
                                        className: "btn-success",
                                        callback: function() {
                                            removeRequest();
                                        }
                                    }
                                }
                            });

                            function removeRequest() {
                                var
                                    uuid = row.Uuid;

                                $.ajax({
                                    "url": window.location.href + "/removeAudioRecord",
                                    "method": "POST",
                                    "contentType": "application/json",
                                    "timeout": 10000,
                                    "data": JSON.stringify({
                                        "uuid": uuid
                                    }),
                                    "dataType": "json",
                                    "success": function(data, textStatus, jqXHR ) {
                                        if ( textStatus === "success" ) {
                                            alert.success("", "Audio record has been removed", 3000);
                                            console.log("Audio record (" + data.uuid + ") has been removed");
                                            $("#statisticsBootstrapTable  tr.statMoreInfoTr").remove();
                                        }
                                    },
                                    "error": function(jqXHR, textStatus, errorThrown ) {
                                        alert.error("", "Audio record has not been removed", 5000);
                                        console.error("Audio record (" + data.uuid + ") has not been removed");
                                        return;
                                    }
                                });
                            }

                        });
                        $("#aditionalCdrInfo").append(removeAudioBtn);
                    }
                }
                function showPdfFile(src) {
                    var
                        pdfBtn = $("<label>").attr({ "class": "btn btn-warning btn-xs" }).css({ "float": "right ", "margin": "0 5px" }).text("PDF");

                    $(pdfBtn).on("click", function() {
                        window.open(src);
                    });

                    $("#additionalTools").append(pdfBtn);
                }

                audioPlayer = $('<audio>').attr({"id": "cdrAudioPlayer", "type": "audio/mp3"});
                $(moreInfoCont).append(audioPlayer);

                $(td).append(moreInfoCont);
                $(moreInfoTr).append(td);

                //  добавити контейнер із кнопками
                $(moreInfoCont).append(btnCont);


                $(element).after(moreInfoTr);

            });
        }

        //  Приводить колонки до потрібного вигляду. Повертає масив обєктів (колонок). Можна задати власний формат колонок
        function prepareStatColumns() {
            var columns = [];

            for ( var property in defaultColumns ) {
                var colName = defaultColumns[property];

                if ( colName === "Uuid" || colName == "Answered time" || colName == "Bridged time" || colName == "Hangup time" ||
                    colName === "Effective caller id name" || colName === "Effective caller id number" || colName == "Last bridge to" ) {
                    columns.push({
                        field: colName,
                        title: colName,
                        sortable: false,
                        visible: false
                    });
                } else {
                    columns.push({
                        field: colName,
                        title: colName,
                        align: 'center',
                        halign: 'center',
                        valign: 'middle',
                        sortable: true
                    });
                }
            }

            return columns;
        }

        //  Приводить рядки до потрібного вигляду. Повертає масив обєктів (рядків). В кінці загружає дані в таблицю loadRowsToStatTable(rows)
        function prepareStatRows(data) {

            var rows = [];

            //  цикл по даних від сервера статистики
            for ( var i = 0; i < data.rows.length; i++ ) {
                var rowData = data.rows[i];

                rowData.callflow[0].times.created_time  = timestampToDate(rowData.callflow[0].times.created_time);
                rowData.callflow[0].times.answered_time = timestampToDate(rowData.callflow[0].times.answered_time);
                rowData.callflow[0].times.bridged_time  = timestampToDate(rowData.callflow[0].times.bridged_time);
                rowData.callflow[0].times.hangup_time   = timestampToDate(rowData.callflow[0].times.hangup_time);

                var rowObj = {};

                //  цикл по колонках.
                //  Не знаю як з отриманих даних витягнути потрібні значення. Тому доступаюсь на подобі value["someProperty"]["someProperty"]...
                for ( var x in associativeColumns ) {

                    var value = rowData;

                    var assColMass = associativeColumns[x].split(" ");

                    //  value["someProperty"]["someProperty"]...
                    for ( var h = 0; h < assColMass.length; h++ ) {
                        value = value[assColMass[h]];
                    }

                    if ( x === "Billsec" || x === "Duration" ) {
                        ss = value;

                        mm = Math.floor(ss / 60);
                        ss = ss - mm * 60;

                        hh = Math.floor(mm / 60);
                        mm = mm - hh * 60;

                        hh < 10 ? hh = "0" + hh : hh;
                        mm < 10 ? mm = "0" + mm : mm;
                        ss < 10 ? ss = "0" + ss : ss;

                        value = hh + ":" + mm + ":" + ss;
                    }



                    //  27.07.2015  if variables.effective_caller_id_name EXISTS, show it instead callflow.caller_profile.caller_id_name
                    if ( associativeColumns[x] === "callflow 0 caller_profile caller_id_name" ) {
                        if ( rowData.variables.effective_caller_id_name ) {
                            value = rowData.variables.effective_caller_id_name;
                        }
                    } else if ( associativeColumns[x] === "callflow 0 caller_profile caller_id_number" ) {
                        if ( rowData.variables.effective_caller_id_number ) {
                            value = rowData.variables.effective_caller_id_number;
                        }
                    }
                    /////////////////////


                    rowObj[x] = value;
                }
                rows.push(rowObj);
            }

            data.rows = rows;

            return data;
        }



        /**                                 ADDITIONAL FUNCTION
         **************************************************************************************************************/
        /**
         * Перевіряє сховище по ключю. Якщо є збережений фільтр по даті, викликає відкритий метод модуля фільтрації і сетить ці значення
         */
        function getDateFilterFromStorage() {
            var periodFilterObj = {};
            if (browser.isLocalStorageSupport()) {
                periodFilterObj = locStor.getOne("periodFilterValue");
            } else if (browser.isCookieEnabled()) {
                periodFilterObj = cookStor.getCookie("periodFilterValue");
            } else {
                console.error("Cannot read user data. Your browser doesn't support LocalStorage. Your Cookie are disabled! Please enable cookies in your browser to improve the site work!");
                return;
            }

            if (periodFilterObj) {
                if (periodFilterObj.startDate || periodFilterObj.endDate) {
                    periodFilter.setValue(periodFilterObj.startDate, periodFilterObj.endDate);

                    statDateFilter = {
                        "callflow.times.created_time": {
                            "$gte": new Date(periodFilterObj.startDate.replace(/(\d{2}).(\d{2}).(\d{4})/, "$2/$1/$3")).getTime() * 1000,
                            "$lte": new Date(periodFilterObj.endDate.replace(/(\d{2}).(\d{2}).(\d{4})/, "$2/$1/$3") + " 23:59:59").getTime() * 1000
                        }
                    };
                }
            }
        }
        function setDateFilterInStorage(startDate, endDate) {
            if (browser.isLocalStorageSupport()) {
                locStor.saveOne("periodFilterValue", {
                    "startDate": startDate,
                    "endDate": endDate
                });
            } else if (browser.isCookieEnabled()) {
                cookStor.saveInCookie("periodFilterValue", {
                    "startDate": startDate,
                    "endDate": endDate
                });
            } else {
                console.error("Cannot read user data. Your browser doesn't support LocalStorage. Your Cookie are disabled! Please enable cookies in your browser to improve the site work!");
                return;
            }
        }

        function getDomainFilterFromStorage() {
            var domainFilterValue = {};
            if (browser.isLocalStorageSupport()) {
                domainFilterValue = locStor.getOne("domainFilterValue");
            } else if (browser.isCookieEnabled()) {
                domainFilterValue = cookStor.getCookie("domainFilterValue");
            } else {
                console.error("Cannot read user data. Your browser doesn't support LocalStorage. Your Cookie are disabled! Please enable cookies in your browser to improve the site work!");
                return;
            }

            if (domainFilterValue) {
                statDomainFilter = domainFilterValue;
                $("#statDomainFilterValue").text(domainFilterValue);
            }
        }
        function setDomainFilterInStorage(domain) {
            if (domain === undefined)
                domain = "";

            if (browser.isLocalStorageSupport()) {
                locStor.saveOne("domainFilterValue", domain);
            } else if (browser.isCookieEnabled()) {
                cookStor.saveInCookie("domainFilterValue", domain);
            } else {
                console.error("Cannot read user data. Your browser doesn't support LocalStorage. Your Cookie are disabled! Please enable cookies in your browser to improve the site work!");
                return;
            }
        }

        function timestampToDate(timestamp) {
            if ( timestamp === 0 ) {
                return 0;
            }

            //  convert date to format: dd.mm.yy hh:mm:ss
            var
                currDate = new Date ( timestamp / 1000),
                yy, month, dd,
                hh, mm, ss,
                convertedDate;

            //  date
            yy    = currDate.getFullYear();
            month = currDate.getMonth() + 1;
                ( month >= 10 ) ? month : month = "0" + month;
            dd    = currDate.getDate();
                ( dd >= 10 ) ? dd : dd = "0" + dd;

            //  time
            hh = currDate.getHours();
                ( hh >= 10 ) ? hh : hh = "0" + hh;
            mm = currDate.getMinutes();
                ( mm >= 10 ) ? mm : mm = "0" + mm;
            ss = currDate.getSeconds();
                ( ss >= 10 ) ? ss : ss = "0" + ss;

            convertedDate = dd + "." + month + "." + yy + " " + hh + ":" + mm + ":" + ss;

            return convertedDate;
        }



        /**                                 AUDIO PLAYER FUNCTION. CHECK AUDIO RESOURCE
         **************************************************************************************************************/

        /**
         * Перевіряє чи є в записа cdr доступний audio, pdf, video
         *
         * @param src       до силки додається &type=all
         * @param success   в callback передається тип доступного файлу. Він може викликатися декілька разів
         * @param error     реалізовано для підтримки старого функціоналу
         */
        function getCdrFileInfo(src, success, error) {
            $.ajax({
                url: src + "&type=all",
                type: 'GET',
                success: function(data) {

                    var
                        isAudioDefined = false,
                        isContentTypeDefined = false;


                    if ( data.length > 0 ) {
                        //  якщо масив не пустий і ніодин обєкт не має властивості "content-type", тоді реалізувати стару логіку
                        for ( var i = 0; i < data.length; i++ ) {
                            if ( data[i]["content-type"] ) {
                                isContentTypeDefined = true;
                            }
                            //  якщо ніодин із обєктів не аудіо, тоді виводилось повідомлення про audio not found
                            /*if ( data[i]["content-type"] === "audio/mpeg" ) {
                                isAudioDefined = true;
                            }*/
                        }

                        /*if ( !isAudioDefined ) {
                            alert.error("", "Audio file not found", 3000);
                        }*/

                        if ( !isContentTypeDefined ) {
                            error();
                            return;
                        }

                        for ( var i = 0; i < data.length; i++ ) {
                            if ( data[i]["content-type"] === "audio/mpeg" ) {
                                success("audio/mpeg");
                            }
                            else if ( data[i]["content-type"] === "application/pdf" ) {
                                success("application/pdf", src + "&type=application/pdf");
                            }
                            else if ( data[i]["content-type"] === "video/mp4" ) {
                                success("video/mp4");
                            }
                        }
                    } else {
                        error();
                    }
                },
                error: function(err) {
                    if ( err.status === 400 ) {
                        try {
                            res = JSON.parse(err.responseText)
                        } catch (e) {}

                        if ( res ) {
                            if ( res.status === 400 && res.message === "Token Expired" ) {
                                console.error("====================");
                                console.error("Token Expired");
                                console.error("====================");

                                alert.error("", "Token Expired. Please, relogin", 3000);
                            } else {
                                console.error("Unhandled error. Error code=400. Check response message !");
                            }
                        } else {
                            console.error("Unhandled error. Error code=400. Response from server is empty");
                        }
                    }
                    else if (err.status === 401 && err.statusText === "Unauthorized") {
                        console.error("====================");
                        console.error("Invalid token or key");
                        console.error("====================");

                        alert.error("", "Invalid token or key. Please, relogin", 3000);
                    }
                    else if (err.status === 404) {
                        console.error("====================");
                        console.error("Audio file not found");
                        console.error("====================");

                        alert.error("", "Audio file not found", 3000);
                    }
                    else if (err.status === 500) {

                        console.error("================");
                        console.error("Bad token or key");
                        console.error("================");

                        alert.error("", "Bad token or key. Please, relogin", 3000);
                    }
                    else if (err.readyState === 0 && err.responseText === "" && err.statusText === "error") {
                        success("audio/mpeg");
                    }
                    else {
                        console.error("Unhandled error after GET hardbitUrl. responseText=" + err.responseText + ", code=" + err.status);
                    }
                }
            });
        }

        //  створює audio тег, передає йому src
        function checkCanPlay(src, callback) {
            var audio = new Audio();
            audio.setAttribute("preload", 'none');
            audio.setAttribute("src", src);
            audio.oncanplay = function() {
                audio.setAttribute("src",'');
                audio.pause();
                delete audio;
                callback();
            };
            audio.load();
        }

        //  для FF && SAFARI
        function checkCanPlayAjax(url, success_callback) {
            $.ajax({
                url: url,
                type: 'GET',
                success: function(data) {
                    success_callback();
                },
                error: function(err) {
                    if ( err.status === 400 ) {
                        try {
                            res = JSON.parse(err.responseText)
                        } catch (e) {}

                        if ( res ) {
                            if ( res.status === 400 && res.message === "Token Expired" ) {
                                console.error("====================");
                                console.error("Token Expired");
                                console.error("====================");

                                alert.error("", "Token Expired. Please, relogin", 3000);
                            } else {
                                console.error("Unhandled error. Error code=400. Check response message !");
                            }
                        } else {
                            console.error("Unhandled error. Error code=400. Response from server is empty");
                        }
                    }
                    else if (err.status === 401 && err.statusText === "Unauthorized") {

                        console.error("====================");
                        console.error("Invalid token or key");
                        console.error("====================");

                        alert.error("", "Invalid token or key. Please, relogin", 3000);
                    }
                    else if (err.status === 404) {
                        console.error("====================");
                        console.error("Audio file not found");
                        console.error("====================");

                        alert.error("", "Audio file not found", 3000);
                    }
                    else if (err.status === 500) {

                        console.error("================");
                        console.error("Bad token or key");
                        console.error("================");

                        alert.error("", "Bad token or key. Please, relogin", 3000);
                    }
                    else if (err.readyState === 0 && err.responseText === "" && err.statusText === "error") {

                        success_callback();
                    }
                    else {
                        console.error("Unhandled error after GET hardbitUrl. responseText=" + err.responseText + ", code=" + err.status);
                    }
                }
            });
        }





        /**                                 DOMAIN LIST FOR FILTER
         **************************************************************************************************************/
        function showDomainTable() {
            webitel.domainList(function(res) {
                if (res.status === 0) {
                    var domainData = this.parseDataTable();

                    var domainDataHeaders = prepareHeadersToDomTable(domainData.headers);
                    initDomTable(domainDataHeaders);

                    var domainDataRow = prepareDataForLoadToDomTable(domainData.headers, domainData.data);
                    $('#statDomainListTable').bootstrapTable("load", domainDataRow);

                    $("#stat-domain-lookup-modal").modal("show");
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
                } else {
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
            $('#statDomainListTable').bootstrapTable({
                cache: false,
                striped: true,
                pagination: true,
                pageSize: 10,
                pageList: [],
                search: true,
                columns: domainColumns
            });
        }


        /**                                         EXPORT TO EXCEL
         **************************************************************************************************************/
        function initExportToExcel() {

            generateNewExcelel = true;

            //  підключити плагін для формування таблиць в Excel файлі
            require(['Excel/Table'], function(Table) {


                if ( checkElementOnEvent($("#exportToExcelLink").get(0), "click") ) {
                    
                    $("#exportToExcelLink").on("click", function() {

                        var 
                            parentEl = this.parentElement,
                            domain;

                        totalRow = $("#rowCount").text().slice(6);
                        totalRow = Number(totalRow);

                        if ( !totalRow ) {
                            return;
                        }

                        //  якщо кількість записів більша 20000 вивести попереджувальне повідомлення
                        if ( totalRow > maxRowsToExport ) {
                            alert.warning("", "The maximum number of rows for export to Excel can not be more " + maxRowsToExport, 5000);
                            return;
                        }

                        //  якщо елемент вже активний, тоді нічого не робити
                        if ( $(parentEl).hasClass("active") ) {
                            return;
                        } 
                            

                        //  відобразити початок генерування excel 
                        $(parentEl).addClass("active");


                        //  визначити домен
                        if ( session.getRole() === "root" ) {
                            domain = $("#statDomainFilterValue").text();
                        } else {
                            domain = session.getDomain();
                        }

                        if ( domain === "Domain" ) {
                            domain = "";
                        }

                        //  підключити додатковий модуль, для відправки запитів і генерації даних
                        require(["/js/app/statisticsSectionModule/exportToExcelHandler.js"], function(worker) {

                            var filter = $("#builder-import_export").queryBuilder('getMongo');
                            convertFilterToTimestamp(filter);
                            worker.init({
                                "EB"       : EB,
                                "Table"    : Table,
                                "totalRow" : totalRow,
                                "startDate": statDateFilter["callflow.times.created_time"].$gte,
                                "endDate"  : statDateFilter["callflow.times.created_time"].$lte,
                                "domain"   : domain,
                                "generateNewExcelel": generateNewExcelel,
                                "filter" : filter
                            }, function() {
                                generateNewExcelel = false;
                                $(parentEl).removeClass("active");
                            });
                        })
                    });
                }
            });
        }

        /**
         * Перевірка чи івент привязаний до елемента
         *
         * @param element    - конкретний елемент для перевірки (не може бути $ елемент і селектор)
         * @param eventType  - назва типу івента
         * @returns {boolean}
         */
        function checkElementOnEvent(element, eventType) {

            var eventsObj = $._data( element, "events"),
                x = false;

            if ( !eventsObj ) {
                return x;
            }

            //  return false для того, щоб вийти із циклу ech
            $.each(eventsObj, function(type, handler) {
                if ( type === eventType ) {
                    x = true;
                    return false;
                }
            });

            return x;
        }

        function convertFilterToTimestamp(obj) {
            var properties = [];
            for (var p in obj) {
                if (typeof(obj[p]) == 'object') {
                    for(var i = 0; i < obj[p].length; i++) {
                        if(isDate(obj[p][i])) {
                            var el = obj[p][i][Object.keys(obj[p][i])[0]];
                            el = el.split(".");
                            var newDate = el[2]+"/"+ el[1]+"/" + el[0];
                            obj[p][i][Object.keys(obj[p][i])[0]] = new Date(newDate).getTime() * 1000;
                        }
                        if(obj[p][i]["callflow.times.created_time"] ||
                            obj[p][i]["callflow.times.answered_time"] ||
                            obj[p][i]["callflow.times.bridged_time"] ||
                            obj[p][i]["callflow.times.hangup_time"]) {
                            if(obj[p][i][Object.keys(obj[p][i])]["$gte"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$gte"]) != "number") {
                                var el1 = obj[p][i][Object.keys(obj[p][i])]["$gte"];
                                el1 = el1.split(".");
                                var newDate = el1[2] + "/" + el1[1] + "/" + el1[0];
                                obj[p][i][Object.keys(obj[p][i])]["$gte"] = new Date(newDate).getTime() * 1000;
                            }

                            if(obj[p][i][Object.keys(obj[p][i])]["$lte"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$lte"]) != "number") {
                                var el2 = obj[p][i][Object.keys(obj[p][i])]["$lte"];
                                el2 = el2.split(".");
                                var newDate = el2[2] + "/" + el2[1] + "/" + el2[0];
                                obj[p][i][Object.keys(obj[p][i])]["$lte"] = new Date(newDate).getTime() * 1000;
                            }

                            if(obj[p][i][Object.keys(obj[p][i])]["$lt"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$lt"]) != "number") {
                                var el2 = obj[p][i][Object.keys(obj[p][i])]["$lt"];
                                el2 = el2.split(".");
                                var newDate = el2[2] + "/" + el2[1] + "/" + el2[0];
                                obj[p][i][Object.keys(obj[p][i])]["$lt"] = new Date(newDate).getTime() * 1000;
                            }

                            if(obj[p][i][Object.keys(obj[p][i])]["$gt"] && (typeof obj[p][i][Object.keys(obj[p][i])]["$gt"]) != "number") {
                                var el2 = obj[p][i][Object.keys(obj[p][i])]["$gt"];
                                el2 = el2.split(".");
                                var newDate = el2[2] + "/" + el2[1] + "/" + el2[0];
                                obj[p][i][Object.keys(obj[p][i])]["$gt"] = new Date(newDate).getTime() * 1000;
                            }
                        }
                    }
                    properties = properties.concat( convertFilterToTimestamp(obj[p]) );
                } else {
                    properties.push(p);
                }
            }
            return properties;
        }

        function isDate(date) {
            var resultDate = date[Object.keys(date)[0]];
            var newDate;
            try {
                resultDate = resultDate.split(".");
                if(resultDate[0] == undefined || resultDate[1] == undefined || resultDate[2] == undefined || resultDate[3] != undefined) {
                    return false;
                }
                newDate = resultDate[2]+ "/" + resultDate[1] + "/" + resultDate[0];
            }
            catch(err) {
            }
            return (new Date(newDate) !== "Invalid Date" && !isNaN(new Date(newDate))) ? true : false;
        }

        return {
            createWebitel: createWebitel
        }
});

























