
var Client = require('node-rest-client').Client,
    client = new Client();

var REST_URL = {
    "DEF_GET"      : "/api/v2/routes/default",
    "PUB_GET"      : "/api/v2/routes/public",
    "EXTENSION_GET": "/api/v2/routes/extensions",
    "VARIABLES": "/api/v2/routes/variables"
};

client.on('error', function (err) {
    console.error(err.message);
});

function getServerUrl (url) {
    try {
        return url.replace(/ws(s)?/, 'http$1');
    } catch (e) {
        return ''
    }
}

module.exports = {
    getDefault: function (user, domain, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.DEF_GET
            },
            parameters: {
                "domain": domain
            }
        };
        var req = client.get(getServerUrl(user["webitelServer"]) + '${id}', args, function (data, response) {
            if (data) {
                cb(null, data);
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    postDefault: function (user, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.DEF_GET
            },
            data: data
        };

        console.log(getServerUrl(user['webitelServer']) + '${id}');

        var req = client.post(getServerUrl(user['webitelServer']) + '${id}', args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },
    
    deleteDefault: function (user, id, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.DEF_GET
            }
        };
        var req = client.delete(getServerUrl(user['webitelServer']) + '${id}' + '/' + id, args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    putDefault: function (user, id, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.DEF_GET,
                "uuid": id
            },
            data: data
        };
        var req = client.put(getServerUrl(user['webitelServer']) + '${id}/${uuid}', args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    setOrderDefault: function (user, id, order, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.DEF_GET,
                "uuid": id
            },
            data: {
                "order": order
            }
        };
        var req = client.put(getServerUrl(user['webitelServer']) + '${id}/${uuid}/setOrder', args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    incOrderDefault: function (user, domainName, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.DEF_GET,
                "domain": domainName
            },
            data: data
        };
        var req = client.put(getServerUrl(user['webitelServer']) + '${id}/${domain}/incOrder', args, function (_data, response) {
            if (response.statusCode == 200) {
                cb(null, _data);
            } else {
                cb(new Error(_data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },


    /** PUBLIC */
    getPublic: function (user, domain, cb) {
        user = user || {};
        var args = {
            requestConfig: {rejectUnauthorized: false},
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.PUB_GET
            },
            parameters: {
                "domain": domain
            }
        };
        var req = client.get(getServerUrl(user['webitelServer']) + '${id}', args, function (data, response) {
            if (data) {
                cb(null, data);
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            console.dir(arguments);
            cb(err);
        });

        req.on('responseTimeout',function(){
            console.dir(arguments)
        });
    },

    postPublic: function (user, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.PUB_GET
            },
            data: data
        };
        var req = client.post(getServerUrl(user['webitelServer']) + '${id}', args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    putPublic: function (user, id, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.PUB_GET,
                "uuid": id
            },
            data: data
        };
        var req = client.put(getServerUrl(user['webitelServer']) + '${id}/${uuid}', args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            }
            ;
        });

        req.on('requestTimeout', function (req) {
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error', function (err) {
            cb(err);
        });

        req.on('responseTimeout', function () {

        });
    },

    deletePublic: function (user, id, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type": "application/json",
                "x-access-token": user['token'],
                "x-key": user['key']
            },
            path: {
                "id": REST_URL.PUB_GET
            }
        };
        var req = client.delete(getServerUrl(user['webitelServer']) + '${id}' + '/' + id, args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            };
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    /** EXTENSION */
    getExtension: function(user, domain, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type"  : "application/json",
                "x-access-token": user['token'],
                "x-key"         : user['key']
            },
            path: {
                "id": REST_URL["EXTENSION_GET"]
            },
            parameters: {
                "domain": domain
            }
        };

        var req = client.get(getServerUrl(user['webitelServer']) + '${id}', args, function (data, response) {
            if (data) {
                cb(null, data);
            }
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    putExtension: function(user, id, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type"  : "application/json",
                "x-access-token": user['token'],
                "x-key"         : user['key']
            },
            path: {
                "id"  : REST_URL["EXTENSION_GET"],
                "uuid": id
            },
            data: data
        };
        var req = client.put(getServerUrl(user['webitelServer']) + '${id}/${uuid}', args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            }
        });

        req.on('requestTimeout', function (req) {
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error', function (err) {
            cb(err);
        });

        req.on('responseTimeout', function () {

        });
    },

    /** VARIABLES */
    getVariables: function(user, domain, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type"  : "application/json",
                "x-access-token": user['token'],
                "x-key"         : user['key']
            },
            path: {
                "id": REST_URL["VARIABLES"]
            },
            parameters: {
                "domain": domain
            }
        };

        var req = client.get(getServerUrl(user['webitelServer']) + '${id}', args, function (data, response) {
            if (data) {
                cb(null, data);
            }
        });

        req.on('requestTimeout',function(req){
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error',function(err){
            cb(err);
        });

        req.on('responseTimeout',function(){

        });
    },

    putVariables: function(user, domain, data, cb) {
        user = user || {};
        var args = {
            headers: {
                "Content-Type"  : "application/json",
                "x-access-token": user['token'],
                "x-key"         : user['key']
            },
            data: data
        };
        var req = client.put(getServerUrl(user['webitelServer']) + REST_URL["VARIABLES"] + "?domain=" + domain, args, function (data, response) {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb(new Error(data));
            }
        });

        req.on('requestTimeout', function (req) {
            req.abort();
            cb(new Error('Timeout'));
        });

        req.on('error', function (err) {
            cb(err);
        });

        req.on('responseTimeout', function () {

        });
    }


};