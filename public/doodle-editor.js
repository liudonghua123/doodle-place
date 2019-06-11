/* global describe Okb doodleRig doodleMeta doodleAnimate addConstantsToCss doodleSerial doodleClassify makeIcon CONST*/
doodleClassify.load();

doodleRig.setup({
  width:CONST.SIZE.DOODLE,
  height:CONST.SIZE.DOODLE,
  fat:15,
  bleed:5,
})

var TOOLTIPDIV = document.createElement("div");
TOOLTIPDIV.id = "tooltip";
TOOLTIPDIV.classList.add("tooltip");
document.body.appendChild(TOOLTIPDIV);

var LAZYPROCESS = true;

function tooltip(tabs){
  if (CONST.ENV.ISMOBILE){
    return;
  }
  var elt = tabs.dom;
  var f1 = elt.onmouseenter
  var f2 = elt.onmouseleave
  var hint = TOOLTIPDIV;
  
  elt.onmouseenter = function(){

    if (f1){f1()};
    var rect = elt.getBoundingClientRect();
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft
    var left = scrollleft + rect.left
    var top = scrolltop +rect.top
    var bottom = scrolltop + rect.bottom
    var right = scrollleft + rect.right;
    
    hint.style.display = "block";
    var w = (tabs.width || 70)
    var d = tabs.dir || "right";

    if (d=="right"){
      hint.style.left = right+"px";
      hint.style.top = top+"px"
    }else if (d=="bottom"){
      hint.style.left = (left+rect.width/2-w/2-CONST.SIZE.MARGIN*2)+"px";
      hint.style.top = bottom+"px"
    }
    hint.style.width = w+"px";
    hint.innerHTML = tabs.text.toUpperCase();
  }
  elt.onmouseleave = function(){
    if (f2){f2()};
    hint.style.display = "none";
  }
}

function instruction(text, add_cond, rem_cond, abo_cond){
  console.log(text);
  var w = 320;
  
  if (CONST.ENV.ISMOBILE){
    return;
  }
  var div;

  function f(){
    if (div){
      var a = parseFloat(div.style.opacity);
      a = Math.min(1,a + 0.1);
      div.style.opacity = a;
    }
    if (div == undefined && add_cond()){
      
      div = document.createElement("div");
      div.id = "instruction-div";
      div.classList.add("tooltip");
      div.innerHTML = text;
      div.style.position = "absolute";
      div.style.left = (window.innerWidth-w)/2+"px";
      div.style.top = (window.innerHeight*0.7)+"px";
      div.style.width = w+"px";
      div.style.textAlign = "center";
      div.style.display = "block";
      div.style.height = "18px";
      div.style.fontSize = "15px";
      div.style.opacity = "0";
      document.body.appendChild(div);
    }
    if (rem_cond()){
      if (div){
        div.parentNode.removeChild(div);
        return;
      }
    }
    if (abo_cond()){
      if (div){
        div.parentNode.removeChild(div);
      }
      return;
    }
    setTimeout(f,10);
  }
  f();
}


function notooltip(){
  TOOLTIPDIV.style.display = "none";
}

function dragElement(elmnt,header) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var oldmouseup;
  var oldmousemove;
  
  var oldtouchend;
  var oldtouchmove;

  var elt = elmnt;
  if (header){
    elt = header;
  }
  
  elt.onmousedown = function(e){dragMouseDown(e,e.clientX,e.clientY)};
  elt.ontouchstart= function(e){dragMouseDown(e,e.touches[0].pageX,e.touches[0].pageY)};
  
  function dragMouseDown(e,x,y) {
    if (e.eventPhase == Event.BUBBLING_PHASE){
      return
    }
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = x;
    pos4 = y;
    var rect = elt.getBoundingClientRect();
    pos1 = x - rect.left;
    pos2 = y - rect.top;
    
    oldmouseup = document.onmouseup
    oldmousemove = document.onmousemove
    oldtouchend= document.ontouchend
    oldtouchmove = document.ontouchmove

    document.onmouseup = closeDragElement;
    document.ontouchend = closeDragElement;
    
    document.onmousemove = function(e){elementDrag(e,e.clientX,e.clientY)};
    document.ontouchmove = function(e){elementDrag(e,e.touches[0].pageX,e.touches[0].pageY)};
  }

  function elementDrag(e,x,y) {
    e = e || window.event;
    e.preventDefault();
    pos3 = x;
    pos4 = y;
    var rect = elt.getBoundingClientRect();
    elmnt.style.top = Math.min(window.innerHeight-rect.height,Math.max(0, pos4- pos2)) + "px";
    elmnt.style.left = Math.min(window.innerWidth-rect.width,Math.max(0, pos3 - pos1)) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = oldmouseup;
    document.onmousemove = oldmousemove;
    document.ontouchend = oldtouchend;
    document.ontouchmove = oldtouchmove;
  }
}


