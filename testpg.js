var sprintf = require("sprintf-js").sprintf;


var record={  
  table:'toto',
  champ:'totoChamp',
  valeur:'totValeur',
  id:'a0QtotoIdsalesforce',
  operation:'insert',
  sequence: 69
}
var qryMySQL = 'insert into ubjournal(Objectname,FieldName,strFieldValueSmall,sfID,operation,sequence) VALUES (\'%(table)s\',\'%(champ)s\',\'%(valeur)s\',\'%(id)s\',\'%(operation)s\',%(sequence)s);'

var qryPgSQL = ' insert into "ubJournaling"("Objectname","FieldName","strFieldValueSmall","sfID","operation","sequence") VALUES (\'%(table)s\',\'%(champ)s\',\'%(valeur)s\',\'%(id)s\',\'%(operation)s\',%(sequence)s);'

console.log(sprintf(qryMySQL,record));
console.log(sprintf(qryPgSQL,record));