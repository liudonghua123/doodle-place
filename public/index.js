/*global describe io THREE Okb makeIcon addConstantsToCss newDoodle newDoodleName newAsyncPrompt newDropMenu doodleSerial doodleRig doodleMeta doodleAnimate doodleClassify doodleMusic CONST sharedTools tooltip instruction newInfoFrame newTouchPad newTouchLook minimap*/ 

var P5 = window;
var socket = io();

var X2WORLD = 0.01;
var Y2WORLD = -0.01;
var PAUSE = false;
var MOUSELOOK = 0;

var USERNAME;
var READINESS = 0;
var HALFRES = false;


var Scene = new THREE.Scene();
var Camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, CONST.SIZE.FAR );
var LineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff} );
var Renderer = new THREE.WebGLRenderer();

var Mouse = new THREE.Vector2();
var Raycursor = {position:[0,0,0]}

var Doodles = [];
var Terrain = {};
var AltTerrain = {};
var Player = {x:0,y:0,z:0,rot:0,spd:0.1,turnspd:0.05,look:{x:0,y:0,z:0},zoom:0,zoomtarg:{x:0,y:0,z:0}};
var Clusters = [];

var FrameCount= 0;
var KeyState = {};


var nav_div = document.createElement("div");
nav_div.classList.add("nav");
nav_div.style.position = "sticky";
nav_div.style.top = "0px";
nav_div.style.left = "0px";
nav_div.style.width = (window.innerWidth)+"px";
nav_div.style.height = "48px";
document.body.appendChild(nav_div);

if (window.innerWidth > 700){
  var title_div = document.createElement("div");
  title_div.style.width = "400px";
  nav_div.appendChild(title_div);
  title_div.innerHTML = "D O O D L E - P L A C E";
  title_div.style.position = "absolute";
  title_div.style.top = "14px";
  title_div.style.left = (window.innerWidth/2-200)+"px";
  title_div.style.fontSize = "16px";
  title_div.style.textAlign = "center";
  tooltip({dom:title_div,text:"A virtual world inhabited by user-submitted, computationally-animated doodles",dir:"bottom",width:530})
}

var new_btn = document.createElement("div");
new_btn.classList.add("text-btn","noselect");
new_btn.classList.add("text-btn-big");
new_btn.style.width = "200px";
nav_div.appendChild(new_btn);
new_btn.innerHTML = "NEW DOODLE (N)";
new_btn.style.position = "absolute";
new_btn.style.top = "4px";
new_btn.style.left = Math.max(100,window.innerWidth-300)+"px";
new_btn.onclick = putDoodle;


var load_div = document.createElement("div");
load_div.style.position = "absolute";
load_div.style.left = "0px";
load_div.style.top = (window.innerHeight/2-40)+"px";
load_div.style.fontSize = "20px";
load_div.style.width = (window.innerWidth)+"px";
load_div.style.pad = "10px";
load_div.style.textAlign = "center";
document.body.appendChild(load_div);

var menu_btn = newDropMenu([
  {name:function(){return `SIGNATURE (${USERNAME.length >= 10 ? USERNAME.slice(0,7)+"..." : USERNAME})`},onclick:function(){
    newAsyncPrompt("sign your doodles",USERNAME,function(name){
      USERNAME = name;
    },function(){})
  }},
  {name:"readme", onclick:function(){
    newInfoFrame("readme.html");
    
    
    // window.location.href = window.location.href.toString().replace("index.html","")+"/readme.html"
  
  }},
  {name:"browse database",onclick:function(){
    window.location.href = window.location.href.toString().replace("index.html","")+"/database.html"
  }},
  {name:"source code",onclick:function(){window.location.href = "https://glitch.com/edit/#!/doodle-place"}},
])
nav_div.appendChild(menu_btn);
menu_btn.style.position = "absolute";
menu_btn.style.top = "4px";
menu_btn.style.left = (window.innerWidth-50)+"px";

var lbl_div = document.createElement("div");
lbl_div.style.position = "absolute";
lbl_div.classList.add("wild-doodle-lbl")
document.body.appendChild(lbl_div);


var map_canv = document.createElement("canvas");
map_canv.style.border = `1px solid ${CONST.COLOR.HINT}`;
map_canv.style.opacity = "0.5";
map_canv.style.position = "absolute";
map_canv.style.left = (window.innerWidth-CONST.SIZE.MINIMAP-15)+"px";
map_canv.style.top = "60px";
map_canv.style.borderRadius = CONST.SIZE.CHAMFER+"px";
document.body.appendChild(map_canv);
var mapbg_canv;

