/* global describe Okb CONST sharedTools doodleMeta*/

var minimap = new function(){var that = this;
  that.generate = function(trn,w,w0){
    if (w0 == undefined){
      w0 = CONST.SIZE.TERRAIN;
    }
    var data = []
    for (var i = 0; i < w; i++){
      data.push([]);
      for (var j = 0; j < w; j++){
        var v =sharedTools.terrain.getAtW(trn,(j/w-0.5)*trn.length,(i/w-0.5)*trn.length, w0);
        data[data.length-1].push(v);
      }
    }
    
    var lvl = 5;
    var canv = document.createElement("canvas");
    canv.style.zIndex = 10;
    canv.width = data.length;
    canv.height = data.length;
   
    var ctx = canv.getContext("2d");
    
    var maxval = 0;
    for (var i = 0; i < data.length; i++){
      for (var j = 0; j < data[i].length; j++){
        if (data[i][j] > maxval){
          maxval = data[i][j]
        }
      }
    }
    data = that.boxFilter(data,maxval,3);
    maxval = 0;
    for (var i = 0; i < data.length; i++){
      for (var j = 0; j < data[i].length; j++){
        if (data[i][j] > maxval){
          maxval = data[i][j]
        }
        if (data[i][j] > 0.5){
          ctx.fillStyle = CONST.COLOR.DARK;
          ctx.fillRect(j,i,1,1);
        }
      }
    }
    
    var discrete = [];
    for (var i = 0; i < data.length; i++){
      discrete.push([]);
      for (var j = 0; j < data[i].length; j++){
        var v = Math.round(data[i][j]/maxval * lvl);
        discrete[discrete.length-1].push(v);
      }
    }
    for (var i = 1; i < discrete.length-1; i++){
      for (var j = 1; j < discrete[i].length-1; j++){
        
        //ctx.fillStyle = Okb.color.css(discrete[i][j]*255/lvl);
        //ctx.fillRect(j,i,1,1);
        
        if (discrete[i][j-1] != discrete[i][j] || discrete[i-1][j] != discrete[i][j] || discrete[i+1][j] != discrete[i][j] || discrete[i][j+1] != discrete[i][j]){
          ctx.fillStyle = CONST.COLOR.LIGHT;
          ctx.fillRect(j,i,1,1);
        }
      }
    }
    return canv;
  }  
  that.boxFilter = function(data,maxval,radius){
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari){
      console.log("safari detected. using homemade box filter")
      var result = [];
      for (var k = 0; k < radius; k++){
        for (var i = 1; i < data.length-1; i++){
          result.push([])
          for (var j = 1; j < data[i].length-1; j++){
            result[result.length-1].push((
              data[i-1][j-1]+data[i-1][j]+data[i-1][j+1]+
              data[i][j-1]+data[i][j]+data[i][j+1]+
              data[i+1][j-1]+data[i+1][j]+data[i+1][j+1])/9)
          }
        }
        data = result;
        result = []
      }
      return data;    
    }
    
    
    
    var canvas = document.createElement("canvas");
    canvas.width = data[0].length;
    canvas.height = data.length;
    var context = canvas.getContext("2d");
    var img = [];
    for (var i = 0; i < data.length; i++){
      for (var j = 0; j < data[i].length; j++){
        img.push(255*data[i][j]/maxval,255*data[i][j]/maxval,255*data[i][j]/maxval,255);
      }
    }
    var palette = context.getImageData(0,0,canvas.width,canvas.height); //x,y,w,h
    // Wrap your array as a Uint8ClampedArray
    palette.data.set(new Uint8ClampedArray(img)); // assuming values 0..255, RGBA, pre-mult.
    // Repost the data.
    context.putImageData(palette,0,0);
    var canv = document.createElement("canvas");
    canv.width = data.length;
    canv.height = data.length;
    var ctx = canv.getContext("2d");
    ctx.filter = `blur(${radius}px)`
    ctx.drawImage(canvas,0,0);
    var imgdata = ctx.getImageData(0,0,canv.width,canv.height).data;
    var result = []
    for (var i = 0; i < data.length; i++){
      result.push([])
      for (var j = 0; j < data[i].length; j++){
        result[result.length-1].push(imgdata[(i*data[i].length+j)*4]/maxval);
      }
    }
    // document.body.appendChild(canvas);
    // document.body.appendChild(canv);
    return result;
  }
                             
  that.plot = function(canv,coords,w0){
    if (w0 == undefined){w0 = CONST.SIZE.TERRAIN}
    var ctx = canv.getContext('2d');
    for (var i = 0; i < coords.length; i++){
      var pt = coords[i];
      var xf = (pt.x/CONST.SIZE.TERRAINGRID+w0/2)*canv.width/w0;
      var zf = (pt.z/CONST.SIZE.TERRAINGRID+w0/2)*canv.width/w0;
      if (pt.style == "box"){
        ctx.strokeStyle = pt.color || CONST.COLOR.WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(xf-pt.size/2,zf-pt.size/2,pt.size,pt.size);
      }else if (pt.style == "dot"){
        ctx.fillStyle = pt.color || CONST.COLOR.WHITE;
        ctx.fillRect(xf,zf,2,2);
      }else if (pt.style == "triangle"){
        ctx.strokeStyle = pt.color || CONST.COLOR.WHITE;
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(xf,zf);
        ctx.rotate(pt.rot);
        ctx.beginPath();
          ctx.moveTo(pt.size/2,0);
          ctx.lineTo(-pt.size/2,-pt.size/4);
          ctx.lineTo(-pt.size/2,pt.size/4);
          ctx.lineTo(pt.size/2,0);
        ctx.stroke();
        
        ctx.restore();
      }
    }
  }
  that.plotClusters = function(canv,clusters,mouse){
    var ctx = canv.getContext('2d');
    var isover = false;
    for (var i = 0; i < clusters.length; i++){
      var pt = clusters[i].center;
      var xf = (pt.x/CONST.SIZE.TERRAINGRID+CONST.SIZE.TERRAIN/2)*canv.width/CONST.SIZE.TERRAIN;
      var zf = (pt.y/CONST.SIZE.TERRAINGRID+CONST.SIZE.TERRAIN/2)*canv.width/CONST.SIZE.TERRAIN;
      
      var d = Okb.vector.distance([xf,zf],mouse);
      
      ctx.fillStyle = CONST.COLOR.OVERLAY;
      ctx.strokeStyle = CONST.COLOR.LIGHT;
      ctx.lineWidth = 2;
      ctx.lineJoin = "miter";
      ctx.save();
      ctx.translate(xf,zf);
      if (d < 14){
        ctx.scale(1.2,1.2);
      }
      ctx.beginPath();
        ctx.arc(0, -14, 4, 0, 2 * Math.PI);
        ctx.moveTo(0,0);
        ctx.lineTo(0,-10);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
      
      var g = clusters[i].samples.length+1;
      var w = canv.width/g;
      var iw = w * 0.6;
      if (d < 14){
        isover = true;
        ctx.lineWidth = 1;
        
        ctx.fillStyle = CONST.COLOR.DARK;
        ctx.strokeStyle = CONST.COLOR.WHITE;
        
        ctx.fillRect(0,canv.height-w,w*g,w);
        ctx.strokeRect(0,canv.height-w,w*g,w);
        
        
        ctx.lineJoin = "round";
        for (var j = 0; j < clusters[i].samples.length; j++){
          var skin = clusters[i].samples[j].skin;
          var rect = Okb.geometry.rectangleBound(skin);
          var scl = iw/Math.max(rect.width,rect.height)
          skin = skin.map((p)=>Object.assign({},p,{x:(p.x-rect.x)*scl+(w-rect.width*scl)/2+w*j,y:canv.height-w+(p.y-rect.y)*scl+(w-rect.height*scl)/2}))
          console.log(skin);
          doodleMeta.drawSkin(canv,skin);
        }
        ctx.fillStyle =CONST.COLOR.WHITE;
        ctx.font = iw*0.5+"px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; 
        ctx.fillText(" "+clusters[i].count+"+",(g-1)*w+iw/2,canv.height-w/2);
      }
      
    }
    if (isover){
      canv.style.cursor = "pointer";
    }else{
      canv.style.cursor = "crosshair";
    }
    // ctx.fillStyle = "red";
    // ctx.fillRect(mouse.x,mouse.y,10,10);
  }
  
  that.test = function(){
    for (var i = 0; i < 10; i++){
      var terrain = sharedTools.terrain.generate();
      var canv = minimap.generate(terrain);
      document.body.appendChild(canv);
    }
  }
                             
}

