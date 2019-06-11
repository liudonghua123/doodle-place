/* global describe CONST tf tsnejs */
if (typeof document == 'undefined'){
  var tf = require('@tensorflow/tfjs');
  var { createCanvas, loadImage } = require('canvas');
  require('@tensorflow/tfjs-node');
  var tsnejs = require('tsne');
}else{
  var createCanvas = function(){return document.createElement("canvas")};
}

var doodleClassify = {}
doodleClassify.CLASS2OBJECTS = {
  "architecture":["barn","bridge","castle","church","hospital","house","skyscraper","tent","The Eiffel Tower","The Great Wall of China","windmill"],
  "bird":["bird","duck","flamingo","owl","parrot","penguin","swan"],
  "container":["bucket","coffee cup","cup","mug","suitcase","vase","wine bottle","wine glass"],
  "fish":["dolphin","fish","shark","whale"],
  "food":["birthday cake","bread","cake","carrot","cookie","donut","hamburger","hot dog","ice cream","lollipop","onion","peanut","peas","pizza","popsicle","sandwich","steak"],
  "fruit":["apple","banana","blackberry","blueberry","pear","pineapple","strawberry","watermelon"],
  "furniture":["bed","bench","chair","couch","dresser","table","toilet"],
  "garment":["belt","bowtie","bracelet","crown","hat","helmet","jacket","necklace","pants","rollerskates","shoe","shorts","sock","sweater","t-shirt","underwear"],
  "humanoid":["angel","face","teddy-bear","yoga"],
  "insect":["ant","bat","bee","butterfly","lobster","mosquito","scorpion","snail","snake","spider"],
  "instrument":["cello","clarinet","drums","guitar","harp","piano","saxophone","trombone","trumpet","violin"],
  "plant":["bush","cactus","flower","grass","mushroom","house plant","palm tree","tree"],
  "quadruped":["bear","camel","cat","cow","crocodile","dog","elephant","giraffe","hedgehog","horse","kangaroo","lion","monkey","mouse","panda","pig","rabbit","raccoon","rhinoceros","sea turtle","sheep","squirrel","tiger","zebra"],
  "ship":["aircraft carrier","canoe","sailboat","cruise ship","speedboat"],
  "technology":["calculator","camera","cell phone","computer","laptop","megaphone","microphone","microwave","radio","remote control","telephone","television"],
  "tool":["axe","broom","hammer","knife","pliers","rake","rifle","saw","shovel","sword","toothbrush"],
  "vehicle":["ambulance","bicycle","bulldozer","bus","car","firetruck","motorbike","pickup truck","police car","school bus","tractor","train","truck","van"],
}
doodleClassify.CLASSES = Object.keys(doodleClassify.CLASS2OBJECTS).sort();
doodleClassify.OBJECTS = [].concat(...doodleClassify.CLASSES.map((x)=>doodleClassify.CLASS2OBJECTS[x])).sort()
doodleClassify.NUM_OBJECTS = doodleClassify.OBJECTS.length;

doodleClassify.IMAGE_W = 32,
doodleClassify.IMAGE_H = 32,
doodleClassify.IMAGE_SIZE = doodleClassify.IMAGE_H * doodleClassify.IMAGE_W;
doodleClassify.NUM_CLASSES = doodleClassify.CLASSES.length;

doodleClassify.model = undefined;

doodleClassify.DESCRIPTION = `A <i>Quick, Draw!</i> knock-off based on a ConvNet for MNIST trained on a ${doodleClassify.CLASSES.length} class, ${doodleClassify.NUM_TRAIN_ELEMENTS} drawings re-categorized version of quickdraw containing ${doodleClassify.NUM_OBJECTS} classes of the original dataset.`

doodleClassify.load = async function(){
  if (typeof document == 'undefined'){
    doodleClassify.model = await tf.loadModel('file://public/models/drawc17.json');
  }else{
    doodleClassify.model = await tf.loadLayersModel('models/drawc17.json');
  }
}