function tabSwitcher(tabs){
  var wacc = 0;
  var hacc = 0;
  
  var ctn = document.createElement("div");
  ctn.style.position = "relative";
  ctn.classList.add("tab-switch-container");
  for (var i = 0; i < tabs.length; i++){
    if (i == 0){
      tabs[i].dom.style.display = "block";
    }else{
      tabs[i].dom.style.display = "none";
    }
    var div = document.createElement("div");
    div.classList.add("noselect");
    div.classList.add("tab-switch");
    
    if (i == 0){
      div.classList.add("tab-switch-first");
      div.classList.add("tab-switch-sel");
    }else if (i==tabs.length-1){
      div.classList.add("tab-switch-last");
    }
    var w = (tabs[i].width || 80)
    var h = (tabs[i].height || 20)
    div.style.width = (w) + "px";
    div.style.height = h + "px";
    div.style.position = "absolute";
    div.style.left = wacc + "px";
    div.style.top = "0px";
    wacc += w;
    hacc = Math.max(h,hacc);
    div.innerHTML = tabs[i].name
    tooltip({dom:div,text:tabs[i].hint || tabs[i].name,dir:"bottom",width:120})
    
    function f(){
      var d = div;
      var j = i;
      d.onclick = function(){
        for (var k = 0; k < tabs.length; k++){
          if (k != j){
            tabs[k].dom.style.display = "none";
          }else{
            tabs[k].dom.style.display = "block";
            if (tabs[k].onclick){
              tabs[k].onclick();
            }
          }
        }
        var ds = ctn.childNodes;
        for (var k = 0; k < ds.length;k++){
          if (ds[k] == d){
            ds[k].classList.add("tab-switch-sel");
          }else{
            ds[k].classList.remove("tab-switch-sel");
          }
        }
      }
    }
    f();
    ctn.style.width = wacc + "px";
    ctn.style.height = hacc + "px";
    ctn.appendChild(div);
  }
  var cctn = document.createElement("div");
  cctn.appendChild(ctn);
  return cctn;
}


function toolSwitcher(tabs,state,attr){
  var w = CONST.SIZE.ICON;
  var ctn = document.createElement("div");
  
  function setState(i){
    var ds = ctn.childNodes;
    for (var k = 0; k < ds.length;k++){
      if (k==i){
        ds[k].innerHTML = makeIcon({name:tabs[k].name,width:w,height:w,color:CONST.COLOR.DARK});
        ds[k].classList.add("icon-btn-sel");
      }else{
        ds[k].innerHTML = makeIcon({name:tabs[k].name,width:w,height:w,color:CONST.COLOR.LIGHT});
        ds[k].classList.remove("icon-btn-sel");
      }
    }
  }
  
  for (var i = 0; i < tabs.length; i++){
    var div = document.createElement("div");
    div.classList.add("noselect");
    div.classList.add("icon-btn");
    function f(){
      var d = div;
      var j = i;
      d.onclick = function(){
        state[attr] = tabs[j].name;
        setState(j);
        if (tabs[j].onclick){
          tabs[j].onclick();
        }
      }
    }
    f();
    tooltip({dom:div,text:tabs[i].name})
    ctn.appendChild(div);
  }
  function setter(){
    for (var i = 0; i < tabs.length; i++){
      if (tabs[i].name == state[attr]){
        setState(i);
        break;
      }  
    }
  }
  setter();
  return [ctn,setter];
}

