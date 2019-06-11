
var CONST = {
  COLOR : {
    BLACK: "black",
    WHITE: "white",
    DARK: "rgb(20,20,20)",
    LIGHT: "silver",
    OVERLAY: "rgba(255,255,255,0.3)",
    DARKOVERLAY: "rgba(0,0,0,0.5)",
    HINT: "gray",
  },
  SIZE :{
    DOODLE: 256,
    ICON: 20,
    ERASER: 10,
    CHAMFER: 3,
    TEXT: 14,
    MARGIN: 5,
    TERRAIN: 256,
    TERRAINGRID: 1,
    TERRAINHEIGHT: 50,
    ALTTERRAIN: 64,
    ALTTERRAINX:0,
    ALTTERRAINZ:256/2+64/2-1,
    FAR: 40,
    MINPOINTS: 20,
    SERVELIMIT: 400,
    LOADLIMIT: 300,
    MINIMAP: 200,
  },
  ENV:{},
  ANIMMODE:2,
}

CONST.ENV.ISNODE = typeof document == 'undefined' || typeof navigator == 'undefined'
if (!CONST.ENV.ISNODE){
  CONST.ENV.ISMOBILE = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent))
  if (window.chrome){
    CONST.ENV.ISCHROME = true;
  }else{
    CONST.ENV.ISCHROME = false;
  }
}
if (CONST.ENV.ISMOBILE){
  CONST.SIZE.MINIMAP = 100;
}

const SVGICONS = {
  pencil:`<path d="M0,32 L0,24 L16,8 L24,16 L8,32 z" %FILL/><path d="M18,6 L26,14 L32,8 L24,0 z" %FILLL/>`,
  eraser:`<path d="M0,20 L20,0 L32,12 L12,32 L8,32 L0,24 z" %STROKE/><path d="M4,16 L18,2 L30,14 L16,28 z" %FILL/>`,
  trash:`<path d="M6,8 L26,8 L24,32 L8,32 z" %FILL/><path d="M4,2 L12,2 L14,0 L18,0 L20,2 L28,2 L28,6 L4,6 z" %FILL/>`,
  nodes:`<path d="M0,20 L12,20 L12,32 L0,32 z" %STROKE/><path d="M2,4 L12,4 L12,14 L2,14 z" %STROKE/>
         <path d="M20,22 L28,22 L28,30 L20,30 z" %STROKE/><path d="M18,0 L28,0 L28,10 L18,10 z" %STROKE/><path d="M18,10 L12,20" %STROKE/>
         <path d="M18,5 L12,9" %STROKE/><path d="M23,10 L24,22" %STROKE/>`,
  close:`<path d="M0,0 L32,32 M32,0 L0,32" %STROKE/>`,
  dice:`<path d="M0,8 L0,24 L16,32 L16,16 z" %STROKE/><path d="M32,8 L32,24 L16,32 L16,16 z" %STROKE/><path d="M0,8 L16,0 L32,8 L16,16 z" %STROKE/>
        <path d="M 16 5 a 4 2 0 1 0 0.01 0 z" %FILL/><path d="M 5 13 a 2 2 0 1 0 0.01 0 z" %FILL/><path d="M 11 22 a 2 2 0 1 0 0.01 0 z" %FILL/>
        <path d="M 21 22 a 2 2 0 1 0 0.01 0 z" %FILL/><path d="M 27 13 a 2 2 0 1 0 0.01 0 z" %FILL/><path d="M 24 17.5 a 2 2 0 1 0 0.01 0 z" %FILL/>`,
  mammaloid:`<path d="M2,12 L3,20 L2,32 L4,32 L6,22 L6,32 L8,32 L10,20 L14,21 L22,19 L22,32 L24,32 L26,22 L26,32 L28,32 30,16 26,10 L16,10 L4,8 L8,4 L4,0 L0,4 L4,8 z" %FILL/>`,
  humanoid:`<path d="M16,0 L12,4 L16,8 L9,8 L6,22 L8,22 L12,10 L10,32 L12,32 L16,20 L20,32 L22,32 L20,10 L24,22 L26,22 L23,8 L16,8 L20,4 z" %FILL/>`,
  fishoid:`<path d="M4,16 L0,12 L8,8 L16,8 L24,16 L32,8 L32,24 L24,16 L16,24 L8,24 L0,20 z" %FILL/>`,
  birdoid:`<path d="M0,26 L4,22 L10,22 L8,12 L16,0 L20,4 L18,10 L20,20 L24,24 L28,24 L32,26 L30,30 L24,28 L13,30 z" %FILL/>`,
  plantoid:`<path d="M16,0 L12,2 L10,8 L10,12 L6,16 L6,20 L10,24 L14,22 L14,30 L12,32 L20,32 L18,30 L18,22 L22,24 L26,20 L26,16 L22,12 L22,8 L20,2 z" %FILL/>`,
  menu:`<path d="M0,2 L32,2 L32,6 L0,6 z" %FILL/><path d="M0,14 L32,14 L32,18 L0,18 z" %FILL/><path d="M0,26 L32,26 L32,30 L0,30 z" %FILL/>`,
  flag:`<path d="M4,2 L0,32 L4,32 L8,2 z" %FILL/><path d="M10,4 L16,0 L24,4 L32,0 L32,16 L24,20 L16,16 L8,20 z" %FILL/>`,
  left:`<path d="M26,0 L6,16 L26,32" %STROKE/>`,
  right:`<path d="M6,0 L26,16 L6,32" %STROKE/>`,
  refresh:`<path d="M0,16 L8,8 L14,5 L20,4 L20,0 L32,8 L20,16 L20,11 L14,11" %FILL/><path d="M32,16 L24,24 L18,27 L12,28 L12,32 L0,24 L12,16 L12,21 L18,21" %FILL/>`,
  add:`<path d="M14,0 L18,0 L18,32 L14,32" %FILL/><path d="M0,14 L0,18 L32,18 L32,14" %FILL/>`,
}

function makeIcon(args){
  var svg = SVGICONS[args.name]
    .replace(/%STROKE/g, ` stroke-width="2" stroke="${args.color}" fill="none" stroke-linejoin="round"`)
    .replace(/%FILL/g, ` fill="${args.color}" `);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${args.width}" height="${args.height}" viewBox="-2 -2 36 36">`+svg+"</svg>"
}



function addConstantsToCss(doc){
  for (var k in CONST.COLOR){
    doc.body.style.setProperty('--'+k.toLowerCase(), CONST.COLOR[k])
  }
  for (var k in CONST.SIZE){
    doc.body.style.setProperty('--size-'+k.toLowerCase(), CONST.SIZE[k]+"px")
  }
}

if (!CONST.ENV.ISNODE ){
  addConstantsToCss(document);

  (function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();stats.dom.id="stats-dom";document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()
}else{
  module.exports = CONST  
}
