/*global describe io Okb newDoodle newDoodleName newAsyncPrompt doodleRig doodleSerial doodleMeta doodleAnimate CONST sharedTools iconButton textButton newDropMenu*/ 

var serverData = {};
var socket = io();
var INDEX_WINDOW = 24;
var INDEX_BEGIN = 0;
var ROW_COUNT = undefined;
var all_intervals = [];

function hideFPS(){
  try{
    document.getElementById("stats-dom").style.display="none";
  }catch(e){
    setTimeout(hideFPS,100);
  }
}
hideFPS();
  
var load_div = document.createElement("div");
load_div.style.position = "absolute";
load_div.style.left = "0px";
load_div.style.top = (window.innerHeight/2-40)+"px";
load_div.style.fontSize = "20px";
load_div.style.width = (window.innerWidth)+"px";
load_div.style.pad = "10px";
load_div.style.textAlign = "center";
document.body.appendChild(load_div);

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

var prev_btn = iconButton({name:"left",hint:"previous page",hintDir:"bottom",hintWidth:100});
prev_btn.classList.add("database-op-btn");
prev_btn.style.transform = "translate(0px,5px)";
nav_div.appendChild(prev_btn);

var range_div = document.createElement("span");
nav_div.appendChild(range_div);
updateRange();

function updateRange(){
  range_div.innerHTML = INDEX_BEGIN + "-" + (INDEX_BEGIN+INDEX_WINDOW)
}

var cnt_div = document.createElement("span");
nav_div.appendChild(cnt_div);

var next_btn = iconButton({name:"right",hint:"next page",hintDir:"bottom",hintWidth:100});
next_btn.classList.add("database-op-btn")
next_btn.style.transform = "translate(0px,5px)";
nav_div.appendChild(next_btn);


var refresh_btn = iconButton({name:"refresh",hint:"refresh",hintDir:"bottom",hintWidth:100});
refresh_btn.classList.add("database-op-btn");
refresh_btn.style.transform = "translate(0px,5px)";
nav_div.appendChild(refresh_btn);


function putDoodle(){
  newDoodle(function(doodle){
    newDoodleName(function(name){
      if (doodle.skin.length < CONST.SIZE.MINPOINTS){
        alert("INVALID DOODLE: EMPTY / TOO SIMPLE");
        return;
      }
      var data = doodleSerial.compress(doodleSerial.serialize(doodle));
      console.log(name);
      console.log(doodle)
      console.log(data);
      socket.emit('client-update',{
        op:"submit",userid:socket.id,
        doodlename:name,
        doodledata:data,
        timestamp:(new Date()).toString(),
      });
    })
  })
}


var new_btn = iconButton({name:"add",hint:"new doodle",hintDir:"bottom",hintWidth:100});
new_btn.classList.add("database-op-btn");
new_btn.style.transform = "translate(0px,5px)";
nav_div.appendChild(new_btn);
new_btn.onclick = putDoodle;

