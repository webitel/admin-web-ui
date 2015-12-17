
define(["fileSaver"], function(fileSaver) {

    var 
        totalRow,
        EB, Table,
        reqLimit = 2000,            //  в середньому запит для 2000 записів триває 2-3 секунди, передається 1Mb інфи
        reqCount = 0,
        reqBody  = {},
        receivedData = [],
        tableColumns = {
            "Caller name"  : "callflow 0 caller_profile caller_id_name",
            "Caller number": "callflow 0 caller_profile caller_id_number",
            "Destination number": "callflow 0 caller_profile destination_number",

            "Created time": "callflow 0 times created_time",

            "Billsec"  : "variables billsec",
            "Duration" : "variables duration",
            "Direction": "variables webitel_direction",

            //"Uuid": "variables uuid",
            "Answered": "callflow 0 times answered_time",
            "Bridged": "callflow 0 times bridged_time",
            "Hangup" : "callflow 0 times hangup_time"
        },
        callback,

        workBook,
        workSheet,
        blobExcel,
        periodInfo;


    /**
     * @param {object} settings
     *      - EB                    силка на ExcelBuilder
     *      - Table                 силка на обєкт для роботи з таблицями в Excel
     *      - totalRow              кількість всіх записів в таблиці статистики
     *      - generateNewExcelel    флажок чи потрібно генерувати новий файл
     *      - startDate/endDate     діапазон дат для фільтрації
     *      - domain                домен для фільтрації
     */
    function init(settings, cb) {

        if ( !settings.totalRow ) {
            return;
        }

        totalRow = settings.totalRow;
        EB       = settings.EB;
        Table    = settings.Table;
        callback = cb;

        periodInfo = "Statistics for: " + timestampToDate(settings.startDate).split(" ")[0] + " - " + timestampToDate(settings.endDate).split(" ")[0];

        //  ініціалізація значень початкового фільтра
        reqBody = {
            "columns":{
                "callflow.caller_profile.caller_id_name"  : 1,
                "callflow.caller_profile.caller_id_number": 1,
                "callflow.caller_profile.destination_number": 1,

                "callflow.times.created_time": 1,

                "variables.billsec": 1,
                "variables.duration": 1,
                "variables.webitel_direction": 1,

                //"variables.uuid": 1,
                "callflow.times.answered_time": 1,
                "callflow.times.bridged_time": 1,
                "callflow.times.hangup_time": 1
            },
            "filter": {
                "callflow.times.created_time": {
                    "$gte": settings.startDate,
                    "$lte": settings.endDate
                }
            },
            "limit": reqLimit,
            "sort" : {
                "callflow.times.created_time": -1
            }
        };

        //  якщо домен заданий, добавити його до фільтра
        if ( settings.domain ) {
            reqBody.filter["variables.domain_name"] = settings.domain;
        }



        //  якщо фільтрація по даті в розділі не змінилась, тоді скачати попередній файл
        if ( settings.generateNewExcelel ) {

            workBook = EB.createWorkbook();
            workSheet = workBook.createWorksheet({ name: 'Statistics List' });

            receivedData = [];

            createExcelLayout();

            calcCountOfReq();

            getData();

        } else {
            saveFile();
        }

    }
    //  створює шаблон для побудови Excel файлу
    function createExcelLayout() {
        var 
            colorBlack = "000000",
            stylesheet = workBook.getStyleSheet(),
            importantFormatter = stylesheet.createFormat({
                font: {
                    bold : true,
                    color: colorBlack,
                    size : 12
                },
                border: {
                    bottom: {color: colorBlack, style: 'thin'},
                    top   : {color: colorBlack, style: 'thin'},
                    left  : {color: colorBlack, style: 'thin'},
                    right : {color: colorBlack, style: 'thin'}
                },
                alignment: {
                    horizontal: "center"
                }
            }),
            periodInfoFormatter = stylesheet.createFormat({
                font: {
                    bold : true,
                    color: colorBlack,
                    size : 12
                },
                alignment: {
                    horizontal: "center"
                }
            });

        receivedData.push([]);
        receivedData.push([{ value: periodInfo, metadata: { style: periodInfoFormatter.id }}]);
        receivedData.push([]);

        var thead = [];

        for ( var prop in tableColumns) {
            thead.push({
                value: prop, 
                metadata: { 
                    style: importantFormatter.id 
                }
            });
        }

        receivedData.push(thead);
    }
    //  вставляє дані в таблицю статистики
    function pushToExcelLayout(data) {
        
        var 
            pathToValue,
            i, prop,
            newRow,
            currentRow,
            value,
            theDate,
            theTime,
            hh, mm, ss,
            centerAlign = workBook.getStyleSheet().createFormat({
                alignment: {
                    horizontal: "center"
                },
                border: {
                    top   : {color: "000000", style: 'thin'},
                    left  : {color: "000000", style: 'thin'},
                    right : {color: "000000", style: 'thin'},
                    bottom: {color: "000000", style: 'thin'}
                },
            });




        for ( k = 0; k < data.length; k++) {



            newRow = [];

            //  цикл по всіх полях, які потрібно дістати
            for ( prop in tableColumns ) {

                currentRow = data[k];

                //  масив який містить елементи шляху до value, наприклад [callflow 0 times answered_time]
                pathToValue = tableColumns[prop].split(" ");


                //  цикл для витягування value, наприклад [callflow.caller_profile.caller_id_name]
                for ( i = 0; i < pathToValue.length; i++) {
                    currentRow = currentRow[pathToValue[i]];
                }

                if ( currentRow === undefined ) {
                    currentRow = "";
                }

                if ( prop === "Answered" || prop === "Bridged" || prop === "Hangup" ||  prop === "Created time") {
                    currentRow = timestampToDate(currentRow);
                }

                if ( prop === "Billsec" || prop === "Duration") {
                    ss = currentRow;

                    mm = Math.floor(currentRow / 60);
                    ss = ss - mm * 60;

                    hh = Math.floor(mm / 60);
                    mm = mm - hh * 60;

                    hh < 10 ? hh = "0" + hh : hh;
                    mm < 10 ? mm = "0" + mm : mm;
                    ss < 10 ? ss = "0" + ss : ss;

                    currentRow = hh + ":" + mm + ":" + ss;
                }

                newRow.push({value: currentRow, metadata: {style: centerAlign.id}});    
                
            }

            receivedData.push(newRow);

        }

    }

    //  вираховує кількість необхідних запитів для отримання даних. Залежить від кількості всіх записів [totalRow]
    function calcCountOfReq() {

        var fractionalPart = 0;

        //  якщо кількість всіх записів менша ніж кількість записів за один запит, тоді потрібно зробити один запит 
        if ( totalRow < reqLimit ) {
            reqCount = 1;
            return;
        }

        decimalNum = ((totalRow / reqLimit) + "").split(".");

        if ( decimalNum[1] ) {
            if ( decimalNum[1] > 0 ) {
                fractionalPart = 1;
            }
        }

        //  привести стрічку до числа і додати для визначення кількості запитів
        reqCount = +decimalNum[0] + +fractionalPart;
    }

    /**
     * За допомогою рекурсії отримати всі дані
     */
    function getData() {

        if ( reqCount === 0 ) {
            return;
        }

        var xhr = new XMLHttpRequest();

        xhr.open("POST", "/statistics/getDataForExcel", true);
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

        xhr.onreadystatechange = function() {

            if ( xhr.readyState !== 4 ) return;

            if ( xhr.status === 200 ) {
                //  обробити отримані дані, і відправити наступний запит з новим фільтром
                var response;

                try {
                    response = JSON.parse(xhr.responseText);
                } catch (e) {
                    console.error("Cannot parse responseText received from server UI");
                    return;
                }

                if ( !response ) {
                    console.error("Bad response from server UI. Check server UI code");
                    return;
                }

                if ( response.status ) {
                    console.error("Bad response from server UI. Check server UI code");
                    //errHandler.resCoreErr(response);
                    return;
                }

                if ( response.res === "-ERR" ) {
                    console.error(response.code + " " + response.message + ". " + "Error request from Server UI to Core" + " \nRequest info: " + response.desc || "empty");
                    return;
                }

                console.log(response.length);

                reqCount -= 1;

                if ( response.length > 0) {

                    modifyReqBody(response[response.length - 1]);

                    pushToExcelLayout(response);

                    if ( reqCount === 0 ) {
                        generateExcel();
                    }

                    getData();
                }


            }
        };
        xhr.send(JSON.stringify(reqBody));
        
    }


    /**
     * Спочатку фільтрація проходить по заданим фільтрам в UI. Після отримання першої порції даних, береться останій елемент і його поле created_time підставляється в фільтр
     */
    function modifyReqBody(lastElement) {

        var x = lastElement.callflow[0].times["created_time"];

        //  видалити значення фільтра по початковій даті
        delete reqBody.filter["callflow.times.created_time"].$lte;

        //  добавити нове значення фільтра
        reqBody.filter["callflow.times.created_time"].$lt = x;
    }

    //  добавляє дані в Excel файл, задає деякі стилі для колонок
    function generateExcel() {

        var 
            table;

        table = new Table();

        table.setReferenceRange([1, 4], [10, receivedData.length]);
        table.setTableColumns([
            'Caller name',
            'Caller number',
            'Destination number',
            'Created time',
            'Billsec',
            'Duration',
            'Direction',
            'Answered',
            'Bridged',
            'Hangup'
        ]);

        //  змержити комірка для тексту
        workSheet.mergeCells('A2','B2');


        workSheet.setData(receivedData);

        workSheet.setColumns([
            {
                width: 20
            },
            {
                width: 20
            },
            {
                width: 25
            },
            {
                width: 25
            },
            {
                width: 15
            },
            {
                width: 15
            },
            {
                width: 15
            },
            {
                width: 25
            },
            {
                width: 25
            },
            {
                width: 25
            }
        ]);

        workBook.addWorksheet(workSheet);


        //  добавити таблицю 
        workSheet.addTable(table);
        workBook.addTable(table);


        blobExcel = EB.createFile(workBook);
        saveFile();

    }

    function saveFile() {
        fileSaver(blobExcel, "Statistics.xlsx");
        callback();
    }





    //  timestamp to local date
    function timestampToDate(timestamp) {
        var 
            theDate;

        if ( timestamp === 0 ) {
            return 0;
        }

        theDate = new Date( timestamp / 1000 );
        theDate = theDate.toLocaleString();

        return theDate;
    }


    return {
        init: init
    }
});