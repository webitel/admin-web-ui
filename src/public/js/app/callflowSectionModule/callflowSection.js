/**
 * При динамічному добавленні не працює видалення variables
 * Дозволяє сетати пусте значення. Заборонити пусте знчення
 */


define("callflowSection", ["webitelConnector", "alert", "jsoneditor", "bootbox", "rowSorted", "tagInput", "chosen", "text!/additionalFiles/CallFlowSection/AllTimeZone.txt"],
    function(webitelConnector, alert, JSONEditor, _bootbox, _rowSorted, _tagInput, chosen, AllTimeZone) {

        var currentDomainName = '',
            $defTable,
            $pubTable,
            $editPage,
            $editPublicPage,

            $extensionTable,
            $editExtensionPage,

            timeZoneList;


        var initDefTab = function() {

            $('#test-default-number').keyup(function(val) {
                var r = $('#def-input-number').val();
                if (!r) return;
                try {
                    var reg = new RegExp($('#def-input-number').val()),
                        str = 'Result: <br\>',
                        arr = reg.exec(this.value) || [];
                    arr.forEach(function(v, i) {
                        str += '&amp;reg0.$' + i + ' -> ' + v + '; <br/>';
                    });

                    $('#result-default-test').html(str)
                } catch (e) {
                    console.error(e);
                }
            });

            var editor,
                gotoId,
                activeRow,
                defaultRoutes,
                domainName,
                liveEdit = false,
                changePage = false;

            $defTable = $('#default-tabs-box table').bootstrapTable({
                url: "callflow/data/routes/default?domain=" + currentDomainName,
                field: "_id",
                cardView: true,
                columns: [
                    {
                        title: "_id",
                        field: "_id",
                        visible: false
                    },
                    {
                        title: "Number",
                        field: "destination_number"
                    },
                    {
                        title: "Name",
                        field: "name"
                    },
                    {
                        title: "Order",
                        field: "order",
                        width: "4",
                        align: "center"
                    },
                    {
                        title: "Action",
                        width: "4",
                        "formatter": function () {
                            return "</div class='form-group'>" +
                                        "<button class='btn btn-default btn-icon icon-lg fa fa-sort move-action'></button>" +
                                        "<button class='btn btn-default edit-default'>Edit</button>" +
                                        "<button class='btn btn-default delete-default'>Delete</button>" +
                                        "<button class='btn btn-default cfd-default'>Designer</button>" +
                                    "</div>"
                        }
                    }
                ],
                onLoadSuccess: function (data) {
                    defaultRoutes = data;
                    domainName = currentDomainName;
                    if (gotoId) {
                        $defTable.find('#' + gotoId + ' td').click()
                    };
                    enableDefAction();
                },
                onClickRow: function (rowData, div) {
                    changePage = false;
                    if (!rowData || $(div).hasClass('selected') || $editPage.newRecord) return;

                    if (liveEdit) {
                        $('#default-edit-page').fadeIn('slow');
                    };
                    gotoId = rowData['_id'];
                    activeRow = rowData;
                    $(div).addClass('selected').siblings().removeClass('selected');
                    $editPage.trigger('editRecord', {
                        name        : rowData['name'],
                        number      : rowData['destination_number'],
                        order       : rowData['order'],
                        timezone    : rowData['timezone'],
                        timezonename: rowData['timezonename'],
                        variables   : rowData.variables,
                        callflow    : rowData.callflow
                    });
                }
            });

            $("#def-input-name").change(function() {
                changePage = true;
            });

            $("#def-input-number").change(function() {
                changePage = true;
            });

            $defTable.on('removeRecord', function (e, id) {

                var _remove = function () {
                    var  parentRow = $defTable.find('#' + id).prev();
                    if (parentRow.length == 0) {
                        parentRow = $defTable.find('#' + id).next();
                    };
                    var parentId = parentRow.attr('id');

                    $defTable.bootstrapTable('remove', {field: '_id', values: [id]});

                    var _t = $defTable.find('#' + parentId);
                    if (_t.length != 0) {
                        _t.find('td').click();
                    } else {
                        $editPage.trigger('closePage');
                        $editPage.trigger('reset');
                    };
                };

                if (id == 'newid') {
                    _remove();
                    return;
                };

                $.ajax({
                    type: "DELETE",
                    url: '/callflow/data/routes/default/' + id,
                    contentType: "application/json; charset=utf-8",
                    success: function () {
                        _remove();
                        alert.success(null, this.responseText, 3000);
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'DELETED failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown, null);
                    }
                });
            });

            $defTable.on('click', 'button.delete-default', function(){
                var delId = $(this).parents('tr').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $defTable.trigger('removeRecord', delId);
                    };
                });
            });

            $defTable.on('click', 'button.edit-default', function(){
                $('#default-edit-page').fadeIn('slow');
                $editPage.trigger('editRecord', {
                    name        : activeRow['name'],
                    number      : activeRow['destination_number'],
                    order       : activeRow['order'],
                    timezone    : activeRow['timezone'],
                    timezonename: activeRow['timezonename'],
                    variables   : activeRow['variables'],
                    callflow    : activeRow.callflow
                });
            });


            /**
             * Open CallFlow Designer
             */
            $defTable.on("click", 'button.cfd-default', function() {

                //  TODO
                //      як передати потрібні значення в дочірнє вікно. Щоб вони там зберігалися, навіть після оновлення F5 вікна. Передаю через параметри
                //      обробити помилки вже відкритого вікна
                var
                    cfdWindow = window.open("/callflow/designer?schemaType=" + "default" + "&id=" + (activeRow._id || "") + "&domain=" + "makaron", "", "width=1500, height=800");


                if ( cfdWindow  === null ) {
                    console.error("Please, allow to open new Window");
                    return;
                }
                cfdWindow .focus();
            });

            $($defTable).rowSorter({
                handler: "button.move-action",
                onDragStart: function () {

                },
                onDrop: function(tbody, row, index, oldIndex) {
                    var prevId = $('#' + row.id).prev().attr('id'),
                        currentOrder;

                    if (prevId) {
                        currentOrder = findRowById(defaultRoutes, prevId);
                        if (currentOrder) {
                            currentOrder = parseInt(currentOrder['order']);
                        } else {
                            currentOrder = 0;
                        };
                    } else {
                        currentOrder = 0;
                    };

                    incOrderDefault(currentDomainName, 1, currentOrder, function (err, res) {
                        if (err) {
                            // TODO Беда
                            return;
                        };
                        setOrderDefault(row.id, (currentOrder + 1), function (err) {
                            if (err) {
                                // ++
                                return;
                            };
                            gotoId = row.id;
                            $defTable.trigger('refreshData');
                        });
                    });
                    return false;
                }
            });

            $defTable.on('addRecord', function (e, param) {
                var table = $defTable.bootstrapTable('append', [{_id: 'newid'}]).find('tbody tr'),
                    $newRow = $(table[table.length -1 ]);
                $newRow.find('td')[0].click();
                $newRow.find('button').css('display', 'none');
                $('#default-edit-page').fadeIn('slow');
                $editPage.trigger('newRecord');
                $editPage.newRecord = true;
            });

            $defTable.on('cancelRecord', function (e, param) {
                var _fn = function () {
                    $editPage.newRecord = false;
                    liveEdit = false;
                    if ($defTable.find('#newid').length > 0) {
                        $defTable.trigger('removeRecord', 'newid');
                    } else {
                        $editPage.trigger('closePage');
                    };
                    $('#wrap-def-table').fadeIn('slow');
                    enableDefAction();
                };
                if (!$editPage.newRecord && changePage) {
                    window.bootbox.confirm("Save this record ?", function(result) {
                        if (result) {
                            $editPage.find('#default-save').click();
                        };
                        _fn();
                    });
                } else {
                    _fn();
                };
            });

            $defTable.on('refreshData', function (e) {
                editor.set([]);
                $defTable.bootstrapTable('refresh', {
                    url: "callflow/data/routes/default?domain=" + currentDomainName
                });
            });

            $defTable.on('tabChange', function (e) {
                if (currentDomainName != domainName) {
                    $editPage.trigger('reset');
                    $defTable.trigger('refreshData');
                };
            });

            $editPage = $('#default-edit-page');
            $editPage.find('#default-add').on('click', function (e) {

                var $this = $editPage,
                    $name = $this.find('#def-input-name'),
                    $number = $this.find('#def-input-number'),
                    order = getMaxOrder(defaultRoutes),
                    name = $name.val(),
                    number = $number.val(),
                    callflow = editor.get(),
                    error = false;

                if (name == '') {
                    $name.parent().addClass('has-error');
                    error = true;
                } else {
                    $name.parent().removeClass('has-error');
                };
                if (number == '') {
                    error = true;
                    $number.parent().addClass('has-error');
                } else {
                    $number.parent().removeClass('has-error');
                };

                if (!callflow) {
                    error = true;
                };

                if (error) {
                    alert.error(null, 'Bad request!');
                    return;
                }
                var data = {
                    destination_number: number,
                    name: name,
                    order: order,
                    domain: currentDomainName,
                    timezone: getDef_timeZone(),
                    fs_timezone: getDef_TZ_country(),
                    timezonename: getDef_timeZone_Name(),
                    callflow: callflow
                };

                $.ajax({
                    type: "POST",
                    url: '/callflow/data/routes/default?',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    success: function (response) {
                        refreshDefaultData();
                        alert.success(null, 'Created', 3000);
                        var json_res = JSON.parse(response);
                        gotoId = json_res['info'];
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });
            });
            $editPage.find('#default-cancel').on('click', function (e) {
                $defTable.trigger('cancelRecord');
            });
            $editPage.find('#default-save').on('click', function (e) {

                var $this = $editPage,
                    $name = $this.find('#def-input-name'),
                    $number = $this.find('#def-input-number'),
                    order = activeRow['order'],
                    name = $name.val(),
                    number = $number.val(),
                    callflow = editor.get(),
                    error = false;
                if (name == '') {
                    $name.parent().addClass('has-error');
                    error = true;
                } else {
                    $name.parent().removeClass('has-error');
                };
                if (number == '') {
                    error = true;
                    $number.parent().addClass('has-error');
                } else {
                    $number.parent().removeClass('has-error');
                };

                if (!callflow) {
                    error = true;
                };

                if (error) {
                    alert.error(null, 'Bad request!');
                    return;
                }
                var data = {
                    destination_number: number,
                    name: name,
                    order: order,
                    domain: currentDomainName,
                    timezone: getDef_timeZone(),
                    fs_timezone: getDef_TZ_country(),
                    timezonename: getDef_timeZone_Name(),
                    callflow: callflow
                };
                $.ajax({
                    type: "PUT",
                    url: '/callflow/data/routes/default?id=' + activeRow['_id'],
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    success: function (response) {
                        refreshDefaultData();
                        alert.success(null, 'Updated', 3000);
                        var json_res = JSON.parse(response);
                        gotoId = json_res['_id'];
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });
            });

            $editPage.on('reset', function (e) {
                $editPage.find('#def-input-name').val('');
                $editPage.find('#def-input-number').val('');
                $editPage.find('#def-input-order').val('');
                clearDef_timezone();
                if (editor)
                    editor.set([]);
            });
            $editPage.on('closePage', function (e) {
                $('#default-edit-page').hide(300);
            });

            $editPage.on('newRecord', function (e) {
                setEditPageValues();
                disableDefAction();
                $editPage.find('#default-add').css('display', '');
                $editPage.find('#default-save').css('display', 'none');
            });

            $editPage.on('editRecord', function (e, param) {
                $editPage.find('#default-add').css('display', 'none');
                $editPage.find('#default-save').css('display', '');
                setEditPageValues(param);
            });
            var container = document.getElementById("def-jsoneditor");
            editor = new JSONEditor(container, {
                mode: "code",
                history: false
            }, []);

            initMenuJSON(editor);

            var setEditPageValues = function (param) {
                param = param || {};
                var $name = $editPage.find('#def-input-name'),
                    $number = $editPage.find('#def-input-number'),
                    $order = $editPage.find('#def-input-order');

                $name.parent().removeClass('has-error');
                $number.parent().removeClass('has-error');
                $order.parent().removeClass('has-error');

                $name.val(param['name']);
                $number.val(param['number']);
                $order.val(param['order']);
                setDef_timeZone(param['timezone'], param['timezonename']);

                if (editor)
                    editor.set(param['callflow'] || []);
            };

            var refreshDefaultData = function () {
                $editPage.newRecord = false;
                $defTable.bootstrapTable('refresh');
            };

            var enableDefAction = function () {
                $editPage.newRecord = false;
                $('#default-add-record').removeClass('disabled');
                $('#default-refresh-table').removeClass('disabled');
            };

            var disableDefAction = function () {
                $('#default-add-record').addClass('disabled');
                $('#default-refresh-table').addClass('disabled');
            };
        };

        var findRowById = function (data, id) {
            for (var i = 0, len = data.length; i < len; i++) {
                if (data[i]['_id'] == id)
                    return data[i]
            };
        };

        var getMaxOrder = function (data) {
            var _max = 0, _t;
            if (data && data.length > 0) {
                for (var i = 0, len = data.length; i < len; i++) {
                    _t = data[i]['order'];
                    if (_t && parseInt(_t) > _max) {
                        _max = parseInt(_t);
                    };
                };
            };
            return (_max + 1);
        };

        var setOrderDefault = function (id, order, cb) {
            var data = {
                "order": order
            };
            $.ajax({
                type: "PUT",
                url: '/callflow/data/routes/default/' + id + '/setOrder',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data),
                success: function (response) {
                    cb(null, response)
                },
                error: function (responseData, textStatus, errorThrown) {
                    cb(new Error(responseData));
                }
            });
        };

        var incOrderDefault = function (domain, inc, start, cb) {
            var data = {
                "inc": inc,
                "start": start
            };
            $.ajax({
                type: "PUT",
                url: '/callflow/data/routes/default/' + domain + '/incOrder',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data),
                success: function (response) {
                    cb(null, response)
                },
                error: function (responseData, textStatus, errorThrown) {
                    cb(new Error(responseData));
                }
            });
        };

        function showDomainLookUp() {
            webitel.domainList(function(res) {
                if (res.status === 0) {
                    var domainData = this.parseDataTable();

                    var domainDataHeaders = prepareHeadersToDataTable(domainData.headers);
                    initDomainTable(domainDataHeaders);

                    var domainDataRow = prepareDataForLoadToDataTable(domainData.headers, domainData.data);
                    $('#domainListTable').bootstrapTable("load", domainDataRow);
                    $("#domain-lookup-modal").modal("show");
                }
                else if (res.status === 1) {
                    alert.error(null, this.responseText, null);
                }
            });
        }
        /**
         * @param [] headers масив стрічок заголовків колонок таблиці
         * @param [] rows масив масивів стрічок
         * return [] rowsData масив підготовлених обєктів для заповнення даними dataTable
         */
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
        /**
         * Приводить масив назв колонок до потрібного вигляду
         * @param [] headers масив стрічок заголовків
         * return [] columnHead масив підготовлених обєктів для ініціалізації dataTable
         */
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
        /**
         * Ініціалізує таблицю доменів. Задає параметри dataTable
         * @param [] domainColumns масив обєктів, кожен із яких описує окрему колонку
         */
        function initDomainTable(domainColumns) {
            $('#domainListTable').bootstrapTable({
                cache: false,
                striped: true,
                pagination: true,
                pageSize: 10,
                pageList: [],
                search: true,
                columns: domainColumns
            })
        }

        /**
         * Призначити і підписатися на івенти розділу
         */
        function subsOnEvents() {
            //  клік по кнопці вибору домена
            $(".selectDomainBtn").on("click", function (e) {
                showDomainLookUp();
            });

            //  двойний клік по lookup доменів.
            $('#domainListTable').bind("dblclick", function(e) {
                if ($(this).find("tbody tr:hover").length === 1) {
                    var tr = $(this).find("tbody tr:hover"),
                        domain = $(tr).find("td div").attr("value");

                    if (domain) {
                        setDomInSelectBtn(domain);
                        $(".addVariablesBtn").css({"visibility": "visible"});
                    };

                    $("#domain-lookup-modal").modal("hide");
                }
            });

            $('#default-tabs-box .table-toolbar-left #default-add-record').on('click', function (e) {
                $defTable.trigger('addRecord');
            });

            $('#default-tabs-box .table-toolbar-left #default-delete').on('click', function (e) {
                var delId = $defTable.find('.selected').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $defTable.trigger('removeRecord', delId);
                    };
                });
            });

            $('#public-tabs-box .table-toolbar-left #public-add-record').on('click', function (e) {
                $pubTable.trigger('addRecord');
            });

            $('#public-tabs-box .table-toolbar-left #public-delete').on('click', function (e) {
                var delId = $pubTable.find('.selected').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $pubTable.trigger('removeRecord', delId);
                    };
                });
            });



            $('#callflow-nav li').on('click', function(e){
                if (e.target.id == 'public-tab-btn') {
                    $pubTable.trigger('tabChange');
                } else if (e.target.id == "extension-tab-btn") {
                    $extensionTable.trigger('tabChange');
                } else {
                    $defTable.trigger('tabChange');
                }
            });

            $('#default-refresh-table').on('click', function (e) {
                $defTable.trigger('refreshData');
            });

            $('#public-refresh-table').on('click', function (e) {
                $pubTable.trigger('refreshData');
            });

            $('#extension-refresh-table').on('click', function (e) {
                $extensionTable.trigger('refreshData');
            });

            $('.btn-hide-grid').on('click', function() {
                var gridId = $(this).attr('data'),
                    $grid = $('#' + gridId);
                if ($grid.css('display') == 'none') {
                    $grid.fadeIn('slow');
                } else {
                    $grid.hide(300);
                }

            });
        }

        function initPublicTab() {
            //if ($pubTable) return;

            var editor,
                gotoId,
                activeRow,
                defaultRoutes,
                domainName,
                liveEdit = false,
                changePage = false;

            $pubTable = $('#public-table').bootstrapTable({
                url: "callflow/data/routes/public?domain=" + currentDomainName,
                field: "_id",
                cardView: true,
                columns: [
                    {
                        title: "_id",
                        field: "_id",
                        visible: false
                    },
                    {
                        title: "Number",
                        field: "destination_number"
                    },
                    {
                        title: "Name",
                        field: "name"
                    },
                    {
                        title: "Action",
                        width: "4",
                        "formatter": function () {
                            return "</div class='form-group'>" +
                                "<button class='btn btn-default edit-public'>Edit</button>" +
                                "<button class='btn btn-default delete-public'>Delete</button>" +
                                "</div>"
                        }
                    }
                ],
                onLoadSuccess: function (data) {
                    domainName = currentDomainName;
                    defaultRoutes = data;
                    if (gotoId) {
                        $pubTable.find('#' + gotoId + ' td').click()
                    }
                    enableDefAction();
                },
                onClickRow: function (rowData, div) {
                    changePage = false;
                    if (!rowData || $(div).hasClass('selected') || $editPublicPage.newRecord) return;

                    if (liveEdit) {
                        $('#public-edit-page').fadeIn('slow');
                    };
                    gotoId = rowData['_id'];
                    activeRow = rowData;
                    $(div).addClass('selected').siblings().removeClass('selected');
                    $editPublicPage.trigger('editRecord', {
                        name        : rowData['name'],
                        number      : rowData['destination_number'],
                        callflow    : rowData.callflow,
                        timezone    : rowData.timezone,
                        timezonename: rowData.timezonename,
                        variables   : rowData.variables
                    });
                }
            });

            $("#public-input-name").change(function() {
                changePage = true;
            });

            $("#pub-timeZoneInput").change(function() {
                changePage = true;
            });

            $("#public-input-number").change(function() {
                //changePage = true;
            });

            $pubTable.on('removeRecord', function (e, id) {

                var _remove = function () {
                    var  parentRow = $pubTable.find('#' + id).prev();
                    if (parentRow.length == 0) {
                        parentRow = $pubTable.find('#' + id).next();
                    };
                    var parentId = parentRow.attr('id');

                    $pubTable.bootstrapTable('remove', {field: '_id', values: [id]});

                    var _t = $pubTable.find('#' + parentId);
                    if (_t.length != 0) {
                        _t.find('td').click();
                    } else {
                        $editPublicPage.trigger('closePage');
                        $editPublicPage.trigger('reset');
                    };
                };

                if (id == 'newid') {
                    _remove();
                    return;
                };

                $.ajax({
                    type: "DELETE",
                    url: '/callflow/data/routes/public/' + id,
                    contentType: "application/json; charset=utf-8",
                    success: function () {
                        _remove();
                        alert.success(null, this.responseText, 3000);
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'DELETED failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown, null);
                    }
                });
            });

            $pubTable.on('addRecord', function (e, param) {
                var table = $pubTable.bootstrapTable('append', [{_id: 'newid'}]).find('tbody tr'),
                    $newRow = $(table[table.length -1 ]);
                $newRow.find('td')[0].click();
                $newRow.find('button').css('display', 'none');
                $('#public-edit-page').fadeIn('slow');
                $editPublicPage.trigger('newRecord');
                $editPublicPage.newRecord = true;
            });

            $pubTable.on('cancelRecord', function (e, param) {
                var _fn = function () {
                    $editPublicPage.newRecord = false;
                    if ($pubTable.find('#newid').length > 0) {
                        $pubTable.trigger('removeRecord', 'newid');
                    } else {
                        $editPublicPage.trigger('closePage');
                    }
                    ;
                    $('#wrap-pub-table').fadeIn('slow');
                    enableDefAction();
                };
                if (!$editPublicPage.newRecord && changePage) {
                    window.bootbox.confirm("Save this record ?", function(result) {
                        if (result) {
                            $editPublicPage.find('#public-save').click();
                        };
                        _fn();
                    });
                } else {
                    _fn();
                };
            });

            $pubTable.on('refreshData', function (e) {
                editor.set([]);
                $pubTable.bootstrapTable('refresh', {
                    url: "callflow/data/routes/public?domain=" + currentDomainName
                });
            });

            $pubTable.on('tabChange', function (e) {
                if (currentDomainName != domainName) {
                    $pubTable.trigger('refreshData');
                };
            });

            $pubTable.on('click', 'button.delete-public', function(){
                var delId = $(this).parents('tr').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $pubTable.trigger('removeRecord', delId);
                    };
                });
            });

            $pubTable.on('click', 'button.edit-public', function(){
                $('#public-edit-page').fadeIn('slow');
                $editPublicPage.trigger('editRecord', {
                    name        : activeRow['name'],
                    number      : activeRow['destination_number'],
                    callflow    : activeRow.callflow,
                    timezone    : activeRow['timezone'],
                    timezonename: activeRow['timezonename'],
                    variables   : activeRow['variables']
                });
            });

            $pubTable.on('click', 'button.delete-default', function(){
                var delId = $(this).parents('tr').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $pubTable.trigger('removeRecord', delId);
                    };
                });
            });

            $editPublicPage = $('#public-edit-page');
            $editPublicPage.find('#public-add').on('click', function (e) {
                var $this = $editPublicPage,
                    $name = $this.find('#public-input-name'),
                    $number = $this.find('#public-input-number'),
                    name = $name.val(),
                    number = $number.val(),
                    callflow = editor.get(),
                    error = false;
                if (name == '') {
                    $name.parent().addClass('has-error');
                    error = true;
                } else {
                    $name.parent().removeClass('has-error');
                };
                if (number == '') {
                    error = true;
                    $number.parent().addClass('has-error');
                } else {
                    $number.parent().removeClass('has-error');
                };

                if (!callflow) {
                    error = true;
                };

                if (error) {
                    alert.error(null, 'Bad request!');
                    return;
                }
                var data = {
                    destination_number: number.split(','),
                    name        : name,
                    domain      : currentDomainName,
                    callflow    : callflow,
                    timezone    : getPub_timeZone(),
                    fs_timezone : getPub_TZ_country(),
                    timezonename: getPub_timeZone_Name()
                };
                $.ajax({
                    type: "POST",
                    url: '/callflow/data/routes/public?',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    success: function (response) {
                        refreshDefaultData();
                        alert.success(null, 'Created', 3000);
                        var json_res = JSON.parse(response);
                        gotoId = json_res['info'];
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });
            });
            $editPublicPage.find('#public-cancel').on('click', function (e) {
                $pubTable.trigger('cancelRecord');
            });

            $editPublicPage.find('#public-save').on('click', function (e) {
                var $this = $editPublicPage,
                    $name = $this.find('#public-input-name'),
                    $number = $this.find('#public-input-number'),
                    name = $name.val(),
                    number = $number.val(),
                    callflow = editor.get(),
                    error = false;
                if (name == '') {
                    $name.parent().addClass('has-error');
                    error = true;
                } else {
                    $name.parent().removeClass('has-error');
                };
                if (number == '') {
                    error = true;
                    $number.parent().addClass('has-error');
                } else {
                    $number.parent().removeClass('has-error');
                };

                if (!callflow) {
                    error = true;
                };

                if (error) {
                    alert.error(null, 'Bad request!');
                    return;
                }
                var data = {
                    destination_number: number.split(','),
                    name        : name,
                    domain      : currentDomainName,
                    callflow    : callflow,
                    timezone    : getPub_timeZone(),
                    fs_timezone : getPub_TZ_country(),
                    timezonename: getPub_timeZone_Name()
                };
                $.ajax({
                    type: "PUT",
                    url: '/callflow/data/routes/public?id=' + activeRow['_id'],
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    success: function (response) {
                        refreshDefaultData();
                        alert.success(null, 'Updated', 3000);
                        var json_res = JSON.parse(response);
                        gotoId = json_res['_id'];
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });
            });

            $editPublicPage.on('reset', function (e) {
                $editPublicPage.find('#public-input-name').val('');
                $editPublicPage.find('#public-input-number').val('');
                clearPub_timezone();
                if (editor)
                    editor.set([]);
            });
            $editPublicPage.on('closePage', function (e) {
                $('#public-edit-page').hide(300);
                $('#wrap-pub-table').fadeIn('slow');
            });

            $editPublicPage.on('newRecord', function (e) {
                setEditPageValues();
                disableDefAction();
                $editPublicPage.find('#public-add').css('display', '');
                $editPublicPage.find('#public-save').css('display', 'none');
            });

            $editPublicPage.on('editRecord', function (e, param) {
                $editPublicPage.find('#public-add').css('display', 'none');
                $editPublicPage.find('#public-save').css('display', '');
                setEditPageValues(param);
            });

            var container = document.getElementById("public-jsoneditor");
            editor = new JSONEditor(container, {
                mode: "code",
                history: false
            }, []);

            var setEditPageValues = function (param) {
                param = param || {};
                var _s = param['number'] || [];
                $('#public-input-number').tagsinput('removeAll');
                $('#public-input-number').tagsinput('add', _s.join(','));
                setPub_timeZone(param['timezone'], param['timezonename']);

                $editPublicPage.find('#public-input-name').val(param['name']);
                if (editor)
                    editor.set(param['callflow'] || []);
            };

            var refreshDefaultData = function () {
                $editPublicPage.newRecord = false;
                $pubTable.bootstrapTable('refresh');
            };

            var enableDefAction = function () {
                $editPublicPage.newRecord = false;
                $('#public-add-record').removeClass('disabled');
                $('#public-refresh-table').removeClass('disabled');
            };

            var disableDefAction = function () {
                $('#public-add-record').addClass('disabled');
                $('#public-refresh-table').addClass('disabled');
            };


        }

        /**
         * Відобразити на кнопці lookup домена, вибраний домен (only root)
         */
        function setDomInSelectBtn(domain) {
            $(".selectDomainBtn").text(domain);
            currentDomainName = domain;
            $('#wrap-pub-table').fadeIn('slow');
            $('#wrap-def-table').fadeIn('slow');
            $('#wrap-extension-table').fadeIn('slow');

            if ($('#callflow-nav .active a').attr('id') == "public-tab-btn") {
                $pubTable.trigger('refreshData');
                $editPublicPage.trigger('closePage');
            } else if ($('#callflow-nav .active a').attr('id') == "extension-tab-btn") {
                $extensionTable.trigger('refreshData');
                $editExtensionPage.trigger('closePage');
            } else {
                $defTable.trigger('refreshData');
                $editPage.trigger('closePage');
            }
        }

        function createWebitel() {
            if (!window.webitel) {
                webitelConnector.autoConnect(init);
            } else {
                init();
            }
        }

        function initDomain () {
            currentDomainName = $('#domain-id').attr('data');
            if (currentDomainName) {
                $(".addVariablesBtn").css({"visibility": "visible"});
            }
        }

        function init() {

            //  показати головний контенер із контентом
            $("#content-container").show();

            //  розпарсити дані, вставити їх в розмітку
            prepareTimeZoneData("def-timeZoneCont");
            prepareTimeZoneData("pub-timeZoneCont");
            prepareTimeZoneData("extension-timeZoneCont");

            //
            def_subscribeOnTimeZoneChange();
            pub_subscribeOnTimeZoneChange();
            extension_subscribeOnTimeZoneChange();

            //  add variables btn
            initAddVariablesBtn();

            initDomain();
            initPublicTab();
            subsOnEvents();

            initDefTab();

            //  extension
            initExtensionTab();
        }

        function initMenuJSON (editor) {
            // TODO
            /*
            var $menu = $(editor.menu),
                $gBridge = $('<div>', {
                    class: "btn-group"
                }).append($('<button>', {
                    class: "btn btn-xs btn-default fa fa-phone-square"
                })),
                $btnPop = $('<button>', {
                    class: "btn btn-xs btn-default dropdown-toggle dropdown-toggle-icon",
                    "data-toggle": "dropdown",
                    "type": "button",
                    "aria-expanded": "true"
                }).append($('<i>', {
                    class: "dropdown-caret fa fa-caret-up"
                })),
                $ulBridge = $('<ul>', {
                    class: "dropdown-menu"
                }).append($('<li>').append($('<a>', {
                    text: "Action",
                    href: "#"
                })));
            $gBridge.append($btnPop, $ulBridge);

            $menu.append($gBridge);
        */
        }

        /**                                         TIMEZONE SELECT
         ******************************************************************************************************************/

        /**
         * TODO
         *     Якщо зона вибрана, підтягувати прапор країни.
         *     І при кліку на input підсвітити вибраний елемент
         */


        //  modified 10.07.2015
        //  change timezone list. Add flags for country

        //  TIMEZONE INPUT EVENT
        function def_subscribeOnTimeZoneChange() {

            $("#def-timeZoneInput").unbind("change");
            $("#def-timeZoneInput").on("change", function(e) {
                $("#def-timeZoneInput").val("");
                $("#def-timeZoneInput").attr("timezonevalue", "");
            });

            $("#def-timeZoneInput").unbind("focus");
            $("#def-timeZoneInput").focus(function() {
                $("#def-timeZoneCont").show();
            });

            $("#def-timeZoneInput").unbind("focusout");
            $("#def-timeZoneInput").focusout(function() {

                var
                    selectedTZ,
                    tz_flag_class,
                    defInputVal = $("#def-timeZoneInput").val();

                $("#def-timeZoneCont").hide();

                //  Відобразити всі часові зони, при втраті фокусу
                $("#def-timeZoneCont ul li").css('display', 'block');

                selectedTZ = $("#def-timeZoneCont ul li:hover");
                tz_flag_class = $(selectedTZ).find("div").attr("class");

                if ( selectedTZ.length > 0 ) {
                    $("#def-timeZoneInput").val($(selectedTZ).find("span").text());
                    $("#def-timeZoneInput").attr('timeZoneValue', $(selectedTZ).find("span").attr("timezonevalue"));

                    //  добавити додаткові класи для відображення прапора
                    $("#def-timeZoneInput").parent().parent().addClass("flag-defined");
                    $(".def-tz-cont .flag-cont div").removeClass();
                    $(".def-tz-cont .flag-cont div").addClass(tz_flag_class);
                }
                //  видаляти прапор тоді, коли поле input пусте
                else if ( defInputVal === "" && selectedTZ.length === 0 ) {
                    $("#def-timeZoneInput").parent().parent().removeClass("flag-defined");
                }
            });


            
            //  keys Event
            $("#def-timeZoneInput").off("keypress");
            $("#def-timeZoneInput").on("keypress", function(e) {
                var
                    keyCode = (e.keyCode ? e.keyCode : e.which),
                    keyText = String.fromCharCode(keyCode),
                    searchVal = e.target.value + keyText;

                //  event Ctrl + C
                if ( keyCode === 99 && e.ctrlKey ) {
                    return;
                }

                searchTimeZone(searchVal, "def-timeZoneCont");
            });

            //  paste, cut Events
            $("#def-timeZoneInput").off("paste");
            $("#def-timeZoneInput").off("cut");
            $("#def-timeZoneInput").on({
                paste : function(e){
                    setTimeout(function() {
                        searchTimeZone(e.target.value, "def-timeZoneCont");
                    }, 0);
                    
                },
                cut : function(e){
                    setTimeout(function() {
                        searchTimeZone(e.target.value, "def-timeZoneCont");
                    }, 0);                    
                }
            });

            //  backspace Event
            $('#def-timeZoneInput').off("keyup");
            $('#def-timeZoneInput').on("keyup", function(e){
                var
                    searchVal,
                    keyCode = (e.keyCode ? e.keyCode : e.which);

                //  backspace event
                if ( keyCode === 8 ) {
                    searchVal = e.target.value;
                    searchTimeZone(searchVal, "def-timeZoneCont");
                }
                //  ctrl + Z event
                else if ( keyCode === 90 && e.ctrlKey ) {
                    searchVal = e.target.value;
                    searchTimeZone(searchVal, "def-timeZoneCont");
                }
            });  
        }
        function pub_subscribeOnTimeZoneChange() {
            $("#pub-timeZoneInput").unbind("change");
            $("#pub-timeZoneInput").on("change", function() {
                $("#pub-timeZoneInput").val("");
                $("#pub-timeZoneInput").attr("timezonevalue", "");
            });

            $("#pub-timeZoneInput").unbind("focus");
            $("#pub-timeZoneInput").focus(function() {
                $("#pub-timeZoneCont").show();
            });

            $("#pub-timeZoneInput").unbind("focusout");
            $("#pub-timeZoneInput").focusout(function() {

                var
                    selectedTZ,
                    tz_flag_class,
                    pubInputVal = $("#pub-timeZoneInput").val();


                $("#pub-timeZoneCont").hide();

                //  Відобразити всі часові зони, при втраті фокусу
                $("#pub-timeZoneCont ul li").css('display', 'block');

                selectedTZ = $("#pub-timeZoneCont ul li:hover");
                tz_flag_class = $(selectedTZ).find("div").attr("class");

                if ( selectedTZ.length > 0 ) {
                    $("#pub-timeZoneInput").val($(selectedTZ).find("span").text());
                    $("#pub-timeZoneInput").attr('timeZoneValue', $(selectedTZ).find("span").attr("timezonevalue"));

                    //  добавити додаткові класи для відображення прапора
                    $("#pub-timeZoneInput").parent().parent().addClass("flag-defined");
                    $(".pub-tz-cont .flag-cont div").removeClass();
                    $(".pub-tz-cont .flag-cont div").addClass(tz_flag_class);
                }
                //  видаляти прапор тоді, коли поле input пусте
                else if ( pubInputVal === "" && selectedTZ.length === 0 ) {
                    $("#pub-timeZoneInput").parent().parent().removeClass("flag-defined");
                }
            });



            //  keys Event
            $("#pub-timeZoneInput").off("keypress");
            $("#pub-timeZoneInput").on("keypress", function(e) {
                var
                    keyCode = (e.keyCode ? e.keyCode : e.which),
                    keyText = String.fromCharCode(keyCode),
                    searchVal = e.target.value + keyText;

                //  event Ctrl + C
                if ( keyCode === 99 && e.ctrlKey ) {
                    return;
                }

                searchTimeZone(searchVal, "pub-timeZoneInput");
            });

            //  paste, cut Events
            $("#pub-timeZoneInput").off("paste");
            $("#pub-timeZoneInput").off("cut");
            $("#pub-timeZoneInput").on({
                paste : function(e){
                    setTimeout(function() {
                        searchTimeZone(e.target.value, "pub-timeZoneCont");
                    }, 0);

                },
                cut : function(e){
                    setTimeout(function() {
                        searchTimeZone(e.target.value, "pub-timeZoneCont");
                    }, 0);
                }
            });

            //  backspace Event
            $('#pub-timeZoneInput').off("keyup");
            $('#pub-timeZoneInput').on("keyup", function(e){
                var
                    searchVal,
                    keyCode = (e.keyCode ? e.keyCode : e.which);

                //  backspace event
                if ( keyCode === 8 ) {
                    searchVal = e.target.value;
                    searchTimeZone(searchVal, "pub-timeZoneCont");
                }
                //  ctrl + Z event
                else if ( keyCode === 90 && e.ctrlKey ) {
                    searchVal = e.target.value;
                    searchTimeZone(searchVal, "pub-timeZoneCont");
                }
            });
        }
        function extension_subscribeOnTimeZoneChange() {
            $("#extension-timeZoneInput").unbind("change");
            $("#extension-timeZoneInput").on("change", function() {
                $("#extension-timeZoneInput").val("");
                $("#extension-timeZoneInput").attr("timezonevalue", "");
            });

            $("#extension-timeZoneInput").unbind("focus");
            $("#extension-timeZoneInput").focus(function() {
                $("#extension-timeZoneCont").show();
            });

            $("#extension-timeZoneInput").unbind("focusout");
            $("#extension-timeZoneInput").focusout(function() {

                var
                    selectedTZ,
                    tz_flag_class,
                    extensionInputVal = $("#extension-timeZoneInput").val();

                $("#extension-timeZoneCont").hide();

                //  Відобразити всі часові зони, при втраті фокусу
                $("#extension-timeZoneCont ul li").css('display', 'block');

                selectedTZ = $("#extension-timeZoneCont ul li:hover");
                tz_flag_class = $(selectedTZ).find("div").attr("class");

                selectedTZ = $("#extension-timeZoneCont ul li:hover");

                if ( selectedTZ.length > 0 ) {
                    $("#extension-timeZoneInput").val($(selectedTZ).find("span").text());
                    $("#extension-timeZoneInput").attr('timeZoneValue', $(selectedTZ).find("span").attr("timezonevalue"));

                    //  добавити додаткові класи для відображення прапора
                    $("#extension-timeZoneInput").parent().parent().addClass("flag-defined");
                    $(".ex-tz-cont .flag-cont div").removeClass();
                    $(".ex-tz-cont .flag-cont div").addClass(tz_flag_class);
                }
                //  видаляти прапор тоді, коли поле input пусте
                else if ( extensionInputVal === "" && selectedTZ.length === 0 ) {
                    $("#extension-timeZoneInput").parent().parent().removeClass("flag-defined");
                }
            });




            //  keys Event
            $("#extension-timeZoneInput").off("keypress");
            $("#extension-timeZoneInput").on("keypress", function(e) {
                var
                    keyCode = (e.keyCode ? e.keyCode : e.which),
                    keyText = String.fromCharCode(keyCode),
                    searchVal = e.target.value + keyText;

                //  event Ctrl + C
                if ( keyCode === 99 && e.ctrlKey ) {
                    return;
                }

                searchTimeZone(searchVal, "extension-timeZoneCont");
            });

            //  paste, cut Events
            $("#extension-timeZoneInput").off("paste");
            $("#extension-timeZoneInput").off("cut");
            $("#extension-timeZoneInput").on({
                paste : function(e){
                    setTimeout(function() {
                        searchTimeZone(e.target.value, "extension-timeZoneCont");
                    }, 0);

                },
                cut : function(e){
                    setTimeout(function() {
                        searchTimeZone(e.target.value, "extension-timeZoneCont");
                    }, 0);
                }
            });

            //  backspace Event
            $('#extension-timeZoneInput').off("keyup");
            $('#extension-timeZoneInput').on("keyup", function(e){
                var
                    searchVal,
                    keyCode = (e.keyCode ? e.keyCode : e.which);

                //  backspace event
                if ( keyCode === 8 ) {
                    searchVal = e.target.value;
                    searchTimeZone(searchVal, "extension-timeZoneCont");
                }
                //  ctrl + Z event
                else if ( keyCode === 90 && e.ctrlKey ) {
                    searchVal = e.target.value;
                    searchTimeZone(searchVal, "extension-timeZoneCont");
                }
            });
        }

        //  GET TIMEZONE TIME
        function getDef_timeZone() {
            var time = $("#def-timeZoneInput").attr("timezonevalue");

            if (time === "") return "";

            var minutes,
                operation = time.substr(0, 1);

            time = time.replace("+", "");
            time = time.replace("-", "");

            minutes = time.split(":")[0]*60 + Number(time.split(":")[1]);

            return operation + minutes;
        }
        function getPub_timeZone() {
            var time = $("#pub-timeZoneInput").attr("timezonevalue");

            if (time === "") return "";

            var minutes,
                operation = time.substr(0, 1);

            time = time.replace("+", "");
            time = time.replace("-", "");

            minutes = time.split(":")[0]*60 + Number(time.split(":")[1]);

            return operation + minutes;
        }
        function getExtension_timeZone() {
            var time = $("#extension-timeZoneInput").attr("timezonevalue");

            if (time === "") return "";

            var minutes,
                operation = time.substr(0, 1);

            time = time.replace("+", "");
            time = time.replace("-", "");

            minutes = time.split(":")[0]*60 + Number(time.split(":")[1]);

            return operation + minutes;
        }

        //  GET country and city name
        function getDef_TZ_country() {
            return $("#def-timeZoneInput").val().split(" ")[1];
        }
        function getPub_TZ_country() {
            return $("#pub-timeZoneInput").val().split(" ")[1];
        }
        function getExtension_TZ_country() {
            return $("#extension-timeZoneInput").val().split(" ")[1];
        }

        //  GET TIMEZONE NAME
        function getDef_timeZone_Name() {
            return $("#def-timeZoneInput").val();
        }
        function getPub_timeZone_Name() {
            return $("#pub-timeZoneInput").val();
        }
        function getExtension_timeZone_Name() {
            return $("#extension-timeZoneInput").val();
        }

        //  CLEAR TIMEZONE
        function clearDef_timezone() {
            $("#def-timeZoneInput").val("");
            $("#def-timeZoneInput").attr("timezonevalue", "");
        }
        function clearPub_timezone() {
            $("#pub-timeZoneInput").val("");
            $("#pub-timeZoneInput").attr("timezonevalue", "");
        }
        function clearExtension_timezone() {
            $("#extension-timeZoneInput").val("");
            $("#extension-timeZoneInput").attr("timezonevalue", "");
        }

        //  SET TIMEZONE
        function setDef_timeZone(time, timeName) {

            var
                i,
                tzList = $("#def-timeZoneCont ul li"),
                liEl,
                flagClass,
                isFlagDefined = false;

            if ( !timeName ) {
                //  видалити допоміжний клас для відображення прапора
                $("#def-timeZoneInput").parent().parent().removeClass("flag-defined");

                console.warn("Can not set timezone. Received time is not valid");
                clearDef_timezone();
                return;
            }

            var startPos, endPos, timeZone;

            startPos = timeName.indexOf("(");
            endPos   = timeName.indexOf(")") + 1;

            timeZone = timeName.substr(startPos, endPos - startPos);

            timeZone = timeZone.replace("GMT", "");
            timeZone = timeZone.replace("(", "");
            timeZone = timeZone.replace(")", "");

            $("#def-timeZoneInput").val(timeName);
            $("#def-timeZoneInput").attr("timezonevalue", timeZone);


            for ( i = 0; i < tzList.length; i++ ) {
                liEl = tzList[i];

                if ( $(liEl).find("span").text() === timeName ) {
                    flagClass = $(liEl).find("div").attr("class");
                    isFlagDefined = true;
                    break;
                }
            }

            if ( isFlagDefined ) {
                $("#def-timeZoneInput").parent().parent().addClass("flag-defined");
                $(".def-tz-cont .flag-cont div").removeClass();
                $(".def-tz-cont .flag-cont div").addClass(flagClass);
            } else {
                $("#def-timeZoneInput").parent().parent().removeClass("flag-defined");
            }
        }
        function setPub_timeZone(time, timeName) {

            var
                i,
                tzList = $("#def-timeZoneCont ul li"),
                liEl,
                flagClass,
                isFlagDefined = false;

            if ( !timeName ) {
                $("#pub-timeZoneInput").parent().parent().removeClass("flag-defined");

                console.warn("Can not set timezone. Received time is not valid");
                clearPub_timezone();
                return;
            }

            var startPos, endPos, timeZone;

            startPos = timeName.indexOf("(");
            endPos   = timeName.indexOf(")") + 1;

            timeZone = timeName.substr(startPos, endPos - startPos);

            timeZone = timeZone.replace("GMT", "");
            timeZone = timeZone.replace("(", "");
            timeZone = timeZone.replace(")", "");

            $("#pub-timeZoneInput").val(timeName);
            $("#pub-timeZoneInput").attr("timezonevalue", timeZone);

            for ( i = 0; i < tzList.length; i++ ) {
                liEl = tzList[i];

                if ( $(liEl).find("span").text() === timeName ) {
                    flagClass = $(liEl).find("div").attr("class");
                    isFlagDefined = true;
                    break;
                }
            }

            if ( isFlagDefined ) {
                $("#pub-timeZoneInput").parent().parent().addClass("flag-defined");
                $(".pub-tz-cont .flag-cont div").removeClass();
                $(".pub-tz-cont .flag-cont div").addClass(flagClass);
            } else {
                $("#pub-timeZoneInput").parent().parent().removeClass("flag-defined");
            }

        }
        function setExtension_timeZone(time, timeName) {

            var
                i,
                tzList = $("#def-timeZoneCont ul li"),
                liEl,
                flagClass,
                isFlagDefined = false;

            if ( !timeName ) {
                //  видалити допоміжний клас для відображення прапора
                $("#extension-timeZoneInput").parent().parent().removeClass("flag-defined");

                console.warn("Can not set timezone. Received time is not valid");
                clearExtension_timezone();
                return;
            }

            var startPos, endPos, timeZone;

            startPos = timeName.indexOf("(");
            endPos   = timeName.indexOf(")") + 1;

            timeZone = timeName.substr(startPos, endPos - startPos);

            timeZone = timeZone.replace("GMT", "");
            timeZone = timeZone.replace("(", "");
            timeZone = timeZone.replace(")", "");

            $("#extension-timeZoneInput").val(timeName);
            $("#extension-timeZoneInput").attr("timezonevalue", timeZone);

            for ( i = 0; i < tzList.length; i++ ) {
                liEl = tzList[i];

                if ( $(liEl).find("span").text() === timeName ) {
                    flagClass = $(liEl).find("div").attr("class");
                    isFlagDefined = true;
                    break;
                }
            }

            if ( isFlagDefined ) {
                $("#extension-timeZoneInput").parent().parent().addClass("flag-defined");
                $(".ex-tz-cont .flag-cont div").removeClass();
                $(".ex-tz-cont .flag-cont div").addClass(flagClass);
            } else {
                $("#extension-timeZoneInput").parent().parent().removeClass("flag-defined");
            }


        }


        //  функція пошуку часової зони
        function searchTimeZone(name, contID) {

            if ( name === "" ) {
                $("#" + contID + " ul li").css('display', 'block');
                return;
            }

            var allSpan = $("#" + contID + " ul li span");

            for (var i = 0; i < allSpan.length; i++) {
                if ( (allSpan[i].textContent.toLowerCase()).indexOf(name.toLowerCase()) === -1 ) {
                    $(allSpan[i].parentElement.parentElement).css('display', 'none');
                } else {
                    $(allSpan[i].parentElement.parentElement).css('display', 'block');
                }
            };
        }
        function prepareTimeZoneData(contID) {
            var
                i,
                data,
                ul = $("<ul>").attr({ "class": "f32" }),
                timeZoneArr;

            if ( timeZoneList ) {
                timeZoneArr = timeZoneList;
            } else {
                timeZoneArr = timeZoneList = AllTimeZone.split("\n");
            }

            for ( i = 0; i < timeZoneArr.length; i++) {
                data = timeZoneArr[i].split("\t");
                //  data[0] code
                //  data[1] country name


                var li = $("<li>");
                
                var a = $("<a>");
                $(a).on("click", function() { return false; });

                var div = $("<div>").attr({ "class": "flag " + data[0].toLowerCase() });


                var span = $("<span>").attr({ "timezonevalue": data[3] }).text("GMT(" + data[3] + ")" + " " + data[2]);

                $(a).append(div);
                $(a).append(span);

                $(li).append(a);

                $(ul).append(li);
            }

            $("#" + contID).append(ul);

        }





        /**                                           EXTENSION TAB
         **************************************************************************************************************/

        function initExtensionTab() {

            var editor,
                gotoId,
                activeRow,
                defaultRoutes,
                domainName,
                liveEdit = false,
                changePage = false;

            $extensionTable = $('#extension-table').bootstrapTable({
                url: "callflow/data/routes/extension?domain=" + currentDomainName,
                field: "_id",
                cardView: true,
                columns: [
                    {
                        title: "_id",
                        field: "_id",
                        visible: false
                    },
                    {
                        title: "Number",
                        field: "destination_number"
                    },
                    {
                        title: "Name",
                        field: "name"
                    },
                    {
                        title: "User",
                        field: "userRef",
                        formatter: function(value) {
                            return value = value.split("@")[0];
                        }
                    },
                    {
                        title: "Action",
                        width: "4",
                        "formatter": function () {
                            return "</div class='form-group'>" +
                                "<button class='btn btn-default edit-extension'>Edit</button>" +
                                "</div>"
                        }
                    }
                ],
                onLoadSuccess: function (data) {
                    domainName = currentDomainName;
                    defaultRoutes = data;
                    if (gotoId) {
                        $extensionTable.find('#' + gotoId + ' td').click()
                    }
                    enableDefAction();
                },
                onClickRow: function (rowData, div) {
                    changePage = false;
                    if (!rowData || $(div).hasClass('selected') || $editExtensionPage.newRecord) return;

                    if (liveEdit) {
                        $('#extension-edit-page').fadeIn('slow');
                    }
                    gotoId = rowData['_id'];
                    activeRow = rowData;
                    $(div).addClass('selected').siblings().removeClass('selected');
                    $editExtensionPage.trigger('editRecord', {
                        name        : rowData['name'],
                        number      : rowData['destination_number'],
                        callflow    : rowData.callflow,
                        timezone    : rowData.timezone,
                        timezonename: rowData.timezonename,
                        variables   : rowData.variables
                    });
                }
            });

            $("#extension-input-name").change(function() {
                changePage = true;
            });

            $("#extension-timeZoneInput").change(function() {
                changePage = true;
            });

            $extensionTable.on('removeRecord', function (e, id) {

                var _remove = function () {
                    var  parentRow = $extensionTable.find('#' + id).prev();
                    if (parentRow.length == 0) {
                        parentRow = $extensionTable.find('#' + id).next();
                    };
                    var parentId = parentRow.attr('id');

                    $extensionTable.bootstrapTable('remove', {field: '_id', values: [id]});

                    var _t = $extensionTable.find('#' + parentId);
                    if (_t.length != 0) {
                        _t.find('td').click();
                    } else {
                        $editExtensionPage.trigger('closePage');
                        $editExtensionPage.trigger('reset');
                    };
                };

                if (id == 'newid') {
                    _remove();
                    return;
                };

                /*$.ajax({
                    type: "DELETE",
                    url: '/callflow/data/routes/public/' + id,
                    contentType: "application/json; charset=utf-8",
                    success: function () {
                        _remove();
                        alert.success(null, this.responseText, 3000);
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'DELETED failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown, null);
                    }
                });*/
            });

            $extensionTable.on('addRecord', function (e, param) {
                var table = $extensionTable.bootstrapTable('append', [{_id: 'newid'}]).find('tbody tr'),
                    $newRow = $(table[table.length -1 ]);
                $newRow.find('td')[0].click();
                $newRow.find('button').css('display', 'none');
                $('#extension-edit-page').fadeIn('slow');
                $editExtensionPage.trigger('newRecord');
                $editExtensionPage.newRecord = true;
            });

            $extensionTable.on('cancelRecord', function (e, param) {
                var _fn = function () {
                    $editExtensionPage.newRecord = false;
                    if ($extensionTable.find('#newid').length > 0) {
                        $extensionTable.trigger('removeRecord', 'newid');
                    } else {
                        $editExtensionPage.trigger('closePage');
                    }
                    ;
                    $('#wrap-extension-table').fadeIn('slow');
                    enableDefAction();
                };
                if (!$editExtensionPage.newRecord && changePage) {
                    window.bootbox.confirm("Save this record ?", function(result) {
                        if (result) {
                            $editExtensionPage.find('#extension-save').click();
                        }
                        _fn();
                    });
                } else {
                    _fn();
                }
            });

            $extensionTable.on('refreshData', function (e) {
                editor.set([]);
                $extensionTable.bootstrapTable('refresh', {
                    url: "callflow/data/routes/extension?domain=" + currentDomainName
                });
            });

            $extensionTable.on('tabChange', function (e) {
                if (currentDomainName != domainName) {
                    $extensionTable.trigger('refreshData');
                }
            });

            $extensionTable.on('click', 'button.delete-extension', function(){
                var delId = $(this).parents('tr').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $extensionTable.trigger('removeRecord', delId);
                    }
                });
            });

            $extensionTable.on('click', 'button.edit-extension', function(){
                $('#extension-edit-page').fadeIn('slow');
                $editExtensionPage.trigger('editRecord', {
                    name        : activeRow['name'],
                    number      : activeRow['destination_number'],
                    callflow    : activeRow.callflow,
                    timezone    : activeRow['timezone'],
                    timezonename: activeRow['timezonename'],
                    variables   : activeRow['variables']
                });
            });

            $extensionTable.on('click', 'button.delete-extension', function(){
                var delId = $(this).parents('tr').attr('id');
                if (!delId) {
                    return alert.error(null, 'Plase select row');
                };

                window.bootbox.confirm("Delete this record ?", function(result) {
                    if (result) {
                        $extensionTable.trigger('removeRecord', delId);
                    };
                });
            });




            $editExtensionPage = $('#extension-edit-page');
            $editExtensionPage.find('#extension-add').on('click', function (e) {
                var $this = $editExtensionPage,
                    $name = $this.find('#extension-input-name'),
                    $number = $this.find('#extension-input-number'),
                    name = $name.val(),
                    number = $number.val(),
                    callflow = editor.get(),
                    error = false;
                if (name == '') {
                    $name.parent().addClass('has-error');
                    error = true;
                } else {
                    $name.parent().removeClass('has-error');
                };
                if (number == '') {
                    error = true;
                    $number.parent().addClass('has-error');
                } else {
                    $number.parent().removeClass('has-error');
                };

                if (!callflow) {
                    error = true;
                };

                if (error) {
                    alert.error(null, 'Bad request!');
                    return;
                }
                var data = {
                    destination_number: number.split(','),
                    name              : name,
                    domain            : currentDomainName,
                    callflow          : callflow,
                    timezone          : getPub_timeZone(),
                    fs_timezone       : getPub_TZ_country(),
                    timezonename      : getPub_timeZone_Name()
                };
                /*$.ajax({
                    type: "POST",
                    url: '/callflow/data/routes/public?',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    success: function (response) {
                        refreshDefaultData();
                        alert.success(null, 'Created', 3000);
                        var json_res = JSON.parse(response);
                        gotoId = json_res['info'];
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });*/
            });
            $editExtensionPage.find('#extension-cancel').on('click', function (e) {
                $extensionTable.trigger('cancelRecord');
            });

            $editExtensionPage.find('#extension-save').on('click', function (e) {
                var $this = $editExtensionPage,
                    $name = $this.find('#extension-input-name'),
                    $number = $this.find('#extension-input-number'),
                    name = $name.val(),
                    number = $number.val(),
                    callflow = editor.get(),
                    error = false;
                if (name == '') {
                    $name.parent().addClass('has-error');
                    error = true;
                } else {
                    $name.parent().removeClass('has-error');
                };
                if (number == '') {
                    error = true;
                    $number.parent().addClass('has-error');
                } else {
                    $number.parent().removeClass('has-error');
                };

                if (!callflow) {
                    error = true;
                };

                if (error) {
                    alert.error(null, 'Bad request!');
                    return;
                }
                var data = {
                    //destination_number: number.split(','),
                    name              : name,
                    //domain            : currentDomainName,
                    callflow          : callflow,
                    timezone          : getExtension_timeZone(),
                    fs_timezone       : getExtension_TZ_country(),
                    timezonename      : getExtension_timeZone_Name()
                };

                $.ajax({
                    type: "PUT",
                    url: '/callflow/data/routes/extension?id=' + activeRow['_id'],
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),
                    success: function (response) {
                        refreshDefaultData();
                        alert.success(null, 'Updated', 3000);
                        var json_res = JSON.parse(response);
                        gotoId = json_res['_id'];
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });
            });

            $editExtensionPage.on('reset', function (e) {
                $editExtensionPage.find('#extension-input-name').val('');
                $editExtensionPage.find('#extension-input-number').val('');
                clearPub_timezone();
                if (editor)
                    editor.set([]);
            });

            $editExtensionPage.on('closePage', function (e) {
                $('#extension-edit-page').hide(300);
                $('#wrap-extension-table').fadeIn('slow');
            });

            $editExtensionPage.on('newRecord', function (e) {
                setEditPageValues();
                disableDefAction();
                $editExtensionPage.find('#extension-add').css('display', '');
                $editExtensionPage.find('#extension-save').css('display', 'none');
            });

            $editExtensionPage.on('editRecord', function (e, param) {
                $editExtensionPage.find('#extension-add').css('display', 'none');
                $editExtensionPage.find('#extension-save').css('display', '');
                setEditPageValues(param);
            });

            var container = document.getElementById("extension-jsoneditor");
            editor = new JSONEditor(container, {
                mode: "code",
                history: false
            }, []);

            var setEditPageValues = function (param) {
                param = param || {};
                var _s = param['number'] || [];
                $('#extension-input-number').tagsinput('removeAll');
                //$('#extension-input-number').tagsinput('add', _s.join(','));
                $('#extension-input-number').tagsinput('add', _s);
                setExtension_timeZone(param['timezone'], param['timezonename']);

                $editExtensionPage.find('#extension-input-name').val(param['name']);
                if (editor)
                    editor.set(param['callflow'] || []);
            };

            var refreshDefaultData = function () {
                $editExtensionPage.newRecord = false;
                $extensionTable.bootstrapTable('refresh');
            };

            var enableDefAction = function () {
                $editExtensionPage.newRecord = false;
                $('#extension-add-record').removeClass('disabled');
                $('#extension-refresh-table').removeClass('disabled');
            };

            var disableDefAction = function () {
                $('#extension-add-record').addClass('disabled');
                $('#extension-refresh-table').addClass('disabled');
            };

        }

        /**                                           ADD VARIABLES BTN
         **************************************************************************************************************/
        //  приховати поки що variables. дати можливість сетати глобальну варіблу

        //  перевірити чи вибраний домен.
        //  показати модальне вікно
        function initAddVariablesBtn() {

            var responseVariables;


            //  CLICK SHOW VARIABLES MODAL
            $(".addVariablesBtn").off("click");
            $(".addVariablesBtn").on("click", function() {
                if (!currentDomainName) {
                    alert.warning("", "Domain must be selected", 3000);
                    return;
                }

                $.ajax({
                    type: "GET",
                    url: '/callflow/data/routes/variables?domain=' + currentDomainName,
                    contentType: "application/json; charset=utf-8",
                    success: function (response) {
                        if (response.status === 401) {
                            console.error("You are unauthorized. Please relogin!");
                            alert.error("", "You are unauthorized. Please relogin!", 5000);
                            return;
                        }

                        if (response.length === 0) {
                            responseVariables = {};
                            $("#add-variables-modal").modal("show");
                        } else {
                            responseVariables = response[0].variables;
                            $("#add-variables-modal").modal("show");
                        }

                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'GET failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });


            });

            //  спрацьовує перед відкриттям модального вікна. Будує модальне вікно
            $("#add-variables-modal").off("show.bs.modal");
            $("#add-variables-modal").on("show.bs.modal", function() {

                $("#add-variables-modal .modal-body form ul").children().remove();

                for (var property in responseVariables) {
                    $("#add-variables-modal .modal-body form ul").append(variablesItemLayout(property, responseVariables[property]));
                }
                $("#add-variables-modal .modal-body form ul").append($("<div>").attr({"class": "clearfix"}));
                removeVariablesEvent();

            });

            //  підтвердження збереження модального вікна з variables
            $("#add-variables-modal .saveVariables").off("click");
            $("#add-variables-modal .saveVariables").on("click", function() {
                $.ajax({
                    type: "PUT",
                    url: '/callflow/data/routes/variables?domain=' + currentDomainName,
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(get_variables()),
                    success: function (response) {
                        try {
                            var res = JSON.parse(response)
                        } catch (e) {}

                        if (res.status === "OK") {
                            $("#add-variables-modal").modal("hide");
                            alert.success("", "Variables were changed", 3000)
                        } else {
                            alert.error(res.status);
                        }
                    },
                    error: function (responseData, textStatus, errorThrown) {
                        alert.error(null, 'POST failed. ' + JSON.stringify(responseData) + " status: " + textStatus + " Error: " + errorThrown);
                    }
                });
            });

            //
            $("#add-variables-btn").off("click");
            $("#add-variables-btn").on("click", function() {
                $("#add-variables-modal .modal-body form ul").append(variablesItemLayout("", ""));
                $("#add-variables-modal .modal-body form ul").append($("<div>").attr({"class": "clearfix"}));
                removeVariablesEvent();
            })
        }

        function removeVariablesEvent() {
            $("#add-variables-modal .modal-body form ul li .removeVariables").off("click");
            $("#add-variables-modal .modal-body form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            });
        }
        function get_variables() {
            var listEl,
                key,
                value,
                variables = {},
                i;

            for ( i = 0; i < $("#add-variables-modal form ul li").length; i++ ) {
                listEl =  $("#add-variables-modal form ul li")[i];

                if ($(listEl).hasClass("clearfix")) {
                    continue;
                }

                key = $(listEl).find("input[variablesType='key']").val();
                value = $(listEl).find("input[variablesType='value']").val();

                //  значення не може бути пустим
                if ( !key || !value ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be empty");
                    continue;
                }

                //  не може бути пробілів
                if ( key.indexOf(" ") !== -1 || value.indexOf(" ") !== -1 ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be spaces");
                    continue;
                }


                variables[key] = value;
            }

            return variables;
        }


        /**                                           !!! NOT USE NOW DEF VARIABLES
         **************************************************************************************************************/
        function def_subOnAddVariablesEvent() {
            //  CLICK ADD BTN
            $("#def-add-variables").off("click");
            $("#def-add-variables").on("click", function () {
                $("#def-variables-cont form ul").append(variablesItemLayout("", ""));
                def_subOnAddVariablesEvent();
            });

            //  CLICK REMOVE BTN
            $("#def-variables-cont form ul li .removeVariables").off("click");
            $("#def-variables-cont form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            });
        }
        /** Отримати список всіх variables */
        function get_def_variables() {
            var listEl,
                key,
                value,
                variables = {},
                i;

            for ( i = 0; i < $("#def-variables-cont form ul li").length; i++ ) {
                listEl =  $("#def-variables-cont form ul li")[i];

                key = $(listEl).find("input[variablesType='key']").val();
                value = $(listEl).find("input[variablesType='value']").val();

                //  значення не може бути пустим
                if ( !key || !value ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be empty");
                    continue;
                }

                //  не може бути пробілів
                if ( key.indexOf(" ") !== -1 || value.indexOf(" ") !== -1 ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be spaces");
                    continue;
                }


                variables[key] = value;
            }

            return variables;
        }
        /** Засетати значення з отриманого обєкту */
        function set_def_variables(variables) {
            //  очистити всі варібли
            $("#def-variables-cont form ul li").remove();

            if (!variables) {
                return;
            }

            for (var property in variables) {
                $("#def-variables-cont form ul").append(variablesItemLayout(property, variables[property]));
            }

            $("#def-variables-cont form ul li .removeVariables").off("click");
            $("#def-variables-cont form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            })
        }


        /**                                           PUB VARIABLES
         ******************************************************************************************************************/
        function pub_subOnAddVariablesEvent() {
            //  CLICK ADD BTN
            $("#public-add-variables").off("click");
            $("#public-add-variables").on("click", function () {
                $("#public-variables-cont form ul").append(variablesItemLayout("", ""));
                pub_subOnAddVariablesEvent();
            });

            //  CLICK REMOVE BTN
            $("#public-variables-cont form ul li .removeVariables").off("click");
            $("#public-variables-cont form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            });
        }
        /** Отримати список всіх variables */
        function get_pub_variables() {
            var listEl,
                key,
                value,
                variables = {},
                i;

            for ( i = 0; i < $("#public-variables-cont form ul li").length; i++ ) {
                listEl =  $("#public-variables-cont form ul li")[i];

                key = $(listEl).find("input[variablesType='key']").val();
                value = $(listEl).find("input[variablesType='value']").val();

                //  значення не може бути пустим
                if ( !key || !value ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be empty");
                    continue;
                }

                //  не може бути пробілів
                if ( key.indexOf(" ") !== -1 || value.indexOf(" ") !== -1 ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be spaces");
                    continue;
                }


                variables[key] = value;
            }

            return variables;
        }
        /** Засетати значення з отриманого обєкту */
        function set_pub_variables(variables) {
            //  очистити всі варібли
            $("#public-variables-cont form ul li").remove();

            if (!variables) {
                return;
            }

            for (var property in variables) {
                $("#public-variables-cont form ul").append(variablesItemLayout(property, variables[property]));
            }

            $("#public-variables-cont form ul li .removeVariables").off("click");
            $("#public-variables-cont form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            })
        }

        function extension_subOnAddVariablesEvent() {
            //  CLICK ADD BTN
            $("#extension-add-variables").off("click");
            $("#extension-add-variables").on("click", function () {
                $("#extension-variables-cont form ul").append(variablesItemLayout("", ""));
                extension_subOnAddVariablesEvent();
            });

            //  CLICK REMOVE BTN
            $("#extension-variables-cont form ul li .removeVariables").off("click");
            $("#extension-variables-cont form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            });
        }
        /** Отримати список всіх variables */
        function get_extension_variables() {
            var listEl,
                key,
                value,
                variables = {},
                i;

            for ( i = 0; i < $("#extension-variables-cont form ul li").length; i++ ) {
                listEl =  $("#extension-variables-cont form ul li")[i];

                key = $(listEl).find("input[variablesType='key']").val();
                value = $(listEl).find("input[variablesType='value']").val();

                //  значення не може бути пустим
                if ( !key || !value ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be empty");
                    continue;
                }

                //  не може бути пробілів
                if ( key.indexOf(" ") !== -1 || value.indexOf(" ") !== -1 ) {
                    console.warn("WEBITEL_UI:\n In variables key - value, can not be spaces");
                    continue;
                }


                variables[key] = value;
            }

            return variables;
        }
        /** Засетати значення з отриманого обєкту */
        function set_extension_variables(variables) {
            //  очистити всі варібли
            $("#extension-variables-cont form ul li").remove();

            if (!variables) {
                return;
            }

            for (var property in variables) {
                $("#extension-variables-cont form ul").append(variablesItemLayout(property, variables[property]));
            }

            $("#extension-variables-cont form ul li .removeVariables").off("click");
            $("#extension-variables-cont form ul li .removeVariables").on("click", function() {
                $(this.parentElement).remove();
            })
        }

        /** Шаблон для li елемента */
        function variablesItemLayout(key, value) {
            var itemLayout =
                "<div class ='form-group col-sm-12'>" +
                    "<div class='col-sm-5'>" +
                        "<input class='form-control' type='text' variablesType='key' value='" + key + "'>" +
                    "</div>" +
                    "<div class='col-sm-5'>" +
                        "<input class='form-control' type='text' variablesType='value' value='" + value + "'>" +
                    "</div>" +
                    "<span class='removeVariables' style='position: absolute; cursor: pointer;'>" +
                        "<i class='fa fa-remove'>"+
                    "</span>"+
                "</div>";

            return $("<li>").append(itemLayout);
        }



    return {
        createWebitel: createWebitel
    }
});