var config = require(global["APP_ROOT_PATH"] + '/config/index.js');

module.exports = function (app) {
    require(__dirname + "/express.js")(app);
};

