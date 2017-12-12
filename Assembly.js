// des librairies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');



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
// var sfmetadata = JSON.parse(fs.readFileSync('./sfMetadata.json', 'utf8'));
/*
 * for (var table in sfmetadata) { console.log(sfmetadata[table].Name);
 * console.log(sfmetadata[table].Prefix); }
 */
// Connection a PostGres
/*
 * var pg = require('pg'); var pool = new pg.Pool({ user: 'postgres', password:
 * 'ubi2016', host: '192.168.8.100', database: 'mm', max: 10, // max number of
 * clients in pool idleTimeoutMillis: 1000, // close & remove clients which have
 * been idle > 1 second }); console.log(pool); // connection a MySQL var mysql =
 * require('mysql'); var connection = mysql.createConnection({ host:
 * '192.168.8.100', user: 'jep', password: 'ubi2016', database: 'mm' });
 * connection.connect();
 */
/*
 * function checkDescription(myId, oauth, what2chk) { var fields =
 * what2chk.replace(';', ','); var qry = "select id, " + fields + " from
 * Ub_Contact_Dummy__c where id='" + myId + "'"; console.log(qry); org.query({
 * query: qry, oauth: oauth }, function(err, resp) { if (err) {
 * console.log(err); } //console.log(resp); if (resp.records &&
 * resp.records.length) { console.log(resp.records[0]); } }); }
 */



/*
 * function buildSQLRecord(id, record) { if (record.operation =='deleted'){ var
 * qryMySQL = 'insert into
 * ubjournal(Objectname,FieldName,strFieldValueSmall,sfID,operation,sequence)
 * VALUES
 * (\'%(table)s\',\'%(champ)s\',\'%(valeur)s\',\'%(id)s\',\'%(operation)s\',%(sequence)s);'
 * 
 * var qryPgSQL = ' insert into
 * "ubJournaling"("Objectname","FieldName","strFieldValueSmall","sfID","operation","sequence")
 * VALUES
 * (\'%(table)s\',\'%(champ)s\',\'%(valeur)s\',\'%(id)s\',\'%(operation)s\',%(sequence)s);'
 * var MySQLqry = sprintf(qryMySQL, record); var PGSQLqry = sprintf(qryPgSQL,
 * record); } if (record.champ != 'Id') { var qryMySQL = 'insert into
 * ubjournal(Objectname,FieldName,strFieldValueSmall,sfID,operation,sequence)
 * VALUES
 * (\'%(table)s\',\'%(champ)s\',\'%(valeur)s\',\'%(id)s\',\'%(operation)s\',%(sequence)s);'
 * var qryPgSQL = ' insert into
 * "ubJournaling"("Objectname","FieldName","strFieldValueSmall","sfID","operation","sequence")
 * VALUES
 * (\'%(table)s\',\'%(champ)s\',\'%(valeur)s\',\'%(id)s\',\'%(operation)s\',%(sequence)s);'
 * var MySQLqry = sprintf(qryMySQL, record); var PGSQLqry = sprintf(qryPgSQL,
 * record); // var qry = 'insert into
 * ubjournal(Objectname,FieldName,strFieldValueSmall,sfID,operation,sequence)
 * VALUES (\''+table +'\',\''+champ +'\',\''+valeur +'\',\''+id
 * +'\',\''+operation +'\','+sequence+');'; // console.log(qry); }
 * console.log(sprintf(qryMySQL, record)); console.log(sprintf(qryPgSQL,
 * record));
 */
    /*
	 * pool.connect(function(err, client, done) { if (err) { return
	 * console.error('error fetching client from pool', err); }
	 * client.query(PGSQLqry, '', function(err, result) { //call `done()` to
	 * release the client back to the pool console.log('transaction ok',
	 * PGSQLqry); done();
	 * 
	 * if (err) { return console.error('error running query', err); } }); });
	 */

    /*
	 * connection.query(MySQLqry, function(err, rows, fields) { if (!err)
	 * console.log('Transaction OK: ', MySQLqry); else{ // console.log('Error
	 * while performing Query.', err); } });
	 */
