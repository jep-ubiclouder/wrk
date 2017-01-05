var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config.js');
var nforce = require('nforce');
var routes = require('./routes/index');
var app = express();
var server = require('http').Server(app);
// attach socket.io and listen
var io = require('socket.io')(server);
// get a reference to the socket once a client connects
var socket = io.sockets.on('connection', function(socket) {});
var org = nforce.createConnection({
    clientId: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    redirectUri: config.CALLBACK_URL + '/oauth/_callback',
    mode: 'multi',
    environment: config.ENVIRONMENT // optional, sandbox or production, production default
});

function checkDescription(myId, oauth) {
    var qry = "select id, Description from Contact where id='" + myId + "'";
    console.log(qry);
    org.query({
        query: qry,
        oauth: oauth
    }, function(err, resp) {
        if (err) {
            console.log(err);
        }
        //console.log(resp);
        if (resp.records && resp.records.length) {
            console.log(resp.records[0]);
        }
    });
}
org.authenticate({
    username: config.USERNAME,
    password: config.PASSWORD
}, function(err, oauth) {
    if (err) return console.log(err);
    if (!err) {
        console.log('*** Successfully connected to Salesforce ***');
        // add any logic to perform after login
        // console.log('Access Token: ' + org.accessToken);
        // console.log('Instance URL: ' + org.instanceUrl);
        // console.log('User ID: ' + userInfo.id);
        // console.log('Org ID: ' + userInfo.organizationId);
        console.log(org);
        var query = 'select id,name,query from pushtopic';
        org.query({
            query: query,
            oauth: oauth
        }, function(err, resp) {
            if (err) throw err;
            if (resp.records && resp.records.length) {
                resp.records.forEach(function(rec) {
                    console.log('Pushtopic: ' + rec.get('Name') + ' ' + rec.get('query'));
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
                        console.log('Received the following from pushtopic:');
                        console.log(data);
                        var myId = data.sobject.Id;
                        var chkDescr = data.sobject.Is_Long_text_changed__c;
                        if (chkDescr) {
                            checkDescription(myId, oauth);
                        }
                        // emit the record to be displayed on the page
                        socket.emit('record-processed', JSON.stringify(data));
                    });
                });
            }
        });
    }
    //console.log(app.get('/Pushtopic'));
    // subscribe to a pushtopic
});
app.set('port', process.env.PORT || 3001);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
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