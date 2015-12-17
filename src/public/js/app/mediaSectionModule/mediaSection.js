/**
 * Не реалізовано
 *      - підтримка default файлів wav
 *      - робота з custom and default
 *
 *
 * Доробити 21.04
 *      - play/pause
 *          при кліку, на play виконувати логіку завантаження, і зразу програвати пісню.            +++
 *          при другому кліку на play, якщо пісня вже завнтажена просто продовжити програвання.     +++
 *          в кінці не забути перевести кнопку в стан play                                          +++
 *      - upload process
 *      - видалення запису
 *      - перевірити помилку при завантажеені
 *
 */


define("mediaSection", ["webitelConnector", "session", "audioPlayer", "alert"],
    function(webitelConnector, session,  _audioPlayer, alert) {

        var coreUrl = session.getWebitelServer(),
            selectedDomain,
            currentPlayer,
            REST_AUDIO = {
                "getAudioList": {
                    //"path"  : "/api/v2/r/media",
                    "path"  : "/api/v2/media",
                    "method": "GET"
                },
                "getAudioFile": {
                    //"path"  : "/api/v2/r/media",       //  url + type + name + domain
                    "path"  : "/api/v2/media",       //  url + type + name + domain
                    "method": "GET"
                },
                "sendOne": {
                    //"path"  : "/api/v2/r/media",        //  domain - required
                    "path"  : "/api/v2/media",        //  domain - required
                    "method": "POST"
                },
                "sendMany": {
                    //"path"  : "/api/v2/r/media",
                    "path"  : "/api/v2/media",
                    "method": "POST"
                },
                "deleteOne": {
                    //"path"  : "/api/v2/r/media",          //  :type/:name
                    "path"  : "/api/v2/media",          //  :type/:name
                    "method": "DELETE"
                }
            },
            AUDIO_MAX_SIZE = 5242880,
            loadingClass = "fa fa-spinner fa-pulse fa-lg",
            playClass = "fa fa-play fa-lg",
            pauseClass = "fa fa-pause fa-lg";

        //  підписатися на івент вибору домена
        //  $("#select-domain").off("domainSelected");
        $("#select-domain").on("domainSelected", function(e, domain) {

            if ( location.pathname === "/media" ) {
                selectedDomain = domain;

                //  заюзав додаткову властивість дял метода init, по якій перевіряю чи був ініціалізований модуль
                if ( init["state"] === "initialized") {
                    getAudioList(selectedDomain);
                } else {
                    init();
                }
            }
        });

        function createWebitel() {
            if ( !window.webitel ) {
                webitelConnector.autoConnect(init);
            } else {
                init();
            }
        }
        function init() {

            if ( !isDomainSelected() ) {
                alert.warning("", "Domain does not selected", 3000);
                return;
            }
            //  показати головний контенер із контентом
            $("#content-container").show();


            //  ініціалізувати прихований плеєр
            initCurrentPlayer();

            //  підписатися на івенти розділу
            subOnLayoutEvent();

            //  отримати список аудіо
            getAudioList(selectedDomain);

            //  при повторній ініціалізації потрібно затерти цю властивість, щоб знов засетати потрібне значення volume
            customSetVolume["setVolume"] = undefined;


            //  заюзав додаткову властивість дял метода init, по якій перевіряю чи був ініціалізований модуль
            init["state"] = "initialized";
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
         * Ініціалізація плеєра
         * 1. Під час ініт в тега аудіо повинен бути вказаний src на реальний файл (дати силку на мінімальний файл)
         */
        function initCurrentPlayer() {
            $(".audio-player").mediaelementplayer({
                features: ['progress', 'duration', 'volume'],
                success: function (mediaElement, domObject) {
                    currentPlayer = mediaElement;
                    window.currentPlayer = currentPlayer;

                    //  при закінченні програвання, засетати кнопку play
                    currentPlayer.addEventListener('ended', function(e){
                        clearPreviousPauseLoadingBtn();
                    });
                }
            });

        }

        /** Підписатися на івенти розділу */
        function subOnLayoutEvent() {

            //  REFRESH AUDIO LIST
            $(".audio-body-controls .refreshAudio").off("click");
            $(".audio-body-controls .refreshAudio").on("click", function() {
                getAudioList(selectedDomain);
            });

            //  ADD NEW AUDIO (SHOW SELECT WINDOW)
            $(".audio-body-controls .addAudio").off("click");
            $(".audio-body-controls .addAudio").on("click", function() {
                //  показати вікно вибору аудіо
                $(".addAudioInput").trigger("click");
            });

            //  CHANGE INPUT FILE
            $(".audio-body-controls .addAudioInput").off("change");
            $(".audio-body-controls .addAudioInput").on("change", function() {

                var domain,
                    audioType;

                if (this.files.length === 0) {
                    return;
                }

                if (this.files.length > 10) {
                    alert.warning("", "You can send only 10 files at the same time", 5000);
                    return;
                }

                //  перевірити чи тип вибраних файлів mp3 або wav і чи вибрані файли одного типу
                for (var i = 0; i < this.files.length; i++) {
                    if (this.files[i].type === "audio/mp3" || this.files[i].type === "audio/wav") {
                        if ( !audioType ) {
                            audioType = this.files[i].type;
                        } else {
                            if ( audioType !== this.files[i].type ) {
                                alert.warning("", "All files must be of the same type", 5000);
                                return;
                            }
                        }
                        continue;
                    } else {
                        alert.warning("", "All files must be .mp3 or .wav type", 5000);
                        return;
                    }
                }

                //  перевірити чи розмір кожного із файлів < 5 MB
                for (i = 0; i < this.files.length; i++) {
                    if (this.files[i].size > AUDIO_MAX_SIZE) {
                        alert.warning("", "File " + this.files[i].name + " is too big. Max size must be less than 5 MB", 5000);
                        return;
                    }
                }

                //  імя не повинно містити крапки
                for (i = 0; i < this.files.length; i++) {
                    if ( this.files[i].name.indexOf(".") !== -1 ) {
                        if ( this.files[i].name.indexOf(".", this.files[i].name.indexOf("." ) + 1) !== -1) {
                            alert.warning("", "File name should not contain the point", 5000);
                            return;
                        }
                    }
                }


                //  витягнути домен і передати його далі
                if ( selectedDomain ) {
                    domain = selectedDomain;
                } else {
                    domain = "";
                }

                sendAudio(this.files, domain, audioType);
            });
        }


        /**                                       RENDER/SUBSCRIBE AUDIO LIST
         ***************************************************************************************************************/
        /**
         * Вставляє в розмітку список отриманих аудіо файлів
         * Розділити логіку між адмном і рутом
         */
        function renderAudioList(data) {

            //  вирізати плеєр в прихований контейнер (щоб при видалені попередніх аудіо, не затерти сам плеєр)
            $("#audioPlayerHome").append($("#mediaelement-wrap"));

            //  очистити аудіо список
            $("#list").children().remove();

            //  сховати панельку оновлення аудіо
            var el = $(".refreshAudio");
                el.niftyOverlay('hide');

            if (data.length === 0) {
                //  показати повідомлення, що нема аудіозаписів
                var emptyLi = $(
                    "<li>" +
                        "Empty" +
                    "</li>"
                );
                $("#list").append(emptyLi);
                return;
            }
            var liClass,
                audio_str,
                audioName, audionType, audioSize;



            for (i = 0; i < data.length; i++) {
                if (i % 2 !== 0) {
                    liClass = "strip";
                } else {
                    liClass = "";
                }

                if ( data[i].name.indexOf(".mp3") !== -1 ) {
                    audioName = data[i].name.replace(".mp3", "");
                } else if ( data[i].name.indexOf(".wav") !== -1 ) {
                    audioName = data[i].name.replace(".wav", "");
                }

                audionType = data[i].type;
                audioSize = ((data[i].size) / 1024 / 1024).toFixed(2);

                audio_str =
                    "<li class='" + liClass + "'>" +
                        "<div class='audio-logo'>" +
                            "<span class='overlay'>" +
                                "<i class='fa fa-play fa-lg'></i>" +
                            "</span>" +
                            "<img src='../../img/mediaSection/default_audio.png'>" +
                        "</div>" +
                        "<div class='audio-info-controls'>" +
                            "<div class='audio-info'>" +
                                "<span class='audioName'>" + audioName + "</span>" +
                                "<span class='audioRemove'>" +
                                    "<i class='fa fa-remove'></i>" +
                                "</span>" +
                                "<span class='audioDownload'>" +
                                    "<i class='fa fa-cloud-download fa-lg'></i>" +
                                "</span>" +
                                "<span class='audioType'>" + audionType + "</span>" +
                                "<span class='audioSize'>" + audioSize + " MB</span>" +
                            "</div>" +

                            "<div style='clear: both'></div>" +

                            "<div class='audio-control'></div>" +

                            "<div style='clear: both'></div>" +

                        "</div>" +

                        "<div style='clear: both'></div>" +
                    "</li>";

                $("#list").append($(audio_str));
            }

            subOnAudioListEvent();
        }

        /** Підписатися на події списку аудіозаписів */
        function subOnAudioListEvent() {

            /**
             *  CLICK PLAY BTN
             *  TODO
             *  візуальні ефекти загрузки аудіо і появлення плеєра
             *  перевірити, як краще коли плеєру передавати src, чи коли самому скачувати аудіо і віддавти новостворену силку
             */
            $("#list li .audio-logo span.overlay").off("click");
            $("#list li .audio-logo span.overlay").on("click", function() {

                /**
                 * Перевіряє чи в вибраному елементі є вже плеєр. Якщо є, тоді працює тільки з play/pause
                 * Якщо плеєр відсутній, очищає значення попередньо вибраного елемента, відображає загрузку, отримує силку на аудіо, відображає плеєр
                 */
                if ($("#list li:hover").find("#mediaelement-wrap").length > 0) {

                    if ($(this).find("i").hasClass(playClass)) {
                        showPauseBtn();
                        currentPlayer.play();
                    }
                    else if ($(this).find("i").hasClass(pauseClass)) {
                        showPlayBtn();
                        currentPlayer.stop();
                    }
                }
                else {

                    clearPreviousPauseLoadingBtn();
                    //  видалити у всіх елементів списку клас active
                    $("#list li").removeClass("active");
                    //  зупинити плеєр
                    currentPlayer.stop();

                    //  додати до вибраного елементу списку клас active
                    $("#list li:hover").addClass("active");

                    //  позначити елемент як активний
                    var selectedEl = $("#list li.active");

                    //  показати загрузку файла
                    showLoadingBtn();

                    //  вставити плеєр в вибраний елемент списку
                    $(selectedEl).find(".audio-control").append($("#mediaelement-wrap").hide());

                    var audioName = $("li.active .audio-info span.audioName").text(),
                        audioType = $("li.active .audio-info span.audioType").text(),
                        audioDomain = selectedDomain;

                    //  опрацювати помилки, не давати можливість прослухати запис розмови
                    getAudioBlod(audioName, audioType, audioDomain, function (src) {
                        currentPlayer.setSrc(src);

                        $("#mediaelement-wrap").show();

                        currentPlayer.play();
                        customSetVolume("setVolume");

                        showPauseBtn();
                    });
                }
            });

            //  CLICK DOWNLOAD BTN
            $("#list .audioDownload").off("click");
            $("#list .audioDownload").on("click", function() {

                if ($("#list li:hover").hasClass("active")) {
                    var src = $(currentPlayer).attr('src');

                    if (src) {
                        var file = document.createElement('a');
                        file.href = src;
                        file.download = $("li.active .audioName").text() || src;
                        document.body.appendChild(file);
                        file.click();
                        document.body.removeChild(file);
                    }
                } else {
                    var audioName = $("li:hover .audioName").text(),
                        audioType = $("li:hover .audioType").text(),
                        domain = selectedDomain;

                    downloadAudio(audioName, audioType, domain, function (src) {
                        var file = document.createElement('a'),
                            name = audioName + "." + audioType;

                        file.href = src;
                        file.download = name || src;
                        document.body.appendChild(file);
                        file.click();
                        document.body.removeChild(file);
                    });
                }
            });

            //  REMOVE AUDIO
            $("#list .audioRemove").off("click");
            $("#list .audioRemove").on("click", function() {
                var audioName = $("#list li:hover .audioName").text(),
                    audioType = $("#list li:hover .audioType").text(),
                    domain = selectedDomain;

                removeAudio(domain, audioName, audioType);

            });
        }

        function showPauseBtn() {
            $("#list li.active .audio-logo i").removeClass();
            $("#list li.active .audio-logo i").addClass(pauseClass);
        }
        function showPlayBtn() {
            $("#list li.active .audio-logo i").removeClass();
            $("#list li.active .audio-logo i").addClass(playClass);
        }
        function showLoadingBtn() {
            $("#list li:hover .audio-logo i").removeClass();
            $("#list li:hover .audio-logo i").addClass(loadingClass);
        }
        function clearPreviousPauseLoadingBtn() {
            if ($("#list li.active .audio-logo i").hasClass(pauseClass) || $("#list li.active .audio-logo i").hasClass(loadingClass)) {
                $("#list li.active .audio-logo i").removeClass();
                $("#list li.active .audio-logo i").addClass(playClass);
            }
        }

        //  this func executed only once
        function customSetVolume(oneCall) {
            if ( !customSetVolume[oneCall] ) {
                currentPlayer.setVolume(0.5);
                customSetVolume[oneCall] = oneCall;
            }
        }


        /**                                         REST AUDIO API
         **************************************************************************************************************/

         // Отримати список всіх аудіозаписів
        function getAudioList(domain) {

            domain = "?domain=" + domain;

            //  показати панельку оновлення аудіо
            var el = $(".refreshAudio");
                el.niftyOverlay({});
                el.niftyOverlay('show');

            goToRedirect(coreUrl + REST_AUDIO.getAudioList.path + domain);


/*            var xhr = new XMLHttpRequest();

            xhr.open(REST_AUDIO.getAudioList.method, coreUrl + REST_AUDIO.getAudioList.path + domain, true);

            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

            xhr.setRequestHeader("X-Access-Token", session.getToken());
            xhr.setRequestHeader("X-Key", session.getKey());

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;

                if (xhr.status === 200) {
                    try { var res = JSON.parse(xhr.responseText); } catch (e) { console.error("Cannot parse json. Bad received response"); return; }

                    renderAudioList(res.data);
                    return;


                    if (res["info"] && res["info"] != "") {
                        goToRedirect(res["info"]);
                    } else {
                        alert.error("", "Response from " + REST_AUDIO.getAudioList.method + " " + coreUrl + REST_AUDIO.getAudioList.path + domain + " does not contain redirect Url", 5000);
                        console.error("Response from " + REST_AUDIO.getAudioList.method + " " + coreUrl + REST_AUDIO.getAudioList.path + domain + " does not contain redirect Url");
                        return;
                    }
                } else {
                    xhrErrorHandler(xhr);
                }

            };
            xhr.send(null);*/

            function goToRedirect(url) {

                var xhr = new XMLHttpRequest();

                xhr.open(REST_AUDIO.getAudioList.method, url, true);

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                        } catch (e) {
                            console.error("Cannot parse json. Bad received response");
                            return;
                        }

                        if (res.status === "OK") {
                            renderAudioList(res.data);
                        } else {
                            console.error("Response from " + REST_AUDIO.getAudioList.method + " " + url + " status=" + res.status);
                            return;
                        }
                    } else {
                        xhrErrorHandler(xhr);
                    }
                };
                xhr.send(null);
            }
        }

        /**
         * Download audio file
         * Працює аналогічно до прослуховування
         */
        function downloadAudio(name, type, domain, callback) {
            if (domain) {
                domain = "?domain=" + domain;
            } else {
                domain = "";
            }

            name += "." + type;

            goToRedirect(coreUrl + REST_AUDIO.getAudioFile.path + "/" + type + "/" + name + domain, callback);

/*            var xhr = new XMLHttpRequest();

            xhr.open(REST_AUDIO.getAudioFile.method, coreUrl + REST_AUDIO.getAudioFile.path + "/" + type + "/" + name + domain, true);

            xhr.setRequestHeader("X-Access-Token", session.getToken());
            xhr.setRequestHeader("X-Key", session.getKey());

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;

                if (xhr.status === 200) {
                    try {
                        var res = JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.error("Cannot parse json. Bad received response");
                        return;
                    }
                    if (res["info"] && res["info"] !== "") {
                        goToRedirect(res["info"], callback);
                    } else {
                        alert.error("", "Response from " + REST_AUDIO.getAudioFile.method + " " + coreUrl + REST_AUDIO.getAudioFile.path + domain + " does not contain redirect Url", 5000);
                        console.error("Response from " + REST_AUDIO.getAudioFile.method + " " + coreUrl + REST_AUDIO.getAudioFile.path + domain + " does not contain redirect Url");
                        return;
                    }
                }
                else {
                    xhrErrorHandler(xhr);
                }

            };
            xhr.send();*/

            function goToRedirect(url, callback) {

                var xhr = new XMLHttpRequest();


                xhr.open(REST_AUDIO.getAudioFile.method, url, true);

                xhr.responseType = "blob";

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                        callback(window.URL.createObjectURL(xhr.response));
                    } else if (xhr.readyState === 4 && xhr.status >= 300) {
                        xhrErrorHandler(xhr);
                    } else if (xhr.readyState === 4 && xhr.status < 200) {
                        xhrErrorHandler(xhr);
                    }
                };

                xhr.send();
            }
        }

        /**
         * Загрузити файл, зберегти його в blob, згенерувати з blob src для прослуховування
         */
        function getAudioBlod(name, type, domain, callback) {
            if (domain) {
                domain = "?domain=" + domain;
            } else {
                domain = "";
            }

            name += "." + type;

            goToRedirect(coreUrl + REST_AUDIO.getAudioFile.path + "/" + type + "/" + name + domain, callback);

/*            var xhr = new XMLHttpRequest();

            xhr.open(REST_AUDIO.getAudioFile.method, coreUrl + REST_AUDIO.getAudioFile.path + "/" + type + "/" + name + domain, true);

            xhr.setRequestHeader("X-Access-Token", session.getToken());
            xhr.setRequestHeader("X-Key", session.getKey());

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;

                if (xhr.status === 200) {
                    try {
                        var res = JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.error("Cannot parse json. Bad received response");
                        return;
                    }
                    if (res["info"] && res["info"] !== "") {
                        goToRedirect(res["info"], callback);
                    } else {
                        alert.error("", "Response from " + REST_AUDIO.getAudioFile.method + " " + coreUrl + REST_AUDIO.getAudioFile.path + domain + " does not contain redirect Url", 5000);
                        console.error("Response from " + REST_AUDIO.getAudioFile.method + " " + coreUrl + REST_AUDIO.getAudioFile.path + domain + " does not contain redirect Url");
                        return;
                    }
                }
                else {
                    xhrErrorHandler(xhr);
                }

            };
            xhr.send();*/

            function goToRedirect(url, callback) {

                var xhr = new XMLHttpRequest();


                xhr.open(REST_AUDIO.getAudioFile.method, url, true);

                //xhr.responseType = "blob";
                xhr.responseType = "arraybuffer";

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
                        var blobObject = new Blob([xhr.response], { type: 'audio/wav' });
                        callback(window.URL.createObjectURL(blobObject));
                        //  callback(window.URL.createObjectURL(xhr.response));
                    } else if (xhr.readyState === 4 && xhr.status >= 300) {
                        /*if ( xhr.responseText ) {
                            var response = JSON.parse(xhr.responseText);
                            if ( response.status === "error" ) {
                                alert.error("", response.info, 10000);
                                console.error(response.info);
                                return;
                            }*/
                        //} else {
                            xhrErrorHandler(xhr);
                        //}

                    } else if (xhr.readyState === 4 && xhr.status < 200) {
                        xhrErrorHandler(xhr);
                    }
                };

                xhr.send();
            }
        }

        /**
         * Завантажити аудіо файл на сервер
         * bug: На даний момент, завантаження декілької аудіофайлів виконується почерзі, як і одного файлу
         */
        function sendAudio(files, domain, type) {

            if (!domain) {
                alert.warning("", "Cannot send audio files. Domain parameter is empty");
                return;
            }

            if (files.length === 1) {
                //sendOneGoToRedirect("http://136.243.12.186:10022/api/v2/media/mp3?domain=136.243.12.186", files[0]);
                sendOne(files[0], type);
            } else {
                sendMany(files, type);
            }

            function sendOne(audioFile, type) {

                if ( type === "audio/wav" ) {
                    type = "/wav"
                } else if ( type === "audio/mp3" ) {
                    type = "/mp3"
                } else {
                    type = ""
                }

                sendOneGoToRedirect(coreUrl +  REST_AUDIO.sendOne.path + type + "?" + "domain=" + domain, audioFile);

/*                var xhr = new XMLHttpRequest();

                xhr.open(REST_AUDIO.sendOne.method, coreUrl +  REST_AUDIO.sendOne.path + type + "?" + "domain=" + domain, true);

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                        } catch (e) {
                            console.error("Cannot parse json. Bad received response");
                            return;
                        }
                        if (res["info"] && res["info"] !== "") {
                            sendOneGoToRedirect(res["info"], audioFile);
                        } else {
                            alert.error("", "Response from " + REST_AUDIO.sendOne.method + " " + coreUrl + REST_AUDIO.sendOne.path + domain + " does not contain redirect Url", 5000);
                            console.error("Response from " + REST_AUDIO.sendOne.method + " " + coreUrl + REST_AUDIO.sendOne.path + domain + " does not contain redirect Url");
                            return;
                        }
                    }
                    else {
                        xhrErrorHandler(xhr);
                    }

                };
                xhr.send();*/
            }
            function sendOneGoToRedirect(url, audioFile) {

                var formData,
                    xhr;

                formData = new FormData();
                formData.append("audioFile", audioFile);

                xhr = new XMLHttpRequest();

                xhr.open(REST_AUDIO.sendOne.method, url, true);

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                        } catch (e) {
                            console.error("Cannot parse json. Bad received response");
                            return;
                        }

                        if (res.status === "OK") {
                            //  приховати прогрес бар
                            clearUpLoadingProgressBar();

                            alert.success("", "File " + res.inserted[0] + " was sended", 3000);
                            $(".audio-body-controls .refreshAudio").trigger("click");
                        } else {
                            console.error("Response status does not equal Ok. Unhandled error");
                        }
                    }
                    else {
                        rollbackUpLoadingProgress();
                        xhrErrorHandler(xhr);
                    }
                };
                xhr.upload.onprogress  = function(event) {
                    console.log( 'Отправлено на сервер ' + event.loaded + ' байт из ' + event.total );
                    showUpLoadingProgress(event.loaded, event.total);
                };
                xhr.send(formData);
            }

            //  протестувати масив відповідей
            function sendMany(audioFiles, type) {

                if ( type === "audio/wav" ) {
                    type = "/wav"
                } else if ( type === "audio/mp3" ) {
                    type = "/mp3"
                } else {
                    type = ""
                }

                sendManyGoToRedirect(coreUrl + REST_AUDIO.sendMany.path + type + "?" + "domain=" + domain, audioFiles);

/*                var xhr = new XMLHttpRequest();

                xhr.open(REST_AUDIO.sendMany.method, coreUrl + REST_AUDIO.sendMany.path + type + "?" + "domain=" + domain, true);

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                        } catch (e) {
                            console.error("Cannot parse json. Bad received response");
                            return;
                        }
                        if (res["info"] && res["info"] !== "") {
                            sendManyGoToRedirect(res["info"], audioFiles);
                        } else {
                            alert.error("", "Response from " + REST_AUDIO.sendOne.method + " " + coreUrl + REST_AUDIO.sendOne.path + domain + " does not contain redirect Url", 5000);
                            console.error("Response from " + REST_AUDIO.sendOne.method + " " + coreUrl + REST_AUDIO.sendOne.path + domain + " does not contain redirect Url");
                            return;
                        }
                    }
                    else {
                        xhrErrorHandler(xhr);
                    }
                };
                xhr.send();*/

            }
            function sendManyGoToRedirect(url, audioFiles) {
                var formData,
                    xhr;

                formData = new FormData();

                for (var i = 0; i < audioFiles.length; i++) {
                    formData.append("audioFile-" + i, audioFiles[i]);
                }


                xhr = new XMLHttpRequest();

                xhr.open(REST_AUDIO.sendMany.method, url, true);

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                        } catch (e) {
                            console.error("Cannot parse json. Bad received response");
                            return;
                        }

                        if (res.status === "OK") {

                            //  приховати прогрес бар
                            clearUpLoadingProgressBar();

                            var sendedFilesName = "";

                            //  оформлення виводу інформації
                            if (res.inserted.length > 1) {
                                for (var i = 0; i < res.inserted.length; i++) {
                                    if (i === 0) {
                                        sendedFilesName = res.inserted[i];
                                    } else {
                                        sendedFilesName += ", " + res.inserted[i];
                                    }
                                }
                            } else {
                                sendedFilesName = res.inserted[0];
                            }

                            alert.success("", sendedFilesName + " was sended", 3000);
                            $(".audio-body-controls .refreshAudio").trigger("click");
                        } else {
                            console.error("Unhandled error. When trying send many files to server");
                        }
                    }
                    else {
                        rollbackUpLoadingProgress();
                        xhrErrorHandler(xhr);
                    }
                };
                xhr.upload.onprogress  = function(event) {
                    console.log( 'Загружено на сервер ' + event.loaded + ' байт из ' + event.total );
                    showUpLoadingProgress(event.loaded, event.total);
                };
                xhr.send(formData);
            }
        }

        /**
         * Видалити аудіо файл
         */
        function removeAudio(domain, audioName, audioType) {
            if ( !domain ) {
                alert.warning("", "Domain is required for delete audio", 3000);
                return;
            } else {
                domain = "?domain=" + domain;
            }

            if ( !audioName ) {
                alert.warning("", "Audio name is required for delete audio", 3000);
                return;
            } else {
                audioName = audioName + "." + audioType;
            }

            if ( !audioType ) {
                alert.warning("", "Audio type is required for delete audio", 3000);
                return;
            }

            goToRedirect(coreUrl + REST_AUDIO.deleteOne.path + "/" + audioType + "/" + audioName + domain);

/*            var xhr = new XMLHttpRequest();

            xhr.open(REST_AUDIO.deleteOne.method, coreUrl + REST_AUDIO.deleteOne.path + "/" + audioType + "/" + audioName + domain, true);

            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

            xhr.setRequestHeader("X-Access-Token", session.getToken());
            xhr.setRequestHeader("X-Key", session.getKey());

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4) return;

                if (xhr.status === 200) {
                    try {
                        var res = JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.error("Cannot parse json. Bad received response");
                        return;
                    }

                    if (res["info"] && res["info"] != "") {
                        goToRedirect(res["info"]);
                    } else {
                        alert.error("", "Response from " + REST_AUDIO.getAudioList.method + " " + coreUrl + REST_AUDIO.getAudioList.path + domain + " does not contain redirect Url", 5000);
                        console.error("Response from " + REST_AUDIO.getAudioList.method + " " + coreUrl + REST_AUDIO.getAudioList.path + domain + " does not contain redirect Url");
                        return;
                    }
                } else {
                    xhrErrorHandler(xhr);
                }

            };
            xhr.send(null);*/

            function goToRedirect(url) {

                var xhr = new XMLHttpRequest();

                xhr.open(REST_AUDIO.deleteOne.method, url, true);

                xhr.setRequestHeader("X-Access-Token", session.getToken());
                xhr.setRequestHeader("X-Key", session.getKey());

                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;

                    if (xhr.status === 200) {
                        try {
                            var res = JSON.parse(xhr.responseText);
                        } catch (e) {
                            console.error("Cannot parse json. Bad received response");
                            return;
                        }

                        if (res.status === "OK") {
                            alert.success("", res.info, 3000);
                            $(".audio-body-controls .refreshAudio").trigger("click");
                        } else {
                            console.error("Response from " + REST_AUDIO.getAudioList.method + " " + url + " status=" + res.status);
                            return;
                        }
                    } else {
                        xhrErrorHandler(xhr);
                    }
                };
                xhr.send(null);
            }

        }




        /**                                         UPLOAD PROGRESS BAR
         **************************************************************************************************************/
        //  відображає загрузку файлу
        function showUpLoadingProgress(curr, total) {
            $('#uploadProgressBarCont').css({"visibility": "visible"});
            $(".uploadProgressBar").css({"width":  (100 * curr / total) + "%"});
        }
        //  візуально показує відкат загрузки
        function rollbackUpLoadingProgress() {
            $(".uploadProgressBar").css({"width": "0%"});
            setTimeout(function() {
                $('#uploadProgressBarCont').css({"visibility": "hidden"});
            }, 1000);
        }
        //  приховує і очищає полосу загрузки. Викликається після кожної загрузки
        function clearUpLoadingProgressBar() {
            setTimeout(function() {
                $('#uploadProgressBarCont').css({"visibility": "hidden"});
                $(".uploadProgressBar").css({"width": "0%"});
            }, 1000);
        }





        //  обробляє помилки запитів
        function xhrErrorHandler(xhr) {
            //  сховати панельку оновлення аудіо
            var el = $(".refreshAudio");
            el.niftyOverlay('hide');

            if (xhr.status === 0 && xhr.response === "" && xhr.responseText === "") {
                alert.error("", "Unhandled CORS error", 5000);
            }
            else if (xhr.status === 400) {
                alert.error("", "Request error. status=" + xhr.status + ", statusText="  + xhr.statusText +
                ", response=" + xhr.response, 5000);
            }
            else if (xhr.status === 401) {
                alert.error("", "Unauthorized. You must relogin", 5000);
            }
            else if (xhr.status === 403) {
                alert.error("", "Forbidden. You dont have enought permision for access to this data", 5000);
            }
            else if (xhr.status === 404) {
                alert.error("", "Not found error. status=" + xhr.status + ", statusText="  + xhr.statusText +
                ", response=" + xhr.response, 5000);
            }
            else if (xhr.status === 500) {
                alert.error("", "Bad credentials. You must relogin", 5000);
            }
            else {
                alert.error("", "Unhandled error. status=" + xhr.status + ", statusText="  + xhr.statusText +
                ", response=" + xhr.response, 5000);
            }
        }


        return {
            createWebitel: createWebitel
        }
});