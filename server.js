// server.js
// where your node app starts

////////////////////////////////////////////////////////////////////////////
const requireFromUrl = require('require-from-url/sync');
const newUUID = require('uuid/v4');
const CONST = require('./public/constants');
const Okb = requireFromUrl("https://okb.glitch.me/Okb-min.js");
const doodleSerial = require('./public/doodle-serial');
const sharedTools = require('./public/shared-tools');
const classifier = require('./public/doodle-classify');

// const https = require('https');
var express = require('express'); 
var app = express();
var server = app.listen(process.env.PORT || 300);
app.use(express.static('public'));
console.log('server running')

var io = require('socket.io')(server,{pingTimeout:1000});

// init sqlite db
var fs = require('fs');
var dbFile = './data/sqlite.db';
var exists = fs.existsSync(dbFile) && fs.readFileSync(dbFile).toString().length;
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var clientCount = 0;
var clientQueue = [];
var CLIENT_MAX = 30;
var clientServing = [];
var uuidAlias = {};

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(function(){
  if (!exists) {
    db.run('CREATE TABLE Doodles (uuid TEXT, userid TEXT, timestamp TEXT, doodlename TEXT, doodledata TEXT, appropriate TEXT)');
    console.log('New table Doodles created!');
  }
  else {
    console.log('Database "Doodles" ready to go!');
  }
});


app.get('/download', function(req, res){
  var file = __dirname + '/data/sqlite.db';
  var filename = `DOODLES-${(new Date().toString())}.db`;
  res.setHeader('Content-Type', 'application/json');
  res.download(file,filename);
});


