/*global describe io THREE Okb makeIcon addConstantsToCss newDoodle newDoodleName newAsyncPrompt newDropMenu doodleSerial doodleRig doodleMeta doodleAnimate doodleClassify doodleMusic CONST sharedTools tooltip instruction newInfoFrame newTouchPad newTouchLook minimap*/ 

var socket = io();


var Doodles = [];
var Terrain = {};
var AltTerrain = {};

var FrameCount= 0;
var mapsize = 500

var map_canv = document.createElement("canvas");
map_canv.style.border = `1px solid ${CONST.COLOR.HINT}`;
map_canv.style.opacity = "0.5";
map_canv.style.position = "absolute";
map_canv.style.left = (window.innerWidth-mapsize-15)+"px";
map_canv.style.top = "60px";
map_canv.style.borderRadius = CONST.SIZE.CHAMFER+"px";
document.body.appendChild(map_canv);
var mapbg_canv;

var altmap_canv = document.createElement("canvas");
altmap_canv.style.border = `1px solid ${CONST.COLOR.HINT}`;
altmap_canv.style.opacity = "0.5";
altmap_canv.style.position = "absolute";
altmap_canv.style.left = 0+"px";
altmap_canv.style.top = "60px";
altmap_canv.style.borderRadius = CONST.SIZE.CHAMFER+"px";
document.body.appendChild(altmap_canv);
var altmapbg_canv;



socket.on('world', function(data){
  for (var i = 0; i < data.length; i++){

    var id = data[i]["id"];
    var doodle = sharedTools.array.findById(Doodles,id)
    if (!doodle){
      Doodles.push({
        id:id,
        dest:{},
        cluster:undefined,
      })
    }else{
      doodle.dest = {x:data[i].x,y:data[i].y,z:data[i].z}
      doodle.cluster = data[i].cluster;
    }
  }
})

socket.on('datum', function(data){
  if (data == null){
    return;
  }
  var doodle = sharedTools.array.findById(Doodles,data.uuid);
  if (!doodle){
    console.log("unwanted data received ", data.uuid);
  }
  var ret = doodleSerial.deserialize(doodleSerial.decompress(data["doodledata"]));
  
  doodle.name = data["doodlename"];
  doodle.skin = ret.skin;
  doodle.type = ret.type;
  doodle.nodes = ret.nodes;

})


socket.on('terrain', function(data){
  Terrain.data = data;

  mapbg_canv = minimap.generate(data,mapsize);
  map_canv.width = mapbg_canv.width;
  map_canv.height = mapbg_canv.height;
})

socket.on('altterrain', function(data){
  AltTerrain.data = data;

  altmapbg_canv = minimap.generate(data,mapsize,CONST.SIZE.ALTTERRAIN);
  altmap_canv.width = altmapbg_canv.width;
  altmap_canv.height = altmapbg_canv.height;
})

function setup(){
  console.log("start");

  
  socket.emit('client-update',{
    op:"request-terrain",
    timestamp:(new Date()).toString(),
  });
  
  socket.emit('client-update',{
    op:"request-altterrain",
    timestamp:(new Date()).toString(),
  });
  
  
}

setup();
draw();




function draw(){
  requestAnimationFrame( draw );
  
  
  socket.emit('client-update',{
    op:"request-world-inf",
    timestamp:(new Date()).toString(),
  });
   
  if (mapbg_canv){
    var ctx = map_canv.getContext('2d');
    ctx.clearRect(0,0,map_canv.width,map_canv.height);
    ctx.drawImage(mapbg_canv,0,0);
    minimap.plot(map_canv,
      Doodles.map((x)=>(Object.assign({style:"box",size:2,color:["red","green","blue","magenta","orange","cyan","yellow"][x.cluster]},x.dest)))
    )
  }
  
  if (altmapbg_canv){
    var ctx = altmap_canv.getContext('2d');
    ctx.clearRect(0,0,altmap_canv.width,altmap_canv.height);
    ctx.drawImage(altmapbg_canv,0,0);
    minimap.plot(altmap_canv,
      Doodles.map((x)=>(Object.assign({style:"box",size:2,color:["red","green","blue","magenta","orange","cyan","yellow"][x.cluster]},Okb.vector.subtract(x.dest,[CONST.SIZE.ALTTERRAINX,0,CONST.SIZE.ALTTERRAINZ])))),
      CONST.SIZE.ALTTERRAIN
    )
  }


  FrameCount ++;
}
