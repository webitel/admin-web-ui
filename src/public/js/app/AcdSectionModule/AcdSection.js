/**
 * Automatic call distributor
 *
 * Помінялись API. Тепер замість метода PUT використовується метод PATCH.
 *      PUT використовується коли потрібно змінюється декілька параметрів, наприклад при редагуванні черги
 *
 */


define("AcdSection", ["webitelConnector", "session", "alert", "text!/js/app/AcdSectionModule/tpl/AcdTpl.html"], function(webitelConnector, session, alert, AcdTpl) {

    var currentDomain;

    //  підписатися на івент вибору домена
    //$("#select-domain").off("domainSelected");
    $("#select-domain").on("domainSelected", function(e, domain) {

        if ( location.pathname.indexOf("/acd") !== -1 ) {
            currentDomain = domain;
            session.setDomain(domain);
            createWebitel();
        }
    });

    //  перевіряє чи створений обєкт вебітел, або створює його
    function createWebitel() {
        if ( !window.webitel ) {
            webitelConnector.autoConnect(init);
        } else {
            init();
        }
    }

    //  викликає різні допоміжні функції
    //  TODO після вибору домена викликається метод ініт, навіть якщо відкритий інший розділ
    function init() {

        if ( !isDomainSelected() ) {
            alert.warning("", "Domain does not selected", 3000);
            return;
        }

        //  показати головний контенер із контентом
        $("#content-container").show();

        useBackbone();
    }
    function isDomainSelected() {
        if ( session.getRole() === "admin" || session.getRole() === "user" ) {
            currentDomain = session.getDomain();
        }
        else {
            currentDomain = $("#select-domain").attr("selectedDomain");
        }

        if ( currentDomain ) {
            return true;
        } else {
            return false
        }
    }


    //  підключити потрібні моделі
    function useBackbone() {

        //  додаткова перевірка, перед виконання модуля
        if ( location.pathname.indexOf("/acd") === -1 ) {
            return;
        }

        $("#content-container").html(_.template(AcdTpl)());

        require(["AcdCollection", "AcdCollectionView"], function(AcdCollection, AcdCollectionView) {

            var acdCollection = new AcdCollection([], {
                domain: currentDomain,
                token: session.getToken(),
                key  : session.getKey(),
                host : session.getWebitelServer()
            });

            var acdCollectionView = new AcdCollectionView({
                collection: acdCollection
            });
        });
    }

    return {
        createWebitel: createWebitel
    }
});
