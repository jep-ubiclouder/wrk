// des librairies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// var Promise = require('promise');

var config = require('./config.js');
// plugin SF
var nforce = require('nforce');
var routes = require('./routes/index');


var app = express();
// Creation du serveur
var server = require('http').Server(app);

// Uitlitaire formatage des string
var sprintf = require("sprintf-js").sprintf;

// attach socket.io and listen
var io = require('socket.io')(server);
// get a reference to the socket once a client connects
var socket = io.sockets.on('connection', function(socket) {});

// Une mantra pour la connection
var org = nforce.createConnection({
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    redirectUri: config.CALLBACK_URL + '/oauth/_callback',
    mode: 'multi',
    environment: config.ENVIRONMENT // optional, sandbox or production,
    // production default
});


// meta donées de SF
var fs = require('fs');

function mapRT(org, oauth) {
    // returns a recordtype map
    var query = 'select Id,IsActive,Name,NamespacePrefix,SobjectType FROM RecordType where isActive = true';
    org.query({
        query: query,
        oauth: oauth
    }, function(err, resp) {
        if (err) throw err;
        if (resp.records && resp.records.length) {
            console.log('infonction', resp.records);
            return resp.records;
        }

    });
}
const getLT = async (org, oauth, field, myId,chkFld) => {
    var q = "select id," + field + "  from Biography__c where Id='" + myId + "'";
    // var b = 1;
    // console.log('in getLT', q);
    const resultSQL = await getLTF(org, oauth, field, myId,chkFld);

    return resultSQL;
}
const getLTF = function(org, oauth, field, myId,chkFld) {
    return new Promise((resolve, reject) => {
        var q = "select id," + field + "  from Biography__c where Id='" + myId + "'";
        //console.log(q);
        org.query({
            oauth: oauth,
            query: q
        }, function(err, resp) {

            if (err) return reject(err);
            var b = {
                'field': field,
                'value': resp.records[0].get(field)
            };
            // console.log(b);

            var bio = nforce.createSObject('Biography__c');
            bio.set('Id', myId);
            bio.set('chkBioRTF__c', false);

            org.update({
                sobject: bio,
                oauth: oauth
            }, function(err, r) {
                if (!err) console.log('It worked!');
            });
            resolve(b);
        })
    })
}
const process = async (data) {
	// create parts of the final JSON record
	
	var resulat =  {};
    var result = {}
    result['data'] = data.sobject;
    result['event'] = data.event;
    result['meta'] = {
        'sobject': ' ',
        'recordtype': null
    }; // si le recordtype existe , il sera géré
    result['additional'] = [];

    var myId = data.sobject.Id;
    var key = myId.substring(0, 3);
    var flds2callback = [];
    var chBF = data.sobject.chkBioF__c;
    var chBE = data.sobject.chkBioE__c;
    var chBD = data.sobject.chkBioD__c;
    var chRTF = data.sobject.chkBioRTF__c;
    // console.log(chBF,chBE,chBD);
    var rtypeId = data.sobject.RecordTypeId;

    var prefix = myId.slice(0, 3);
    if (globalSchema[prefix]) {
        result['meta']['sobject'] = globalSchema[prefix]['MasterLabel'];
    }
    
    const options = await aditional;    
    const aditional = getLT(org, oauth,data) ; // org, oauth, field, myId,chkFld
    
    //console.log(rtypeId);
    if (rtypeId) {
        console.log(rtypeId);
        console.log(allRecordtypes[rtypeId]);
        result['meta']['recordtype'] = allRecordtypes[rtypeId]['name'];
    }

    if (chRTF) {
    	const options = await getLT(org, oauth, 'Formatted_Text_Element__c', myId,'chkBioRTF__c').then((resp) => {
            console.log('back from async', resp);
            result['additional'].push(resp);
        });
    }
    if (chBF) {
    	const options = await getLT(org, oauth, 'Biography_French__c', myId,'chkBioF__c').then((resp) => {
            console.log('back from async', resp);
            result['additional'].push(resp);
        });
    }
    if (chBE) {
    	const options = await getLT(org, oauth, 'Biography_English__c', myId,'chkBioE__c').then((resp) => {
            console.log('back from async', resp);
            result['additional'].push(resp);
        });
    }

    if (chBD) {
    	const options = await  getLT(org, oauth, 'Biography_German__c', myId,'chkBioD__c').then((resp) => {
            console.log('back from async', resp);
            result['additional'].push(resp);
        });
    } 	
	return result;
} 


org.authenticate({
    username: config.USERNAME,
    password: config.PASSWORD
}, function(err, oauth) {
    if (err) return console.log(err);
    if (!err) {
        console.log('*** Successfully connected to Salesforce ***');


        /*
         Un catalogue des prefixes pour trouver les noms d'objets
         */
        var querySchema = 'Select QualifiedApiName, MasterLabel, Label, KeyPrefix From EntityDefinition';
        var globalSchema = 1;
        org.query({
            query: querySchema,
            oauth: oauth
        }, function(err, resp) {
            if (err) throw err;
            if (resp.records && resp.records.length) {
                var recordTypes = {};
                resp.records.forEach(function(rec) {
                    recordTypes[rec.get('KeyPrefix')] = {
                        'QualifiedApiName': rec.get('QualifiedApiName'),
                        'Label': rec.get('Label'),
                        'MasterLabel': rec.get('MasterLabel')
                    };
                });
                globalSchema = recordTypes;
            }
        });

        /*
         * Catalogues des recordtypes
         */
        var queryRT = 'select Id,IsActive,Name,NamespacePrefix,SobjectType FROM RecordType where isActive = true';
        var allRecordtypes = 1;
        org.query({
            query: queryRT,
            oauth: oauth
        }, function(err, resp) {
            if (err) throw err;
            if (resp.records && resp.records.length) {
                var recordTypes = {};
                resp.records.forEach(function(rec) {
                    recordTypes[rec.get('id').slice(0, 15)] = {
                        'id': rec.get('id'),
                        'name': rec.get('name'),
                        'object': rec.get('sobjecttype')
                    };
                });
                allRecordtypes = recordTypes;
            }
        });

        var query = 'select id,name,query from pushtopic';
        org.query({
            query: query,
            oauth: oauth
        }, function(err, resp) {
            if (err) throw err;

            if (resp.records && resp.records.length) {
                resp.records.forEach(function(rec) {
                    // console.log('Pushtopic: ' + rec.get('Name') + ' ' +
                    // rec.get('query'));
                    var str = org.stream({
                        topic: rec.get('Name'),
                        oauth: oauth
                    });
                    str.on('connect', function() {
                        console.log('Connected to pushtopic: ' + rec.get('Name'));
                    });
                    str.on('error', function(error) {
                        console.log('Error received from pushtopic: ' + error);
                    });
                    str.on('data', function(data) {
                    	process(data).then((record) => {
                                console.log('back from async', record);
                                // TODO: Publish full record
                            });
                        console.log('*************************************',result);
                    });
                });
            }
        });
    }
});
app.set('port', process.env.PORT || 3001);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
server.listen(app.get('port'), function() {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});
module.exports = app;