instruction(
  "WASD / ARROW KEYS TO NAGIVATE",
  function(){
    var start_frame = 300;
    return FrameCount > start_frame;
  },function(){
    var end_frame = 700;
    if (FrameCount > end_frame){
      return true;
    }
    return false;
  },function(){
    var keys = ["w","a","s","d","W","A","S","D","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"]
    for (var i = 0; i < keys.length; i++){
      if (KeyState[keys[i]]){
        return true;
      }
    }
    return false;
  }
);

function putDoodle(){
  if (READINESS < 2){
    alert(`The computer vision libraries are still being loaded. Please try again when the "Loading..." message disappears. This can take a while on mobile devices.`);
    return;
  }
  PAUSE ++;
  Player.zoomtarg = {x:Raycursor.position.x,y:Raycursor.position.y,z:Raycursor.position.z};
  newDoodle(function(doodle){
    newDoodleName(function(name){
      if (doodle.skin.length < CONST.SIZE.MINPOINTS){
        alert("INVALID DOODLE: EMPTY / TOO SIMPLE");
        PAUSE --;
        return;
      }
      var data = doodleSerial.compress(doodleSerial.serialize(doodle));
      console.log(name);
      console.log(doodle)
      console.log(data);
      socket.emit('client-update',{
        op:"submit",userid:USERNAME,
        doodlename:name,
        doodledata:data,
        timestamp:(new Date()).toString(),
        x: Raycursor.position.x,
        y: Raycursor.position.y,
        z: Raycursor.position.z,
      });
      PAUSE --;
      var t = 20;
      for (var i = 0; i < t; i++){
        function f(){
          var _i = i
          var x = _i/(t-1);
          setTimeout(function(){Player.zoom = Math.pow(Math.sin(x*Math.PI),0.5)*0.7},_i*50)
        }
        f();             
      }
    })
  },function(){PAUSE --})
}



socket.on('connect', function(){
  USERNAME = socket.id;
  READINESS ++;
});

doodleRig.checkOpenCVReady(function(){
  READINESS ++;
})


socket.on('world', function(data){
  for (var i = 0; i < data.length; i++){

    var id = data[i]["id"];
    var doodle = sharedTools.array.findById(Doodles,id)
    if (!doodle){
      var obj = new THREE.Group();
      obj.position.set(data[i].x,data[i].y,data[i].z);
      Scene.add( obj );
      Doodles.push({
        id:id,
        name:"",
        nodes:[],
        skin:[],
        motion:[],
        obj:obj,
        yoff: 0,
        amp:1,
        stun:0,
        scale:data[i].scale,
        dest:{x:data[i].x,y:data[i].y,z:data[i].z},
        info:{userid:"", timestamp:""}
      })
      socket.emit('client-update',{
        op:"request-datum",userid:USERNAME,
        uuid:id,
        timestamp:(new Date()).toString(),
      });
    }else{
      doodle.dest = {x:data[i].x,y:data[i].y,z:data[i].z}
      doodle.stun = data[i].stun;
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
    return;
  }
  var ret = doodleSerial.deserialize(doodleSerial.decompress(data["doodledata"]));
  
  doodle.name = data["doodlename"];
  doodle.skin = ret.skin;
  doodle.type = ret.type;
  doodle.nodes = ret.nodes;
  doodle.motion = doodleAnimate.bakeMotion(ret.nodes,doodleAnimate.getParts(ret.nodes,ret.type));
  
  doodle.info.userid = data["userid"];
  doodle.info.timestamp = data["timestamp"];
  
  var skin = doodle.skin;
  var obj = doodle.obj;
  while (obj.children.length){
    obj.remove(obj.children[0]);
  }
  for (var j = 0; j < skin.length; j+=1){
    if (!skin[j].connect){
      var geometry = new THREE.Geometry();
      var line = new THREE.Line( geometry, LineMaterial );
      obj.add(line);
    }
    obj.children[obj.children.length-1].geometry.vertices.push(new THREE.Vector3(skin[j].x*X2WORLD, skin[j].y*Y2WORLD,0));
  }
})

function processTerrain(trn, data, size, x, z){
  trn.data = data;
  var geometry = new THREE.Geometry();
  var w = data.length
  for (var i = 0; i < w; i++){
    for (var j = 0; j < w; j++){
      geometry.vertices.push(
        new THREE.Vector3( (j-w/2)*CONST.SIZE.TERRAINGRID,  data[i][j], (i-w/2)*CONST.SIZE.TERRAINGRID ),
      );
      if (i != 0 && j != 0){
        geometry.faces.push( new THREE.Face3(  i*w+j-1, i*w+j, (i-1)*w+j ) );
        geometry.faces.push( new THREE.Face3( (i-1)*w+j, (i-1)*w+j-1, i*w+j-1 ) );
      }
    }
  }

  var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { wireframe:true, color: 0x444444, transparent:false, opacity: 0.1} ) );
  var mesh_back = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x000000} ) );

  var plane = new THREE.Mesh( new THREE.PlaneGeometry( size+2, size+2), new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} ) );
  plane.rotation.set(Math.PI/2,0,0);
  plane.position.set(x,0.1,z);
  trn.obj = mesh;
  mesh.position.set(x,0,z)
  mesh_back.position.set(x,-0.02,z)
  Scene.add( plane );
  Scene.add( mesh );
  Scene.add( mesh_back );  

}

