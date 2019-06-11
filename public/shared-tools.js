/* global describe CONST Okb*/
if (typeof document == 'undefined'){
  var requireFromUrl = require('require-from-url/sync');
  var Okb = requireFromUrl("https://okb.glitch.me/Okb-min.js");
  var CONST = require("./constants");
}

var sharedTools = new function(){var those = this;

  those.terrain = new function(){ var that = this;
    that.generate = function(){
      Okb.random.perlinSeed();
      var trn = [];
      var w = CONST.SIZE.TERRAIN/ CONST.SIZE.TERRAINGRID
      for (var i = 0; i < w; i++){
        trn.push([])
        for (var j = 0; j < w; j++){
          var v0 = Okb.random.perlin(i*0.01,j*0.01);
          var v1 = 0.5+0.5*Okb.random.perlin(i*0.05,j*0.05);
          var v2 = 0.2+0.8*Okb.curves.gaussian2d(Okb.math.map(i/w,0,1,0,1),Okb.math.map(j/w,0,1,0,1),)
          var v3 = 0.8+0.2*Okb.random.perlin(i*0.2,j*0.2);
          trn[i][j] = Math.max(0,v0*v1*v2*v3-0.09)*CONST.SIZE.TERRAINHEIGHT;
        }
      }
      console.log("terrain generated!")
      return trn;
    }
    that.generateAlt = function(){
      Okb.random.perlinSeed();
      var trn = [];
      var w = CONST.SIZE.ALTTERRAIN/ CONST.SIZE.TERRAINGRID
      for (var i = 0; i < w; i++){
        trn.push([])
        for (var j = 0; j < w; j++){
          var v0 = Okb.random.perlin(i*0.01,j*0.01);
          var v1 = 0.5+0.5*Okb.random.perlin(i*0.05,j*0.05);
          var v2 = 0.2+0.8*Okb.curves.gaussian2d(Okb.math.map(i/w,0,1,0,1),Okb.math.map(j/w,0,1,0,1),)
          var v3 = 0.8+0.2*Okb.random.perlin(i*0.2,j*0.2);
          trn[i][j] = Math.max(0,v0*v1*v2*v3-0.12)*CONST.SIZE.TERRAINHEIGHT*0.9;
        }
      }
      console.log("alt terrain generated!")
      return trn;
    }
                                 
    that.getAtW = function(trn,x,z,size){
      var xf = x/CONST.SIZE.TERRAINGRID+size/2;
      var zf = z/CONST.SIZE.TERRAINGRID+size/2;
      var w = trn.length;
      if (xf < 0 || xf >= w-1 || zf < 0 || zf >= w-1){
        return -1;
      }

      var p0 = trn[Math.floor(zf)][Math.floor(xf)]
      var p1 = trn[Math.floor(zf)][Math.ceil(xf)]
      var p2 = trn[Math.ceil(zf)][Math.ceil(xf)]
      var p3 = trn[Math.ceil(zf)][Math.floor(xf)]

      var rx = xf-Math.floor(xf)
      var rz = zf-Math.floor(zf)


      return Okb.math.lerp(Okb.math.lerp(p0,p1,rx),Okb.math.lerp(p3,p2,rx),rz);

    }
    that.getAt = function(trn,x,z){
      return that.getAtW(trn,x,z,CONST.SIZE.TERRAIN);
    }
    that.getCombinedAt = function(trn, atrn, x, z){
      var y = that.getAtW(trn,x,z,CONST.SIZE.TERRAIN);
      if (y == -1){
        return that.getAtW(atrn,x-CONST.SIZE.ALTTERRAINX,z-CONST.SIZE.ALTTERRAINZ,CONST.SIZE.ALTTERRAIN);
      }
      return y;
    }
  }

  those.time = new function(){var that = this;
    
    var timezones = {
      "-11":"Pacific Ocean",
      "-10":"Pacific Ocean",
      "-9":"Pacific Ocean",
      "-8":"North America",
      "-7":"North America",
      "-6":"Americas",
      "-5":"Americas",
      "-4":"Americas",
      "-3":"Greenland / South America",
      "-2":"Atlantic Ocean",
      "-1":"Atlantic Ocean",
      "-2":"Greenland / Atlantic Ocean",
      "0":"Europe / Africa",
      "1":"Europe / Africa",
      "2":"Europe / Africa",
      "3":"Europe / Asia / Africa",
      "4":"Europe / Asia / Indian Ocean",
      "5":"Asia / Indian Ocean",
      "6":"Asia",
      "7":"Asia",
      "8":"Asia / Oceania",
      "8":"Asia / Oceania",
      "9":"Asia / Oceania",
      "10":"Asia / Oceania",
      "11":"Asia / Pacific Ocean",
      "12":"Asia / Pacific Ocean",
    }
    
    that.describeTimeZone = function(d){
      try{
        var x = parseInt(d.split("GMT")[1].slice(0,3));
        return timezones[x.toString()];
      }catch(e){
        return "Unknown";
      }
    }
    that.format = function(d){
      var t = new Date(d);
      return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}, ${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`;
    }
    
    
  }
  
  those.array = new function(){var that = this;
    that.findById = function(arr,id){
      for (var i = 0; i < arr.length; i++){
        if (arr[i].id == id){
          return arr[i];
        }
      }
      return undefined;
    }
  }
}
if (typeof document == 'undefined'){
  module.exports = sharedTools;
}