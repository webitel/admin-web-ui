
define("alert", [], function() {

    function success(container, mess, time) {
        $.niftyNoty({
            icon : "fa fa-thumbs-up fa-lg",
            type: "success",
            container : container || "floating",
            title : "Success",
            message : mess || "",
            closeBtn : true,
            timer : time || 5000
        });
    }

    function error(container, mess, time) {
        $.niftyNoty({
            icon : "fa fa-times fa-lg",
            type: "danger",
            container : container || "floating",
            title : "Error",
            message : mess || "",
            closeBtn : true,
            timer : time || 5000
        });
    }

    function info(container, mess, time) {
        $.niftyNoty({
            icon : "fa fa-info fa-lg",
            type: "info",
            container : container || "floating",
            title : "Info",
            message : mess || "",
            closeBtn : true,
            timer : time || 5000
        });
    }

    function warning(container, mess, time) {
        $.niftyNoty({
            icon : "fa fa-bolt fa-lg",
            type: "warning",
            container : container || "floating",
            title : "Warning",
            message : mess || "",
            closeBtn : true,
            timer : time || 5000
        });
    }


    function custom(container) {
        $.niftyNoty({
            type: 'danger',
            container : "" || "floating",
            html : '<h4 class="alert-title">Oh snap! You got an error!</h4><p class="alert-message">Change this and that and try again. Duis mollis, est non commodo luctus.</p><div class="mar-top"><button type="button" class="btn btn-info" data-dismiss="noty">Close this notification</button></div>',
            closeBtn : false
        });
    }

    return {
        warning : warning,
        success : success,
        error   : error,
        info    : info
    }
});