socket.on('terrain', function(data){
  processTerrain(Terrain,data,CONST.SIZE.TERRAIN,0,0);

  mapbg_canv = minimap.generate(data,CONST.SIZE.MINIMAP);
  map_canv.width = mapbg_canv.width;
  map_canv.height = mapbg_canv.height;
})

socket.on('altterrain', function(data){
  processTerrain(AltTerrain,data,CONST.SIZE.ALTTERRAIN,CONST.SIZE.ALTTERRAINX,CONST.SIZE.ALTTERRAINZ);
});


socket.on('deathrattle',function(data){
  var id = data.id;
  var doodle = sharedTools.array.findById(Doodles,id);
  if (!doodle){
    return;
  }
  console.log("deleting overload: ",doodle.id);
  Scene.remove(doodle.obj);
  Doodles.splice(Doodles.indexOf(doodle),1);
})

socket.on('clusters',function(data){
  Clusters = data;
  for (var i = 0; i < Clusters.length; i++){
    
    Clusters[i].samples = Clusters[i].samples.map((x)=>
      doodleSerial.deserialize(doodleSerial.decompress(x))
    )
  }
})


function space2screen(v){

  var vec = new THREE.Vector3(v.x,v.y,v.z);
  var canvas = Renderer.domElement;
  vec.project( Camera );

  vec.x = Math.round( (   vec.x + 1 ) * canvas.width  / 2 );
  vec.y = Math.round( ( - vec.y + 1 ) * canvas.height / 2 );
  vec.z = 0; 
  
  return vec;
}

function updateDoodleModels(){
  for (var i = 0; i < Doodles.length; i++){
    var doodle = Doodles[i];
    var skin = Doodles[i].skin;
    var obj = Doodles[i].obj;
    
    var d = Okb.vector.distance(doodle.dest,Player)
    if (d > CONST.SIZE.FAR){
      continue
    }
    
    var idx = -1;
    var jdx = 0;
    var bd = Okb.geometry.bound(skin);
    if (-CONST.SIZE.DOODLE <= bd[1].y && bd[1].y < CONST.SIZE.DOODLE*2){
      doodle.yoff = Okb.math.lerp(doodle.yoff,bd[1].y*Y2WORLD*doodle.scale-0.2,0.2);
    }

    for (var j = 0; j < skin.length; j+=1){
      if (!skin[j].connect){
        if (idx != -1 && d < CONST.SIZE.FAR*0.3){
          obj.children[idx].geometry.computeBoundingSphere();
        }
        idx ++;
        jdx = j;
        obj.children[idx].geometry.verticesNeedUpdate  = true;
      }
      obj.children[idx].geometry.vertices[j-jdx] = new THREE.Vector3(skin[j].x*X2WORLD*doodle.scale, +skin[j].y*Y2WORLD*doodle.scale-doodle.yoff,0);
    }
    if (obj.children[idx] && d < CONST.SIZE.FAR*0.3){
      obj.children[idx].geometry.computeBoundingSphere();
    }
    obj.lookAt(Player.x,obj.position.y,Player.z);
  }
}