// }
function mapRT(org,oauth){
	// returns a recordtype map
	var query =  'select Id,IsActive,Name,NamespacePrefix,SobjectType FROM RecordType where isActive = true';
	org.query({
        query: query,
        oauth: oauth
    }, function(err, resp) {
    	if (err) throw err;
    	if (resp.records && resp.records.length){
    		console.log('infonction',resp.records);
    		return resp.records;
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
        var query = 'select id,name,query from pushtopic';
        org.query({
            query: query,
            oauth: oauth
        }, function(err, resp) {
            if (err) throw err;
            var queryRT =  'select Id,IsActive,Name,NamespacePrefix,SobjectType FROM RecordType where isActive = true';
            var allRecordtypes = org.query({
                query: queryRT,
                oauth: oauth
            }, function(err, resp) {
            	if (err) throw err;
            	if (resp.records && resp.records.length){
            		var recordTypes =[];
            		resp.records.forEach(function(rec) {
            			console.log(rec);
            			recordTypes.push([rec.get('id'),rec.get('name'),rec.get('Sobjecttype')]);
            		});
            		// console.log('infonction',resp.records);
            		return recordTypes;
            	}
            });
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
                    	console.log(allRecordtypes);
                        console.log('Received the following from pushtopic:');
                        console.log(data);
                        var myId = data.sobject.Id;
                        var key = myId.substring(0, 3);
                        var flds2callback = [];
                        var chBF = data.sobject.chkBioF__c;
                        var chBE = data.sobject.chkBioE__c;
                        var chBD = data.sobject.chkBioD__c;
                        var chRTF = data.sobject.chkBioRTF__c;
                        // console.log(chBF,chBE,chBD);
                        
                        if(chRTF){
                        	var q = "select id, Formatted_Text_Element__c from Biography__c where Id='"+myId +"'";
                            console.log(q);
                            org.query({
                                oauth:oauth,
                                query : q
                            } , function(err,resp){
                                // console.log(resp);
                                // console.log(resp.records[0].get('Biography_French__c'));
                                var b = {'Id':myId, 'Formatted_Text_Element__c': resp.records[0].get('Formatted_Text_Element__c')};
                                console.log(JSON.stringify(b));
                                var bio = nforce.createSObject('Biography__c');
                                bio.set('Id',myId);
                                bio.set('chkBioRTF__c',false);
                                org.update({sobject:bio, oauth:oauth}, function(err, r){
                                	  if(!err) console.log('It worked!');
                                });
                            });
                        	
                        }
                        
                        if (chBF){
                            var q = "select id, Biography_French__c from Biography__c where Id='"+myId +"'";
                            console.log(q);
                            org.query({
                                oauth:oauth,
                                query : q
                            } , function(err,resp){
                                // console.log(resp);
                                // console.log(resp.records[0].get('Biography_French__c'));
                                var b = {'Id':myId, 'Biography_French__c': resp.records[0].get('Biography_French__c')};
                                console.log(JSON.stringify(b));
                                var bio = nforce.createSObject('Biography__c');
                                bio.set('Id',myId);
                                bio.set('chkBioF__c',false);
                                org.update({sobject:bio, oauth:oauth}, function(err, r){
                                	  if(!err) console.log('It worked!');
                                });
                            });
                        }
                        if (chBE){
                            var q = "select id, Biography_English__c from Biography__c where Id = '"+myId +"'";
                            console.log(q);
                            org.query({
                                oauth:oauth,
                                query :q
                            } , function(err,resp){
                                console.log(resp.records[0].get('Biography_English__c'));
                                var b = {'Id':myId, 'Biography_English__c': resp.records[0].get('Biography_English__c')};
                                console.log(JSON.stringify(b));
                                
                                var bio = nforce.createSObject('Biography__c');
                                bio.set('Id',myId);
                                bio.set('chkBioE__c',false);
                                org.update({sobject:bio, oauth:oauth}, function(err, r){
                                	  if(!err) console.log('It worked!');
                                });
                            });
                        }
                        if (chBD){
                            var q = "select id, Biography_German__c from Biography__c where Id = '"+myId +"'";
                            console.log(q);
                            org.query({
                                oauth:oauth,
                                query :q
                            } , function(err,resp){
                                console.log(resp.records[0].get('Biography_German__c'));
                                var bio = nforce.createSObject('Biography__c');
                                bio.set('Id',myId);
                                bio.set('chkBioD__c',false);
                                org.update({sobject:bio, oauth:oauth}, function(err, r){
                                	  if(!err) console.log('It worked!');
                                });
                                
                            });
                        }
                        /*
						 * for (var boucle in sfmetadata) { if (key ==
						 * sfmetadata[boucle].Prefix) { var table =
						 * sfmetadata[boucle].Name;
						 * 
						 * for (var field in sfmetadata[boucle].fields) { if
						 * (sfmetadata[boucle].fields[field].fType ==
						 * 'TEXTAREA') {
						 * flds2callback.push(sfmetadata[boucle].fields[field].fName); } }
						 * console.log('LTF', flds2callback); break; } }
						 */
                        /*
						 * for (item in data.sobject) { var record = { table:
						 * table, operation: data.event.type, champ: item,
						 * valeur: data.sobject[item], sequence:
						 * data.event.replayId, id: myId } }
						 */
                        /*
						 * var chkDescr = data.sobject.ubLongBioChanged__c; //
						 * console.log(chkDescr); if (chkDescr) { var what2chk =
						 * data.sobject.testMultipick__c; console.log(what2chk);
						 * checkDescription(myId, oauth, what2chk); }
						 */
                        // emit the record to be displayed on the page
                        // socket.emit('record-processed',
						// JSON.stringify(data));
                    });
                });
            }
        });
    }
    // console.log(app.get('/Pushtopic'));
    // subscribe to a pushtopic
});
app.set('port', process.env.PORT || 3001);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
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
