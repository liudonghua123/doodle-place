/* global describe Tone Midi THREE Okb CONST sharedTools doodleRig doodleAnimate doodleSerial instruction*/
var doodleMusic = new function(){
  var that = this;
  var midi;
  var synths = [];
  var timeouts = [];
  
  var _did_drag = false;
  
  that.measures_to_load = 12;
  that.ticks_to_load = undefined;
  that.beat_per_minute = undefined;
  that.millis_per_tick = undefined;
  that.second_per_tick = undefined;
  that.tick_per_quaternote = undefined;
  that.quaternote_per_beat = undefined;
  that.millis_per_beat = undefined;
  that.beat_per_measure = undefined;
  that.tick_per_measure = undefined;
  

  that.time_offset = 0;

  var upl_div = document.createElement("div");
  upl_div.style.position = "absolute";
  upl_div.style.width = "500px";
  upl_div.style.height = "500px";
  // upl_div.style.border = "5px dashed white";
  upl_div.style.zIndex = 10;
  upl_div.style.display = "none";
  var upl_inp = document.createElement("input");
  upl_inp.type = "file";
  upl_inp.accept = "audio/midi";
  upl_inp.style.opacity = 0;
  upl_inp.style.width = upl_inp.style.height = "100%";
  
  upl_div.appendChild(upl_inp);
  document.body.appendChild(upl_div);
  
  upl_div.addEventListener("dragenter", () => {_did_drag = true; upl_div.style.border = `1px dashed ${CONST.COLOR.LIGHT}`})
  upl_div.addEventListener("dragleave", () => {upl_div.style.border = "none"})
  upl_div.addEventListener("drop", () => {_did_drag = true; upl_div.style.border = "none"})
  upl_inp.addEventListener("change", e => {
    const files = e.target.files
    if (files.length > 0){
      const file = files[0]
      parseFile(file)
    }
  })
  function parseFile(file){
    //read the file
    const reader = new FileReader()
    reader.onload = function(e){
      var m = new Midi(e.target.result)
      that.stop();
      useMIDI(m);
    }
    reader.readAsArrayBuffer(file)
  }

  
  function useMIDI(m){
    midi=m;
    console.log(midi);
    
    // parsed
    that.beat_per_minute = midi.header.tempos[0].bpm
    that.beat_per_measure = midi.header.timeSignatures[0].timeSignature[0];
    that.quaternote_per_beat = 4/midi.header.timeSignatures[0].timeSignature[1];
    that.tick_per_quaternote = midi.header.ppq;
    that.tick_per_beat = that.tick_per_quaternote * that.quaternote_per_beat;
    
    //inferred
    that.millis_per_beat = (1/that.beat_per_minute) * 60 * 1000;
    that.millis_per_tick = that.millis_per_beat / that.tick_per_beat;
    that.second_per_tick = that.millis_per_tick / 1000;
    that.tick_per_measure = that.tick_per_beat * that.beat_per_measure;
    
    if (midi.header.timeSignatures.length > 1){
      that.ticks_to_load = midi.header.timeSignatures[1].ticks;
      that.measures_to_load = that.ticks_to_load / that.tick_per_measure;
    }else{
      that.ticks_to_load = that.measures_to_load * that.tick_per_measure;
    }
    console.log(that.tick_per_quaternote,that.quaternote_per_beat,that.tick_per_beat,that.millis_per_beat)
    for (var i = timeouts.length-1; i >= 0;  i--){
      console.log("cancel force stop");
      clearTimeout(timeouts[i]);
      timeouts.splice(i,1);
    }
  }
  
  Midi.fromUrl("https://cdn.glitch.com/13d5d296-8e8b-4b85-a837-48c9d3f9d588%2Fhmk.mid?1556581347330").then((m)=>{
    useMIDI(m);
  });

  Tone.Master.volume.value = 0;

  that.play= function(frame,vol){
    if (!midi){
      return
    }
    if (!synths.length){
      const now = Tone.now() + 1;
      that.time_offset = (new Date()).getTime() + 1000;
      var sent_stop = false;
      midi.tracks.forEach(track => {
        //create a synth for each track
        const synth = new Tone.PolySynth(10, Tone.Synth, {
          envelope : {
            attack : 0.02,
            decay : 0.1,
            sustain : 0.3,
            release : 1
          }
        }).toMaster()
        synths.push(synth)
        //schedule all of the events
        track.notes.forEach(note => {
          if (note.ticks >= that.ticks_to_load){
            // console.log(1000 + note.ticks*that.millis_per_tick);
            if (!sent_stop){
              var tout = setTimeout(function(){that.stop();console.log("forced stop");}, 1000 + note.ticks*that.millis_per_tick);
              timeouts.push(tout);
            }
            sent_stop = true;
            return;
          }
          // console.log(note.time, note.ticks*that.second_per_tick, note.ticks, that.second_per_tick);
          synth.triggerAttackRelease(note.name, note.durationTicks * that.second_per_tick, now + note.ticks*that.second_per_tick, note.velocity)
        })
      })
      
    }
    Tone.Master.volume.value = Okb.math.map(vol,0,1,-40,10);
  }

  that.stop = function(){
    // console.log("stop!");
    for (var i = synths.length-1; i >= 0; i--){
      synths[i].dispose()
      synths.splice(i,1);
    }
    
  }
  
  var obj = undefined;
  var bbox = undefined;
  var _bbox_set = false;
  var skin;
  var nodes;
  that.x = 0;
  that.y = 0;
  
  var dyoff = 0;
  var dscale = 1;
  
  
  that.setup = function(globe,x,z){
    if (!CONST.ENV.ISCHROME){
      // return;
    }
    that.x = x;
    that.z = z;
    var serialized = `{"nodes":[{"th":0,"r":0,"type":"root","parent":-1,"children":[1]},{"th":-33,"r":7,"type":"edge","parent":0,"children":[2]},{"th":10,"r":15,"type":"edge","parent":1,"children":[3]},{"th":6,"r":21,"type":"node","parent":2,"children":[4,7]},{"th":41,"r":29,"type":"edge","parent":3,"children":[5]},{"th":10,"r":28,"type":"edge","parent":4,"children":[6]},{"th":8,"r":20,"type":"leaf","parent":5,"children":[]},{"th":-101,"r":19,"type":"edge","parent":3,"children":[8]},{"th":4,"r":25,"type":"edge","parent":7,"children":[9]},{"th":-2,"r":28,"type":"edge","parent":8,"children":[10]},{"th":-2,"r":26,"type":"edge","parent":9,"children":[11]},{"th":14,"r":22,"type":"edge","parent":10,"children":[12]},{"th":24,"r":24,"type":"edge","parent":11,"children":[13]},{"th":2,"r":28,"type":"edge","parent":12,"children":[14]},{"th":-9,"r":26,"type":"leaf","parent":13,"children":[]}],"strokes":[[[-51,-167],[-51,-170],[-50,-173],[-48,-176],[-47,-179],[-45,-180],[-44,-182],[-42,-184],[-40,-185],[-38,-186],[-35,-187],[-32,-187],[-29,-187],[-27,-188],[-26,-190],[-24,-193],[-22,-195],[-20,-196],[-18,-198],[-15,-199],[-12,-199],[-10,-200],[-7,-200],[-4,-200],[-1,-200],[2,-200],[4,-199],[7,-199],[10,-199],[13,-199],[15,-198],[17,-197],[18,-195],[19,-193],[20,-191],[21,-189],[22,-187],[23,-184],[26,-183],[28,-182],[30,-180],[31,-178],[32,-176],[33,-174],[33,-171],[33,-168],[33,-165],[35,-164],[36,-162],[37,-160],[38,-158],[39,-155],[39,-152],[39,-149],[39,-146],[39,-143],[37,-142],[36,-140],[35,-138],[33,-137],[32,-135],[30,-134],[29,-132],[30,-130],[30,-127],[29,-123],[27,-120],[26,-116],[24,-114],[23,-112],[21,-110],[19,-108],[16,-105],[14,-104],[11,-103],[9,-102],[7,-101],[6,-99],[8,-98],[10,-97],[11,-95],[11,-92],[10,-90],[8,-88],[6,-86],[4,-85],[1,-83],[-2,-82],[-6,-81],[-10,-81],[-13,-81],[-16,-80],[-17,-78],[-18,-76],[-21,-73],[-23,-71],[-25,-69],[-28,-67],[-30,-66],[-34,-64],[-36,-63],[-39,-63],[-44,-63],[-47,-63],[-50,-63],[-52,-64],[-54,-65],[-56,-66],[-58,-67],[-58,-70],[-58,-73],[-58,-76],[-60,-77],[-63,-77],[-66,-77],[-68,-78],[-70,-79],[-72,-80],[-73,-82],[-73,-85],[-73,-89],[-73,-92],[-74,-94],[-75,-96],[-75,-99],[-75,-103],[-75,-107],[-75,-111],[-74,-113],[-73,-116],[-72,-118],[-71,-120],[-72,-122],[-73,-124],[-74,-126],[-74,-129],[-74,-132],[-74,-136],[-74,-140],[-73,-143],[-72,-145],[-71,-147],[-70,-149],[-68,-150],[-68,-153],[-67,-156],[-66,-158],[-64,-159],[-62,-160],[-59,-160],[-59,-163],[-57,-164],[-55,-165]],[[-73,-98],[-69,-98],[-65,-98],[-62,-98],[-59,-99],[-56,-99],[-52,-99],[-47,-99],[-42,-99],[-37,-99],[-34,-99],[-30,-99],[-26,-99],[-22,-98],[-20,-97],[-18,-96],[-15,-95],[-12,-94],[-9,-93]],[[-72,-124],[-69,-124],[-66,-124],[-63,-124],[-59,-124],[-56,-124],[-53,-124],[-49,-124],[-46,-124],[-43,-122],[-40,-121],[-37,-119],[-35,-118],[-32,-117],[-30,-116],[-28,-115],[-26,-113],[-22,-112],[-20,-110],[-18,-109],[-16,-108],[-14,-107],[-12,-105],[-10,-104],[-8,-102],[-6,-100]],[[-58,-157],[-55,-157],[-52,-157],[-49,-157],[-45,-157],[-41,-156],[-37,-154],[-32,-151],[-28,-149],[-26,-148],[-24,-146],[-21,-145],[-20,-143],[-18,-142],[-16,-141],[-15,-139],[-12,-137],[-11,-135],[-9,-132],[-7,-130],[-5,-128],[-4,-126],[-2,-124],[0,-121],[1,-119],[2,-117]],[[-23,-187],[-23,-183],[-23,-180],[-23,-177],[-23,-174],[-21,-171],[-18,-163],[-15,-160],[-14,-156],[-11,-152],[-10,-150],[-9,-148],[-6,-145],[-5,-142],[-4,-140],[-3,-138],[-1,-135],[0,-133],[1,-131],[2,-129],[3,-126]],[[3,-197],[3,-194],[2,-188],[2,-185],[3,-181],[5,-177],[5,-172],[6,-167],[7,-161],[8,-158],[8,-154],[9,-152],[10,-149],[11,-144],[12,-141],[14,-139],[15,-137],[16,-135]],[[25,-176],[25,-173],[25,-169],[25,-165],[25,-161],[25,-158],[25,-154],[25,-150],[25,-146],[25,-142],[25,-139],[26,-136],[27,-134],[29,-132]],[[-51,-70],[-48,-72],[-45,-73],[-42,-74],[-40,-75],[-36,-76],[-33,-77],[-30,-78],[-27,-78],[-25,-79],[-22,-79]],[[33,-134],[33,-131],[33,-128],[33,-124],[33,-120],[35,-119],[36,-116],[37,-113],[39,-112],[40,-110],[42,-108],[44,-106],[46,-104],[48,-103],[50,-101],[52,-100],[54,-98],[57,-97],[59,-95],[61,-94],[63,-92],[65,-91],[67,-89],[69,-88],[71,-87],[73,-85],[75,-84],[77,-83],[79,-81],[76,-81],[74,-82],[71,-82],[68,-82],[65,-82],[62,-82],[59,-83],[56,-83],[53,-83],[50,-83],[48,-84],[45,-84],[42,-84],[39,-84],[36,-84],[34,-85],[31,-85],[28,-85],[25,-85],[21,-85],[17,-84],[14,-83],[11,-82],[9,-81],[7,-80],[5,-79],[3,-78],[0,-77],[-3,-77],[-6,-77]],[[68,-81],[71,-81],[74,-80],[76,-79],[76,-76],[77,-74],[77,-71],[77,-68],[76,-65],[74,-64],[72,-63],[69,-63],[66,-63],[63,-63],[60,-63],[57,-63],[54,-63],[51,-63],[48,-63],[45,-63],[42,-63],[39,-63],[37,-62],[37,-59],[37,-56],[40,-56],[43,-56],[46,-56],[49,-56],[52,-56],[55,-56],[58,-56],[61,-56],[64,-56],[67,-56],[69,-57],[72,-57],[74,-58],[76,-59],[78,-60],[79,-62],[79,-65],[79,-68],[80,-70],[80,-73],[80,-76],[79,-78]],[[37,-51],[37,-54],[36,-56],[34,-58],[32,-59],[29,-59],[26,-59],[25,-57],[24,-55],[24,-52],[26,-51],[28,-50],[30,-49],[32,-48],[34,-47],[37,-47],[39,-48],[40,-50],[40,-53],[39,-56],[37,-58],[35,-60],[33,-61],[30,-61],[27,-61],[26,-59],[26,-56],[26,-53],[28,-52],[29,-50],[32,-50],[35,-50],[37,-51],[38,-53],[38,-56],[38,-59],[37,-61],[35,-62],[32,-62]],[[25,-51],[21,-51],[18,-51],[13,-51],[10,-51],[6,-51],[2,-51],[0,-50],[-2,-49],[-4,-48],[-7,-48],[-9,-47],[-11,-46],[-13,-45],[-15,-44],[-17,-43],[-13,-43],[-10,-43],[-6,-43],[-3,-42],[0,-42],[4,-42],[7,-42],[10,-42],[13,-42],[16,-42],[19,-42],[23,-42],[26,-42],[29,-42],[32,-41],[36,-41],[39,-41],[42,-41],[45,-41],[48,-41],[51,-41],[54,-41],[58,-41],[61,-41],[64,-41],[67,-41],[70,-41],[73,-41],[76,-41],[78,-42],[77,-44],[75,-45],[73,-46],[71,-47],[68,-47],[65,-48],[62,-48],[60,-49],[57,-50],[54,-50],[51,-50],[48,-50],[46,-51]],[[-41,-30],[-38,-30],[-35,-30],[-31,-30],[-28,-30],[-25,-30],[-22,-30],[-19,-30],[-15,-30],[-12,-30],[-8,-30],[-4,-30],[0,-30],[3,-30],[7,-30],[10,-30],[13,-30],[16,-30],[19,-30],[22,-30],[25,-30],[28,-30],[31,-30],[34,-30],[37,-30],[39,-29],[39,-26],[39,-23],[39,-19],[39,-16],[39,-13],[39,-10],[39,-6],[40,-2],[40,1],[40,5],[40,8],[40,11],[41,13],[41,16],[41,19],[41,22],[41,25],[41,28],[39,29],[36,29],[33,29],[29,29],[26,29],[23,29],[20,29],[17,30],[14,30],[11,30],[8,30],[5,30],[2,30],[-2,30],[-5,30],[-8,30],[-11,30],[-14,30],[-17,30],[-20,30],[-23,30],[-26,30],[-29,30],[-31,29],[-33,28],[-34,26],[-34,23],[-34,20],[-34,17],[-35,13],[-35,10],[-35,7],[-35,3],[-36,0],[-36,-3],[-36,-6],[-37,-10],[-37,-14],[-37,-18],[-37,-21],[-38,-23],[-38,-26],[-38,-29],[-38,-32],[-36,-33],[-33,-33],[-31,-34],[-29,-35],[-26,-36],[-23,-37],[-20,-38],[-18,-39],[-16,-40]],[[37,-30],[40,-30],[43,-31],[45,-32],[48,-33],[52,-33],[54,-34],[58,-34],[60,-35],[64,-35],[68,-35],[70,-36],[73,-37],[76,-37],[78,-38],[81,-38],[83,-39],[86,-40],[89,-41],[93,-42],[96,-42],[98,-43],[101,-43],[99,-44],[96,-44],[93,-45],[89,-45],[86,-46],[83,-46],[80,-46],[77,-47],[74,-47],[71,-47]],[[41,29],[44,29],[47,29],[50,29],[53,28],[57,27],[60,27],[62,26],[64,25],[67,25],[70,25],[73,24],[75,23],[78,22],[81,22],[83,21],[86,20],[88,19],[91,18],[94,17],[97,16],[99,15],[101,14]],[[100,-44],[100,-41],[100,-37],[100,-33],[100,-28],[100,-24],[100,-19],[100,-16],[100,-13],[100,-9],[100,-6],[100,-3],[100,0],[100,3],[100,6],[101,8],[101,11],[102,13]],[[73,-22],[77,-22],[80,-22],[83,-22],[86,-22],[89,-22],[92,-22],[94,-21],[94,-18],[94,-13],[93,-10],[93,-7],[92,-5],[92,-1],[91,2],[90,5],[90,9],[90,13],[90,17],[90,20],[90,23],[91,25],[93,26],[95,27],[98,27],[101,28],[104,28],[108,28],[110,29],[113,29],[116,29],[114,28],[112,27],[110,26],[107,25],[104,25],[102,24],[99,24],[96,24],[93,24],[91,23],[90,21],[88,19],[87,17],[86,14],[86,10],[86,7],[86,3],[86,0],[86,-3],[86,-6],[86,-9],[87,-12],[86,-14],[83,-14],[80,-14],[78,-16],[76,-17],[75,-19]],[[-11,-8],[-11,-5],[-11,-2],[-8,-1],[-4,-1],[-1,-1],[1,-2],[1,-5],[1,-8],[-1,-9],[-5,-9],[-8,-9],[-11,-9],[-13,-10]],[[-31,25],[-26,25],[-21,25],[-18,25],[-15,25],[-12,25],[-9,25],[-6,25],[-2,25],[1,25],[4,25],[7,25],[10,25],[13,25],[16,25],[19,25],[22,25],[25,25],[28,25],[31,25],[34,25],[37,25],[39,24],[41,23],[43,22],[45,20],[47,19],[50,19],[52,18],[55,17],[58,17],[60,16],[63,15],[65,14],[68,13],[71,13],[73,12],[76,12],[78,11]],[[-38,-56],[-35,-56],[-32,-56],[-30,-57],[-28,-58],[-26,-59],[-24,-60],[-22,-61],[-21,-63],[-19,-64],[-18,-66],[-16,-67],[-15,-69],[-13,-70],[-12,-72],[-11,-74],[-9,-75],[-6,-75],[-4,-76],[-1,-76],[2,-77],[5,-77],[7,-78],[9,-79],[11,-80],[12,-82],[14,-83],[16,-84],[16,-87],[17,-89],[17,-92],[17,-95],[17,-98],[18,-100],[19,-102],[22,-103],[24,-105],[26,-107],[28,-110],[29,-112],[30,-114],[31,-117],[32,-120],[33,-123],[34,-125],[34,-128],[34,-131],[36,-132],[38,-134],[40,-135],[42,-137],[44,-139],[46,-141],[47,-143],[48,-145],[48,-148],[48,-151],[48,-154],[48,-157],[47,-159],[46,-162],[45,-164],[44,-166],[42,-167],[40,-168],[40,-171],[40,-174],[40,-177],[40,-180],[40,-183],[40,-186],[40,-189],[38,-190],[36,-191],[34,-192],[31,-193],[28,-193],[25,-193],[24,-195],[23,-197],[21,-199],[19,-201],[17,-202],[15,-203],[13,-204],[10,-204],[7,-204],[4,-204],[2,-203],[-1,-203],[-3,-202],[-5,-201],[-9,-201],[-12,-201],[-15,-201],[-18,-201],[-21,-201],[-23,-200],[-24,-198],[-26,-197],[-27,-195],[-28,-193],[-29,-191],[-31,-190],[-31,-187],[-34,-187],[-36,-188],[-39,-188],[-42,-188],[-45,-188],[-47,-187],[-50,-186],[-52,-185],[-54,-183],[-56,-182],[-57,-180],[-58,-178],[-59,-175],[-59,-172],[-60,-170],[-61,-168],[-63,-167],[-65,-166],[-67,-165],[-69,-164],[-70,-162],[-71,-160],[-72,-158],[-73,-156],[-74,-154],[-74,-151],[-74,-148],[-74,-145],[-74,-141],[-74,-138],[-74,-135],[-73,-133],[-72,-131],[-72,-128],[-72,-125],[-73,-122],[-74,-120],[-75,-118],[-76,-116],[-77,-114],[-78,-112],[-78,-109],[-79,-106],[-79,-103],[-78,-101],[-78,-98],[-77,-96],[-76,-94],[-75,-91],[-74,-88],[-73,-86],[-72,-84],[-71,-82],[-71,-79],[-71,-76],[-71,-73],[-69,-72],[-67,-71],[-65,-70],[-63,-69],[-61,-67],[-59,-66],[-58,-64],[-57,-62],[-55,-61],[-52,-61],[-49,-61],[-45,-61],[-43,-62],[-41,-63]],[[-12,-92],[-12,-95],[-12,-98],[-12,-101],[-12,-104],[-11,-107],[-10,-109],[-9,-111],[-8,-113],[-6,-116],[-5,-118],[-3,-120],[-1,-121],[0,-123],[2,-124],[4,-126],[7,-128],[10,-130],[12,-131],[13,-133],[15,-134],[17,-135],[19,-136],[17,-133],[15,-130],[12,-127],[10,-125],[9,-123],[8,-121],[6,-120],[5,-118],[3,-117],[1,-115],[-1,-112],[-2,-110],[-3,-108],[-4,-106],[-5,-104],[-5,-101],[-5,-98],[-5,-95],[-4,-98],[-3,-101],[-2,-103],[-1,-105],[1,-106],[2,-109],[4,-110],[6,-112],[8,-113],[10,-115],[13,-117],[15,-118]],[[-13,-42],[-10,-42],[-7,-42],[-4,-42],[-1,-42],[1,-41],[4,-41],[7,-41],[9,-40],[12,-40],[15,-40],[18,-40],[21,-40],[24,-40],[27,-40],[30,-40],[33,-40],[35,-41],[38,-41],[40,-42],[43,-42]]],"type":"plantoid"}`;
    var deserialized = doodleSerial.deserialize(serialized);
    skin = deserialized.skin;
    nodes = deserialized.nodes;
        
    obj = new THREE.Group();
    globe.Scene.add( obj );

    for (var j = 0; j < skin.length; j+=1){
      if (!skin[j].connect){
        var geometry = new THREE.Geometry();
        var line = new THREE.Line( geometry, globe.LineMaterial );
        obj.add(line);
      }
      obj.children[obj.children.length-1].geometry.vertices.push(new THREE.Vector3(skin[j].x*globe.X2WORLD, skin[j].y*globe.Y2WORLD,0));
    }
    
    instruction(
      "DROP A MIDI FILE ONTO GRAMOPHONE",
      function(){
        var d = Okb.vector.distance([globe.Player.x,globe.Player.z],[that.x,that.z]);
        if (d < 5){
          return true;
        }else{
          return false;
        }
      },function(){
        var d = Okb.vector.distance([globe.Player.x,globe.Player.z],[that.x,that.z]);
        if (d > 8){
          return true;
        }else{
          return false;
        }
      },function(){
        return _did_drag;
      }
    );
    
    return obj;
  }
  
  function permuteMinMax(minv, maxv){
    return [
      {x:minv.x,y:minv.y,z:minv.z},
      {x:maxv.x,y:minv.y,z:minv.z},
      {x:minv.x,y:maxv.y,z:minv.z},
      {x:maxv.x,y:maxv.y,z:minv.z},
      {x:minv.x,y:minv.y,z:maxv.z},
      {x:maxv.x,y:minv.y,z:maxv.z},
      {x:minv.x,y:maxv.y,z:maxv.z},
      {x:maxv.x,y:maxv.y,z:maxv.z},
    ]
  }

  that.update = function(globe){
    if (!CONST.ENV.ISCHROME){
      // return;
    }
    
    var d = Okb.vector.distance([globe.Player.x,globe.Player.z],[that.x,that.z]);
    if (d<8){
      CONST.ANIMMODE = 2;
    }else{
      CONST.ANIMMODE = 0;
    }
    if (d < 15){
      that.play(globe.FrameCount,Math.min(Math.max(Okb.math.map(d,5,10,1,0),0),1));
    }else{
      that.stop();
    }
    if (globe.Terrain.data){
      doodleAnimate.dance(nodes,skin,doodleMusic);
      var idx = -1;
      var jdx = 0;
      var bd = Okb.geometry.bound(skin);
      if (-CONST.SIZE.DOODLE <= bd[1].y && bd[1].y < CONST.SIZE.DOODLE*2){
        dyoff = Okb.math.lerp(dyoff,bd[1].y*globe.Y2WORLD*dscale-0.2,0.2);
      }
      for (var j = 0; j < skin.length; j+=1){
        if (!skin[j].connect){
          if (idx != -1){
            obj.children[idx].geometry.computeBoundingSphere();
          }
          idx ++;
          jdx = j;
        }
        obj.children[idx].geometry.verticesNeedUpdate  = true;
        // console.log(skin[j].x*globe.X2WORLD*dscale, +skin[j].y*globe.Y2WORLD*dscale-dyoff);
        obj.children[idx].geometry.vertices[j-jdx] = new THREE.Vector3(skin[j].x*globe.X2WORLD*dscale, +skin[j].y*globe.Y2WORLD*dscale-dyoff,0);
      }
      obj.children[idx].geometry.computeBoundingSphere();
      
      
      obj.position.set(that.x,sharedTools.terrain.getAt(globe.Terrain.data,that.x,that.z),that.z);
      obj.lookAt(globe.Player.x,obj.position.y,globe.Player.z);
      
      if (!_bbox_set){
        bbox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(obj.position.x, obj.position.y+1.5, obj.position.z), new THREE.Vector3(1.5,2,1.5));
        console.log(bbox);
        _bbox_set = true;
      }
      
      if (d < 10){
        var pts = permuteMinMax(bbox.min,bbox.max).map(globe.space2screen);
        var rect = Okb.geometry.rectangleBound(pts);
        upl_div.style.left = rect.x + "px";
        upl_div.style.top = rect.y+ "px";
        upl_div.style.width = rect.width + "px";
        upl_div.style.height = rect.height + "px";
        upl_div.style.display = "block";
        
      }else{
        upl_div.style.display = "none";
      }
      

      
    }
  
    
  }
  
}