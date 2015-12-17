define("profilePage", ["webitelConnector", "session", "alert", "locStor", "cookStor", "browser"], function(webitelConnector, session, alert, locStor, cookStor, browser) {

    var xhr = new XMLHttpRequest(),
        coreStatus = {},
        coreUrl = session.getWebitelServer();

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

        //  отримати дані про Core server
        getCoreServStatus();

        //  навішати обробники івентів на елементи інтерфейсу
        subsOnEvent();
    }


    function subsOnEvent() {
        //  REFRESH CORE STATUS
        $("#fixedProfileCont .refreshCoreStatus").on("click", function() {
            var that = this;
            that.disabled = true;

            setTimeout(function() {
                that.disabled = false;
            }, 1000);

            getCoreServStatus();
        });

        //  RELOAD DIALPLAN
        $("#fixedProfileCont .reloadDialplan").on("click", function() {
            this.disabled = true;
            sendReloadDialplan(this);
        });
    }

    /**                                             Core request
     ******************************************************************************************************************/
    //  XHR /api/v2/status
    function getCoreServStatus() {
        xhr.open("GET", coreUrl + "/api/v2/status", true);

        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-Access-Token", session.getToken());
        xhr.setRequestHeader("X-Key", session.getKey());

        xhr.onreadystatechange = function() {

            if (xhr.readyState != 4)
                return;

            if (this.status === 200 && this.statusText === "OK") {
                coreStatus = JSON.parse(this.responseText);
                refreshViewCoreStatus();
            } else {
                if (this.status === 401 && this.statusText === "Unauthorized") {
                    alert.error("", "Unauthorized. Please, relogin!", 3000);
                } else {
                    alert.error("", "Unhandled error. status=" + this.status + ", statusText=" + this.statusText +
                    ", response=" + this.response + ", server=" + coreUrl + "/api/v2/status", "");
                }
            }
        };
        xhr.send();
    }

    //  XHR /api/v2/reloadxml
    function sendReloadDialplan(btnDisabled) {
        xhr.open("GET", coreUrl + "/api/v2/reloadxml", true);

        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-Access-Token", session.getToken());
        xhr.setRequestHeader("X-Key", session.getKey());

        xhr.onreadystatechange = function() {

            if (xhr.readyState != 4)
                return;

            if (this.status === 200 && this.statusText === "OK" && this.responseText === "+OK\n") {
                alert.success("", "Dialplan reloaded", 3000);
                btnDisabled.disabled = false;
            } else {
                if (this.status === 401 && this.statusText === "Unauthorized") {
                    alert.error("", "Unauthorized. Please, relogin!", 3000);
                } else {
                    alert.error("", "Unhandled error. status=" + this.status + ", statusText=" + this.statusText +
                    ", response=" + this.response + ", server=" + coreUrl + "/api/v2/reloadxml", "");
                }
            }
        };
        xhr.send();
    }




    /**                                              Changed VIEW
     ******************************************************************************************************************/
    //  refresh Core status. Insert into HTML
    function refreshViewCoreStatus() {

        $(".coreInfo").children().remove();
        $(".webitelInfo").children().remove();
        $(".freeSwitchInfo").children().remove();
        $(".nodeMemory").children().remove();
        $(".os").children().remove();
        $(".processUpTime").children().remove();

        var fsInfo = coreStatus.freeSWITCH.split("\n"),
            i;

        //  FS INFO
        for (i = 0; i < fsInfo.length; i++) {
            $(".freeSwitchInfo").append($("<p>").text(fsInfo[i]));
        }

        //  CORE INFO
        if (coreStatus["CRASH_WORKER_COUNT"] || coreStatus["CRASH_WORKER_COUNT"] === 0) {
            $(".coreInfo").append($("<p>").text("Worker crash: " + coreStatus["CRASH_WORKER_COUNT"]));
        }
        if (coreStatus["Users_Session"]) {
            $(".coreInfo").append($("<p>").text("User session: " + coreStatus["Users_Session"]));
        }
        if (coreStatus["Domain_Session"]) {
            $(".coreInfo").append($("<p>").text("Domain session: " + coreStatus["Domain_Session"]));
        }
        if (coreStatus["Version"]) {
            var version,
                hash;

            try {
                version = coreStatus["Version"].split(" [")[0];
                hash = coreStatus["Version"].substring(coreStatus["Version"].indexOf(" hash ") + 6, coreStatus["Version"].indexOf(" at "));
                hash = hash.substring(0, 15);
            } catch (e) {
                console.error("Cannot manipulate with version string");
                version = "";
                hash = "";
            }

            $(".coreInfo").append($("<p>").css({"overflow": "hidden"}).text("Version: " + version + "  [" + hash + "]"));
        }


        //  WEBITEL INFO
        if (coreStatus.Webitel) {
            if (coreStatus.Webitel["Status"]) {
                $(".webitelInfo").append($("<p>").text("Status: " + coreStatus.Webitel["Status"]));
            }
            if (coreStatus.Webitel["ApiQueue"] || coreStatus.Webitel["ApiQueue"] === 0) {
                $(".webitelInfo").append($("<p>").text("Api queue: " + coreStatus.Webitel["ApiQueue"]));
            }
            if (coreStatus.Webitel["CmdQueue"] || coreStatus.Webitel["CmdQueue"] === 0) {
                $(".webitelInfo").append($("<p>").text("Cmd queue: " + coreStatus.Webitel["CmdQueue"]));
            }
            if (coreStatus.Webitel["Version"]) {
                $(".webitelInfo").append($("<p>").text("Version: " + coreStatus.Webitel["Version"]));
            }
        }

        //  Node memory
        if ( coreStatus["Node memory"] ) {
            $(".nodeMemory").append($("<p>").text("rss: " + coreStatus["Node memory"].rss));
            $(".nodeMemory").append($("<p>").text("heapTotal: " + coreStatus["Node memory"].heapTotal));
            $(".nodeMemory").append($("<p>").text("heapUsed: " + coreStatus["Node memory"].heapUsed));
        }

        //  OS
        if ( coreStatus.OS ) {
            $(".os").append($("<p>").text("Architecture: " + coreStatus.OS["Architecture"]));
            $(".os").append($("<p>").text("Free memory: " + coreStatus.OS["Free memory"]));
            $(".os").append($("<p>").text("Name: " + coreStatus.OS["Name"]));
            $(".os").append($("<p>").text("Platform: " + coreStatus.OS["Platform"]));
            $(".os").append($("<p>").text("Total memory: " + coreStatus.OS["Total memory"]));
        }

        //  Process up time
        if ( coreStatus["Process up time"] ) {
            $(".processUpTime").append($("<p>").text("Process up time: " + coreStatus["Process up time"]));
        }
    }



    return {
        createWebitel: createWebitel
    }
});