function clean(x){
  return x.replace(/['" \*\(\)=]/g,"").replace(/DELETE/g,"")
}

function isvalid(data){
  try{
    doodleSerial.decompress(data);
    return true;
  }catch(e){
    return false;
  }
}

function receiveClientUpdate(socket,data){
  if (clientServing.indexOf(socket.id) == -1){
    return;
  }
  if (data.op != "request-world" && data.op != "request-datum" && data.op != "request-world-inf"){console.log(socket.id,data.op)}
  if (data.op == "submit"){
    var uuid = newUUID();
    var date = (new Date(data.timestamp)).toString() == "Invalid Date" ? (new Date()).toString() : data.timestamp;
    if (!isvalid(data.doodledata)){
      console.log("doodledata validity check failed! possibly an attack")
      return
    }
    db.run(`INSERT INTO Doodles (uuid, userid, timestamp, doodlename, doodledata, appropriate) VALUES ("${uuid}", "${clean(data.userid)}", "${date}", "${clean(data.doodlename)}", "${data.doodledata}", "1")`);
    
    addDoodleToWorld(data.doodledata,uuid,[data.x||0,data.y||0,data.z||0]);
    
    socket.emit('submit-success');
  }else if (data.op == "admin"){
    console.log("admin attempt");
    if (data.password == process.env.SECRET || data.password == process.env.SECRET2){
      console.log("admin success");
      console.log(data.command);
      db.run(data.command);
    }else{
      console.log("admin failure");
    }
  }else if (data.op == "request-database"){
    db.all(`SELECT * from Doodles LIMIT ${data.range[1]-data.range[0]} OFFSET ${data.range[0]}`, function(err, rows) {
      socket.emit('database',rows)
    });

  }else if (data.op == "request-rowcount"){
    db.all(`SELECT COUNT(*) FROM Doodles`, function(err, rows) {
      socket.emit('rowcount',rows[0]["COUNT(*)"])
    });

  }else if (data.op == "request-datum"){
    var vis_uuid = data.uuid;
    var uuid = data.uuid;
    if (uuid in uuidAlias){
      uuid = uuidAlias[uuid];
    }
    db.all(`SELECT * from Doodles WHERE uuid='${uuid}';`, function(err, rows) {
      if (rows[0] != undefined){
        socket.emit('datum',Object.assign({},rows[0],{uuid:vis_uuid,doodlename:rows[0].doodlename+(vis_uuid==uuid?"":" (Clone)")}));
      }
    });
  }else if (data.op == "request-world"){
    var selected = World.filter((x)=>(Okb.vector.distance(data.position,x)<CONST.SIZE.FAR+10));
    var t = (new Date()).getTime();
    selected.map((x)=>(x.lastReq=t));
    socket.emit('world',selected)
  }else if (data.op == "request-world-inf"){
    var selected = World;
    var t = (new Date()).getTime();
    selected.map((x)=>(x.lastReq=t));
    socket.emit('world',selected)
  }else if (data.op == "request-terrain"){
    socket.emit('terrain',Terrain);
  }else if (data.op == "request-altterrain"){
    socket.emit('altterrain',AltTerrain);
  }else if (data.op == "request-clusters"){
    socket.emit('clusters',Clusters);
  }
}


var Terrain = sharedTools.terrain.generate();
var AltTerrain = sharedTools.terrain.generateAlt();

function newConnection(socket){
  function onClientUpdate(data){
    receiveClientUpdate(socket,data);
	}
  
	function onClientExit(){
    clientCount --;
    var icq = clientQueue.indexOf(socket.id);
    var ics = clientServing.indexOf(socket.id);
    if (icq != -1){clientQueue.splice(icq,1);}
    if (ics != -1){clientServing.splice(ics,1);}
    console.log(socket.id+' disconnected');
	}
  
  clientCount ++;
	console.log('new connection: ' + socket.id);
  console.log("clientCount",clientCount);
  
  clientQueue.push(socket.id);
	socket.on('client-update', onClientUpdate);
	socket.on('disconnect', onClientExit);
}	


io.sockets.on('connection', newConnection);

var World = [];

function addDoodleToWorld(doodledata,uuid,p,cluster){
  if (cluster == undefined){
    cluster = Math.floor(Math.random()*Clusters.length); //TODO: something smarter
  }
  var type = doodleSerial.acronym(doodledata.split("&")[0]);
  var doodle = {
    x:p.x,
    y:p.y,
    z:p.z,
    v:{
      x:0,
      y:0,
      z:0
    },
    targ:{x:p.x,y:p.y,z:p.z},
    scale: 1+2*Okb.random.weighted((n)=>(1-n)),
    id: uuid,
    type: type,
    stun: 200,
    spd: Math.random()*0.04+0.02,
    lastReq: (new Date()).getTime(),
    cluster: cluster,
  }
  World.push(doodle)
  return doodle
}

var Clusters = [];

function initClusters(rows){
  
  var embeddings = []
  for (var i = 0; i < rows.length; i++){
    var strokes = JSON.parse(doodleSerial.decompress(rows[i].doodledata)).strokes;
    embeddings.push(classifier.embed(strokes));
    classifier.predict(strokes).prediction;
  }
  var embed2d = classifier.makeTSNE(embeddings);
  var k = 6;
  var km = Okb.math.kmeans(embed2d, k);
  
  var centers = [];
  var waterlvl = 3;
  var num_candidates = 100;
  
  for (var i = 0; i < k; i++){
    var candidates = [];
    for (var j = 0; j < num_candidates; j++){
      var x,y;
      do {
        x = (Math.random()-0.5)*CONST.SIZE.TERRAIN;
        y = (Math.random()-0.5)*CONST.SIZE.TERRAIN;
      }while (sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,x,y) < waterlvl)
      candidates.push([x,y])
    }
    var mmd = -Infinity;
    var mmc = candidates[0];
    for (var j = 0; j < candidates.length; j++){
      var md = Infinity;
      for (var l = 0; l < centers.length; l++){
        var d = Okb.vector.distance(candidates[j],centers[l]);
        if (d < md){
          md = d;
        }
      }
      if (md > mmd){
        mmd = md;
        mmc = candidates[j];
      }
    }
    centers.push(mmc);
  }
  
  centers.push([CONST.SIZE.ALTTERRAINX,CONST.SIZE.ALTTERRAINZ]);
  
  for (var i = 0; i < rows.length; i++){
    if (rows[i].appropriate=='1'){
      rows[i].cluster = km.labels[i];
    }else{
      rows[i].cluster = centers.length-1;
    }
  }
  
  Clusters = []
  for (var i = 0; i < centers.length; i++){
    var c = {}
    var y = rows.filter((x)=>(x.cluster==i))
    c.center = centers[i];
    c.count = y.length;
    c.samples = y.slice(0,3).map(x=>(x.doodledata));
    Clusters.push(c);
  }

  // console.log(Clusters);
}


function initWorld(){
  World = [];
  db.all(`SELECT * FROM Doodles ORDER BY RANDOM() LIMIT ${CONST.SIZE.LOADLIMIT};`,function(err, rows) {
    console.log(rows.length+" doodles loaded from database");
    
    var clusters = initClusters(rows);
    
    var l = rows.length;
    while (rows.length < CONST.SIZE.LOADLIMIT){
      var doodle = Object.assign({},rows[Math.floor(Math.random()*l)]);
      doodle.doodlename += "(Clone)";
      var newid = newUUID();
      uuidAlias[newid] = doodle.uuid;
      
      doodle.uuid = newid;
      rows.push(doodle);
    }
    // console.log(uuidAlias)
    // console.log(rows.map((x)=>(x.doodlename)).join(","))
    
    console.log(rows.length+" doodles spawned");
    for (var i = 0; i < rows.length; i++){
      var x = Clusters[rows[i].cluster].center.x + (Math.random()-0.5)*CONST.SIZE.TERRAIN*0.2;
      var z = Clusters[rows[i].cluster].center.y + (Math.random()-0.5)*CONST.SIZE.TERRAIN*0.2;
      var y = sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,x,z);
      var doodle = addDoodleToWorld(rows[i].doodledata,rows[i].uuid,[x,y,z],rows[i].cluster);
      
      if (doodle.type == "birdoid"){
        doodle.y += Math.random()*8+2
      }
      
    }
    console.log("world length",World.length)
  });
}