function updateDoodleLabel(){
  lbl_div.innerHTML = "";
  var md = 7;
  var mp;
  for (var i = 0; i < Doodles.length; i++){
    var doodle = Doodles[i]
    var d = Okb.vector.distance(doodle.obj.position,Raycursor.position)
    if (d < md){
      md = d;
      mp = doodle
    }
  }
  if (mp && mp.name){
    var p = space2screen(mp.obj.position);
    // console.log(doodle.name,p);
    lbl_div.style.left = p.x*(1+HALFRES) + "px";
    lbl_div.style.top = (p.y*(1+HALFRES) +20)+ "px";
    
    var enddiv = "</div>";
    var br = "<br>"
    lbl_div.innerHTML = `<div class="wild-doodle-title">${mp.name}${enddiv}by ${mp.info.userid.length > 16? mp.info.userid.slice(0,5):mp.info.userid}${br}${sharedTools.time.format(mp.info.timestamp)}${br}${sharedTools.time.describeTimeZone(mp.info.timestamp)}`;
    
    // var strokes = [[]];for (var i = 0; i < mp.skin.length; i++){if (!mp.skin[i].connect){strokes.push([]);}strokes[strokes.length-1].push([mp.skin[i].x,mp.skin[i].y]);}
    // console.log(mp.name,mp.skin.length,doodleClassify.predict(strokes));
  }
  
}


function initRenderer(half){
  if (half){
    Renderer.setSize( window.innerWidth/2, window.innerHeight/2 );
    document.body.appendChild( Renderer.domElement );
    Renderer.domElement.style.position = "absolute";
    Renderer.domElement.style.left = "0px";
    Renderer.domElement.style.top = "0px";
    Renderer.domElement.style.zIndex = -1;
    Renderer.domElement.style.width = window.innerWidth + "px";
    Renderer.domElement.style.height = window.innerHeight + "px";
    Renderer.domElement.style.imageRendering = "pixelated"; 
  }else{
    Renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( Renderer.domElement );
    Renderer.domElement.style.position = "absolute";
    Renderer.domElement.style.left = "0px";
    Renderer.domElement.style.top = "0px";
    Renderer.domElement.style.zIndex = -1;
  } 
}


var geolines_near = 5
var geolines_far = CONST.SIZE.FAR
var geolines_forw = 5
var geolines_side = 40;
var geolines_steps = 200

var GeoLines = [];
function initGeoLines(){
  for (var i = geolines_near; i < geolines_far; i+=geolines_forw){
    var geometry = new THREE.Geometry();
    for (var j = 0; j < geolines_steps; j++){
      geometry.vertices.push(new THREE.Vector3(10*i,10*j,10));
    }
    var line = new THREE.Line( geometry, LineMaterial );
    GeoLines.push(line);
    Scene.add(line);
  }
}

function updateGeoLines(){
  if (Terrain.data){
    var cosrot = Math.cos(Player.rot);
    var sinrot = Math.sin(Player.rot);
    var cosrot_l = Math.cos(Player.rot-Math.PI/2);
    var sinrot_l = Math.sin(Player.rot-Math.PI/2);
    var cosrot_r = Math.cos(Player.rot+Math.PI/2);
    var sinrot_r = Math.sin(Player.rot+Math.PI/2);
    
    var mat = []
    
    for (var d = geolines_near; d < geolines_far; d+=geolines_forw){
      mat.push([]);
      var p0 = [Player.x + cosrot * d, Player.z + sinrot * d]
      var p1 = [p0.x + cosrot_l * geolines_side, p0.y + sinrot_l * geolines_side]
      var p2 = [p0.x + cosrot_r * geolines_side, p0.y + sinrot_r * geolines_side]
      
      for (var i = 0; i < geolines_steps; i++){
        var p = Okb.vector.lerp(p1,p2,i/geolines_steps);
        // p.x = Math.floor(p.x);
        // p.y = Math.floor(p.y);
        //console.log(p)
        var y = sharedTools.terrain.getCombinedAt(Terrain.data,AltTerrain.data,p.x,p.y);
        mat[mat.length-1].push([p.x,y+0.3,p.y]);
      }
    }

    
    for (var i = 0; i < GeoLines.length; i++){
      for (var j = 0; j < geolines_steps; j++){
        // console.log(mat[i][j].y)
        try{
          var p = Okb.vector.lerp(GeoLines[i].geometry.vertices[j], mat[i][j],0.2)
          GeoLines[i].geometry.vertices[j] = new THREE.Vector3(p.x,p.y,p.z);
        }catch(e){}
      }
      GeoLines[i].geometry.verticesNeedUpdate  = true
    }
  }
}



