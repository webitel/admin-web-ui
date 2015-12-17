var fs      = require('fs'),
    path    = require('path'),
    http    = require('http'),
    https   = require('https'),
    express = require('express');


var APP_ROOT_PATH = path.dirname(require.main.filename);
global["APP_ROOT_PATH"] = APP_ROOT_PATH;

var log     = require('./boot/winston.js')(module),
    config  = require('./config/index.js');

var app = express(); 

require(APP_ROOT_PATH + "/boot/index.js")(app);
require(APP_ROOT_PATH + "/router/index.js")(app);

if (config.get("ssl:enabled") != true) {
    http.createServer(app).listen(app.get('port'), function(){
        //log.info("Server webitel-admin running: protocol=http, port=" + app.get('port'));

        log.info(
            "\n ____________________________" +
            "\n/  Webitel UI running on     \\" +
            "\n\\  http://          :" + app.get('port') + "   /" +
            "\n ----------------------------" +
            "\n\t   \\\t^__^" +
            "\n\t\t\\\t(OO)\_______" +
            "\n\t\t\t(__)\       )\\/\\" +
            "\n\t\t\t    ||---WW |" +
            "\n\t\t\t    ||     ||" +
            "\n");
    });
}
else {
    var key_file  = APP_ROOT_PATH + "/cert/" + config.get("ssl:keyFile"),
        cert_file = APP_ROOT_PATH + "/cert/" + config.get("ssl:certFile");

    var sll_config = {
        key: fs.readFileSync(key_file),
        cert: fs.readFileSync(cert_file)
    };

    https.createServer(sll_config, app).listen(app.get('port'), function () {
        //log.info("Server webitel-admin running: protocol=https, port=" + app.get('port'));

        log.info(
            "\n ____________________________" +
            "\n/  Webitel UI running on     \\" +
            "\n\\  https://         :" + app.get('port') + "   /" +
            "\n ----------------------------" +
            "\n\t   \\\t^__^" +
            "\n\t\t\\\t(oo)\_______" +
            "\n\t\t\t(__)\       )\\/\\" +
            "\n\t\t\t    ||----W |" +
            "\n\t\t\t    ||     ||" +
            "\n");
    });
}



