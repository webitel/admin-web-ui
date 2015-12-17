var config = require('nconf');
var fs     = require('fs');

config.argv()
    .env()
    .file({ file: __dirname + '/config.json' });

module.exports = config;