function setup(){
  load_div.style.pointerEvents = "none";
  console.log("start");
  
  var w = Math.min(window.innerWidth,640);
  var h = w * window.innerHeight / window.innerWidth;
  
  initRenderer(HALFRES);
  initGeoLines();

  
  Scene.fog = new THREE.Fog(0, 0.0025, CONST.SIZE.FAR);

  Camera.position.set( 0, 0, 0 );
  Camera.lookAt( 0, 0, 1 );
  
  
  if (CONST.ENV.ISMOBILE){
    var pad = newTouchPad(Player);
    newTouchLook(Player,Renderer.domElement,pad().dom)
  }
  
  
  //Raycursor = new THREE.Mesh( new THREE.BoxGeometry( 0.2, 0.2, 0.2 ), new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
  var geometry = new THREE.Geometry();
  geometry.vertices.push( new THREE.Vector3(0,0,0));
  Raycursor = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0xffffff,size:6,sizeAttenuation:false } ));
  Scene.add( Raycursor );
  
  
  doodleMusic.setup(window,20,0);
  
  socket.emit('client-update',{
    op:"request-terrain",
    timestamp:(new Date()).toString(),
  });
  socket.emit('client-update',{
    op:"request-altterrain",
    timestamp:(new Date()).toString(),
  });
  socket.emit('client-update',{
    op:"request-clusters",
    timestamp:(new Date()).toString(),
  });
  
  draw();
}

socket.on("dequeue",setup);
socket.on("queue",function(data){
  load_div.innerHTML = "Please wait patiently while we try to get you in -- <br> You are <b>"+(data.position+1)+"/"+data.total+"</b> on the queue! <br> (or try alternative servers <a href='https://doodle-place-server-2.glitch.me'>here</a> and <a href='https://doodle-place-server-3.glitch.me'>here</a>)";
})



var PlayerControls = {
  forward:{keys:["W","w","ArrowUp"],on:function(){
    Player.x += Math.cos(Player.rot)*Player.spd;
    Player.z += Math.sin(Player.rot)*Player.spd;
  }},
  backward:{keys:["S","s","ArrowDown"],on:function(){
    Player.x -= Math.cos(Player.rot)*Player.spd;
    Player.z -= Math.sin(Player.rot)*Player.spd;
  }},
  turnleft:{keys:["A","a","ArrowLeft"],on:function(){
    Player.rot -= Player.turnspd;
  }},
  turnright:{keys:["D","d","ArrowRight"],on:function(){
    Player.rot += Player.turnspd;
  }},

}



window.addEventListener('keydown',function(e){
  // console.log(e.key)
  KeyState[e.key] = true;
  if (e.key == "n" && !document.getElementsByClassName("editor-prompt").length){
    putDoodle();
  }
},true);    

window.addEventListener('keyup',function(e){
    KeyState[e.key] = false;
},true);
window.addEventListener( 'mousemove', function ( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components

	Mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	Mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}, false );

function updatePlayer(){
  for (var c in PlayerControls){
    for (var k in KeyState ){
      if (KeyState[k] != true){
        continue;
      }
      if (PlayerControls[c].keys.includes(k)){
        PlayerControls[c].on();
        break;
      }
    }
  }
  
  
  if (Terrain.data && AltTerrain.data){
    Player.y = sharedTools.terrain.getCombinedAt(Terrain.data,AltTerrain.data,Player.x,Player.z)+1.5;
    var d = [Math.cos(Player.rot+Mouse.x*0.2*MOUSELOOK)*4,0,Math.sin(Player.rot+Mouse.x*0.2*MOUSELOOK)*4]
    var lookx = Player.x + d.x;
    var lookz = Player.z + d.z;
    var looky = sharedTools.terrain.getCombinedAt(Terrain.data,AltTerrain.data,lookx,lookz)+Mouse.y*10*MOUSELOOK-10;
    looky = Math.max(Player.y,looky);
    Player.look = Okb.vector.lerp(Okb.vector.add(Player.look,Okb.vector.scale(d,Player.spd+1)),[lookx,looky,lookz],0.1)
    
    var ray = Player;
    var lray = Okb.vector.add(ray,Okb.vector.scale(d,0.1));
    Raycursor.material.color.set(0x222222)
    var done = false
    for (var j = 0; j < 20; j++){
      //console.log(j);
      for (var i = 5; i < 30; i+=2){
        ray = Okb.vector.lerp(Player,Okb.vector.add(Player.look,[0,-10-j*2,0]),0.01*i);
        if (sharedTools.terrain.getCombinedAt(Terrain.data,AltTerrain.data,ray.x,ray.z) > ray.y){
          Raycursor.material.color.set(0xffffff)
          done = true;
          break;
        }
        lray = ray;
      }
      if (done){
        break;
      }
    }
    lray = Okb.vector.lerp(Raycursor.position,lray,0.1);
    Raycursor.position.set(lray.x,lray.y,lray.z)
    
    var p = Okb.vector.lerp(Camera.position, Okb.vector.lerp(Player,Player.zoomtarg,Player.zoom), 0.1)
    Camera.position.set( p.x, p.y, p.z );
    Camera.lookAt( Player.look.x,Player.look.y,Player.look.z );
  }

  
  
}


