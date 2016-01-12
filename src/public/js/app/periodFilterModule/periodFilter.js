/**
 * Для нормального функціонування модуля потрібно:
 *      - datepicker3.css
 *      - bootstrap.min.css
 *      - jquery-2.1.1.min.js
 *      - bootstrap-datepicker.js обовязково повинен бути загружений після jQuery
 *
 * Івенти, які генерує
 *      - customChangeDate, кастомний івент зміни дати, який генерується для певного контейнера
 *      -
 */




define("periodFilter",["bsDatepicker"], function(_bsDatepicker) {

    var periodFilterObj,
        eventCont,
        selectedPeriodFilterValue = {
            "startTime": "",
            "endTime"  : ""
        },
        FIXED_PERIOD_VALUE = {
            "isYesterday": function() {
                var dateObj = new Date();
                dateObj.setDate(dateObj.getDate() - 1);
                return {
                    "setStartDate": checkDateValue(dateObj.getDate()) + "." + checkDateValue(dateObj.getMonth() + 1) + "." + dateObj.getFullYear(),
                    "setEndDate"  : checkDateValue(dateObj.getDate()) + "." + checkDateValue(dateObj.getMonth() + 1) + "." + dateObj.getFullYear()
                };
            },
            "isToday": function() {
                var dateObj = new Date();
                return {
                    "setStartDate": checkDateValue(dateObj.getDate()) + "." + checkDateValue(dateObj.getMonth() + 1) + "." + dateObj.getFullYear(),
                    "setEndDate"  : checkDateValue(dateObj.getDate()) + "." + checkDateValue(dateObj.getMonth() + 1) + "." + dateObj.getFullYear()
                };
            },
            "isTomorrow": function() {
                var dateObj = new Date();
                dateObj.setDate(dateObj.getDate() + 1);
                return {
                    "setStartDate": checkDateValue(dateObj.getDate()) + "." + checkDateValue(dateObj.getMonth() + 1) + "." + dateObj.getFullYear(),
                    "setEndDate"  : checkDateValue(dateObj.getDate()) + "." + checkDateValue(dateObj.getMonth() + 1) + "." + dateObj.getFullYear()
                };
            },

            "isPrevWeek": function() {
                var currDate = new Date();
                var dayOfMonth = currDate.getDate();    //  1-31
                var dayOfWeek = currDate.getDay() - 1;  //  Тиждень починаяється з 0 - неділя

                var startOfWeek = new Date(new Date().setDate(dayOfMonth - dayOfWeek - 7));
                //  проміжна змінна. Обовязково потрібна. x == startOfWeek
                var x = new Date(startOfWeek.getTime());
                var endOfWeek = new Date(x.setDate(startOfWeek.getDate() + 6));

                return {
                    "setStartDate": checkDateValue(startOfWeek.getDate()) + "." + checkDateValue(startOfWeek.getMonth() + 1) + "." + startOfWeek.getFullYear(),
                    "setEndDate"  : checkDateValue(endOfWeek.getDate()) + "." + checkDateValue(endOfWeek.getMonth() + 1) + "." + endOfWeek.getFullYear()
                };
            },
            "isCurrWeek": function() {
                var currDate = new Date();
                var dayOfMonth = currDate.getDate();    //  1-31
                var dayOfWeek = currDate.getDay() - 1;  //  Тиждень починаяється з 0 - неділя

                var startOfWeek = new Date(new Date().setDate(dayOfMonth - dayOfWeek));
                var endOfWeek = new Date(new Date().setDate(startOfWeek.getDate() + 6));

                return {
                    "setStartDate": checkDateValue(startOfWeek.getDate()) + "." + checkDateValue(startOfWeek.getMonth() + 1) + "." + startOfWeek.getFullYear(),
                    "setEndDate"  : checkDateValue(endOfWeek.getDate()) + "." + checkDateValue(endOfWeek.getMonth() + 1) + "." + endOfWeek.getFullYear()
                };
            },
            "isNextWeek": function() {
                var currDate = new Date();
                var dayOfMonth = currDate.getDate();    //  1-31
                var dayOfWeek = currDate.getDay() - 1;  //  Тиждень починаяється з 0 - неділя

                var startOfWeek = new Date(new Date().setDate(dayOfMonth - dayOfWeek + 7));
                //  проміжна змінна. Обовязково потрібна. x == startOfWeek
                var x = new Date(startOfWeek.getTime());
                var endOfWeek = new Date(x.setDate(startOfWeek.getDate() + 6));

                return {
                    "setStartDate": checkDateValue(startOfWeek.getDate()) + "." + checkDateValue(startOfWeek.getMonth() + 1) + "." + startOfWeek.getFullYear(),
                    "setEndDate"  : checkDateValue(endOfWeek.getDate()) + "." + checkDateValue(endOfWeek.getMonth() + 1) + "." + endOfWeek.getFullYear()
                };
            },

            "isPrevMonth": function() {
                var previousMonth = new Date(new Date().setDate(0));

                var firstDayOfMonth = getDayInMonth(previousMonth.getFullYear(), previousMonth.getMonth() + 1, "first");
                var lastDayOfMonth = getDayInMonth(previousMonth.getFullYear(), previousMonth.getMonth() + 1, "last");

                return {
                    "setStartDate": checkDateValue(firstDayOfMonth) + "." + checkDateValue(previousMonth.getMonth() + 1) + "." + previousMonth.getFullYear(),
                    "setEndDate"  : checkDateValue(lastDayOfMonth) + "." + checkDateValue(previousMonth.getMonth() + 1) + "." + previousMonth.getFullYear()
                };
            },
            "isCurrMonth": function() {
                var currDate = new Date();
                var currMonth = currDate.getMonth() + 1;
                var currYear = currDate.getFullYear();

                var firstDayOfMonth = getDayInMonth(currYear, currMonth, "first");
                var lastDayOfMonth = getDayInMonth(currYear, currMonth, "last");

                return {
                    "setStartDate": checkDateValue(firstDayOfMonth) + "." + checkDateValue(currMonth) + "." + currYear,
                    "setEndDate"  : checkDateValue(lastDayOfMonth) + "." + checkDateValue(currMonth) + "." + currYear
                };
            },
            "isNextMonth": function() {
                var nextMonth = new Date(new Date().setDate(32));

                var firstDayOfMonth = getDayInMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1, "first");
                var lastDayOfMonth = getDayInMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1, "last");

                return {
                    "setStartDate": checkDateValue(firstDayOfMonth) + "." + checkDateValue(nextMonth.getMonth() + 1) + "." + nextMonth.getFullYear(),
                    "setEndDate"  : checkDateValue(lastDayOfMonth) + "." + checkDateValue(nextMonth.getMonth() + 1) + "." + nextMonth.getFullYear()
                };
            }
        };

    function init(container, conf) {

        if (!isContainerEmpty(container))
            return;

        //loadCss("css/datepicker3.css");
        //loadCss("css/bootstrap.min.css");

        var innerCont  = $("<div>").attr({
                "class": "input-daterange input-group",
                "id": "datepicker"
            }),
            startInput = $("<input>").attr({
                "id": "startTime",
                "class": "input-sm form-control",
                "type": "text",
                "name": "start"
            }).css({"cursor": "pointer"}),
            endInput = $("<input>").attr({
                "id": "endTime",
                "class": "input-sm form-control",
                "type": "text",
                "name": "end"
            }).css({"cursor": "pointer"}),
            fixPeriod = $("<span>").attr({"class": "fixedPeriodIco input-group-addon fa fa-calendar-o"}).css({
                    "cursor": "pointer",
                    "border-top-left-radius": "5px",
                    "border-bottom-left-radius": "5px"
                }).on("click", showFixedPeriod),
            spanTo    = $("<span>").attr({"class": "input-group-addon"}).text("to").css({"cursor": "default"}),
            remDate   = $("<span>").attr({"class": "input-group-addon fa fa-remove"}).css({
                    "cursor": "pointer",
                    "border-top-right-radius": "5px",
                    "border-bottom-right-radius": "5px"
                }).on("click", removeDate);


        //  добавляє приховний контейнер фіксованих періодів
        //  bugFix 30.03 Не міг перекрити стилів bootstrapTable. Проблеми з z-index і його контекстом накладення
        //  контейнер з фіксованими періодами виношу на рівень #page-content
        //  $(fixPeriod).append(createFixedPeriodCont());
        $(".panel-body").append(createFixedPeriodCont());

        $(innerCont).append(fixPeriod);

        $(innerCont).append(startInput);
        $(innerCont).append(spanTo);
        $(innerCont).append(endInput);

        //$(innerCont).append(remDate);


        $(container).append(innerCont);

        periodFilterObj = $("#datepicker").datepicker({
            "todayHighlight": true,
            "language"  : 'en',
            "format"    : "dd.mm.yyyy",
            "weekStart" : 1,
            //"todayBtn"  : true,
            "autoclose" : true
        });

        subscribeOnEvent();

        setDefaultFilterValue();
    }

    function subscribeOnEvent() {

        //  відслідкувати всі клікі. Приховувати блок фіксованих періодів
        $(document).click(function(e) {
            if ($(e.target).closest(".fixedPeriodIco").length === 0) {
                $("#fixedPeriodCont").hide();
            }
        });

        //  клік по одному із пунктів блоку фіксованого періоду дат. Зміна дат в самому фільтрі
        $(".fixedPeriodDate").on("click", function() {
            var periodFilterValue = FIXED_PERIOD_VALUE[$(this).attr("fixedPeriod")]();

            periodFilterObj.find('#startTime').datepicker('update', periodFilterValue.setStartDate);
            periodFilterObj.find('#endTime').datepicker('update', periodFilterValue.setEndDate);
            //periodFilterObj.data('datepicker').updateDates();

            if (selectedPeriodFilterValue.startTime !== periodFilterValue.setStartDate || selectedPeriodFilterValue.endTime !== periodFilterValue.setEndDate) {
                selectedPeriodFilterValue.startTime = periodFilterValue.setStartDate;
                selectedPeriodFilterValue.endTime   = periodFilterValue.setEndDate;
                $(eventCont).trigger("customChangeDate", [periodFilterValue.setStartDate, periodFilterValue.setEndDate]);
            }
        });

        //  підписатися на івент приховування контейнера вибору дати. Перевірка чи була змінена дата. Так - генеруєм івент для заданого контейнера
        periodFilterObj.on("hide", function(e) {
            var stDate = periodFilterObj.find('#startTime').datepicker('getDate'),
                enDate = periodFilterObj.find('#endTime').datepicker('getDate');

            stDate = checkDateValue(stDate.getDate()) + "." + checkDateValue(stDate.getMonth() + 1) + "." + stDate.getFullYear();
            enDate = checkDateValue(enDate.getDate()) + "." + checkDateValue(enDate.getMonth() + 1) + "." + enDate.getFullYear();

            if (selectedPeriodFilterValue.startTime !== stDate || selectedPeriodFilterValue.endTime !== enDate) {
                selectedPeriodFilterValue.startTime = stDate;
                selectedPeriodFilterValue.endTime   = enDate;
                $(eventCont).trigger("customChangeDate", [stDate, enDate]);
            }
        });
    }

    function createFixedPeriodCont() {
        var fixedPeriodCont = $("<div>").attr({
                "id": "fixedPeriodCont"
            }).css({
                "display" : "none",
                "position": "absolute",
                "width"   : "150px",
                "border"  : "1px solid rgba(0, 0, 0, 0.2)",
                "background"   : "white",
                "box-shadow"   : "rgba(0, 0, 0, 0.2) 0px 2px 5px",
                "border-radius": "2px",
                "top" : "240px",
                "z-index": "11"
            }),
            ulCont = $("<ul>").attr({
                "class": "list-group"
            }).css({
                "list-style-type": "none",
                "margin": "0",
                "padding": "0",
                "text-align": "left"
            }),

            liYesterday = $("<li>").attr({"class": "fixedPeriodDate", "fixedPeriod": "isYesterday"}).text("Yesterday").css({
                "font-family": "sans-serif"
            }),
            liToday     = $("<li>").attr({"class": "fixedPeriodDate", "fixedPeriod": "isToday"}).text("Today").css({
                "font-family": "sans-serif"
            }),

            liPrevWeek  = $("<li>").attr({"class": "fixedPeriodDate", "fixedPeriod": "isPrevWeek"}).text("Previous Week").css({
                "font-family": "sans-serif"
            }),
            liCurrWeek  = $("<li>").attr({"class": "fixedPeriodDate", "fixedPeriod": "isCurrWeek"}).text("Current Week").css({
                "font-family": "sans-serif"
            }),

            liPrevMonth = $("<li>").attr({"class": "fixedPeriodDate", "fixedPeriod": "isPrevMonth"}).text("Previous Month").css({
                "font-family": "sans-serif"
            }),
            liCurrMonth = $("<li>").attr({"class": "fixedPeriodDate", "fixedPeriod": "isCurrMonth"}).text("Current Month").css({
                "font-family": "sans-serif"
            }),

            liHr1        = $("<li>").append($("<hr>"));
            liHr2        = $("<li>").append($("<hr>"));


        $(ulCont).append(liYesterday);
        $(ulCont).append(liToday);

        //$(ulCont).append(liHr1);


        $(ulCont).append(liPrevWeek);
        $(ulCont).append(liCurrWeek);

        //$(ulCont).append(liHr2);

        $(ulCont).append(liPrevMonth);
        $(ulCont).append(liCurrMonth);

        $(fixedPeriodCont).append(ulCont);

        return fixedPeriodCont;
    }

    //  По default filter value - currentMonth
    function setDefaultFilterValue() {
        selectedPeriodFilterValue.startTime = FIXED_PERIOD_VALUE["isCurrMonth"]().setStartDate;
        selectedPeriodFilterValue.endTime = FIXED_PERIOD_VALUE["isCurrMonth"]().setEndDate;

        periodFilterObj.find('#startTime').datepicker('update', FIXED_PERIOD_VALUE["isCurrMonth"]().setStartDate);
        periodFilterObj.find('#endTime').datepicker('update', FIXED_PERIOD_VALUE["isCurrMonth"]().setEndDate);
        //periodFilterObj.data('datepicker').updateDates();
    }

    function setEventCont(container) {
        eventCont = container;
    }

    /**                                               ADDITIONAL FUNCTIONS
     ******************************************************************************************************************/

    function isContainerEmpty(container) {
        if (container === undefined || container === null) {
            console.error("Cannot render periodFilter in this container. Container Unknown!");
            return false;
        }


        if ($(container).children().length > 0) {
            if ($(container).find("#datepicker")) {
                console.warn("Cannot render periodFilter in this container. This container already have a periodFilter!");
                return false;
            } else {
                console.error("Cannot render periodFilter in this container. Container not empty!");
                return false;
            }
        }
        return true;
    }

    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    //  показує або приховує блок фіксованих періодів
    function showFixedPeriod() {
        if ($("#fixedPeriodCont").is(":visible")) {
            $("#fixedPeriodCont").hide();
        } else {
            $("#fixedPeriodCont").show();
        }
    }

    function removeDate() {
        debugger
    }

    //  Перевіряє чи переданий параметер < 10. Якщо так тоді добавити перед ним 0
    function checkDateValue(dateValue) {
        if (+dateValue < 10) {
            dateValue = "0" + dateValue
        }
        return dateValue;
    };

    /**
     * Визначає перший або остній день місяця
     * @param year
     * @param month
     * @param firstLast "first" | "last"
     * @returns {number}
     */
    function getDayInMonth(year, month, firstLast) {
        if (firstLast === "first") {
            var date = new Date(year, month - 1, 1);
            return date.getDate();
        } else if (firstLast === "last") {
            var date = new Date(year, month, 0);
            return date.getDate();
        }
    }

    function setValue(startDate, endDate) {
        periodFilterObj.find('#startTime').datepicker('update', startDate);
        periodFilterObj.find('#endTime').datepicker('update', endDate);
        //periodFilterObj.data('datepicker').updateDates();

        selectedPeriodFilterValue.startTime = startDate;
        selectedPeriodFilterValue.endTime   = endDate;
    }

    /**
     * init(container) - створює всі потрібні елементи, підписується на івенти ліби, вставляє фільтр в переданий контейнер
     * setValue - задає нові значення фільтрів. Значення переданих параметрів в форматі mm.dd.yy
     * setEventCont - вказує на контейнер для якого генерувати івенти
     */
    return {
        init: init,
        setValue: setValue,
        setEventCont: setEventCont
    }

});