function boolToggle(tabs,state,attr){
  var w = tabs.width || 20;
  var h = tabs.height || 20;
  var wm = 0.6;
  var ctn = document.createElement("div");
  ctn.style.position = "relative";
  ctn.classList.add("bool-container")
  var div = document.createElement("div");
  div.style.position = "absolute";
  div.classList.add("bool-ind")
  div.style.width = w + "px";
  div.style.height = h + "px";
  ctn.style.width = (w*(1+wm)) + "px";
  ctn.style.height = h + "px";
  
  ctn.appendChild(div);
  function f(){
    state[attr] = !state[attr];
    if (state[attr] && tabs.onclick){
      tabs.onclick();
    }
    g();
  }
  function g(){
    div.style.top = "0px";
    
    div.style.left = (w*state[attr]*wm)+"px";
    div.innerHTML = (["",""])[state[attr]*1];
    if (state[attr]){
      ctn.classList.add("bool-container-sel");
    }else{
      ctn.classList.remove("bool-container-sel");
    }
  }
  g();
  ctn.onclick = f;
  
  var cctn = document.createElement("div");
  cctn.classList.add("bool-container-container");
  var lbl = document.createElement("div");
  lbl.style.position = "relative";
  lbl.style.left = (w*(1+wm)+8) + "px";
  lbl.style.top = (-h) + "px";
  lbl.classList.add("ui-lbl");
  lbl.innerHTML = tabs.name;
  cctn.appendChild(ctn);
  cctn.appendChild(lbl);
  
  tooltip({dom:ctn,text:tabs.hint || tabs.name,dir:"bottom",width:120})
  return cctn;
  
}

function iconButton(tabs){
  var w = CONST.SIZE.ICON;
  var div = document.createElement("div");
  div.classList.add("icon-btn");
  div.innerHTML = makeIcon({name:tabs.name,width:w,height:w,color:CONST.COLOR.LIGHT});
  tooltip({dom:div,text:(tabs.hint || tabs.name), dir:tabs.hintDir || "right", width:tabs.hintWidth})
  return div;
}

function textButton(tabs){
  var w = CONST.SIZE.ICON;
  var div = document.createElement("div");
  div.classList.add("text-btn");
  div.classList.add("noselect");
  div.innerHTML = tabs.name;
  div.style.width = (tabs.width || 100)+"px";
  if (tabs.hint != ""){
    tooltip({dom:div,text:tabs.hint || tabs.name,dir:tabs.hintDir || "bottom",width:120})
  }
  return div;
}

function textInput(tabs){
  var ctn = document.createElement("div");
  ctn.classList.add("input-container");
  var lbl = document.createElement("div");
  if (tabs.name){
    
    lbl.style.position = "relative";
    lbl.style.left = 0 + "px";
    lbl.style.top = 6 + "px";
    lbl.classList.add("ui-lbl");
    lbl.innerHTML = tabs.name;
  }else{
    lbl.style.height = "21px"
  }
  
  var div = document.createElement("input");
  div.type = "text";
  div.spellcheck=false
  div.style.position = "relative";
  div.style.left = (tabs.labelWidth || 50)+ "px";
  div.style.top = -21 + "px";
  div.style.width = (tabs.width || 100) + "px";
  
  ctn.appendChild(lbl);
  ctn.appendChild(div);
  
  return ctn;
}

