// server.js
// where your node app starts

///////////////////////////
const requireFromUrl = require('require-from-url/sync');
const newUUID = require('uuid/v1');
const CONST = require('./public/constants');
const Okb = requireFromUrl("https://okb.glitch.me/Okb-min.js");
const doodleSerial = require('./public/doodle-serial');
const sharedTools = require('./public/shared-tools');

// init sqlite db
var fs = require('fs');
var dbFile = './data/sqlite.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);


function double(){

  db.all(`SELECT * from Doodles`, function(err, rows) {
    for (var i = 0; i < rows.length; i++){
      var data = rows[i];
      var uuid = newUUID();
      db.run(`INSERT INTO Doodles (uuid, userid, timestamp, doodlename, doodledata, appropriate) VALUES ("${uuid}", "${data.userid}", "${data.timestamp}", "${data.doodlename}_", "${data.doodledata}", "${data.appropriate}")`);
    }
  })

}

double();



