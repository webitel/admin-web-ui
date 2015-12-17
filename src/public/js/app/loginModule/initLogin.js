

define("initLogin", ["LoginModel", "LoginModelView"], function(LoginModel, LoginModelView) {

    //  ініціалізувати модель форми входу
    var loginModel = new LoginModel();

    //  ініціалізуввати вюху моделі форми входу
    var loginModelView = new LoginModelView({
        model: loginModel
    });
    loginModelView.render();

});