function newDoodle(callback,failure){
  var mouseX = 0;
  var mouseY = 0;
  var mouseIsDown = false;
  
  var STROKES = [];
  var FAT = 15;
  var BLEED = 5;

  var NODES = [];
  var NODES_STATIC = [];
  var SKIN = [];
  var PARTS = [];
  var MOTION = [];
  
  var STATE = {SHOW_NODES:false,TOOL:"pencil",TYPE:"mammaloid",DONE:-1};
  
  var type_edited = false;

  var main_div = document.createElement("div"); main_div.classList.add("editor-main");
  main_div.style.position = "absolute";
  var mw = 325;
  var mh = 350;
  main_div.style.width=mw+"px";
  main_div.style.height=mh+"px";
  var mn = document.getElementsByClassName("editor-main").length;
  main_div.style.left = (window.innerWidth/2 - mw/2+mn*50)+"px";
  main_div.style.top = (window.innerHeight/2 - mh/2+mn*50)+"px";
  
  var draw_div = document.createElement("div"); draw_div.classList.add("editor-tab");
  var view_div = document.createElement("div"); draw_div.classList.add("editor-tab");
  
  function new_canv(){
    var canvas = document.createElement("canvas");
    canvas.classList.add("editor-canvas");
    canvas.width = CONST.SIZE.DOODLE;
    canvas.height = CONST.SIZE.DOODLE;
    canvas.style.position = "absolute";
    canvas.style.left = "50px";
    canvas.style.top = "50px";
    return canvas;
  }
  
  var canvas = new_canv();
  var context = canvas.getContext("2d");
  draw_div.appendChild(canvas);
  
  var anim_canvas = new_canv();
  var anim_context = anim_canvas.getContext("2d");
  view_div.appendChild(anim_canvas);

  var tab_div = tabSwitcher([{name:"DRAW",dom:draw_div,hint:"edit your doodle"},{name:"PREVIEW",dom:view_div,hint:"preview animation",onclick:function(){if(!type_edited){var g = guess_type()};if(LAZYPROCESS){process()}}}])
  var sn_div = boolToggle({name:makeIcon({name:"nodes",width:CONST.SIZE.ICON,height:CONST.SIZE.ICON,color:CONST.COLOR.LIGHT}),hint:"show skeleton",onclick:function(){if(LAZYPROCESS){process()}}},STATE,"SHOW_NODES")
  var [tool_div, tool_div_setter] = toolSwitcher([{name:"pencil"},{name:"eraser"}],STATE,"TOOL");
  var [type_div, type_div_setter] = toolSwitcher([
    {name:"mammaloid",onclick:()=>{type_edited=true;process()}},
    {name:"humanoid",onclick:()=>{type_edited=true;process()}},
    {name:"birdoid",onclick:()=>{type_edited=true;process()}},
    {name:"fishoid",onclick:()=>{type_edited=true;process()}},
    {name:"plantoid",onclick:()=>{type_edited=true;process()}},
  ],STATE,"TYPE");
  
  var del_btn = iconButton({name:"trash",hint:"clear"});
  del_btn.onclick=function(){STROKES = [];process()}
  draw_div.appendChild(del_btn);
  del_btn.style.position = "absolute";
  del_btn.style.left = "5px";
  del_btn.style.top="115px";
  
  var hr = document.createElement("div");
  hr.classList.add("editor-main-header");
  hr.style.position = "absolute";
  hr.style.left = "0px";
  hr.style.top = "0px";
  hr.style.height = "40px";
  hr.style.width="100%";
  main_div.appendChild(hr)
  
  var close_btn = iconButton({name:"close",hintDir:"bottom"});
  main_div.appendChild(close_btn);
  close_btn.style.position = "absolute";
  close_btn.style.left = "0px";
  close_btn.style.top="0px";
  close_btn.onclick = function(){STATE.DONE=1};

  
  var done_btn = textButton({name:"DONE",width:295,hint:"submit doodle"});
  main_div.appendChild(done_btn);
  done_btn.style.position = "absolute";
  done_btn.style.left = "5px";
  done_btn.style.top="311px";
  done_btn.onclick = function(){if(!type_edited){var g = guess_type()};process();STATE.DONE=0};
  
  
  tab_div.style.position = "absolute";
  tab_div.style.left = "65px";
  tab_div.style.top = "5px";
  sn_div.style.position = "absolute";
  
  sn_div.style.left = "250px";
  sn_div.style.top = "5px";
  tool_div.style.position = "absolute";
  tool_div.style.left = "5px";
  tool_div.style.top = "45px";
  
  type_div.style.position = "absolute";
  type_div.style.left = "5px";
  type_div.style.top = "45px";
  
  main_div.appendChild(tab_div);
  main_div.appendChild(sn_div);
  draw_div.appendChild(tool_div);
  view_div.appendChild(type_div);
  main_div.appendChild(draw_div);
  main_div.appendChild(view_div);

  document.body.appendChild(main_div);
  
  dragElement(main_div,hr);
  
  function onmousemove(x,y){
    var rect = canvas.getBoundingClientRect();
    mouseX = x - rect.left;
    mouseY = y - rect.top;
    if (mouseX < 0 || mouseX > CONST.SIZE.DOODLE || mouseY < 0 || mouseY > CONST.SIZE.DOODLE){
      mouseIsDown = false;
    }
    if (mouseIsDown){
      if (STATE.TOOL == "pencil"){
        var last = undefined;
        try{
          last = STROKES[STROKES.length-1][STROKES[STROKES.length-1].length-1]
        }catch(e){}
        if ((last==undefined) || Okb.vector.distance(STROKES[STROKES.length-1][STROKES[STROKES.length-1].length-1], [mouseX,mouseY]) > 2){
          if (!STROKES.length){
            STROKES.push([])
          }
          STROKES[STROKES.length-1].push([mouseX,mouseY]);
        }
      }else if (STATE.TOOL == "eraser"){
        for (var i = 0; i < STROKES.length; i++){
          for (var j = 0; j < STROKES[i].length; j++){
            var p = STROKES[i][j];
            if (Okb.vector.distance(p, [mouseX,mouseY]) < CONST.SIZE.ERASER){
              var seg = STROKES[i].slice(j+1);
              STROKES[i] = STROKES[i].slice(0,j);
              STROKES.splice(i+1,0,seg);
            }
          }
        }
        STROKES = STROKES.filter((x)=>(x.length))
      }
    }
  }
  function onmousedown(){
    mouseIsDown = true;
    if (STATE.TOOL == "pencil"){
      STROKES.push([])
    }else if (STATE.TOOL == "pencil"){
      
    }
  }
  function onmouseup(){
    mouseIsDown = false;
    if (STATE.SHOW_NODES || (!LAZYPROCESS)){
      process();
    }
    console.log(STROKES);
  }
  
  canvas.onmousemove = function(event){onmousemove(event.clientX,event.clientY);event.preventDefault();}
  canvas.onmousedown = function(event){onmousedown();event.preventDefault();}
  canvas.onmouseup = function(event){onmouseup();event.preventDefault();}
  canvas.ontouchstart =function(event){onmousedown();event.preventDefault();}
  canvas.ontouchmove = function(event){onmousemove(event.touches[0].pageX,event.touches[0].pageY);event.preventDefault();}
  canvas.ontouchend =  function(event){onmouseup();event.preventDefault();}
  
  function draw_strokes(ctx){
    for (var i = 0; i < STROKES.length; i++){
      ctx.beginPath();
      for (var j = 0; j < STROKES[i].length; j++){
        if (j == 0){
          ctx.moveTo(STROKES[i][j][0], STROKES[i][j][1]);
        }else{
          ctx.lineTo(STROKES[i][j][0], STROKES[i][j][1]);
        }
      }
      ctx.stroke(); 
    }
  }
  
  function simplify_strokes(){
    var vtxcnt = 0;
    for (var i = 0; i < STROKES.length; i++){
      vtxcnt += STROKES[i].length;
    }
    console.log(vtxcnt);
    if (vtxcnt > 1000){
      for (var i = 0; i < STROKES.length; i++){
        for (var j = 0; j < STROKES[i].length; j+=2){
          STROKES[i].splice(j,1);
        }
      }
    }
  }
  
  function guess_type(){
    if (!doodleClassify.model){
      console.log("model not loaded, refuse to guess type");
      return "?";
    }
    var ret = doodleClassify.predict(STROKES)
    console.log(ret);
    var p = ret.prediction;
    var c = ret.probabilityDistribution[0][1];
    if (c < 0.7){
      console.log("not very confident, refuse to guess type");
      return "?";
    }
    var mapper =  {
      "architecture":"?",
      "bird":"birdoid",
      "container":"?",
      "fish":"fishoid",
      "food":"?",
      "fruit":"?",
      "furniture":"?",
      "garment":"?",
      "humanoid":"humanoid",
      "insect":"?",
      "instrument":"?",
      "plant":"plantoid",
      "quadruped":"mammaloid",
      "ship":"fishoid",
      "technology":"?",
      "tool":"?",
      "vehicle":"",
    }
    var g = mapper[p];
    if (g != "?"){
      STATE.TYPE = g;
      type_div_setter();
      console.log("successfully guessed type:", g);
    }else{
      console.log("what is that? refuse to guess type");
    }
    return g;
  }
  
  
  function process(){
    simplify_strokes();
    var center = {
      x: CONST.SIZE.DOODLE/2,
      y: CONST.SIZE.DOODLE/2,
      types:["node","root"],
    }
    if (STATE.TYPE == "humanoid"){
      center.y = CONST.SIZE.DOODLE * 0.6
    }else if (STATE.TYPE == "plantoid"){
      center.y = CONST.SIZE.DOODLE;
      center.types.push("leaf");
    }else if (STATE.TYPE == "fishoid"){
      center.types.push("edge");
    }
    
    // if (doodleClassify.model){
    //   console.log(doodleClassify.predict(STROKES));
    // }

    var ret = doodleRig.process(STROKES,{center:center});
    NODES = ret.nodes;
    NODES_STATIC = doodleMeta.deepCopyNodes(ret.nodes);
    SKIN = ret.skin;
    
    PARTS = doodleAnimate.getParts(NODES,STATE.TYPE);
    MOTION = doodleAnimate.bakeMotion(NODES,PARTS);

  }

  function anim_render(){
    anim_context.fillStyle=CONST.COLOR.DARK;
    anim_context.fillRect(0,0,CONST.SIZE.DOODLE,CONST.SIZE.DOODLE);

    if (STATE.SHOW_NODES){
      anim_context.fillStyle = "none";
      anim_context.lineWidth = 1.5;
      anim_context.strokeStyle=CONST.COLOR.HINT;
      doodleMeta.drawTree(anim_canvas,NODES[0]);
      doodleAnimate.drawParts(anim_canvas,PARTS);
    }

    anim_context.strokeStyle=CONST.COLOR.WHITE;
    anim_context.fillStyle = "none";
    anim_context.lineWidth = 2;
    anim_context.lineJoin = "round";
    anim_context.lineCap = "round";

    doodleMeta.drawSkin(anim_canvas,SKIN);
    
    
  }
  
  function main(){
    // console.log(STATE);
    context.fillStyle=CONST.COLOR.DARK;
    context.fillRect(0,0,CONST.SIZE.DOODLE,CONST.SIZE.DOODLE);
    
    if (STATE.SHOW_NODES){
      context.save();
        context.globalAlpha = 0.12;
        context.drawImage(document.getElementById("doodle-rig-internal-canvas-1"),0,0);
      context.restore();
      context.fillStyle = "none";
      context.lineWidth = 1.5;
      context.strokeStyle= CONST.COLOR.HINT;
      doodleMeta.drawTree(canvas,NODES_STATIC[0]);
      
    }
    
    context.lineWidth = 2;
    context.strokeStyle=CONST.COLOR.WHITE;
    draw_strokes(context);
    
    if (STATE.TOOL == "eraser"){
      context.beginPath();
      context.arc(mouseX, mouseY, CONST.SIZE.ERASER, 0, 2 * Math.PI, false);
      context.lineWidth = 1;
      context.strokeStyle = CONST.COLOR.LIGHT;
      context.stroke();
    }
    
    if (CONST.ANIMMODE){
      doodleAnimate.test(NODES,SKIN);
    }else{
      doodleAnimate.animateMotion(NODES,SKIN,MOTION);
    }
    anim_render();
    if (STATE.DONE==-1){
      setTimeout(main,10);
    }else{
      main_div.parentNode.removeChild(main_div);
      notooltip();
      if (STATE.DONE == 0){
        console.log(STROKES);
        callback({nodes:NODES,skin:SKIN,strokes:STROKES,type:STATE.TYPE});
      }else{
        if (failure){
          failure();
        }
        //cancelled;
      }
    }
  }
  
  main();
  
}








