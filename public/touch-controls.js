/* global describe Okb CONST */




function angleLerp(a0,a1,t) {
    function shortAngleDist(a0,a1) {
      var max = Math.PI*2;
      var da = (a1 - a0) % max;
      return 2*da % max - da;
  }
  return a0 + shortAngleDist(a0,a1)*t;
}

function newTouchPad(player){
  var W = 300;
  var w = 80;
  var R = 50;
  var pad = -30;
  var outer = document.createElement("div");
  outer.classList.add("dir-ctrl-outer");
  outer.style.position = "absolute";
  outer.style.width = W+"px";
  outer.style.height = W+"px";
  
  if (window.innerWidth < 600){
    outer.style.left = (window.innerWidth/2-W/2)+"px";
    outer.style.top = (window.innerHeight-W-pad)+"px";
  }else{
    outer.style.left = (pad)+"px";
    outer.style.top = (window.innerHeight-W-pad)+"px";    
  }
  outer.style.borderRadius = (W/2) + "px";
  document.body.appendChild(outer)
  
  var inner = document.createElement("div");
  
  inner.classList.add("dir-ctrl-inner");
  inner.style.position = "absolute";
  inner.style.width = w+"px";
  inner.style.height = w+"px";
  inner.style.left = (W-w)/2+"px";
  inner.style.top = (W-w)/2+"px";
  inner.style.borderRadius = (w/2) + "px";
  outer.appendChild(inner)
  
  var touchid;
  var touchx = 0;
  var touchy = 0;
  var innerx = 0;
  var innery = 0;
  var dispx = 0;
  var dispy = 0;
  
  var radius = 0;
  var theta = 0;
  
  
  function calc_touch(){
    var x = touchx;
    var y = touchy;
    var a = Math.atan2(y,x);
    var r = Okb.vector.distance([0,0],[x,y]);
    r = Math.min(r,R);
    radius = r/R;
    theta = a;
    
    innerx = Math.cos(a)*r;
    innery = Math.sin(a)*r;
  }
  
  setInterval(function(){
    dispx = Okb.math.lerp(dispx,innerx,0.2);
    dispy = Okb.math.lerp(dispy,innery,0.2);
    inner.style.left = (dispx-w/2+W/2) + "px";
    inner.style.top = (dispy-w/2+W/2) + "px";
    
    
    if (touchid != undefined){

      player.x += Math.cos(player.rot+theta+Math.PI/2)*player.spd*radius*1.5;
      player.z += Math.sin(player.rot+theta+Math.PI/2)*player.spd*radius*1.5;
    }
    
    
  },10)
  
  outer.addEventListener('touchstart', function(event){
    var rect = outer.getBoundingClientRect();
    for (var i = 0; i < event.touches.length; i++){
      
      var tid = event.touches[i].identifier;
      touchx = event.touches[i].pageX - rect.left-W/2;
      touchy = event.touches[i].pageY - rect.top-W/2;
      touchid = tid;
      break;
    }
    calc_touch();
    event.stopPropagation();
    event.preventDefault();
    
  }, false);
  outer.addEventListener('touchmove', function(event){
    var rect = outer.getBoundingClientRect();
    
    for (var i = 0; i < event.touches.length; i++){
      var tid = event.touches[i].identifier;
      if (tid == touchid){
        touchx = event.touches[i].pageX - rect.left-W/2;
        touchy = event.touches[i].pageY - rect.top-W/2;
        break;
      }
    }
    if (tid != undefined){
      calc_touch();
    }
    event.stopPropagation();
    event.preventDefault();
    
    
  }, false);
  outer.addEventListener('touchcancel', function(event){
    touchid = undefined;
    touchx = 0;
    touchy = 0;
    calc_touch();
    event.stopPropagation();
    event.preventDefault();
    
  }, false);
  outer.addEventListener('touchend', function(event){
    touchid = undefined;
    touchx = 0;
    touchy = 0;
    calc_touch();
    event.stopPropagation();
    event.preventDefault();
    
  }, false);
  

  function get(){
    return {r:radius,th:theta,dom:outer}
  }
  return get;
  
}



function newTouchLook(player,dom,maskdom){

  var touchid;
  var touchdown;
  var oldrot
  var mrect = maskdom.getBoundingClientRect();
  
  dom.addEventListener('touchstart', function(event){
    
    for (var i = 0; i < event.touches.length; i++){
      var x = event.touches[i].pageX;
      var y = event.touches[i].pageY;
      console.log(mrect,x,y)
      if (mrect.left < x && x < mrect.right && mrect.top < y && y < mrect.bottom){
        console.log("blocked");
        continue;
      }
      var tid = event.touches[i].identifier;
      touchdown = event.touches[i].pageX
      touchid = tid;
      oldrot = player.rot
      break;

    }
    event.preventDefault();
  }, false);
  dom.addEventListener('touchmove', function(event){
    var ids = [];
    
    for (var i = 0; i < event.touches.length; i++){
      var tid = event.touches[i].identifier;
      ids.push(tid);
      if (tid == touchid){
        var x = event.touches[i].pageX
        player.rot = oldrot - (x-touchdown)/window.innerWidth*2;
        break;
      }
    }
    
    event.preventDefault();
  }, false);
  dom.addEventListener('touchcancel', function(event){
    touchid = undefined;
    touchdown = undefined;
    event.preventDefault();
  }, false);
  dom.addEventListener('touchend', function(event){
    touchid = undefined;
    touchdown = undefined;
    event.preventDefault();
  }, false);
}