function draw(){
  requestAnimationFrame( draw );
  
  
  if (READINESS >= 2){
    load_div.innerHTML = ""
    
  }else{
    if (load_div.innerHTML == ""){
      load_div.innerHTML = "L O A D I N G<br>";
    }else if (load_div.innerHTML.length < 70){
      load_div.innerHTML += " ."
    }
  }
  
  if (PAUSE){
    return;
  }
  
  
  socket.emit('client-update',{
    op:"request-world",position:{x:Player.x,y:Player.y,z:Player.z},
    timestamp:(new Date()).toString(),
  });

  for (var i = Doodles.length-1; i >= 0; i--){
    var doodle = Doodles[i];
    var p = Okb.vector.lerp(doodle.obj.position,doodle.dest,0.2)
    var maxspd = 0.5;
    if (Okb.vector.distance(doodle.obj.position,p) > maxspd){
      // console.log("moving too fast!!")
      var v = Okb.vector.normalize(Okb.vector.subtract(p,doodle.obj.position));
      var x = doodle.obj.position.x + v.x*maxspd;
      var y = doodle.obj.position.y + v.y*maxspd;
      var z = doodle.obj.position.z + v.z*maxspd;
      if (Terrain.data){
        var y = Math.max(y,sharedTools.terrain.getCombinedAt(Terrain.data,AltTerrain.data,x,z));
      }
      doodle.obj.position.set(x,y,z);
    }else{
      doodle.obj.position.set(p.x,p.y,p.z);
    }
    var d = Okb.vector.distance(doodle.obj.position,Player)
    
    if (doodle.type != "plantoid"){
      if (doodle.stun == 0){
        doodle.amp = Okb.math.lerp(doodle.amp,1,0.05)
      }else{
        doodle.amp = Okb.math.lerp(doodle.amp,0.2,0.05)
      }
    }

    if (d < CONST.SIZE.FAR){
      if (CONST.ANIMMODE == 0){
        doodleAnimate.test(doodle.nodes,doodle.skin,{amp:doodle.amp});
      }else if (CONST.ANIMMODE == 1){
        doodleAnimate.animateMotion(doodle.nodes,doodle.skin,doodle.motion,{amp:doodle.amp});
      }else if (CONST.ANIMMODE == 2){
        doodleAnimate.dance(doodle.nodes,doodle.skin,doodleMusic);
      }
    }
    if (d > CONST.SIZE.FAR*2){
      Scene.remove(doodle.obj);
      Doodles.splice(i,1);
    }
  }
  
  

  
  updatePlayer();
  
  updateGeoLines();
  
  updateDoodleModels();
  
  updateDoodleLabel();
  
  

  Renderer.render( Scene, Camera );
  
  
  if (mapbg_canv){
    var ctx = map_canv.getContext('2d');
    ctx.clearRect(0,0,map_canv.width,map_canv.height);
    ctx.drawImage(mapbg_canv,0,0);
    minimap.plot(map_canv,[Object.assign({style:"triangle",size:16},Player)].concat(
      // Doodles.map((x)=>(Object.assign({style:"dot"},x.dest)))
    ))
    var rect = map_canv.getBoundingClientRect();
    var mmx = -rect.x + (Mouse.x+1)/2 * window.innerWidth;
    var mmy = -rect.y + (-Mouse.y+1)/2 * window.innerHeight;
    minimap.plotClusters(map_canv,Clusters,[mmx,mmy]);
  }

  doodleMusic.update(window);

  
  FrameCount ++;
}