function canvas2xs(canvas){
  var ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var arr = [];
  for (let i = 0; i < imageData.data.length / 4; i++) {
    arr[i] = imageData.data[i * 4] / 255;
  }
  const xs = tf.tensor4d(new Float32Array(arr), [1, doodleClassify.IMAGE_H, doodleClassify.IMAGE_W, 1]);
  return xs;
}

function strokes2canvas(strokes){
  var canvas = createCanvas();
  canvas.width = doodleClassify.IMAGE_W;
  canvas.height = doodleClassify.IMAGE_H;
  var context = canvas.getContext('2d');
  function brect(P){
    var xmin = Infinity
    var xmax = -Infinity
    var ymin = Infinity
    var ymax = -Infinity
    for (var i = 0; i < P.length; i++){
      if (P[i][0] < xmin){xmin = P[i][0]}
      if (P[i][0] > xmax){xmax = P[i][0]}
      if (P[i][1] < ymin){ymin = P[i][1]}
      if (P[i][1] > ymax){ymax = P[i][1]}
    }
    return {
      x:xmin,y:ymin,width:xmax-xmin,height:ymax-ymin
    }
  }
  function draw_strokes(ctx,strokes){
    for (var i = 0; i < strokes.length; i++){
      ctx.beginPath();
      for (var j = 0; j < strokes[i].length; j++){
        if (j == 0){
          ctx.moveTo(strokes[i][j][0], strokes[i][j][1]);
        }else{
          ctx.lineTo(strokes[i][j][0], strokes[i][j][1]);
        }
      }
      ctx.stroke(); 
    }
  }
  context.lineWidth = 1;
  context.fillStyle="black";
  context.fillRect(0,0,doodleClassify.IMAGE_W,doodleClassify.IMAGE_H);
  context.strokeStyle="white";
  var box = brect([].concat(...strokes));
  var scale = Math.min(doodleClassify.IMAGE_W/box.width, doodleClassify.IMAGE_H/box.height);
  draw_strokes(context,strokes.map(x=>(x.map((y)=>([(y[0]-box.x)*scale,(y[1]-box.y)*scale])))));
  return canvas
}


doodleClassify.embedRaster = function(canvas){
  
  return tf.tidy(() => {
    var xs = canvas2xs(canvas);

    const newModel = tf.model({inputs: doodleClassify.model.inputs, outputs: doodleClassify.model.layers[doodleClassify.model.layers.length-2].output}); 
    const layerActivation = newModel.predict(xs);
    // console.log(layerActivation.shape);
    return Array.from(layerActivation.dataSync());
  });
}

doodleClassify.embed = function(strokes){
  var canvas = strokes2canvas(strokes);
  return doodleClassify.embedRaster(canvas);
}

doodleClassify.predictRaster = function(canvas){
  
  return tf.tidy(() => {
    var xs = canvas2xs(canvas);

    const output = doodleClassify.model.predict(xs);
    var _probdist = output.dataSync();
    var probdist = [];
    for (var i = 0; i < doodleClassify.NUM_CLASSES; i++){
      probdist.push([doodleClassify.CLASSES[i],_probdist[i]]);
    }
    probdist.sort((a,b)=>(b[1]-a[1]));
    return probdist;
  });
}

doodleClassify.predict = function(strokes){
  var canvas = strokes2canvas(strokes);
  var probdist = doodleClassify.predictRaster(canvas);
  return {
    prediction:probdist[0][0],
    probabilityDistribution: probdist,
  }
}

doodleClassify.makeTSNE = function(embeddings){
  var opt = {}
  opt.epsilon = 10; // epsilon is learning rate (10 = default)
  opt.perplexity = 30; // roughly how many neighbors each point influences (30 = default)
  opt.dim = 2; // dimensionality of the embedding (2 = default)
  var tsne = new tsnejs.tSNE(opt); // create a tSNE instance
  tsne.initDataRaw(embeddings);
  for(var k = 0; k < 500; k++) {
    tsne.step(); // every time you call this, solution gets better
  }
  var Y = tsne.getSolution(); // Y is an array of 2-D points that you can plot
  return Y;
}



if (typeof document == 'undefined'){
  module.exports = doodleClassify;
}