function removeOverload(){
  if (World.length > CONST.SIZE.SERVELIMIT){
    var t = (new Date()).getTime();
    var removal = World.filter((x)=>(t-x.lastReq > 2000));
    removal.sort((x,y)=>(y.lastReq-x.lastReq));
    removal = removal.slice(0,50);
    for (var i = 0; i < removal.length; i++){
      console.log("deleting overload: ",removal[i].id);
      io.sockets.emit('deathrattle',{id:removal[i].id});
      World.splice(World.indexOf(removal[i]),1);
    }
  }  
}

function dequeue(){
  // console.log(clientServing,clientQueue);
  while (clientServing.length < CLIENT_MAX && clientQueue.length > 0){
    var cid = clientQueue.shift();
    io.sockets.connected[cid].emit("dequeue");
    clientServing.push(cid);
  }
  for (var i = 0; i < clientQueue.length; i++){
    io.sockets.connected[clientQueue[i]].emit("queue",{position:i,total:clientQueue.length});
  }
}

function updateWorld(){
  var waterlvl = 0.1
  for (var i = 0; i < World.length; i++){
    var doodle = World[i];
    if (doodle.type == "plantoid"){
      var trials = 0;
      var maxtrials = 50;
      while (doodle.y < waterlvl){
        doodle.x = Clusters[doodle.cluster].center.x+(Math.random()-0.5)*0.2*CONST.SIZE.TERRAIN;
        doodle.z = Clusters[doodle.cluster].center.y+(Math.random()-0.5)*0.2*CONST.SIZE.TERRAIN;
        doodle.y = sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,doodle.x,doodle.z);
        trials ++;
      };
      continue;
    }else{
      if (doodle.stun > 0){
        doodle.stun --;
        continue;
      }
      if (Math.random() < 0.0005 && doodle.type != "birdoid"){
        doodle.stun = Math.floor(Math.random()*500);
      }
      if (Okb.vector.distance(doodle,doodle.targ) < 1){
        var trials = 0;
        var maxtrials = 50;
        
        if (doodle.type == "fishoid"){
          do{
            doodle.targ = {
              x: doodle.x + (Math.random()-0.5)*50,
              y: 0,
              z: doodle.z + (Math.random()-0.5)*50,
            }
            doodle.targ.y = sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,doodle.targ.x,doodle.targ.z);
            trials ++;
          }while ((doodle.targ.y > waterlvl || doodle.targ.y == -1) && trials < maxtrials);
        }else{
          do{
            doodle.targ = {
              x: Clusters[doodle.cluster].center.x+(Math.random()-0.5)*0.3*CONST.SIZE.TERRAIN,
              y: 0,
              z: Clusters[doodle.cluster].center.y+(Math.random()-0.5)*0.3*CONST.SIZE.TERRAIN,
            }
            doodle.targ.y = sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,doodle.targ.x,doodle.targ.z);
            trials ++;
          }while (doodle.targ.y < waterlvl && doodle.type != "birdoid" && trials < maxtrials);
        }
        
        if (doodle.type == "fishoid" && (trials >= maxtrials)){
          trials = 0;
          do{
            doodle.targ = {
              x: (Math.random()-0.5)*CONST.SIZE.TERRAIN,
              y: 0,
              z: (Math.random()-0.5)*CONST.SIZE.TERRAIN,
            }
            doodle.targ.y = sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,doodle.targ.x,doodle.targ.z);
            trials ++;
          }while (doodle.targ.y > waterlvl && trials < maxtrials);
        }
        
        
        if (doodle.type == "birdoid"){
          doodle.targ.y += Math.random()*8+2;
        }
  
      }
      var d = Okb.vector.normalize(Okb.vector.subtract(doodle.targ,doodle));
      if (Okb.vector.magnitude(d) > 1.1){
        console.log("moving too fast!", Okb.vector.magnitude(d))
      }
      doodle.x += d.x*doodle.spd;
      doodle.z += d.z*doodle.spd;
      var gy = sharedTools.terrain.getCombinedAt(Terrain,AltTerrain,doodle.x,doodle.z)
      if (doodle.type == "birdoid"){
        doodle.y = Math.max(gy,doodle.y+d.y*doodle.spd);
      }else{
        doodle.y = gy
      }
    }
  }
  removeOverload();
   
}

async function preload(){
  await classifier.load();
}

preload().then(()=>{

  initWorld()

  setInterval(updateWorld,10);
  setInterval(dequeue,1000);
})
