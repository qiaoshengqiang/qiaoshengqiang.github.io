(function(){
'use strict';

var SVGNS = 'http://www.w3.org/2000/svg';
var VW = 1000, VH = 700;
var P_ATRIAL_END = 0.12;
var P_VENT_END = 0.42;
var BASE_FLOW = 200;
var PARTICLE_COUNT = 80;

/* ============ 路径构建 ============ */
function buildSegment(raw){
  var pts = raw.points.map(function(p){ return {x:p[0], y:p[1]}; });
  var cum = [0], len = 0, i;
  for(i=1;i<pts.length;i++){
    len += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y);
    cum.push(len);
  }
  return {
    id: raw.id, name: raw.name,
    width: raw.width || 11,
    pts: pts, cum: cum, length: len,
    entryOxy: raw.entryOxy,
    valveIn: raw.valveIn || null,
    circuit: raw.circuit
  };
}

/* ============================================================
   路径：肺动脉在肺门处分成左右两支，同时进入左肺和右肺
   ============================================================ */
var SEGMENTS = [
  /* 主动脉：左心室 → 全身 */
  buildSegment({ id:'aorta', name:'主动脉', circuit:'systemic', width:14,
    points:[
      [482,442],[540,444],[582,432],[610,404],[628,366],[638,320],
      [643,380],[645,462],[645,562],[636,626],[590,652],[468,654]
    ],
    entryOxy:true, valveIn:'aortic' }),

  /* 全身毛细血管 */
  buildSegment({ id:'systemic-capillary', name:'全身毛细血管', circuit:'systemic', width:11,
    points:[[468,654],[400,660],[332,654]], entryOxy:true }),

  /* 体静脉：全身 → 右心房 */
  buildSegment({ id:'systemic-vein', name:'体静脉', circuit:'systemic', width:11,
    points:[
      [332,654],[240,658],[180,632],[163,560],[158,440],[168,358],[210,322],[300,332]
    ],
    entryOxy:false }),

  /* 右心房 */
  buildSegment({ id:'right-atrium', name:'右心房', circuit:'pulmonary', width:9,
    points:[[300,332],[336,332],[336,400]], entryOxy:false }),

  /* 右心室 */
  buildSegment({ id:'right-ventricle', name:'右心室', circuit:'pulmonary', width:9,
    points:[[336,400],[336,450],[268,448]], entryOxy:false, valveIn:'tricuspid' }),

  /* 肺动脉：右心室 → 肺门分叉点 */
  buildSegment({ id:'pulmonary-artery', name:'肺动脉', circuit:'pulmonary', width:12,
    points:[
      [268,448],[272,400],[278,350],[285,300],[295,255],[310,215],[340,180],[380,150],[400,130]
    ],
    entryOxy:false, valveIn:'pulmonary' }),

  /* 左支：进入左肺（画面左侧）→ 肺内气体交换 */
  buildSegment({ id:'lung-a', name:'肺（左支）', circuit:'pulmonary', width:8,
    points:[
      [400,130],[370,138],[335,148],[300,162],[270,180],[250,198],
      [255,215],[280,215],[310,200]
    ],
    entryOxy:false }),

  /* 左肺静脉：肺 → 左心房 */
  buildSegment({ id:'pulmonary-vein-a', name:'肺静脉（左支）', circuit:'pulmonary', width:10,
    points:[
      [310,200],[320,255],[360,300],[430,325],[500,332]
    ],
    entryOxy:true }),

  /* 右支：进入右肺（画面右侧）→ 肺内气体交换 */
  buildSegment({ id:'lung-b', name:'肺（右支）', circuit:'pulmonary', width:8,
    points:[
      [400,130],[430,138],[465,148],[500,162],[530,180],[550,198],
      [545,215],[520,215],[490,200]
    ],
    entryOxy:false }),

  /* 右肺静脉：肺 → 左心房 */
  buildSegment({ id:'pulmonary-vein-b', name:'肺静脉（右支）', circuit:'pulmonary', width:10,
    points:[
      [490,200],[480,255],[475,300],[482,325],[500,332]
    ],
    entryOxy:true }),

  /* 左心房 */
  buildSegment({ id:'left-atrium', name:'左心房', circuit:'systemic', width:9,
    points:[[500,332],[464,332],[464,400]], entryOxy:true }),

  /* 左心室 */
  buildSegment({ id:'left-ventricle', name:'左心室', circuit:'systemic', width:9,
    points:[[464,400],[464,450],[482,442]], entryOxy:true, valveIn:'mitral' })
];

var SEG_BY_ID = {};
SEGMENTS.forEach(function(s,i){ SEG_BY_ID[s.id] = i; });

/* ============================================================
   下一段映射表
   ============================================================ */
var NEXT_SEGMENT = {
  'aorta': 'systemic-capillary',
  'systemic-capillary': 'systemic-vein',
  'systemic-vein': 'right-atrium',
  'right-atrium': 'right-ventricle',
  'right-ventricle': 'pulmonary-artery',
  'pulmonary-artery': null,           /* 由 branch 决定 */
  'lung-a': 'pulmonary-vein-a',
  'lung-b': 'pulmonary-vein-b',
  'pulmonary-vein-a': 'left-atrium',
  'pulmonary-vein-b': 'left-atrium',
  'left-atrium': 'left-ventricle',
  'left-ventricle': 'aorta'
};

/* 主序列（非分叉部分） */
var MAIN_SEQUENCE = [
  'aorta','systemic-capillary','systemic-vein','right-atrium',
  'right-ventricle','pulmonary-artery'
];
var BRANCH_A_SEQUENCE = ['lung-a','pulmonary-vein-a'];
var BRANCH_B_SEQUENCE = ['lung-b','pulmonary-vein-b'];

var TOTAL_LENGTH = SEGMENTS.reduce(function(a,s){ return a + s.length; }, 0);

function nextSegmentOf(p){
  var curId = SEGMENTS[p.seg].id;
  if (curId === 'pulmonary-artery'){
    return p.branch === 'a' ? 'lung-a' : 'lung-b';
  }
  return NEXT_SEGMENT[curId] || null;
}

/* ============================================================
   结构说明
   ============================================================ */
var STRUCT_INFO = {
  'right-atrium':   { name:'右心房', en:'Right Atrium', oxy:'deoxy',
    desc:'接收来自全身的体静脉血。此处血液含氧较少，属于低氧血。',
    flow:'体静脉 → 右心房 → 右心室' },
  'right-ventricle':{ name:'右心室', en:'Right Ventricle', oxy:'deoxy',
    desc:'将低氧血泵入肺动脉，送入肺循环，去肺部进行气体交换。',
    flow:'右心房 → 右心室 → 肺动脉' },
  'left-atrium':    { name:'左心房', en:'Left Atrium', oxy:'oxy',
    desc:'接收来自肺的肺静脉血。此处血液含氧丰富，属于富氧血。',
    flow:'肺静脉 → 左心房 → 左心室' },
  'left-ventricle': { name:'左心室', en:'Left Ventricle', oxy:'oxy',
    desc:'将富氧血泵入主动脉，进入体循环，输送到全身组织。',
    flow:'左心房 → 左心室 → 主动脉' },
  'pulmonary-artery':{ name:'肺动脉', en:'Pulmonary Artery', oxy:'deoxy',
    desc:'把血液从右心室送到肺。在肺门处分成左右两支，同时进入左肺和右肺。注意：肺动脉里流的是低氧血。',
    flow:'右心室 → 肺动脉 → 左肺 / 右肺' },
  'pulmonary-vein': { name:'肺静脉', en:'Pulmonary Vein', oxy:'oxy',
    desc:'把肺里完成气体交换后的血液送回左心房。注意：肺静脉里流的是富氧血。',
    flow:'肺 → 肺静脉 → 左心房' },
  'aorta':          { name:'主动脉', en:'Aorta', oxy:'oxy',
    desc:'全身最粗的动脉，把左心室的富氧血输送到全身各处。',
    flow:'左心室 → 主动脉 → 全身' },
  'systemic-vein':  { name:'体静脉', en:'Systemic Vein', oxy:'deoxy',
    desc:'收集全身组织交换后含氧较少的血液，送回右心房。',
    flow:'全身 → 静脉 → 右心房' },
  'systemic-capillary':{ name:'全身毛细血管', en:'Systemic Capillaries', oxy:'mix',
    desc:'血液在这里与组织细胞进行物质交换：把氧和养料交给细胞，带走二氧化碳等废物，血液由富氧血变为低氧血。',
    flow:'主动脉 → 全身毛细血管 → 静脉' },
  'lung':           { name:'肺', en:'Lung', oxy:'mix',
    desc:'肺循环中的气体交换场所。肺动脉在肺门处分成左右两支，同时进入左肺和右肺。血液在这里排出二氧化碳、获得氧气，由低氧血变为富氧血。',
    flow:'肺动脉 → 左肺 / 右肺 → 肺静脉' }
};

/* 虚拟 ID 到实际段列表的映射（用于点击高亮） */
var ID_TO_SEGS = {
  'lung': ['lung-a','lung-b'],
  'pulmonary-vein': ['pulmonary-vein-a','pulmonary-vein-b']
};

/* ============================================================
   状态
   ============================================================ */
var state = {
  hr: 72, speed: 1, playing: true, mode: 'overview', focus: 'full',
  exercise: 'rest', showLabels: true, showArrows: false,
  phase: 0, time: 0, selected: null, tracked: null, tour: null,
  records: [], lastRecordTime: -999
};

var EXERCISE_PRESETS = {
  rest:     { label:'静息', hr:72,  flow:1.00 },
  light:    { label:'轻度运动', hr:88,  flow:1.22 },
  moderate: { label:'中度运动', hr:108, flow:1.50 },
  intense:  { label:'剧烈运动', hr:120, flow:1.78 }
};

/* ============================================================
   几何工具
   ============================================================ */
function pointAt(seg, s){
  if (!isFinite(s)) s = 0;
  s = Math.max(0, Math.min(seg.length, s));
  var lo = 0, hi = seg.cum.length - 1;
  while (hi - lo > 1){
    var mid = (lo + hi) >> 1;
    if (seg.cum[mid] <= s) lo = mid; else hi = mid;
  }
  var segLen = seg.cum[hi] - seg.cum[lo];
  var f = segLen > 1e-6 ? (s - seg.cum[lo]) / segLen : 0;
  var a = seg.pts[lo], b = seg.pts[hi];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

function phaseName(p){
  if (p < P_ATRIAL_END) return 'atrial';
  if (p < P_VENT_END) return 'ventricular';
  return 'diastole';
}

function phaseLabel(p){
  var n = phaseName(p);
  if (n === 'atrial') return '心房收缩';
  if (n === 'ventricular') return '心室收缩';
  return '全心舒张';
}

function valveStates(p){
  var vent = (p >= P_ATRIAL_END && p < P_VENT_END);
  return {
    tricuspid: !vent,
    mitral: !vent,
    pulmonary: vent,
    aortic: vent
  };
}

/* ============================================================
   粒子系统
   ============================================================ */
var particles = [];

function makeParticleOnSequence(seq, s, branch){
  for (var i = 0; i < seq.length; i++){
    var seg = SEGMENTS[SEG_BY_ID[seq[i]]];
    if (s < seg.length){
      return {
        seg: SEG_BY_ID[seq[i]],
        s: s,
        oxy: seg.entryOxy,
        branch: branch,
        jitter: 0.90 + Math.random() * 0.20,
        backoff: Math.random() * 18,
        blocked: false
      };
    }
    s -= seg.length;
  }
  var firstSeg = SEGMENTS[SEG_BY_ID[seq[0]]];
  return {
    seg: SEG_BY_ID[seq[0]], s: 0,
    oxy: firstSeg.entryOxy, branch: branch,
    jitter: 1, backoff: 0, blocked: false
  };
}

function initParticles(){
  particles.length = 0;

  var mainLen = 0, aLen = 0, bLen = 0;
  MAIN_SEQUENCE.forEach(function(id){ mainLen += SEGMENTS[SEG_BY_ID[id]].length; });
  BRANCH_A_SEQUENCE.forEach(function(id){ aLen += SEGMENTS[SEG_BY_ID[id]].length; });
  BRANCH_B_SEQUENCE.forEach(function(id){ bLen += SEGMENTS[SEG_BY_ID[id]].length; });
  var total = mainLen + aLen + bLen;

  var mainN = Math.round(PARTICLE_COUNT * mainLen / total);
  var aN    = Math.round(PARTICLE_COUNT * aLen / total);
  var bN    = PARTICLE_COUNT - mainN - aN;
  var i;

  for (i = 0; i < mainN; i++){
    particles.push(makeParticleOnSequence(
      MAIN_SEQUENCE,
      (i / mainN) * mainLen,
      Math.random() < 0.5 ? 'a' : 'b'
    ));
  }
  for (i = 0; i < aN; i++){
    particles.push(makeParticleOnSequence(
      BRANCH_A_SEQUENCE, (i / aN) * aLen, 'a'
    ));
  }
  for (i = 0; i < bN; i++){
    particles.push(makeParticleOnSequence(
      BRANCH_B_SEQUENCE, (i / bN) * bLen, 'b'
    ));
  }
}

function updateParticles(dt, flowScale){
  var v = valveStates(state.phase);
  var base = BASE_FLOW * (state.hr / 72) * flowScale;

  for (var i = 0; i < particles.length; i++){
    var p = particles[i];
    var guard = 0;

    p.s += base * p.jitter * dt;

    while (p.s >= SEGMENTS[p.seg].length && guard++ < 4){
      var cur = SEGMENTS[p.seg];
      var nextId = nextSegmentOf(p);
      if (!nextId) break;

      var nextIdx = SEG_BY_ID[nextId];
      if (nextIdx === undefined) break;

      var next = SEGMENTS[nextIdx];

      if (next.valveIn && !v[next.valveIn]){
        p.s = cur.length - p.backoff;
        p.blocked = true;
        break;
      }

      p.blocked = false;
      p.s -= cur.length;
      p.seg = nextIdx;
      p.oxy = next.entryOxy;
    }

    if (!isFinite(p.s)) p.s = 0;
    if (p.s < 0) p.s = 0;
  }
}

/* ============================================================
   SVG 场景
   ============================================================ */
var scene = document.getElementById('scene');
var svgGroups = {};

function el(tag, attrs){
  var e = document.createElementNS(SVGNS, tag);
  if (attrs){
    for (var k in attrs){
      if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    }
  }
  return e;
}

function makeVesselPath(points){
  return points.map(function(p, i){
    return (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y;
  }).join(' ');
}

function buildScene(){
  scene.innerHTML = '';

  /* ---------- defs ---------- */
  var defs = el('defs');
  defs.innerHTML =
    '<radialGradient id="grad-heart" cx="45%" cy="38%" r="70%">' +
      '<stop offset="0%" stop-color="rgba(220,90,110,0.20)"/>' +
      '<stop offset="70%" stop-color="rgba(170,55,80,0.10)"/>' +
      '<stop offset="100%" stop-color="rgba(120,35,60,0.04)"/>' +
    '</radialGradient>' +
    '<radialGradient id="grad-atrium" cx="45%" cy="35%" r="75%">' +
      '<stop offset="0%" stop-color="rgba(110,160,225,0.42)"/>' +
      '<stop offset="100%" stop-color="rgba(70,115,180,0.16)"/>' +
    '</radialGradient>' +
    '<radialGradient id="grad-vent" cx="45%" cy="35%" r="75%">' +
      '<stop offset="0%" stop-color="rgba(95,145,215,0.50)"/>' +
      '<stop offset="100%" stop-color="rgba(55,95,160,0.20)"/>' +
    '</radialGradient>' +
    '<radialGradient id="grad-lung" cx="40%" cy="35%" r="80%">' +
      '<stop offset="0%" stop-color="rgba(150,205,240,0.22)"/>' +
      '<stop offset="100%" stop-color="rgba(90,150,205,0.08)"/>' +
    '</radialGradient>' +
    '<filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="4" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    '</filter>';
  scene.appendChild(defs);

  /* ---------- 人体轮廓 ---------- */
  var bg = el('g', { 'pointer-events':'none' });
  bg.appendChild(el('path', {
    d:'M400 118 C 318 118, 268 168, 258 246 L 236 700 L 564 700 L 542 246 C 532 168, 482 118, 400 118 Z',
    fill:'rgba(120,165,225,0.028)', stroke:'rgba(120,165,225,0.09)', 'stroke-width':1.5
  }));
  bg.appendChild(el('path', {
    d:'M400 20 C 372 20, 352 40, 352 68 C 352 96, 372 116, 400 116 C 428 116, 448 96, 448 68 C 448 40, 428 20, 400 20 Z',
    fill:'rgba(120,165,225,0.028)', stroke:'rgba(120,165,225,0.09)', 'stroke-width':1.5
  }));
  scene.appendChild(bg);

  /* ---------- 血管 ---------- */
  var vesselLayer = el('g', { id:'vessel-layer' });
  SEGMENTS.forEach(function(seg){
    var d = makeVesselPath(seg.pts);
    var w = seg.width;
    var isLungInner = (seg.id === 'lung-a' || seg.id === 'lung-b');
    var baseOpacity = isLungInner ? 0.4 : 1;

    /* hitId：让 lung-a/lung-b 都映射到 "lung" */
    var hitId = seg.id;
    if (seg.id === 'lung-a' || seg.id === 'lung-b') hitId = 'lung';
    if (seg.id === 'pulmonary-vein-a' || seg.id === 'pulmonary-vein-b') hitId = 'pulmonary-vein';

    var glow = el('path', {
      d: d, fill:'none',
      stroke:'rgba(140,180,240,' + (0.10 * baseOpacity) + ')',
      'stroke-width': w * 2.2,
      'stroke-linecap':'round', 'stroke-linejoin':'round',
      'pointer-events':'none', opacity: baseOpacity
    });
    var track = el('path', {
      d: d, fill:'none',
      stroke:'rgba(170,200,245,' + (0.30 * baseOpacity) + ')',
      'stroke-width': w,
      'stroke-linecap':'round', 'stroke-linejoin':'round',
      'pointer-events':'none', opacity: baseOpacity
    });
    var core = el('path', {
      d: d, fill:'none',
      stroke:'rgba(8,14,24,' + (0.88 * baseOpacity) + ')',
      'stroke-width': Math.max(4, w - 4),
      'stroke-linecap':'round', 'stroke-linejoin':'round',
      'pointer-events':'none', opacity: baseOpacity
    });
    var hit = el('path', {
      d: d, fill:'none',
      stroke:'transparent', 'stroke-width': Math.max(24, w + 14),
      'stroke-linecap':'round', 'stroke-linejoin':'round',
      'data-struct': hitId
    });

    glow.setAttribute('data-struct', hitId);
    track.setAttribute('data-struct', hitId);
    core.setAttribute('data-struct', hitId);

    vesselLayer.appendChild(glow);
    vesselLayer.appendChild(track);
    vesselLayer.appendChild(core);
    vesselLayer.appendChild(hit);
    seg._els = [glow, track, core, hit];
  });
  scene.appendChild(vesselLayer);
  svgGroups.vessels = vesselLayer;

  /* ---------- 心脏 ---------- */
  var heartG = el('g', { id:'heart' });

  var outlineD =
    'M 400 262 ' +
    'C 356 250, 312 258, 288 288 ' +
    'C 270 310, 262 342, 262 378 ' +
    'C 262 434, 282 494, 318 536 ' +
    'C 344 566, 370 584, 388 584 ' +
    'C 412 582, 448 558, 478 522 ' +
    'C 510 484, 532 428, 532 378 ' +
    'C 532 342, 524 310, 506 288 ' +
    'C 480 258, 436 250, 400 262 Z';

  heartG.appendChild(el('path', {
    d: outlineD,
    fill:'url(#grad-heart)',
    stroke:'rgba(255,130,150,0.42)',
    'stroke-width':2.2, 'pointer-events':'none',
    filter:'url(#f-glow)'
  }));

  heartG.appendChild(el('path', {
    d:'M 400 268 C 396 350, 392 470, 388 580',
    fill:'none', stroke:'rgba(255,140,160,0.28)',
    'stroke-width':1.4, 'stroke-linecap':'round', 'pointer-events':'none'
  }));
  heartG.appendChild(el('path', {
    d:'M 266 386 C 320 376, 480 376, 530 386',
    fill:'none', stroke:'rgba(255,140,160,0.26)',
    'stroke-width':1.4, 'stroke-linecap':'round', 'pointer-events':'none'
  }));

  var atriumG = el('g', { id:'atrium-group' });
  var ventG = el('g', { id:'ventricle-group' });

  var chambers = [
    { id:'right-atrium', group:atriumG,
      d:'M 296 322 C 320 312, 350 314, 366 330 C 378 344, 380 366, 372 386 ' +
        'C 362 404, 338 410, 314 406 C 296 402, 284 386, 286 362 ' +
        'C 287 346, 290 332, 296 322 Z',
      grad:'url(#grad-atrium)' },
    { id:'left-atrium', group:atriumG,
      d:'M 434 322 C 450 312, 480 314, 504 330 C 518 342, 522 366, 512 386 ' +
        'C 502 404, 478 410, 454 406 C 436 402, 426 386, 428 362 ' +
        'C 429 346, 431 332, 434 322 Z',
      grad:'url(#grad-atrium)' },
    { id:'right-ventricle', group:ventG,
      d:'M 288 410 C 316 398, 358 398, 380 414 C 392 426, 394 452, 386 482 ' +
        'C 378 514, 358 542, 336 552 C 314 558, 294 542, 288 512 ' +
        'C 282 482, 280 444, 288 410 Z',
      grad:'url(#grad-vent)' },
    { id:'left-ventricle', group:ventG,
      d:'M 420 414 C 442 398, 484 398, 512 410 C 526 418, 530 448, 524 482 ' +
        'C 518 516, 498 542, 474 550 C 450 556, 432 538, 426 508 ' +
        'C 420 480, 416 444, 420 414 Z',
      grad:'url(#grad-vent)' }
  ];

  chambers.forEach(function(c){
    var g = el('g', { 'data-struct': c.id, 'class':'struct' });
    var e = el('path', {
      d: c.d, fill: c.grad,
      stroke:'rgba(180,215,255,0.48)',
      'stroke-width':1.8, 'stroke-linejoin':'round'
    });
    g.appendChild(e);
    c.group.appendChild(g);
    c._el = e; c._g = g;
  });

  heartG.appendChild(atriumG);
  heartG.appendChild(ventG);

  /* 瓣膜 */
  var valveDefs = [
    { id:'tricuspid',  x:336, y:400, horizontal:true  },
    { id:'mitral',     x:464, y:400, horizontal:true  },
    { id:'pulmonary',  x:268, y:448, horizontal:false },
    { id:'aortic',     x:482, y:442, horizontal:false }
  ];
  valveDefs.forEach(function(vd){
    var p = el('path', {
      fill:'none', stroke:'rgba(255,225,150,0.85)', 'stroke-width':2.6,
      'stroke-linecap':'round', 'pointer-events':'none'
    });
    heartG.appendChild(p);
    vd._el = p;
  });
  svgGroups.valves = valveDefs;

  scene.appendChild(heartG);
  svgGroups.heart = heartG;
  svgGroups.atriumG = atriumG;
  svgGroups.ventG = ventG;
  svgGroups.chambers = chambers;

  /* ---------- 肺（视觉图形） ---------- */
  var lungG = el('g', { 'data-struct':'lung', 'class':'struct' });

  /* 左肺（画面左侧） */
  lungG.appendChild(el('path', {
    d:'M 262 62 C 232 60, 210 78, 206 110 C 202 142, 214 172, 240 188 ' +
      'C 264 202, 290 196, 304 176 C 316 158, 318 130, 310 106 ' +
      'C 300 76, 284 64, 262 62 Z',
    fill:'url(#grad-lung)', stroke:'rgba(160,210,245,0.42)',
    'stroke-width':1.8, 'stroke-linejoin':'round'
  }));
  lungG.appendChild(el('path', {
    d:'M 212 100 C 240 122, 272 142, 308 146',
    fill:'none', stroke:'rgba(160,210,245,0.22)', 'stroke-width':1.2, 'pointer-events':'none'
  }));
  lungG.appendChild(el('path', {
    d:'M 216 148 C 244 162, 274 174, 300 172',
    fill:'none', stroke:'rgba(160,210,245,0.22)', 'stroke-width':1.2, 'pointer-events':'none'
  }));

  /* 右肺（画面右侧） */
  lungG.appendChild(el('path', {
    d:'M 458 62 C 430 60, 412 78, 408 106 C 404 138, 414 166, 438 182 ' +
      'C 462 196, 488 192, 502 172 C 514 154, 516 128, 510 104 ' +
      'C 500 76, 486 64, 458 62 Z',
    fill:'url(#grad-lung)', stroke:'rgba(160,210,245,0.42)',
    'stroke-width':1.8, 'stroke-linejoin':'round'
  }));
  lungG.appendChild(el('path', {
    d:'M 414 98 C 442 120, 474 140, 508 142',
    fill:'none', stroke:'rgba(160,210,245,0.22)', 'stroke-width':1.2, 'pointer-events':'none'
  }));
  lungG.appendChild(el('path', {
    d:'M 416 146 C 444 160, 474 172, 500 170',
    fill:'none', stroke:'rgba(160,210,245,0.22)', 'stroke-width':1.2, 'pointer-events':'none'
  }));

  /* 肺泡点 */
  for (var li = 0; li < 8; li++){
    var cols = [238, 262, 282, 296];
    var lx = cols[li % 4];
    var ly = 92 + Math.floor(li / 4) * 34;
    lungG.appendChild(el('circle', {
      cx: lx, cy: ly, r: 4.2, fill:'none',
      stroke:'rgba(160,210,245,0.30)', 'stroke-width':1, 'pointer-events':'none'
    }));
    lungG.appendChild(el('circle', {
      cx: 428 + (li % 4) * 24, cy: 90 + Math.floor(li / 4) * 34, r: 4.2, fill:'none',
      stroke:'rgba(160,210,245,0.30)', 'stroke-width':1, 'pointer-events':'none'
    }));
  }
  scene.appendChild(lungG);

  /* ---------- 全身毛细血管 ---------- */
  var capG = el('g', { 'data-struct':'systemic-capillary', 'class':'struct' });
  capG.appendChild(el('path', {
    d:'M 300 620 C 300 606, 500 606, 500 620 C 500 636, 500 660, 500 674 ' +
      'C 500 688, 300 688, 300 674 C 300 660, 300 636, 300 620 Z',
    fill:'rgba(190,140,215,0.12)', stroke:'rgba(210,170,240,0.38)',
    'stroke-width':1.8, 'stroke-linejoin':'round'
  }));
  for (var ci = 0; ci < 6; ci++){
    var cx0 = 322 + ci * 32;
    capG.appendChild(el('path', {
      d:'M' + cx0 + ' 632 Q ' + (cx0 + 8) + ' 648, ' + cx0 + ' 664',
      fill:'none', stroke:'rgba(210,170,240,0.35)', 'stroke-width':1.3, 'pointer-events':'none'
    }));
    capG.appendChild(el('path', {
      d:'M' + (cx0 + 12) + ' 632 Q ' + (cx0 + 20) + ' 648, ' + (cx0 + 12) + ' 664',
      fill:'none', stroke:'rgba(210,170,240,0.35)', 'stroke-width':1.3, 'pointer-events':'none'
    }));
  }
  scene.appendChild(capG);

  /* ---------- 标签 ---------- */
  var labelG = el('g', { id:'label-layer', 'pointer-events':'none' });
  var labelDefs = [
    { text:'右心房', x:244, y:330, anchor:'end'   },
    { text:'右心室', x:244, y:470, anchor:'end'   },
    { text:'左心房', x:552, y:330, anchor:'start' },
    { text:'左心室', x:552, y:470, anchor:'start' },
    { text:'肺动脉', x:236, y:240, anchor:'end'   },
    { text:'肺静脉', x:566, y:240, anchor:'start' },
    { text:'主动脉', x:660, y:500, anchor:'start' },
    { text:'体静脉', x:148, y:530, anchor:'end'   },
    { text:'肺',     x:400, y:40,  anchor:'middle'},
    { text:'全身毛细血管', x:400, y:702, anchor:'middle'}
  ];
  labelDefs.forEach(function(ld){
    var t = el('text', {
      x:ld.x, y:ld.y, 'text-anchor':ld.anchor, 'class':'lbl',
      'dominant-baseline':'middle'
    });
    t.textContent = ld.text;
    labelG.appendChild(t);
  });
  scene.appendChild(labelG);
  svgGroups.labels = labelG;

  /* ---------- 方向箭头 ---------- */
  var arrowG = el('g', { id:'arrow-layer', 'pointer-events':'none', opacity:0 });
  SEGMENTS.forEach(function(seg){
    var mid = seg.length * 0.5;
    var p1 = pointAt(seg, mid - 14);
    var p2 = pointAt(seg, mid + 14);
    var ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    var arrow = el('path', {
      d:'M-9 -5.5 L9 0 L-9 5.5 Z',
      fill:'rgba(190,220,255,0.65)',
      transform:'translate(' + p2.x + ',' + p2.y + ') rotate(' + ang + ')'
    });
    arrowG.appendChild(arrow);
  });
  scene.appendChild(arrowG);
  svgGroups.arrows = arrowG;

  /* ---------- 点击 ---------- */
  scene.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('[data-struct]') : null;
    if (t) selectStructure(t.getAttribute('data-struct'));
  });
}

/* ============================================================
   Canvas 渲染
   ============================================================ */
var canvas = document.getElementById('particle-layer');
var ctx = canvas.getContext('2d');
var stage = document.getElementById('stage');
var view = { scale:1, ox:0, oy:0 };

function resizeCanvas(){
  var rect = stage.getBoundingClientRect();
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  canvas.style.width  = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var s = Math.min(rect.width / VW, rect.height / VH);
  view.scale = s;
  view.ox = (rect.width  - VW * s) / 2;
  view.oy = (rect.height - VH * s) / 2;
}

function toScreen(x, y){
  return { x: view.ox + x * view.scale, y: view.oy + y * view.scale };
}

function drawParticles(){
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = canvas.width / dpr;
  var h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);

  var r = Math.max(2.6, 5.2 * view.scale);
  var trackedIdx = state.tracked ? state.tracked.index : -1;

  for (var i = 0; i < particles.length; i++){
    var p = particles[i];
    var seg = SEGMENTS[p.seg];
    var lp = pointAt(seg, p.s);
    var sp = toScreen(lp.x, lp.y);

    var color = p.oxy ? '#ff4d5e' : '#4d9fff';
    var glow  = p.oxy ? 'rgba(255,77,94,0.85)' : 'rgba(77,159,255,0.85)';

    var alpha = 1;
    if (state.focus !== 'full'){
      var match = (state.focus === 'pulmonary')
        ? (seg.circuit === 'pulmonary')
        : (seg.circuit === 'systemic');
      alpha = match ? 1 : 0.16;
    }
    ctx.globalAlpha = alpha;

    if (i === trackedIdx){
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, r * 2.9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, r * 1.9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10 * view.scale;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (p.oxy){
      ctx.beginPath();
      ctx.arc(sp.x - r * 0.3, sp.y - r * 0.3, r * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ============================================================
   心跳与瓣膜
   ============================================================ */
function updateHeartbeat(){
  var p = state.phase;
  var ph = phaseName(p);
  var atrialScale = 1;
  var ventScale = 1;
  var atrialAmp = (state.mode === 'beat') ? 0.22 : 0.085;
  var ventAmp   = (state.mode === 'beat') ? 0.30 : 0.14;

  if (ph === 'atrial'){
    var t1 = p / P_ATRIAL_END;
    atrialScale = 1 - atrialAmp * Math.sin(t1 * Math.PI);
  } else if (ph === 'ventricular'){
    var t2 = (p - P_ATRIAL_END) / (P_VENT_END - P_ATRIAL_END);
    ventScale = 1 - ventAmp * Math.sin(t2 * Math.PI);
  }

  svgGroups.atriumG.setAttribute('transform',
    'translate(400,340) scale(' + atrialScale.toFixed(4) + ') translate(-400,-340)');
  svgGroups.ventG.setAttribute('transform',
    'translate(400,444) scale(' + ventScale.toFixed(4) + ') translate(-400,-444)');

  var v = valveStates(p);
  svgGroups.valves.forEach(function(vd){
    var open = v[vd.id];
    var d;
    if (vd.horizontal){
      d = open
        ? 'M' + (vd.x - 22) + ' ' + (vd.y - 5) + ' L' + vd.x + ' ' + (vd.y + 9) + ' L' + (vd.x + 22) + ' ' + (vd.y - 5)
        : 'M' + (vd.x - 22) + ' ' + (vd.y + 5) + ' L' + vd.x + ' ' + (vd.y - 9) + ' L' + (vd.x + 22) + ' ' + (vd.y + 5);
    } else {
      d = open
        ? 'M' + (vd.x - 14) + ' ' + (vd.y - 14) + ' L' + vd.x + ' ' + vd.y + ' L' + (vd.x - 14) + ' ' + (vd.y + 14)
        : 'M' + (vd.x - 4) + ' ' + (vd.y - 14) + ' L' + vd.x + ' ' + vd.y + ' L' + (vd.x - 4) + ' ' + (vd.y + 14);
    }
    vd._el.setAttribute('d', d);
    vd._el.setAttribute('stroke', open ? 'rgba(255,225,150,0.9)' : 'rgba(255,160,120,0.95)');
  });
}

function updateHUD(){
  var hud = document.getElementById('mode-hud');
  if (!hud) return;

  if (state.mode === 'beat'){
    hud.classList.add('show');
    var phase = phaseLabel(state.phase);
    var sub = '';
    if (phase === '心房收缩') sub = '心房把血液挤入心室';
    else if (phase === '心室收缩') sub = '心室把血液泵入动脉';
    else sub = '心脏放松，血液回流';
    hud.innerHTML =
      '<div class="hud-label">心动周期</div>' +
      '<div class="hud-big">' + phase + '</div>' +
      '<div class="hud-sub">' + sub + '</div>';
  } else if (state.mode === 'exercise'){
    hud.classList.add('show');
    var preset = EXERCISE_PRESETS[state.exercise];
    var pct = Math.round(preset.flow * 100);
    hud.innerHTML =
      '<div class="hud-label">运动状态</div>' +
      '<div class="hud-big">' + state.hr + ' bpm</div>' +
      '<div class="hud-sub">' + preset.label + ' · 血流 ' + pct + '%</div>';
  } else {
    hud.classList.remove('show');
  }
}

/* ============================================================
   聚焦
   ============================================================ */
function applyFocus(){
  var focus = state.focus || 'full';
  var mode = (focus === 'pulmonary' || focus === 'systemic') ? focus : 'full';

  SEGMENTS.forEach(function(seg){
    var on = true;
    if (mode === 'pulmonary') on = (seg.circuit === 'pulmonary');
    else if (mode === 'systemic') on = (seg.circuit === 'systemic');

    var isLungInner = (seg.id === 'lung-a' || seg.id === 'lung-b');
    var target = on ? 1 : 0.16;
    if (isLungInner && on) target = 0.4;

    seg._els.forEach(function(e){
      e.setAttribute('opacity', target);
    });
  });

  svgGroups.chambers.forEach(function(c){
    var on = true;
    if (mode === 'pulmonary') on = (c.id === 'right-atrium' || c.id === 'right-ventricle' || c.id === 'left-atrium');
    else if (mode === 'systemic') on = (c.id === 'left-atrium' || c.id === 'left-ventricle' || c.id === 'right-atrium');
    c._g.setAttribute('opacity', on ? 1 : 0.16);
  });

  var lungEl = scene.querySelector('[data-struct="lung"].struct');
  if (lungEl) lungEl.setAttribute('opacity', (mode === 'systemic') ? 0.16 : 1);

  var capEl = scene.querySelector('[data-struct="systemic-capillary"]');
  if (capEl) capEl.setAttribute('opacity', (mode === 'pulmonary') ? 0.16 : 1);
}

/* ============================================================
   选中结构
   ============================================================ */
function selectStructure(id){
  var info = STRUCT_INFO[id];
  if (!info) return;

  state.selected = id;
  renderInfoCard(id, info);

  var all = scene.querySelectorAll('.focus');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('focus');

  /* 重置所有血管描边 */
  SEGMENTS.forEach(function(s){
    var isLungInner = (s.id === 'lung-a' || s.id === 'lung-b');
    var baseOpacity = isLungInner ? 0.4 : 1;
    s._els[1].setAttribute('stroke', 'rgba(170,200,245,' + (0.30 * baseOpacity) + ')');
    s._els[1].setAttribute('stroke-width', s.width);
    s._els[2].setAttribute('stroke-width', Math.max(4, s.width - 4));
  });

  var targets = scene.querySelectorAll('[data-struct="' + id + '"]');
  for (var j = 0; j < targets.length; j++) targets[j].classList.add('focus');

  /* 如果是虚拟 ID（肺、肺静脉），映射到实际段 */
  var segIds = ID_TO_SEGS[id] || [id];
  segIds.forEach(function(sid){
    var segIdx = SEG_BY_ID[sid];
    if (segIdx !== undefined){
      var seg = SEGMENTS[segIdx];
      seg._els[1].setAttribute('stroke', 'rgba(255,255,255,0.75)');
      seg._els[1].setAttribute('stroke-width', seg.width + 4);
      seg._els[2].setAttribute('stroke-width', Math.max(6, seg.width));
    }
  });

  setCaption('已选择：' + info.name + ' · ' + info.flow);
}

function renderInfoCard(id, info){
  var oxyBadge = '';
  if (info.oxy === 'oxy') oxyBadge = '<span class="badge oxy">富氧血</span>';
  else if (info.oxy === 'deoxy') oxyBadge = '<span class="badge deoxy">低氧血</span>';
  else oxyBadge = '<span class="badge mix">气体交换处</span>';

  document.getElementById('info-card').innerHTML =
    '<p class="info-name">' + info.name + '</p>' +
    '<p class="info-en">' + info.en + '</p>' +
    '<p class="info-desc">' + info.desc + '</p>' +
    '<div class="info-meta">' +
      '<div class="info-meta-row"><span>血流方向</span><b>' + info.flow + '</b></div>' +
      '<div class="info-meta-row"><span>血液状态</span><b>' + oxyBadge + '</b></div>' +
    '</div>';
}

function setCaption(text){
  document.getElementById('stage-caption').textContent = text;
}

/* ============================================================
   追踪
   ============================================================ */
var trackingHistory = [];

function startTracking(){
  var best = -1;
  for (var i = 0; i < particles.length; i++){
    if (SEGMENTS[particles[i].seg].id === 'systemic-vein'){
      best = i;
      break;
    }
  }
  if (best < 0) best = 0;

  state.tracked = { index: best };
  trackingHistory = [];
  document.getElementById('tracking-info').hidden = false;
  document.getElementById('tracking-history').hidden = false;
  document.getElementById('btn-track').textContent = '重新追踪';
  setCaption('正在追踪一颗红细胞，观察它完成一次完整循环。');
}

function updateTracking(){
  if (!state.tracked) return;
  var p = particles[state.tracked.index];
  if (!p) return;

  var seg = SEGMENTS[p.seg];
  var nextId = nextSegmentOf(p);
  var nextSeg = nextId ? SEGMENTS[SEG_BY_ID[nextId]] : null;

  var locationText = seg.name;
  if (seg.id === 'lung-a') locationText = '左肺';
  if (seg.id === 'lung-b') locationText = '右肺';

  var stageText;
  if (seg.circuit === 'pulmonary') stageText = '肺循环';
  else stageText = '体循环';
  if (seg.id === 'lung-a' || seg.id === 'lung-b') stageText = '肺部气体交换';
  if (seg.id === 'systemic-capillary') stageText = '全身物质交换';

  var bloodText = p.oxy ? '富氧血' : '低氧血';
  var nextName = nextSeg ? nextSeg.name : '—';
  if (nextSeg && nextSeg.valveIn && !valveStates(state.phase)[nextSeg.valveIn]){
    nextName += '（瓣膜关闭，等待中）';
  }

  document.getElementById('tk-location').textContent = locationText;
  document.getElementById('tk-stage').textContent = stageText;
  document.getElementById('tk-blood').textContent = bloodText;
  document.getElementById('tk-next').textContent = nextName;

  if (trackingHistory.length === 0 || trackingHistory[trackingHistory.length - 1] !== locationText){
    trackingHistory.push(locationText);
    if (trackingHistory.length > 14) trackingHistory.shift();
    var list = document.getElementById('tracking-history-list');
    list.innerHTML = '';
    trackingHistory.forEach(function(n){
      var li = document.createElement('li');
      li.textContent = n;
      list.appendChild(li);
    });
    list.scrollTop = list.scrollHeight;
  }

  document.getElementById('ro-track').textContent = locationText;
}

/* ============================================================
   自动演示
   ============================================================ */
var TOUR_STEPS = [
  { id:'systemic-capillary', label:'① 全身' },
  { id:'systemic-vein',      label:'② 体静脉' },
  { id:'right-atrium',       label:'③ 右心房' },
  { id:'right-ventricle',    label:'④ 右心室' },
  { id:'pulmonary-artery',   label:'⑤ 肺动脉' },
  { id:'lung', label:'⑥ 肺（左右同时）', noSeg:true },
  { id:'left-atrium',        label:'⑦ 左心房' },
  { id:'left-ventricle',     label:'⑧ 左心室' },
  { id:'aorta',              label:'⑨ 主动脉' }
];

function startTour(){
  state.tour = { stepIndex: 0, timer: 0 };
  var stepsEl = document.getElementById('tour-steps');
  stepsEl.innerHTML = '';
  TOUR_STEPS.forEach(function(s, i){
    var e2 = document.createElement('span');
    e2.className = 'tour-step';
    e2.textContent = s.label;
    e2.dataset.index = i;
    stepsEl.appendChild(e2);
  });
  document.getElementById('tour-tracker').hidden = false;
  state.focus = 'full';
  syncFocusButtons();
  applyFocus();
  updateTourHighlight();
  setCaption('正在演示一次完整循环：血液从全身出发，经过右心 → 肺 → 左心 → 全身。');
}

function updateTourHighlight(){
  if (!state.tour) return;
  var steps = document.querySelectorAll('.tour-step');
  for (var i = 0; i < steps.length; i++){
    steps[i].classList.remove('is-done', 'is-current');
    if (i < state.tour.stepIndex) steps[i].classList.add('is-done');
    if (i === state.tour.stepIndex) steps[i].classList.add('is-current');
  }
}

function stopTour(){
  state.tour = null;
  document.getElementById('tour-tracker').hidden = true;
}

function updateTour(dt){
  if (!state.tour) return;
  state.tour.timer += dt;
  var perStep = 1.6 / state.speed;
  if (state.tour.timer >= perStep){
    state.tour.timer = 0;
    state.tour.stepIndex++;
    if (state.tour.stepIndex >= TOUR_STEPS.length){
      stopTour();
      setCaption('完整循环演示结束。');
      return;
    }
    updateTourHighlight();
    var step = TOUR_STEPS[state.tour.stepIndex];
    if (step){
      var segIdx = SEG_BY_ID[step.id];
      if (segIdx !== undefined){
        var seg = SEGMENTS[segIdx];
        setCaption('当前阶段：' + seg.name + ' · 血液状态：' + (seg.entryOxy ? '富氧血' : '低氧血'));
      } else {
        setCaption('当前阶段：' + step.label.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '') + ' · 肺循环的气体交换场所');
      }
    }
  }
}

/* ============================================================
   挑战
   ============================================================ */
var CHALLENGES = [
  { q:'低氧血从哪里进入心脏？', opts:['左心房','右心房','左心室','主动脉'], answer:1,
    tip:'全身组织交换后的低氧血经体静脉回到右心房。' },
  { q:'哪个血管将血液从右心室送往肺？', opts:['主动脉','肺静脉','肺动脉','体静脉'], answer:2,
    tip:'右心室把低氧血泵入肺动脉，送往肺部进行气体交换。' },
  { q:'哪个血管将富氧血从肺带回心脏？', opts:['肺动脉','肺静脉','主动脉','体静脉'], answer:1,
    tip:'肺静脉把肺里完成气体交换的富氧血送回左心房。' },
  { q:'血液从左心室离开心脏后首先进入哪个主要血管？', opts:['肺动脉','肺静脉','主动脉','体静脉'], answer:2,
    tip:'左心室把富氧血泵入主动脉，开始体循环。' },
  { q:'完成一次完整循环后，血液最终回到哪里？', opts:['左心房','右心房','左心室','肺'], answer:1,
    tip:'体循环结束后，低氧血经体静脉回到右心房，开始下一轮循环。' }
];

var challengeState = { index:0, picked:-1, answered:false, score:0 };

function openChallenge(){
  challengeState = { index:0, picked:-1, answered:false, score:0 };
  document.getElementById('challenge-overlay').hidden = false;
  renderChallenge();
}

function closeChallenge(){
  document.getElementById('challenge-overlay').hidden = true;
}

function renderChallenge(){
  var overlay = document.getElementById('challenge-overlay');
  var c = CHALLENGES[challengeState.index];

  var optsHtml = c.opts.map(function(o, i){
    var cls = 'challenge-opt';
    if (challengeState.answered){
      if (i === c.answer) cls += ' is-right';
      else if (i === challengeState.picked) cls += ' is-wrong';
    } else if (i === challengeState.picked){
      cls += ' is-picked';
    }
    var key = String.fromCharCode(65 + i);
    return '<button type="button" class="' + cls + '" data-opt="' + i + '">' +
             '<span class="challenge-key">' + key + '</span><span>' + o + '</span>' +
           '</button>';
  }).join('');

  var feedback = '';
  if (challengeState.answered){
    var ok = challengeState.picked === c.answer;
    feedback = '<span class="challenge-feedback ' + (ok ? 'ok' : 'no') + '">' +
      (ok ? '✓ 回答正确！' : '✗ 正确答案是 ' + String.fromCharCode(65 + c.answer) + '。') +
      ' ' + c.tip + '</span>';
  } else {
    feedback = '<span class="challenge-feedback">选择你认为正确的选项。</span>';
  }

  var isLast = challengeState.index === CHALLENGES.length - 1;

  overlay.innerHTML =
    '<div class="challenge-card">' +
      '<div class="challenge-head">' +
        '<h3>🎯 探索挑战</h3>' +
        '<span class="challenge-progress">' +
          (challengeState.index + 1) + ' / ' + CHALLENGES.length +
          ' · 得分 ' + challengeState.score +
        '</span>' +
      '</div>' +
      '<p class="challenge-q">' + c.q + '</p>' +
      '<div class="challenge-opts">' + optsHtml + '</div>' +
      '<div class="challenge-foot">' +
        feedback +
        '<div style="display:flex;gap:8px;flex:none">' +
          '<button class="btn btn-ghost" id="ch-exit" type="button">退出</button>' +
          (challengeState.answered
            ? (isLast
                ? '<button class="btn btn-primary" id="ch-done" type="button">完成</button>'
                : '<button class="btn btn-primary" id="ch-next" type="button">下一题</button>')
            : '<button class="btn btn-primary" id="ch-submit" type="button">提交</button>'
          ) +
        '</div>' +
      '</div>' +
    '</div>';

  var optEls = overlay.querySelectorAll('[data-opt]');
  for (var i = 0; i < optEls.length; i++){
    optEls[i].addEventListener('click', function(){
      if (challengeState.answered) return;
      challengeState.picked = parseInt(this.getAttribute('data-opt'), 10);
      renderChallenge();
    });
  }

  var exitBtn = overlay.querySelector('#ch-exit');
  if (exitBtn) exitBtn.addEventListener('click', closeChallenge);

  var submitBtn = overlay.querySelector('#ch-submit');
  if (submitBtn) submitBtn.addEventListener('click', function(){
    if (challengeState.picked < 0){ setCaption('请先选择一个选项。'); return; }
    challengeState.answered = true;
    if (challengeState.picked === CHALLENGES[challengeState.index].answer){
      challengeState.score++;
    }
    renderChallenge();
  });

  var nextBtn = overlay.querySelector('#ch-next');
  if (nextBtn) nextBtn.addEventListener('click', function(){
    challengeState.index++;
    challengeState.picked = -1;
    challengeState.answered = false;
    renderChallenge();
  });

  var doneBtn = overlay.querySelector('#ch-done');
  if (doneBtn) doneBtn.addEventListener('click', function(){
    setCaption('挑战完成，得分 ' + challengeState.score + ' / ' + CHALLENGES.length + '。');
    closeChallenge();
  });
}

/* ============================================================
   实验记录
   ============================================================ */
function addRecord(status){
  var t = state.time;
  if (Math.abs(t - state.lastRecordTime) < 0.05) return;
  state.lastRecordTime = t;
  state.records.push({ time: t, hr: state.hr, status: status });
  if (state.records.length > 200) state.records.shift();
  renderRecords();
}

function renderRecords(){
  var body = document.getElementById('records-body');
  if (state.records.length === 0){
    body.innerHTML = '<tr class="records-empty"><td colspan="3">暂无记录</td></tr>';
    return;
  }
  var html = '';
  for (var i = state.records.length - 1; i >= 0; i--){
    var r = state.records[i];
    html += '<tr><td>' + r.time.toFixed(1) + ' s</td><td>' + r.hr + '</td><td>' + r.status + '</td></tr>';
  }
  body.innerHTML = html;
}

function exportCSV(){
  if (state.records.length === 0){
    setCaption('还没有实验记录可以导出。');
    return;
  }
  var rows = [['时间(s)', '心率(bpm)', '状态']];
  state.records.forEach(function(r){
    rows.push([r.time.toFixed(1), String(r.hr), r.status]);
  });
  var csv = rows.map(function(r){ return r.join(','); }).join('\r\n');
  var blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'heart-lab-records.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
  setCaption('实验记录已导出为 CSV 文件。');
}

/* ============================================================
   UI 同步
   ============================================================ */
function updateReadout(){
  document.getElementById('ro-hr').textContent = state.hr + ' bpm';
  document.getElementById('ro-phase').textContent = phaseLabel(state.phase);

  var circuitText = '完整循环';
  if (state.focus === 'pulmonary') circuitText = '肺循环';
  else if (state.focus === 'systemic') circuitText = '体循环';
  document.getElementById('ro-circuit').textContent = circuitText;

  var bloodText = '—';
  if (state.tracked){
    var tp = particles[state.tracked.index];
    if (tp) bloodText = tp.oxy ? '富氧血' : '低氧血';
  }
  document.getElementById('ro-blood').textContent = bloodText;
  document.getElementById('ro-time').textContent = state.time.toFixed(1) + ' s';
}

function syncFocusButtons(){
  var btns = document.querySelectorAll('#path-focus .seg-btn');
  for (var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('is-active', btns[i].getAttribute('data-focus') === state.focus);
  }
}

function syncSpeedButtons(){
  var btns = document.querySelectorAll('#speed-seg .seg-btn');
  for (var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('is-active', parseFloat(btns[i].getAttribute('data-speed')) === state.speed);
  }
}

function syncExerciseButtons(){
  var btns = document.querySelectorAll('#exercise-seg .seg-btn');
  for (var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('is-active', btns[i].getAttribute('data-ex') === state.exercise);
  }
}

/* ============================================================
   主循环
   ============================================================ */
var lastTimestamp = 0;
var SIM_STEP = 1 / 120;

function step(dt){
  var period = 60 / state.hr;
  state.phase += dt / period;
  if (state.phase >= 1) state.phase -= Math.floor(state.phase);
  state.time += dt;

  var flowScale = EXERCISE_PRESETS[state.exercise].flow;
  updateParticles(dt, flowScale);
  updateTour(dt);
}

function frame(ts){
  if (!lastTimestamp) lastTimestamp = ts;
  var raw = (ts - lastTimestamp) / 1000;
  lastTimestamp = ts;
  if (!isFinite(raw)) raw = 0;
  raw = Math.min(raw, 0.05);

  if (state.playing){
    var remaining = raw * state.speed;
    var guard = 0;
    while (remaining > 1e-5 && guard++ < 12){
      var s = Math.min(SIM_STEP, remaining);
      step(s);
      remaining -= s;
    }
  }

  updateHeartbeat();
  drawParticles();
  updateTracking();
  updateReadout();
  updateHUD();
  requestAnimationFrame(frame);
}

/* ============================================================
   重置
   ============================================================ */
function resetAll(){
  state.phase = 0;
  state.time = 0;
  state.selected = null;
  state.tracked = null;
  state.tour = null;
  state.lastRecordTime = -999;

  initParticles();
  stopTour();

  document.getElementById('tracking-info').hidden = true;
  document.getElementById('tracking-history').hidden = true;
  document.getElementById('btn-track').textContent = '开始追踪';
  document.getElementById('ro-track').textContent = '未开始';

  document.getElementById('info-card').innerHTML =
    '<p class="info-empty">点击画面中的结构，查看详细说明。</p>';

  var all = scene.querySelectorAll('.focus');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('focus');

  SEGMENTS.forEach(function(s){
    var isLungInner = (s.id === 'lung-a' || s.id === 'lung-b');
    var baseOpacity = isLungInner ? 0.4 : 1;
    s._els[1].setAttribute('stroke', 'rgba(170,200,245,' + (0.30 * baseOpacity) + ')');
    s._els[1].setAttribute('stroke-width', s.width);
    s._els[2].setAttribute('stroke-width', Math.max(4, s.width - 4));
  });

  setCaption('提示：点击心脏腔室、血管或肺，查看它的作用。');
  applyFocus();
}

/* ============================================================
   事件绑定
   ============================================================ */
function bindUI(){
  document.getElementById('mode-list').addEventListener('click', function(e){
    var btn = e.target.closest('.mode-btn');
    if (!btn) return;
    var mode = btn.getAttribute('data-mode');
    state.mode = mode;

    var all = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('is-active');
    btn.classList.add('is-active');

    if (mode !== 'challenge'){
      document.getElementById('challenge-overlay').hidden = true;
    }

    if (mode === 'overview'){
      resetAll();
      state.focus = 'full';
      syncFocusButtons();
      applyFocus();
      setCaption('循环总览：观察血液如何从全身回到右心，经肺再到左心，然后输送到全身。');
    } else if (mode === 'beat'){
      setCaption('心脏搏动：注意心房先收缩，心室后收缩，然后全心舒张。');
    } else if (mode === 'track'){
      setCaption('血液追踪：观察一颗红细胞完成完整循环。');
      startTracking();
    } else if (mode === 'exercise'){
      setCaption('运动状态：切换底部的运动强度，观察心率与血流速度的变化。');
    } else if (mode === 'challenge'){
      setCaption('探索挑战：用 5 道题检验你对血液循环的理解。');
      openChallenge();
    }
  });

  document.getElementById('opt-labels').addEventListener('change', function(){
    state.showLabels = this.checked;
    var labels = svgGroups.labels.querySelectorAll('.lbl');
    for (var i = 0; i < labels.length; i++){
      labels[i].classList.toggle('hidden', !state.showLabels);
    }
  });

  document.getElementById('opt-arrows').addEventListener('change', function(){
    state.showArrows = this.checked;
    svgGroups.arrows.setAttribute('opacity', state.showArrows ? 1 : 0);
  });

  document.getElementById('path-focus').addEventListener('click', function(e){
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    state.focus = btn.getAttribute('data-focus');
    syncFocusButtons();
    applyFocus();

    if (state.focus === 'pulmonary'){
      setCaption('肺循环：右心室 → 肺动脉 → 左肺 / 右肺 → 肺静脉 → 左心房。');
    } else if (state.focus === 'systemic'){
      setCaption('体循环：左心室 → 主动脉 → 全身毛细血管 → 静脉 → 右心房。');
    } else {
      setCaption('完整循环 = 肺循环 + 体循环。');
    }
  });

  document.getElementById('btn-auto-tour').addEventListener('click', startTour);
  document.getElementById('btn-track').addEventListener('click', startTracking);

  var playBtn = document.getElementById('btn-play');
  playBtn.addEventListener('click', function(){
    state.playing = !state.playing;
    playBtn.textContent = state.playing ? '⏸' : '▶';
    setCaption(state.playing ? '继续播放。' : '已暂停：粒子与心跳都停止，点击 ▶ 继续。');
  });

  document.getElementById('btn-rewind').addEventListener('click', function(){
    resetAll();
    state.playing = true;
    playBtn.textContent = '⏸';
  });

  document.getElementById('speed-seg').addEventListener('click', function(e){
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    state.speed = parseFloat(btn.getAttribute('data-speed'));
    syncSpeedButtons();
  });

  var hrSlider = document.getElementById('hr-slider');
  hrSlider.addEventListener('input', function(){
    state.hr = parseInt(this.value, 10);
    document.getElementById('hr-value').textContent = state.hr + ' bpm';
  });
  hrSlider.addEventListener('change', function(){
    addRecord('手动调节心率 ' + state.hr + ' bpm');
  });

  document.getElementById('exercise-seg').addEventListener('click', function(e){
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    var ex = btn.getAttribute('data-ex');
    state.exercise = ex;
    syncExerciseButtons();

    var preset = EXERCISE_PRESETS[ex];
    state.hr = preset.hr;
    hrSlider.value = preset.hr;
    document.getElementById('hr-value').textContent = preset.hr + ' bpm';

    addRecord(preset.label);
    setCaption('当前状态：' + preset.label + '（教学模拟值）· 心率约 ' + preset.hr + ' bpm');
  });

  document.getElementById('btn-clear-records').addEventListener('click', function(){
    state.records = [];
    state.lastRecordTime = -999;
    renderRecords();
    setCaption('实验记录已清空。');
  });
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);

  document.getElementById('btn-fullscreen').addEventListener('click', function(){
    var app = document.getElementById('app');
    if (!document.fullscreenElement){
      if (app.requestFullscreen) app.requestFullscreen();
      else if (app.webkitRequestFullscreen) app.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', function(){
    var isFs = !!document.fullscreenElement;
    document.getElementById('btn-fullscreen').textContent = isFs ? '退出全屏' : '全屏';
    setTimeout(resizeCanvas, 60);
  });

  document.getElementById('btn-classroom').addEventListener('click', function(){
    var app = document.getElementById('app');
    app.classList.toggle('classroom');
    var on = app.classList.contains('classroom');
    this.textContent = on ? '退出课堂' : '课堂模式';
    setCaption(on ? '课堂模式：界面放大，适合投影与电子白板。' : '已退出课堂模式。');
    setTimeout(resizeCanvas, 60);
  });

  document.getElementById('btn-reset').addEventListener('click', function(){
    resetAll();
    state.hr = 72;
    hrSlider.value = 72;
    document.getElementById('hr-value').textContent = '72 bpm';
    state.exercise = 'rest';
    syncExerciseButtons();
    state.focus = 'full';
    syncFocusButtons();
    applyFocus();
    state.playing = true;
    playBtn.textContent = '⏸';
    setCaption('已重置到初始状态。');
  });

  window.addEventListener('resize', function(){
    resizeCanvas();
    drawParticles();
  });

  if (window.ResizeObserver){
    new ResizeObserver(resizeCanvas).observe(stage);
  }
}

/* ============================================================
   自检
   ============================================================ */
function runSelfTest(){
  var results = [];
  function check(name, cond){ results.push({ name: name, pass: !!cond }); }

  /* 路径逻辑 */
  check('右心房 → 右心室', NEXT_SEGMENT['right-atrium'] === 'right-ventricle');
  check('右心室 → 肺动脉', NEXT_SEGMENT['right-ventricle'] === 'pulmonary-artery');
  check('肺动脉在肺门分叉（左/右两支）',
    nextSegmentOf({ seg: SEG_BY_ID['pulmonary-artery'], branch:'a' }) === 'lung-a' &&
    nextSegmentOf({ seg: SEG_BY_ID['pulmonary-artery'], branch:'b' }) === 'lung-b');
  check('左肺 → 左肺静脉', NEXT_SEGMENT['lung-a'] === 'pulmonary-vein-a');
  check('右肺 → 右肺静脉', NEXT_SEGMENT['lung-b'] === 'pulmonary-vein-b');
  check('左肺静脉 → 左心房', NEXT_SEGMENT['pulmonary-vein-a'] === 'left-atrium');
  check('右肺静脉 → 左心房', NEXT_SEGMENT['pulmonary-vein-b'] === 'left-atrium');
  check('左心房 → 左心室', NEXT_SEGMENT['left-atrium'] === 'left-ventricle');
  check('左心室 → 主动脉', NEXT_SEGMENT['left-ventricle'] === 'aorta');
  check('主动脉 → 全身', NEXT_SEGMENT['aorta'] === 'systemic-capillary');
  check('全身 → 体静脉', NEXT_SEGMENT['systemic-capillary'] === 'systemic-vein');
  check('体静脉 → 右心房', NEXT_SEGMENT['systemic-vein'] === 'right-atrium');

  /* 氧合状态 */
  check('肺动脉低氧', SEGMENTS[SEG_BY_ID['pulmonary-artery']].entryOxy === false);
  check('肺静脉（左右）均富氧',
    SEGMENTS[SEG_BY_ID['pulmonary-vein-a']].entryOxy === true &&
    SEGMENTS[SEG_BY_ID['pulmonary-vein-b']].entryOxy === true);
  check('主动脉富氧', SEGMENTS[SEG_BY_ID['aorta']].entryOxy === true);
  check('体静脉低氧', SEGMENTS[SEG_BY_ID['systemic-vein']].entryOxy === false);

  /* 瓣膜 */
  var vD = valveStates(0.8);
  var vV = valveStates(0.25);
  check('舒张期房室瓣打开', vD.tricuspid && vD.mitral);
  check('心室收缩期房室瓣关闭', !vV.tricuspid && !vV.mitral);
  check('心室收缩期半月瓣打开', vV.pulmonary && vV.aortic);

  /* 心率 */
  check('心率提高周期缩短', (60/120) < (60/60));

  var pass = results.filter(function(r){ return r.pass; }).length;
  console.group('%c🫀 自检报告', 'color:#ff4d5e;font-weight:bold');
  results.forEach(function(r){ console.log((r.pass ? '✅' : '❌') + ' ' + r.name); });
  console.log('%c通过 ' + pass + ' / ' + results.length,
    pass === results.length ? 'color:#22d3a6' : 'color:#ffb020');
  console.groupEnd();
  return pass === results.length;
}

/* ============================================================
   启动
   ============================================================ */
function boot(){
  buildScene();
  initParticles();
  bindUI();
  resizeCanvas();
  applyFocus();
  renderRecords();

  document.getElementById('opt-labels').checked = true;
  document.getElementById('opt-arrows').checked = false;

  requestAnimationFrame(function(ts){
    lastTimestamp = ts;
    requestAnimationFrame(frame);
  });

  setTimeout(runSelfTest, 300);
  window.runSelfTest = runSelfTest;
  window.__heartLab = { state: state, SEGMENTS: SEGMENTS, particles: particles };
  console.log('%c🫀 心脏与血液循环实验室已启动', 'color:#22d3a6;font-size:14px;font-weight:bold');
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

})();