var menu_btn = newDropMenu([
  {name:"new doodle",onclick:putDoodle},
  {name:"enter doodle-place",onclick:function(){
    window.location.href = window.location.href.toString().replace("/database.html","")
  }},
  {name:"source code",onclick:function(){window.location.href = "https://glitch.com/edit/#!/doodle-place"}},
  {name:"download database",onclick:function(){
    window.location.href = window.location.href.toString().replace("/database.html","/download")
  }},
  {name:"admin",onclick:function(){
    newAsyncPrompt("Enter Password","*",function(password){
      newAsyncPrompt("Enter Command","",function(command){
        socket.emit('client-update',{
          op:"admin",userid:socket.id,password:password,command:command,
          timestamp:(new Date()).toString(),
        });

      },function(){})
    },function(){});
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
info_div.style.width = (CONST.SIZE.DOODLE-info_div_pad*2)+"px";
info_div.style.height = (CONST.SIZE.DOODLE-info_div_pad*2)+"px";
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
  for (var i = all_intervals.length-1; i >= 0; i--){
    clearInterval(all_intervals[i]);
    all_intervals.splice(i,1);
  }
  socket.emit('client-update',{
    op:"request-rowcount",
  });
  
  socket.emit('client-update',{
    op:"request-database",
    range:[ROW_COUNT-INDEX_BEGIN-INDEX_WINDOW,ROW_COUNT-INDEX_BEGIN],
    timestamp:(new Date()).toString(),
  });
}

prev_btn.onclick = function(){
  INDEX_BEGIN = Math.max(0,INDEX_BEGIN-INDEX_WINDOW);
  updateRange();
  refresh_btn.click();
}
next_btn.onclick = function(){
  INDEX_BEGIN = INDEX_BEGIN+INDEX_WINDOW;
  updateRange();
  refresh_btn.click();
}


function preview(canv,ret,c){
  
  var ctx = canv.getContext("2d");
  ctx.fillStyle=CONST.COLOR.DARK;
  ctx.fillRect(0,0,CONST.SIZE.DOODLE,CONST.SIZE.DOODLE);

  ctx.save();
  ctx.translate(CONST.SIZE.DOODLE/2-c.x,CONST.SIZE.DOODLE/2-c.y);

  ctx.fillStyle = "none";
  ctx.lineWidth = 1.5;
  ctx.strokeStyle=CONST.COLOR.HINT;
  doodleMeta.drawTree(canv,ret.nodes[0]);

  ctx.strokeStyle=CONST.COLOR.WHITE;
  ctx.fillStyle = "none";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  doodleMeta.drawSkin(canv,ret.skin);
  ctx.restore();
}

function rerig(doodledata){
  var doo = doodleSerial.deserialize(doodleSerial.decompress(doodledata));
  
  var [ul,lr] = Okb.geometry.bound([].concat(...doo.strokes));
  var c = Okb.vector.lerp(ul,lr,0.5);
  for (var i = 0; i < doo.strokes.length; i++){
    for (var j = 0; j < doo.strokes[i].length; j++){
      doo.strokes[i][j].x += CONST.SIZE.DOODLE/2-c.x;
      doo.strokes[i][j].y += CONST.SIZE.DOODLE/2-c.y;
    }
  }
  
  var center = {
    x: CONST.SIZE.DOODLE/2,
    y: CONST.SIZE.DOODLE/2,
    types:["node","root"],
  }
  if (doo.type == "humanoid"){
    center.y = CONST.SIZE.DOODLE * 0.6
  }else if (doo.type == "plantoid"){
    center.y = CONST.SIZE.DOODLE;
    center.types.push("leaf");
  }else if (doo.type == "fishoid"){
    center.types.push("edge");
  }

  var ret = doodleRig.process(doo.strokes,{center:center});
  doo.nodes = ret.nodes;
  doo.skin = ret.skin;
  console.log(doo);
  return doodleSerial.compress(doodleSerial.serialize(doo));
}

function displayData(data){
  var table = document.createElement("table");
  var cols = Math.floor(window.innerWidth/CONST.SIZE.DOODLE)
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
    canv.width = CONST.SIZE.DOODLE;
    canv.height = CONST.SIZE.DOODLE;
    td.appendChild(canv);
    tr.appendChild(td);

    var [ul,lr] = Okb.geometry.bound(ret.nodes);
    var c = Okb.vector.lerp(ul,lr,0.5);
    
    preview(canv,ret,c);

    function f(){
      var _canv = canv;
      var _ctx = ctx;
      var _ret = ret;
      var _datai = data[i]
      var _c = c;
      var _motion = motion;
      var pid;
      _canv.onmouseenter = _canv.ontouchstart = function(e){
        pid = setInterval(function(){
          if (CONST.ANIMMODE){
            doodleAnimate.test(_ret.nodes,_ret.skin);
          }else{
            doodleAnimate.animateMotion(_ret.nodes,_ret.skin,_motion);
          }
          preview(_canv,_ret,_c);
          var scrolltop = document.documentElement.scrollTop || document.body.scrollTop
          var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft
          var rect = _canv.getBoundingClientRect();
          var br = "<br>"
          var b0 = "<b>"
          var b1 = "</b>"

          info_div.innerHTML = "";
          var span = document.createElement("span");
          span.innerHTML += `${b0}${_datai.doodlename}${b1} by ${_datai.userid.length > 16? _datai.userid.slice(0,5):_datai.userid}${br}from ${sharedTools.time.describeTimeZone(_datai.timestamp)} on ${sharedTools.time.format(_datai.timestamp)}`
          if (_datai.appropriate == "0"){
            span.innerHTML += "<br>(INAPPROPRIATE)";
            span.style.color = "red";
          }
          
          info_div.appendChild(span);
          
          var del_btn = iconButton({name:"close",hint:"delete",hintDir:"right",hintWidth:100});
          info_div.appendChild(del_btn);
          del_btn.style.position = "absolute";
          del_btn.style.left= "0px"
          del_btn.style.top= "0px";
          del_btn.style.pointerEvents="all";
          
          del_btn.onclick = function(){
            var uuid = _datai.uuid
            newAsyncPrompt("Enter Password","*",function(password){
              socket.emit('client-update',{
                op:"admin",userid:socket.id,password:password,
                command:`DELETE FROM Doodles WHERE uuid='${uuid}';`,
                timestamp:(new Date()).toString(),
              });
            },function(){})
          }

          var flag_btn = iconButton({name:"flag",hint:"inappropriate",hintDir:"right",hintWidth:100});
          info_div.appendChild(flag_btn);
          flag_btn.style.position = "absolute";
          flag_btn.style.left= "0px"
          flag_btn.style.top= "40px";
          flag_btn.style.pointerEvents="all";
          
          
          flag_btn.onclick = function(){
            var val = _datai.appropriate == "1" ? "0" : "1";
            var uuid = _datai.uuid
            newAsyncPrompt("Enter Password","*",function(password){
              socket.emit('client-update',{
                op:"admin",userid:socket.id,password:password,
                command:`UPDATE Doodles SET appropriate = '${val}' WHERE uuid='${uuid}';`,
                timestamp:(new Date()).toString(),
              });
            },function(){})
          }

          
          var fix_btn = iconButton({name:"nodes",hint:"re-rig",hintDir:"right",hintWidth:100});
          info_div.appendChild(fix_btn);
          fix_btn.style.position = "absolute";
          fix_btn.style.left= "0px"
          fix_btn.style.top= "80px";
          fix_btn.style.pointerEvents="all";
          
          
          fix_btn.onclick = function(){
            
            var uuid = _datai.uuid
            var doodledata = rerig(_datai.doodledata);
            
            newAsyncPrompt("Enter Password","*",function(password){
              socket.emit('client-update',{
                op:"admin",userid:socket.id,password:password,
                command:`UPDATE Doodles SET doodledata = '${doodledata}' WHERE uuid='${uuid}';`,
                timestamp:(new Date()).toString(),
              });
            },function(){})
          }
          
          
          info_div.style.left = rect.left+scrollleft + "px";
          info_div.style.top = rect.top+scrolltop + "px";
        },10);
        all_intervals.push(pid);
        e.preventDefault();
      }
      _canv.onmouseleave = _canv.ontouchend = function(e){
        clearInterval(pid);
        all_intervals.splice(all_intervals.indexOf(pid),1);
        e.preventDefault();
      }
    }
    f();

  }
  return table;
}


function main(){
  load_div.style.pointerEvents = "none";
  load_div.innerHTML=""
  console.log("start");
  
  socket.emit('client-update',{
    op:"request-rowcount",
  });
  
  function wait_for_rowcount(){
    console.log(ROW_COUNT);
    if (ROW_COUNT != undefined){
      refresh_btn.click();
      return;
    }
    setTimeout(wait_for_rowcount,100);
  }
  wait_for_rowcount();
  
  socket.on('submit-success', function(){
    //refresh_btn.click();
  })
  
  socket.on('rowcount',function(v){
    cnt_div.innerHTML = " of "+v;
    ROW_COUNT = v;
    // refresh_btn.click();
  })
  
  socket.on('database', function(data){
    data.reverse();
    serverData = data;
    server_data_div.innerHTML = "";
    server_data_div.appendChild(displayData(serverData));
  })
}


socket.on("dequeue",main);
socket.on("queue",function(data){
  load_div.innerHTML = "Please wait patiently while we try to get you in -- <br> You are <b>"+(data.position+1)+"/"+data.total+"</b> on the queue! <br> (or try alternative servers <a href='https://doodle-place-server-2.glitch.me'>here</a> and <a href='https://doodle-place-server-3.glitch.me'>here</a>)";
})