function randName(temperature){
  var vcombos = ['e', 'a', 'i', 'o', 'u', 'ou', 'ie', 'io', 'ia', 'ea', 'au', 'ai', 'ua', 'ei', 'ee', 'ue', 'oo', 'oi', 'ui', 'eo', 'ae', 
                 'oa', 'eu', 'oe', 'iu', 'ao', 'aa', 'iou', 'oui', 'eau', 'aoi', 'uee', 'ii', 'uo', 'oua', 'oia', 'eou', 'ieu']
  var ccombos = ['s', 'r', 't', 'd', 'l', 'c', 'n', 'm', 'p', 'g', 'ng', 'b', 'h', 'v', 'f', 'st', 'ss', 'w', 'nt', 'll', 'rs', 'pr', 
                 'tr', 'sh', 'k', 'nd', 'ch', 'z', 'ct', 'bl', 'ck', 'th', 'ns', 'nc', 'gr', 'tt', 'cr', 'rt', 'sp', 'j', 'pl', 'sc', 
                 'cl', 'br', 'rr', 'ph', 'rm', 'q', 'fl', 'ts', 'str', 'x', 'mp', 'rd', 'sm', 'mm', 'dr', 'rn', 'nn', 'fr', 'pp', 'sl', 
                 'ls', 'nk', 'pt', 'gl', 'mb', 'ff', 'ps', 'rg', 'nts', 'rc', 'sk', 'rl', 'gg', 'rb', 'wh', 'lt', 'rk', 'sw', 'gn', 'tch']

  function cap(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  var nsyl = 3+Math.floor(Okb.random.gaussian()*8)
  var sv = Math.floor(Math.random()*3) == 0
  function f(){
    var w = Okb.math.map(temperature,0,1,2,0.5)
    var result = ""
    for (var i = 0; i < nsyl; i++){
      if ((i+sv)%2){
        result += vcombos[Math.floor(Okb.random.weighted((x)=>(Okb.curves.gaussian((x+0.5)*w)))*vcombos.length)]
      }else{
        result += ccombos[Math.floor(Okb.random.weighted((x)=>(Okb.curves.gaussian((x+0.5)*w)))*ccombos.length)]
      }
    }
    return result;
  }
  for (var i = 0; i < 1000; i++){
    try{
        return cap(f());
    }catch(e){}
  }
  return "Bob";
}

function newDoodleName(callback){
  
  var STATE = {DONE:-1}
  var NAME
  
  var main_div = document.createElement("div"); main_div.classList.add("editor-prompt");
  main_div.style.position = "absolute";
  var mw = 325;
  var mh = 175;
  main_div.style.width=mw+"px";
  main_div.style.height=mh+"px";

  main_div.style.left = (window.innerWidth/2 - mw/2)+"px";
  main_div.style.top = (window.innerHeight/2 - mh/2)+"px";
  
  var lbl = document.createElement("div");
  lbl.style.position = "absolute";
  lbl.style.left = 0 + "px";
  lbl.style.top = 20 + "px";
  lbl.style.width = mw + "px";
  lbl.style.textAlign = "center";
  lbl.classList.add("ui-lbl");
  lbl.innerHTML = "NAME YOUR DOODLE";
  main_div.appendChild(lbl);
  
  var rand_btn = iconButton({name:"dice",hint:"random name",hintWidth:100});
  rand_btn.onclick=function(){fill_name()}
  main_div.appendChild(rand_btn);
  rand_btn.style.position = "absolute";
  rand_btn.style.left = "280px";
  rand_btn.style.top="55px";
  
  var done_btn = textButton({name:"DONE",width:295,hint:"submit doodle",hintdir:"right"});
  main_div.appendChild(done_btn);
  done_btn.style.position = "absolute";
  done_btn.style.left = "5px";
  done_btn.style.top="98px";
  done_btn.onclick = function(){STATE.DONE=0};
  
  var name_inp = textInput({width:258,labelWidth:0.0001});
  main_div.appendChild(name_inp);
  name_inp.style.position = "absolute";
  name_inp.style.left = "10px";
  name_inp.style.top="60px";
  
  var warn_lbl = document.createElement("div");
  warn_lbl.style.position = "absolute";
  warn_lbl.style.left = 10 + "px";
  warn_lbl.style.top = 140 + "px";
  warn_lbl.style.width = (mw-20) + "px";
  warn_lbl.style.lineHeight = "12px";
  warn_lbl.style.fontSize = "11px";
  warn_lbl.innerHTML = "* By contributing your doodle, you agree that it enters into the public domain. (<a href=\"readme.html#Legal\" target=\"_blank\">details</a>)";
  main_div.appendChild(warn_lbl);
  
  
  document.body.appendChild(main_div);
  
  fill_name();
  
  function main(){

    if (STATE.DONE==-1){
      setTimeout(main,10);
    }else{
      main_div.parentNode.removeChild(main_div);
      notooltip();
      if (STATE.DONE == 0){
        callback(name_inp.getElementsByTagName("INPUT")[0].value);
      }else{
        //cancelled;
      }
    }
  }
  function fill_name(){
    name_inp.getElementsByTagName("INPUT")[0].value=randName(0.45);
  }
  
  main();
}




function newAsyncPrompt(promptStr, defaultStr, callback, failure){
  
  var STATE = {DONE:-1}
  var NAME
  
  var main_div = document.createElement("div"); main_div.classList.add("editor-prompt");
  main_div.style.position = "absolute";
  var mw = 325;
  var mh = 145;
  main_div.style.width=mw+"px";
  main_div.style.height=mh+"px";

  
  var scrolltop = document.documentElement.scrollTop || document.body.scrollTop
  var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft
  
  main_div.style.left = (scrollleft + window.innerWidth/2 - mw/2)+"px";
  main_div.style.top = (scrolltop  + window.innerHeight/2 - mh/2)+"px";
  
  var lbl = document.createElement("div");
  lbl.style.position = "absolute";
  lbl.style.left = 0 + "px";
  lbl.style.top = 20 + "px";
  lbl.style.width = mw + "px";
  lbl.style.textAlign = "center";
  lbl.classList.add("ui-lbl");
  lbl.innerHTML = promptStr.toUpperCase();
  main_div.appendChild(lbl);
  
  
  var ok_btn = textButton({name:"OK",width:138,hint:""});
  main_div.appendChild(ok_btn);
  ok_btn.style.position = "absolute";
  ok_btn.style.left = "162px";
  ok_btn.style.top="100px";
  ok_btn.onclick = function(){STATE.DONE=0};
  
  var cancel_btn = textButton({name:"CANCEL",width:138,hint:""});
  main_div.appendChild(cancel_btn);
  cancel_btn.style.position = "absolute";
  cancel_btn.style.left = "5px";
  cancel_btn.style.top="100px";
  cancel_btn.onclick = function(){STATE.DONE=1};
  
  var custom_inp = textInput({width:295,labelWidth:0.0001});
  main_div.appendChild(custom_inp);
  custom_inp.style.position = "absolute";
  custom_inp.style.left = "10px";
  custom_inp.style.top="60px";
  
  document.body.appendChild(main_div);
  
  if (defaultStr[0] == "*"){
    custom_inp.getElementsByTagName("INPUT")[0].type = "password";
  }else{
    custom_inp.getElementsByTagName("INPUT")[0].value=defaultStr;
  }
  function main(){

    if (STATE.DONE==-1){
      setTimeout(main,10);
    }else{
      main_div.parentNode.removeChild(main_div);
      notooltip();
      if (STATE.DONE == 0){
        callback(custom_inp.getElementsByTagName("INPUT")[0].value);
      }else{
        failure();
        //cancelled;
      }
    }
  }
  
  main();
}


function newDropMenu(tabs){
  var w = 200
  var menu_btn = document.createElement("div");
  menu_btn.classList.add("icon-btn");
  menu_btn.innerHTML = makeIcon({name:"menu",width:CONST.SIZE.ICON,height:CONST.SIZE.ICON,color:CONST.COLOR.LIGHT});;
  menu_btn.onclick = function(){
    if (main_div.style.display == "none"){
      main_div.style.display="block"
      var rect = menu_btn.getBoundingClientRect();
      main_div.style.top = (rect.bottom+10)+"px";
      main_div.style.left = (rect.right-w)+"px"
      
      for (var i = 0; i < tabs.length; i++){
        var div = main_div.childNodes[i];
        // console.log(div);
        if (typeof tabs[i].name == 'function'){
          div.innerHTML = tabs[i].name();
        }else{
          div.innerHTML = tabs[i].name.toUpperCase();
        }
      }
    }else{
      main_div.style.display = "none";
    }
  
  };

  var main_div = document.createElement("div");
  main_div.classList.add("menu-container");
  main_div.style.display = "none";
  main_div.style.width = w+"px";
  main_div.style.position = "absolute";

  for (var i = 0; i < tabs.length; i++){
    var div = document.createElement("div");
    div.classList.add("menu-item");div.classList.add("noselect");
    

    
    function f(){
      var _i = i;
      div.onclick = function(){
        main_div.style.display="none";
        tabs[_i].onclick();
      }
    }
    f();
    main_div.appendChild(div);
  }
  document.body.appendChild(main_div);
  return menu_btn;
  
}


function newInfoFrame(url){
  var w = Math.min(400,window.innerWidth-50);
  var h = Math.min(500,window.innerHeight-200);
  var pad = 10;
  
  var main_div = document.createElement("div");
  main_div.classList.add("info-iframe-container");
  main_div.style.position = "absolute";
  main_div.style.width = (w-pad*2) + "px";
  main_div.style.height = (h-pad*2) + "px";
  main_div.style.padding = pad + "px";
  main_div.style.left = (window.innerWidth-w)/2+"px";
  main_div.style.top = (window.innerHeight-h)/2+"px";
  
  var iframe = document.createElement("iframe");
  iframe.classList.add("info-iframe");
  iframe.src = url;
  iframe.frameBorder="0";
  iframe.style.position = "absolute";
  iframe.width = w-pad*2+"px";
  iframe.height = "100%";
  
  main_div.appendChild(iframe);
  document.body.appendChild(main_div);
  
  iframe.onload = function(){
    var idoc = (iframe.contentWindow || iframe.contentDocument);
    if (idoc.document){idoc = idoc.document;}
    console.log(idoc);
    var cssLink = idoc.createElement("link");
    cssLink.href = "/style.css"; 
    addConstantsToCss(idoc);
    cssLink.rel = "stylesheet"; 
    idoc.head.appendChild(cssLink);
    idoc.body.style.backgroundColor = "rgba(0,0,0,0)";
  }
  
  var close_btn = iconButton({name:"close",hintDir:"bottom"});
  document.body.appendChild(close_btn);
  close_btn.style.position = "absolute";
  close_btn.style.left= ((window.innerWidth-w)/2+w-CONST.SIZE.ICON-20)+"px"
  close_btn.style.top= (window.innerHeight-h)/2+2+"px";
  
  close_btn.onclick = function(){
    document.body.removeChild(main_div);
    document.body.removeChild(close_btn);
    notooltip();
  };

  return main_div;
  
}