/* global describe doodleMeta */

var doodleSerial = new function(){
  var that = this;
  var precision = 100;
  
  that.serialize = function(doodle){

    var nodes = doodle.nodes;
    var strokes = doodle.strokes;

    var nnodes = []
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i]
      nnodes.push({
        th: Math.round(n.th0*180/Math.PI),
        r : Math.round(n.r),
        type: n.type,
        parent: nodes.indexOf(n.parent),
        children: [],
      })
    }
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i]
      for (var j = 0; j < n.children.length; j++){
        var cidx = nodes.indexOf(n.children[j]);
        nnodes[i].children.push(cidx);
      }
    }
    
    var nstrokes = []
    for (var i = 0; i < strokes.length; i++){
      nstrokes.push([])
      for (var j = 0; j < strokes[i].length; j++){
        var x = strokes[i][j][0];
        var y = strokes[i][j][1];
        if (nodes.length){
          x -= nodes[0].x;
          y -= nodes[0].y
        }
        nstrokes[i].push([Math.round(x),Math.round(y)]);
      }
    }

    return JSON.stringify({nodes:nnodes,strokes:nstrokes,type:doodle.type})
  }
  
  that.deserialize = function(doodle_str){
    var doodle = JSON.parse(doodle_str);
    var nodes = doodle.nodes;
    var strokes = doodle.strokes;
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      n.th = n.th*Math.PI/180;
      n.th0 = n.th;
      n.id = doodleMeta.randomId();
      n.parent = nodes[n.parent]

      for (var j = 0; j < n.children.length; j++){
        n.children[j] = nodes[n.children[j]]
      }
    }
    doodleMeta.forwardKinematicsNodes(nodes);
    var skin = doodleMeta.buildSkin(strokes,nodes);
    doodleMeta.calculateSkin(skin);
    
    return {strokes:strokes,skin:skin,nodes:nodes,type:doodle.type};
  }
  
  that.compress = function(doodle_str){
    var doodle = JSON.parse(doodle_str);
    var nodes = doodle.nodes;
    var strokes = doodle.strokes;
    var result  = doodle.type[0]+"&"
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      result += n.type[0] + " ";
      result += n.th + " ";
      result += n.r + " ";
      result += n.parent + " ";
      for (var j = 0; j < n.children.length; j++){
        result += n.children[j]
        result += " ";
      }
      result += " ";
    }
    result = result.trim();
    result += "&"
    for (var i = 0; i < strokes.length; i++){
      for (var j = 0; j < strokes[i].length; j++){
        result += strokes[i][j][0] + " " + strokes[i][j][1] + " ";
      }
      result += " "
    }
    result = result.trim();
    return result;
  }
  
  
  that.acronym = function(x){
    var table = {
      "a":"",
      "b":"birdoid",
      "c":"",
      "d":"",
      "e":"edge",
      "f":"fishoid",
      "g":"",
      "h":"humanoid",
      "i":"",
      "j":"",
      "k":"",
      "l":"leaf",
      "m":"mammaloid",
      "n":"node",
      "o":"",
      "p":"plantoid",
      "q":"",
      "r":"root",
      "s":"",
      "t":"",
      "u":"",
      "v":"",
      "w":"",
      "x":"",
      "y":"",
      "z":"", 
    }
    return table[x];
  }
  
  that.decompress = function(doodle_str){
    // console.log(doodle_str)
    var [type_str, node_str, stroke_str] = doodle_str.split("&");
    var node_l = node_str.split("  ")
    var nodes = []
    for (var i = 0; i < node_l.length; i++){
      var nl = node_l[i].split(" ");
      var [type, th, r, parent] = nl.slice(0,4);
      type = that.acronym(type);
      parent = parseInt(parent);
      th = parseInt(th);
      r = parseInt(r);
      var children = []
      for (var j = 4; j < nl.length; j++){
        children.push(parseInt(nl[j]));
      }
      nodes.push({
        type:type,
        th:th,
        r:r,
        parent:parent,
        children:children,
      })
    }
    
    var stroke_l = stroke_str.split("  ")
    var strokes = []
    for (var i = 0; i < stroke_l.length; i++){
      var sl = stroke_l[i].split(" ");
      strokes.push([])
      for (var j = 0; j < sl.length; j+=2){
        strokes[i].push([parseInt(sl[j]),parseInt(sl[j+1])]);
      }
    }
    type_str = that.acronym(type_str)
    return JSON.stringify({nodes:nodes,strokes:strokes,type:type_str});
  }
  
  that.test = function(doodle){
    var s0 = that.serialize(doodle);console.log(s0);
    var s1 = that.compress(s0);console.log(s1);
    var s2 = that.decompress(s1);console.log(s2);
    var s3 = that.deserialize(s2);console.log(s3);

    return s3;
  }
}

if (typeof module != 'undefined'){
  module.exports = doodleSerial;
}