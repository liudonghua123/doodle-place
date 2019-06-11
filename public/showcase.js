/*global describe io Okb newDoodle newDoodleName newAsyncPrompt doodleSerial doodleMeta doodleAnimate CONST sharedTools iconButton textButton newDropMenu*/ 

var serverData = {};
var socket = io();
var INDEX_WINDOW = 66;
var DOODLE_SIZE = 190;
var all_intervals = [];
var rowcnt = -1;

function hideFPS(){
  try{
    document.getElementById("stats-dom").style.display="none";
  }catch(e){
    setTimeout(hideFPS,100);
  }
}
hideFPS();
  
var nav_div = document.createElement("div");
nav_div.classList.add("nav");
nav_div.style.position = "sticky";
nav_div.style.top = "0px";
nav_div.style.left = "0px";
nav_div.style.width = (window.innerWidth)+"px";
nav_div.style.height = "48px";
nav_div.style.whiteSpace="nowrap";
document.body.appendChild(nav_div);

if (window.innerWidth > 650){
  var title_div = document.createElement("div");
  title_div.innerHTML = "DOODLE-PLACE DATABASE";
  title_div.style.display = "inline-block";
  title_div.style.paddingLeft = "30px";
  title_div.style.paddingRight = "30px";
  title_div.style.fontSize = "20px";
  title_div.style.color = CONST.COLOR.LIGHT;
  title_div.style.transform = "translate(0px,2px)";
  nav_div.appendChild(title_div);
}


var range_div = document.createElement("span");
nav_div.appendChild(range_div);


function updateRange(){
  range_div.innerHTML = (rowcnt-INDEX_WINDOW) + "-" + (rowcnt)
}

var cnt_div = document.createElement("span");
nav_div.appendChild(cnt_div);
cnt_div.style.paddingRight = "20px";


var refresh_btn = iconButton({name:"refresh",hint:"refresh",hintDir:"bottom",hintWidth:100});
refresh_btn.classList.add("database-op-btn");
refresh_btn.style.transform = "translate(0px,5px)";
nav_div.appendChild(refresh_btn);



var menu_btn = newDropMenu([
  {name:"enter doodle-place",onclick:function(){
    window.location.href = window.location.href.toString().replace("/database.html","")
  }},
  {name:"source code",onclick:function(){window.location.href = "https://glitch.com/edit/#!/doodle-place"}},
  {name:"download database",onclick:function(){
    window.location.href = window.location.href.toString().replace("/database.html","/download")
  }},
])
nav_div.appendChild(menu_btn);
menu_btn.classList.add("database-op-btn")
menu_btn.style.transform = "translate(0px,5px)";


var server_data_div = document.createElement("div");
server_data_div.id = "server-data";
document.body.appendChild(server_data_div);

var info_div = document.createElement("div");
var info_div_pad = 10;
info_div.style.width = (DOODLE_SIZE-info_div_pad*2)+"px";
info_div.style.height = (DOODLE_SIZE-info_div_pad*2)+"px";
info_div.style.padding = info_div_pad+"px"
info_div.style.position = "absolute";
info_div.style.pointerEvents = "none";
info_div.style.fontSize = "12px"
info_div.style.textAlign = "right";
info_div.style.display = "flex";
info_div.style.justifyContent="flex-end";
info_div.style.alignItems="flex-end";


document.body.appendChild(info_div);


refresh_btn.onclick = function(){
  socket.emit('client-update',{
    op:"request-rowcount",
  });
}


function preview(canv,ret,c){
  
  var ctx = canv.getContext("2d");
  ctx.fillStyle="rgb(10,10,10)";
  ctx.fillRect(0,0,DOODLE_SIZE,DOODLE_SIZE);

  ctx.save();
  ctx.scale(DOODLE_SIZE/CONST.SIZE.DOODLE, DOODLE_SIZE/CONST.SIZE.DOODLE)
  ctx.translate(CONST.SIZE.DOODLE/2-c.x, CONST.SIZE.DOODLE/2-c.y);
 

  // ctx.fillStyle = "none";
  // ctx.lineWidth = 1.5;
  // ctx.strokeStyle=CONST.COLOR.HINT;
  // doodleMeta.drawTree(canv,ret.nodes[0]);

  ctx.strokeStyle=CONST.COLOR.WHITE;
  ctx.fillStyle = "none";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  doodleMeta.drawSkin(canv,ret.skin);
  ctx.restore();
}

function displayData(data){
  for (var i = all_intervals.length-1; i >= 0; i--){
    clearInterval(all_intervals[i]);
    all_intervals.splice(i,1);
  }
  
  var table = document.createElement("table");
  var cols = Math.floor(window.innerWidth/DOODLE_SIZE)
  var tr;
  for (var i = 0; i < data.length; i++){
    if (i % cols == 0){
      tr = document.createElement("tr");
      table.appendChild(tr);
    }
    var td = document.createElement("td");
    
    var k = "doodledata";
    var ret = doodleSerial.deserialize(doodleSerial.decompress(data[i][k]));
    var motion = doodleAnimate.bakeMotion(ret.nodes,doodleAnimate.getParts(ret.nodes,ret.type));
    
    var canv = document.createElement("canvas");
    var ctx = canv.getContext("2d");
    canv.width = DOODLE_SIZE;
    canv.height = DOODLE_SIZE;
    td.appendChild(canv);
    tr.appendChild(td);

    var [ul,lr] = Okb.geometry.bound(ret.nodes);
    var c = Okb.vector.lerp(ul,lr,0.5);
    
    // preview(canv,ret,c);

    function f(){
      var _canv = canv;
      var _ctx = ctx;
      var _ret = ret;
      var _datai = data[i]
      var _c = c;
      var _motion = motion;
      var pid = setInterval(function(){
        doodleAnimate.test(_ret.nodes,_ret.skin,{speed:0.5,amp:0.3});
        preview(_canv,_ret,_c);
      },10);
      all_intervals.push(pid);

    }
    f();

  }
  return table;
}


function main(){
  console.log("start");
  refresh_btn.click();


  socket.on('rowcount',function(v){
    if (rowcnt == v){
      return;
    }
    cnt_div.innerHTML = " of "+v;
    rowcnt = v;
    socket.emit('client-update',{
      op:"request-database",
      range:[rowcnt-INDEX_WINDOW,rowcnt],
      timestamp:(new Date()).toString(),
    });
    updateRange();
  })
  
  socket.on('database', function(data){
    data.reverse();
    serverData = data;
    server_data_div.innerHTML = "";
    server_data_div.appendChild(displayData(serverData));
  })
}

setInterval(function(){
  console.log("refresh");
  refresh_btn.click();
},5000)

main();