/* global describe doodleMeta CONST Okb */
var doodleAnimate = new function(){
  var that = this;
  that.test = function(nodes,skin,args){
    var args = (args == undefined) ? {}: args;
    var speed = (args.speed == undefined) ? 1 : args.speed;
    var amp = (args.amp == undefined) ? 1 : args.amp;
    
    for (var i = 0; i < nodes.length; i++){
      if (nodes[i].parent ){
        var r = Math.min(Math.max(parseFloat(atob(nodes[i].id)),0.3),0.7);
        nodes[i].th = nodes[i].th0 + Math.sin(speed*(new Date()).getTime()*0.003/r+r*Math.PI*2)*r*0.5*amp;
      }else{
        nodes[i].th = nodes[i].th0
      }
    }
    doodleMeta.forwardKinematicsNodes(nodes);
    doodleMeta.calculateSkin(skin);
  }
  
  
  that.dance = function(nodes,skin,music){
    // console.log(music.time_offset,music.millis_per_beat);
    for (var i = 0; i < nodes.length; i++){
      if (nodes[i].parent ){
        var r = Math.min(Math.max(parseFloat(atob(nodes[i].id)),0.3),0.7);
        var t = ((new Date()).getTime() - music.time_offset) / music.millis_per_beat;
        // console.log(music.millis_per_beat);
        nodes[i].th = nodes[i].th0 + Math.pow(Math.sin(t*Math.PI+Math.PI/4),3)*0.3;
      }else{
        nodes[i].th = nodes[i].th0
      }
    }
    doodleMeta.forwardKinematicsNodes(nodes);
    doodleMeta.calculateSkin(skin);
  }
  
  that.getParts = function(nodes, scheme){

    var parts = []
    var [ul,lr] = Okb.geometry.bound(nodes);

    function part_len(p){
      var start = p.nodes[0];
      var end = p.nodes[p.nodes.length-1];
      return Okb.vector.distance(start,end);

    }
    
    for (var i = 0; i < nodes.length; i++){
      if (nodes[i].parent != undefined){
        if (nodes[i].parent.type != "edge"){
          var p = {
            nodes:[nodes[i]],
          }
          var ptr = nodes[i];
          var cnt = 0;
          while(ptr.type == "edge"){
            ptr = ptr.children[0];
            p.nodes.push(ptr);
            cnt ++;
          }
          parts.push(p);
        }
      }
    }
    for (var i = 0; i < parts.length; i++){
      var p = parts[i]
      var start = p.nodes[0];
      var end = p.nodes[p.nodes.length-1];
      var d = part_len(p)
      if (end.type == "leaf" && d < CONST.SIZE.DOODLE * 0.05){
        p.type = "finger";
      }
    }
    function find_limbs(){
      for (var i = 0; i < parts.length; i++){
        var p = parts[i];
        if (p.type == "finger"){
          continue;
        }
        var end = p.nodes[p.nodes.length-1];
        var outer = true;
        if (end.type != "leaf"){
          for (var j = 0; j < parts.length; j++){
            if (parts[j].type == "finger"){
              continue;
            }
            if (end.children.includes(parts[j].nodes[0])){
              outer = false;
              continue;
            }
          }
        }
        if (outer){
          if (part_len(p) < CONST.SIZE.DOODLE * 0.05){
            p.type = "finger";
          }else{
            p.type = "limb"
          }
        }
      }
    }
    find_limbs();
    find_limbs();
    
    var torso = {nodes:[]}
    for (var i = 0; i < parts.length; i++){
      var nl = parts[i].nodes;
      if (nl[0].parent && nl[0].parent.type == "root" && nl[nl.length-1].type != "leaf"){
        if (nl.length > torso.nodes.length){
          torso = parts[i];
        }
      }
    }
    torso.type = "torso";
    
    var limbbylen = parts.filter((x)=>(x.type=="limb"))
    limbbylen.sort((x,y)=>(part_len(y)-part_len(x)));
    
    for (var i = 0; i < parts.length; i++){
      if (parts[i].type != "limb"){
        continue;
      }
      var nl = parts[i].nodes;
      var start = nl[0];
      var end = nl[nl.length-1];
      if (scheme == "mammaloid"){

        if (end.y > (ul.y*0.5+lr.y*0.5)){
          parts[i].type += ".leg";
        }
        
      }else if (scheme == "humanoid"){

        if (end.y > (ul.y*0.3+lr.y*0.7)){
          parts[i].type += ".leg";
        }else if (end.x < (ul.x*0.7+lr.x*0.3) || end.x > (ul.x*0.3+lr.x*0.7)){
          parts[i].type += ".arm";      
        }else{
          parts[i].type += ".head";
        }
        
      }else if (scheme == "birdoid"){

        if (limbbylen.indexOf(parts[i]) <= 1 && part_len(parts[i]) > CONST.SIZE.DOODLE*0.1){
          parts[i].type += ".wing";
        }else if (end.y > (ul.y*0.3+lr.y*0.7)){
          parts[i].type += ".leg";      
        }
        
      }
    }
    
    return parts;
  }
  
  
  that.drawParts = function(canv,parts){
    var ctx = canv.getContext("2d");
    for (var i = 0; i < parts.length; i++){
      ctx.save();
      if (parts[i].type == "torso"){
        ctx.strokeStyle = "cyan";
      }else if (parts[i].type == "limb.arm"){
        ctx.strokeStyle = "yellow";
      }else if (parts[i].type == "limb.leg"){
        ctx.strokeStyle = "magenta";
      }else if (parts[i].type == "limb.head"){
        ctx.strokeStyle = "red";
      }else if (parts[i].type == "limb.wing"){
        ctx.strokeStyle = "orange";
      }else if (parts[i].type == "limb"){
        ctx.strokeStyle = "purple";
      }else if (parts[i].type == "finger"){
        ctx.strokeStyle = "green";
      }else{
        ctx.strokeStyle = "blue";
      }
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(parts[i].nodes[0].parent.x,parts[i].nodes[0].parent.y);
      for (var j = 0; j < parts[i].nodes.length; j++){
        var p = parts[i].nodes[j];
        ctx.lineTo(p.x,p.y);
      }
      ctx.stroke();
      ctx.restore();
    }
    
  }
  
  
  function randrange(a,b){
    return Math.random()*(b-a)+a;
  }
  
  that.bakeMotion = function(nodes,parts){

    var motion = nodes.map((x)=>(undefined));
    var phase_leg = randrange(0,0.5);
    var phase_arm = randrange(0,0.5);
    var freq_leg = randrange(0.005,0.01)
    for (var i = 0; i < parts.length; i++){
      var idx = nodes.indexOf(parts[i].nodes[0]);
      var type = parts[i].type;
      if (type == undefined){
        continue;
      }
      if (type == "limb.leg"){
        motion[idx] = {
          phase:phase_leg+randrange(0,0.25),
          amp:randrange(0.5,0.8),
          freq:freq_leg+randrange(-0.002,0.002),
        }
        phase_leg += 0.75
      }else if (type == "limb.arm"){
        motion[idx] = {
          phase:phase_arm+randrange(0,0.25),
          amp:randrange(0.5,0.8),
          freq:randrange(0.003,0.02),
        }
        phase_arm += 0.75
      }else if (type == "limb.head"){
        motion[idx] = {
          phase:0.75*i+randrange(0,0.25),
          amp:randrange(0.5,0.8),
          freq:randrange(0.001,0.003),
        }
      }else if (type == "limb.wing"){
        motion[idx] = {
          phase:phase_leg+randrange(0,0.25),
          amp:randrange(0.7,1),
          freq:randrange(0.001,0.005),
        }
        phase_leg += 0.75
      }else if (type.startsWith("limb")){
        motion[idx] = {
          phase:0.75*i+randrange(0,0.25),
          amp:randrange(0.5,0.8),
          freq:randrange(0.001,0.005),
        }
      }
    }
    for (var i = 0; i < nodes.length; i++){
      if (motion[i] == undefined){
        motion[i] = {
          phase:randrange(0,0.5),
          amp:randrange(0.05,0.5),
          freq:randrange(0.001,0.005),
        }
      }        
    }
    return motion;
  }
  
  that.animateMotion = function(nodes,skin,motion,args){
    var args = (args == undefined) ? {}: args;
    var speed = (args.speed == undefined) ? 1 : args.speed;
    var amp = (args.amp == undefined) ? 1 : args.amp;
    
    for (var i = 0; i < nodes.length; i++){
      if (nodes[i].parent ){
        var millis = (new Date()).getTime();
        nodes[i].th = nodes[i].th0 + Math.sin(millis*motion[i].freq+motion[i].phase*speed)*motion[i].amp*amp;
      }else{
        nodes[i].th = nodes[i].th0
      }
    }
    doodleMeta.forwardKinematicsNodes(nodes);
    doodleMeta.calculateSkin(skin);
  }
  
  
}