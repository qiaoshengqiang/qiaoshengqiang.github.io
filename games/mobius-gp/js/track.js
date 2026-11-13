import * as THREE from 'three';
import {
  TAU, clamp, smoothstep, mulberry32, makeAsphaltTexture, makeCheckeredTexture,
  makeBoostTexture, makeBillboardTexture, makeCanvas, canvasTexture,
  hexToRgba, disposeGroup,
} from './utils.js';

export const TRACKS = [
  {
    id: 'first-twist',
    name: 'FIRST TWIST',
    zh: '初扭',
    kicker: 'CLASSIC HALF-TWIST',
    desc: '最纯粹的莫比乌斯环。单侧赛道在你完成一圈后会把你翻到另一面——两圈，世界才回到原样。',
    R: 96, width: 22, twists: 1,
    radialAmp: 0, radialFreq: 3, hillAmp: 0, hillFreq: 2, phase: 0.2,
    difficulty: 1, seed: 11,
    aiBase: 45, aiSpread: 1.8, aiGrip: 37,
    theme: {
      skyTop: '#020615', skyBottom: '#07162b', fog: '#040912',
      accent: '#35e7ff', accent2: '#ff35cf',
      road: '#0e131d', light: '#c9f8ff', light2: '#ffc4f0',
      grid: '#175269', star: '#dbfbff', planet: '#233961', planetGlow: '#35e7ff',
      billboards: [['NO WRONG SIDE', 'ONE SIDE. NO LIMITS.'], ['HALF-TWIST', 'GRAVITY OPTIONAL'], ['KEEP IT FLAT', 'OR DON\'T']],
    },
    pads: [
      { u: 0.64, s: -0.32 }, { u: 1.52, s: 0.44 }, { u: 2.48, s: -0.1 },
      { u: 3.55, s: 0.5 }, { u: 4.55, s: -0.52 }, { u: 5.38, s: 0.25 },
    ],
  },
  {
    id: 'solar-ribbon',
    name: 'SOLAR RIBBON',
    zh: '日冕丝带',
    kicker: 'GRAVITY WELL SPRINT',
    desc: '一条被恒星风拉长的环带。径向起伏和长坡让车身不断失重，黄昏会跟着你转过整条赛道。',
    R: 112, width: 18, twists: 1,
    radialAmp: 7.5, radialFreq: 3, hillAmp: 5.5, hillFreq: 2, phase: 0.8,
    difficulty: 2, seed: 23,
    aiBase: 47, aiSpread: 2.0, aiGrip: 38,
    theme: {
      skyTop: '#100307', skyBottom: '#4b1009', fog: '#170409',
      accent: '#ffb84d', accent2: '#ff4d6d',
      road: '#191210', light: '#ffe0ac', light2: '#ff967a',
      grid: '#70301e', star: '#ffead0', planet: '#ff8b43', planetGlow: '#ff9e52',
      billboards: [['SOLAR WIND', 'HOLD THE OUTSIDE'], ['REDLINE', 'THE HORIZON'], ['BURN BRIGHT', 'FINISH LOUD']],
    },
    pads: [
      { u: 0.8, s: 0.4 }, { u: 1.75, s: -0.45 }, { u: 2.65, s: -0.1 },
      { u: 3.5, s: -0.55 }, { u: 4.32, s: 0.2 }, { u: 5.3, s: 0.46 },
    ],
  },
  {
    id: 'triple-helix',
    name: 'TRIPLE HELIX',
    zh: '三重螺旋',
    kicker: 'ACID GREEN PROTOCOL',
    desc: '三次半扭把赛道拧成一条发光的螺旋。每圈车身会翻转三次，你的地平线再也找不到北。',
    R: 88, width: 16, twists: 3,
    radialAmp: 5, radialFreq: 2, hillAmp: 2.8, hillFreq: 3, phase: 2.1,
    difficulty: 3, seed: 37,
    aiBase: 47, aiSpread: 1.6, aiGrip: 37,
    theme: {
      skyTop: '#010604', skyBottom: '#071a10', fog: '#020805',
      accent: '#a8ff3e', accent2: '#8e5cff',
      road: '#0c1210', light: '#e2ffc4', light2: '#c2b0ff',
      grid: '#2a6234', star: '#dbffd4', planet: '#355a39', planetGlow: '#a8ff3e',
      billboards: [['TRIPLE TWIST', 'THREE HORIZONS'], ['ACID LINE', 'DON\'T BLINK'], ['SPIN CYCLE', 'LAP THE VOID']],
    },
    pads: [
      { u: 0.72, s: -0.48 }, { u: 1.5, s: 0.12 }, { u: 2.35, s: 0.48 },
      { u: 3.35, s: -0.22 }, { u: 4.3, s: -0.48 }, { u: 5.45, s: 0.35 },
    ],
  },
  {
    id: 'void-coil',
    name: 'VOID COIL',
    zh: '虚空回环',
    kicker: 'QUINTUPLE RIOT',
    desc: '五次半扭，最窄的赛道。每圈翻转五次的赛道会把你的胃留在弯心。全油门？只有疯子才这么干。',
    R: 116, width: 13.5, twists: 5,
    radialAmp: 8, radialFreq: 4, hillAmp: 4, hillFreq: 1, phase: 4.0,
    difficulty: 4, seed: 53,
    aiBase: 48, aiSpread: 1.4, aiGrip: 38,
    theme: {
      skyTop: '#060107', skyBottom: '#1c060b', fog: '#070208',
      accent: '#ff5533', accent2: '#2dffe1',
      road: '#140b0d', light: '#ffd5c7', light2: '#a9fff3',
      grid: '#5c201a', star: '#ffd9d2', planet: '#3c1018', planetGlow: '#ff5533',
      billboards: [['VOID COIL', 'FIVE FLIPS. NO MERCY.'], ['DON\'T EAT', 'BEFORE THE RACE'], ['REDLINE VOID', 'STAY ON THE BAND']],
    },
    pads: [
      { u: 0.55, s: 0.35 }, { u: 1.45, s: -0.42 }, { u: 2.55, s: 0.0 },
      { u: 3.5, s: 0.48 }, { u: 4.5, s: -0.3 }, { u: 5.25, s: -0.5 },
    ],
  },
  {
    id: 'serpentine',
    name: 'SERPENTINE',
    zh: '蛇形回廊',
    kicker: 'THREE-LOBE SLALOM',
    desc: '三瓣式环带把赛道拉成连续的 S 弯。刚以为找到直线，下一段弯心已经在等你的刹车点。',
    R: 124, width: 19, twists: 1,
    radialAmp: 30, radialFreq: 3, hillAmp: 2.5, hillFreq: 2, phase: 0.45,
    difficulty: 3, seed: 67,
    aiBase: 50, aiSpread: 1.8, aiGrip: 42,
    branches: [
      { u: 2.35, len: 0.86, spread: 6.2, islandHalf: 1.9, left: '节奏线', right: '加速线', padSide: -1 },
    ],
    theme: {
      skyTop: '#050318', skyBottom: '#151d46', fog: '#070920',
      accent: '#8f6bff', accent2: '#b8ff4d',
      road: '#0d0f1d', light: '#e5dcff', light2: '#eaffc0',
      grid: '#322b6b', star: '#e5ddff', planet: '#2a275c', planetGlow: '#8f6bff',
      billboards: [['SERPENTINE', 'FIND THE FLOW'], ['SPLIT SECTOR', 'PICK YOUR RHYTHM'], ['NO STRAIGHTS', 'ONLY RHYTHM']],
    },
    pads: [
      { u: 0.62, s: -0.42 }, { u: 1.5, s: 0.46 }, { u: 2.35, s: -0.64 },
      { u: 3.35, s: 0.5 }, { u: 4.4, s: -0.5 }, { u: 5.42, s: 0.28 },
    ],
  },
  {
    id: 'hairpin-nova',
    name: 'HAIRPIN NOVA',
    zh: '发卡新星',
    kicker: 'TWIN HAIRPIN ORBIT',
    desc: '两个巨大的发卡弯嵌在环形赛道里。外侧是星尘，内侧是真空；晚一点刹车，你会同时看见两种风景。',
    R: 120, width: 17.5, twists: 1,
    radialAmp: 40, radialFreq: 2, hillAmp: 6.5, hillFreq: 2, phase: 1.55,
    difficulty: 4, seed: 79,
    aiBase: 50, aiSpread: 1.9, aiGrip: 42,
    branches: [
      { u: 4.3, len: 0.9, spread: 6.4, islandHalf: 1.9, left: '内线', right: '加速线', padSide: 1 },
    ],
    theme: {
      skyTop: '#0c0208', skyBottom: '#320914', fog: '#100309',
      accent: '#ff4d5f', accent2: '#ffd166',
      road: '#180d12', light: '#ffd8d7', light2: '#ffeab4',
      grid: '#6b1e2b', star: '#ffe0d9', planet: '#561724', planetGlow: '#ff4d5f',
      billboards: [['HAIRPIN NOVA', 'BRAKE LATE. SEE STARS.'], ['SPLIT NOVA', 'OUTSIDE IS ETERNAL'], ['NOVA LINE', 'INSIDE IS ETERNAL']],
    },
    pads: [
      { u: 0.7, s: 0.44 }, { u: 1.62, s: -0.48 }, { u: 2.52, s: 0.12 },
      { u: 3.42, s: -0.5 }, { u: 4.3, s: 0.64 }, { u: 5.36, s: -0.2 },
    ],
  },
  {
    id: 'vortex-crown',
    name: 'VORTEX CROWN',
    zh: '涡冠',
    kicker: 'TRIPLE-TWIST VORTEX',
    desc: '三重半扭叠在三瓣弯道上，弯心与地平线一起旋转。三次翻转之后，你才配谈走线。',
    R: 120, width: 16, twists: 3,
    radialAmp: 32, radialFreq: 3, hillAmp: 5, hillFreq: 3, phase: 2.35,
    difficulty: 5, seed: 97,
    aiBase: 50, aiSpread: 1.6, aiGrip: 43,
    branches: [
      { u: 1.05, len: 0.8, spread: 6.2, islandHalf: 1.85, left: '内旋', right: '加速旋', padSide: -1 },
      { u: 4.5, len: 0.8, spread: 6.2, islandHalf: 1.85, left: '加速旋', right: '内旋', padSide: 1 },
    ],
    theme: {
      skyTop: '#07010e', skyBottom: '#230b30', fog: '#0b0212',
      accent: '#b45cff', accent2: '#38ffd1',
      road: '#120c17', light: '#ead8ff', light2: '#c5fff0',
      grid: '#3d1f5e', star: '#ead9ff', planet: '#321a45', planetGlow: '#b45cff',
      billboards: [['VORTEX CROWN', 'THREE TURNS. ONE FACE.'], ['TWIN SPLIT', 'SPIN WITH IT'], ['EDGE OF REASON', 'HOLD THE LINE']],
    },
    pads: [
      { u: 0.56, s: -0.46 }, { u: 1.05, s: -0.64 }, { u: 2.36, s: -0.1 },
      { u: 3.28, s: 0.5 }, { u: 4.5, s: 0.64 }, { u: 5.34, s: 0.2 },
    ],
  },
  {
    id: 'split-horizon',
    name: 'SPLIT HORIZON',
    zh: '分裂地平线',
    kicker: 'BIFURCATED FLOW',
    desc: '三处分叉把环带撕成并行的未来。外侧是加速带，内侧是更短的弯心；选错不是慢，是看见另一条地平线。',
    R: 118, width: 16, twists: 1,
    radialAmp: 34, radialFreq: 3, hillAmp: 4.5, hillFreq: 2, phase: 1.1,
    difficulty: 4, seed: 113,
    aiBase: 51, aiSpread: 1.5, aiGrip: 44,
    branches: [
      { u: 1.05, len: 0.74, spread: 5.8, islandHalf: 1.85, left: '加速线', right: '弯心线', padSide: 1 },
      { u: 3.18, len: 0.78, spread: 6.0, islandHalf: 1.9, left: '弯心线', right: '加速线', padSide: -1 },
      { u: 5.14, len: 0.8, spread: 6.2, islandHalf: 1.9, left: '加速线', right: '弯心线', padSide: 1 },
    ],
    theme: {
      skyTop: '#020a10', skyBottom: '#062a2b', fog: '#020a0d',
      accent: '#28ffd0', accent2: '#ffb31f',
      road: '#0a1517', light: '#d9fff8', light2: '#ffe6b0',
      grid: '#145a52', star: '#dcfffa', planet: '#164a4d', planetGlow: '#28ffd0',
      billboards: [['SPLIT HORIZON', 'CHOOSE YOUR LINE'], ['TWO LINES', 'ONE FINISH'], ['FORK PROTOCOL', 'COMMIT EARLY']],
    },
    pads: [
      { u: 0.48, s: 0.36 }, { u: 1.05, s: 0.64 }, { u: 2.12, s: -0.46 },
      { u: 3.18, s: -0.64 }, { u: 4.22, s: 0.5 }, { u: 5.14, s: 0.64 },
    ],
  },
  {
    id: 'paradox-fork',
    name: 'PARADOX FORK',
    zh: '悖论分叉',
    kicker: 'DOUBLE-BRANCH PARADOX',
    desc: '两条分叉、三次翻转，同一圈里两次选择。无论选哪边，另一条都会在下一个弯心等你。',
    R: 110, width: 15, twists: 3,
    radialAmp: 38, radialFreq: 2, hillAmp: 5.5, hillFreq: 3, phase: 0.4,
    difficulty: 5, seed: 131,
    aiBase: 51, aiSpread: 1.4, aiGrip: 44,
    branches: [
      { u: 1.82, len: 0.94, spread: 7.0, islandHalf: 1.95, left: '左悖论', right: '右悖论', padSide: 1 },
      { u: 4.72, len: 0.9, spread: 6.8, islandHalf: 1.95, left: '右悖论', right: '左悖论', padSide: -1 },
    ],
    theme: {
      skyTop: '#0a0210', skyBottom: '#2b0738', fog: '#0c0414',
      accent: '#ff4fd8', accent2: '#7dffb0',
      road: '#150b1a', light: '#ffe0fa', light2: '#d4ffe8',
      grid: '#5a1d63', star: '#ffe3fc', planet: '#3a1046', planetGlow: '#ff4fd8',
      billboards: [['PARADOX FORK', 'BOTH WAYS ARE WRONG'], ['DOUBLE SPLIT', 'NO SECOND CHANCE'], ['ECHO LINE', 'PICK A SIDE']],
    },
    pads: [
      { u: 0.52, s: -0.44 }, { u: 1.82, s: 0.64 }, { u: 2.72, s: 0.42 },
      { u: 3.68, s: -0.5 }, { u: 4.72, s: -0.64 }, { u: 5.52, s: 0.34 },
    ],
  },
];

const _v = new THREE.Vector3();

export class Track {
  constructor(config) {
    this.config = config;
    this.R = config.R;
    this.width = config.width;
    this.twists = config.twists;
    this.halfWidth = config.width / 2;
    this.limit = this.halfWidth - 1.3;
    this.branches = config.branches || [];
    this.lapLength = 0;
    this._lengthCache = null;
  }

  /* --- fork geometry ------------------------------------------------- */

  // 0 at the ends of a fork, 1 in its middle. The smooth ramp widens the
  // tarmac before the median island appears, so cars have room to choose.
  branchWeight(branch, u) {
    const d = Math.abs(Math.atan2(Math.sin(u - branch.u), Math.cos(u - branch.u)));
    const half = branch.len * 0.5;
    if (d >= half) return 0;
    return smoothstep(0, 1, clamp((half - d) / (branch.len * 0.18), 0, 1));
  }

  widthAt(u) {
    let width = this.width;
    for (const branch of this.branches) width += branch.spread * this.branchWeight(branch, u);
    return width;
  }

  halfWidthAt(u) {
    return this.widthAt(u) * 0.5;
  }

  limitAt(u) {
    return Math.max(2.2, this.halfWidthAt(u) - 1.3);
  }

  islandHalfAt(u) {
    let half = 0;
    for (const branch of this.branches) {
      const w = this.branchWeight(branch, u);
      if (w <= 0.01) continue;
      const grow = smoothstep(0.45, 0.88, w);
      half = Math.max(half, (branch.islandHalf || 1.9) * grow);
    }
    return half;
  }

  branchInfoAt(u, lookahead = 0) {
    let best = null;
    for (const branch of this.branches) {
      const delta = Math.atan2(Math.sin(branch.u - u), Math.cos(branch.u - u));
      const half = branch.len * 0.5;
      if (delta < -half || delta > half + lookahead) continue;
      const weight = this.branchWeight(branch, u);
      const info = {
        ...branch,
        delta,
        weight,
        phase: clamp((u - (branch.u - half)) / branch.len, 0, 1),
        island: this.islandHalfAt(u),
      };
      if (!best || Math.abs(delta) < Math.abs(best.delta)) best = info;
    }
    return best;
  }

  laneCenterAt(u, side) {
    const island = this.islandHalfAt(u);
    const limit = this.limitAt(u);
    const inner = island + 0.9;
    const outer = Math.max(inner + 0.7, limit - 0.5);
    return side * (inner + outer) * 0.5;
  }

  safeS(u, currentS = 0) {
    const limit = this.limitAt(u);
    const island = this.islandHalfAt(u);
    const side = currentS >= 0 ? 1 : -1;
    if (island > 0.05 && Math.abs(currentS) < island + 0.8) {
      return side * Math.min(limit - 0.35, island + 0.8);
    }
    return clamp(currentS, -limit + 0.2, limit - 0.2);
  }

  // Signed geodesic curvature of the driving surface. Positive means the
  // tangent rotates toward +lateral as u advances. Used by the centrifugal
  // force, the car visuals and the AI's corner-speed planner.
  curvatureAt(u, s = 0) {
    const eps = 0.004;
    const a = this.sample(u - eps, s);
    const b = this.sample(u + eps, s);
    const arc = Math.max(0.0001, (a.metric + b.metric) * eps);
    const dx = b.forward.x - a.forward.x;
    const dy = b.forward.y - a.forward.y;
    const dz = b.forward.z - a.forward.z;
    return (dx * a.lateral.x + dy * a.lateral.y + dz * a.lateral.z) / arc;
  }

  radiusAt(u) {
    const c = this.config;
    return c.R
      + c.radialAmp * Math.sin(c.radialFreq * u + c.phase)
      + c.radialAmp * 0.34 * Math.sin((c.radialFreq + 2) * u + c.phase * 1.7);
  }

  radialSlopeAt(u) {
    const c = this.config;
    return c.radialAmp * c.radialFreq * Math.cos(c.radialFreq * u + c.phase)
      + c.radialAmp * 0.34 * (c.radialFreq + 2) * Math.cos((c.radialFreq + 2) * u + c.phase * 1.7);
  }

  position(u, s, target = new THREE.Vector3()) {
    const c = this.config;
    const a = this.twists * u * 0.5;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const rad = this.radiusAt(u);
    const slope = this.radialSlopeAt(u);
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    // Horizontal normal of the curved centreline. Using the true normal keeps
    // the road width constant through the new hairpins instead of pinching it.
    const inv = 1 / Math.hypot(rad, slope);
    const nx = (rad * cosU + slope * sinU) * inv;
    const nz = (rad * sinU - slope * cosU) * inv;
    const across = s * ca;
    const hill = c.hillAmp * Math.sin(c.hillFreq * u + c.phase * 2)
      + c.hillAmp * 0.4 * Math.sin((c.hillFreq + 1) * u + 1.3);
    return target.set(
      rad * cosU + across * nx,
      s * sa + hill,
      rad * sinU + across * nz,
    );
  }

  sample(u, s) {
    const eps = 0.0018;
    const p0 = this.position(u - eps, s, new THREE.Vector3());
    const p1 = this.position(u + eps, s, new THREE.Vector3());
    const ps0 = this.position(u, s - eps * 8, new THREE.Vector3());
    const ps1 = this.position(u, s + eps * 8, new THREE.Vector3());
    const position = this.position(u, s, new THREE.Vector3());
    const dU = p1.sub(p0).multiplyScalar(1 / (eps * 2));
    const dS = ps1.sub(ps0).multiplyScalar(1 / (eps * 16));
    const metric = dU.length();
    const forward = dU.multiplyScalar(1 / metric);
    const lateral = dS.sub(forward.clone().multiplyScalar(dS.dot(forward))).normalize();
    const up = forward.clone().cross(lateral).normalize();
    return { position, forward, lateral, up, metric };
  }

  getLapLength() {
    if (this._lengthCache != null) return this._lengthCache;
    const N = 800;
    let len = 0;
    const prev = new THREE.Vector3();
    const cur = new THREE.Vector3();
    this.position(0, 0, prev);
    for (let i = 1; i <= N; i++) {
      this.position(i / N * TAU, 0, cur);
      len += prev.distanceTo(cur);
      prev.copy(cur);
    }
    this._lengthCache = len;
    return len;
  }

  padS(pad) {
    return pad.s * this.limitAt(pad.u);
  }

  startGrid(index) {
    const row = Math.floor(index / 2);
    const col = index % 2;
    return {
      u: -0.055 - row * 0.035,
      s: (col === 0 ? -1 : 1) * this.width * 0.17,
    };
  }
}

function makeStartBannerTexture(theme) {
  const c = makeCanvas(1024, 160);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 160);
  ctx.fillStyle = 'rgba(4,10,16,.82)';
  ctx.fillRect(0, 0, 1024, 160);
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 1008, 144);
  ctx.restore();
  ctx.fillStyle = '#f2feff';
  ctx.font = '700 64px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MÖBIUS GP', 512, 69);
  ctx.fillStyle = theme.accent;
  ctx.font = '700 25px Rajdhani, sans-serif';
  ctx.letterSpacing = '14px';
  ctx.fillText('START / FINISH', 512, 120);
  return canvasTexture(c);
}

function makeSurfacePatch(track, u0, u1, s0, s1, lift, material, gridU = 8, gridS = 2) {
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= gridU; i++) {
    const t = i / gridU;
    const u = u0 + (u1 - u0) * t;
    for (let j = 0; j <= gridS; j++) {
      const v = j / gridS;
      const s = s0 + (s1 - s0) * v;
      const sm = track.sample(u, s);
      const p = sm.position.addScaledVector(sm.up, lift);
      positions.push(p.x, p.y, p.z);
      uvs.push(t, v);
    }
  }
  for (let i = 0; i < gridU; i++) {
    for (let j = 0; j < gridS; j++) {
      const a = i * (gridS + 1) + j;
      const b = (i + 1) * (gridS + 1) + j;
      const c = i * (gridS + 1) + j + 1;
      const d = (i + 1) * (gridS + 1) + j + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

function buildRoad(track, theme, quality, anisotropy) {
  const uSeg = quality === 'low' ? 360 : 620;
  const sSeg = quality === 'low' ? 6 : 10;
  const positions = [], normals = [], uvs = [], indices = [];
  const n = new THREE.Vector3();
  for (let i = 0; i <= uSeg; i++) {
    const u = (i / uSeg) * TAU;
    for (let j = 0; j <= sSeg; j++) {
      const v = j / sSeg;
      const s = (v - 0.5) * track.widthAt(u);
      const sm = track.sample(u, s);
      positions.push(sm.position.x, sm.position.y, sm.position.z);
      n.copy(sm.up);
      normals.push(n.x, n.y, n.z);
      uvs.push((i / uSeg) * 9, v);
    }
  }
  for (let i = 0; i < uSeg; i++) {
    for (let j = 0; j < sSeg; j++) {
      const a = i * (sSeg + 1) + j;
      const b = (i + 1) * (sSeg + 1) + j;
      const c = i * (sSeg + 1) + j + 1;
      const d = (i + 1) * (sSeg + 1) + j + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  const map = makeAsphaltTexture(theme, anisotropy);
  const mat = new THREE.MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0.38,
    metalness: 0.22,
    roughness: 0.64,
    side: THREE.DoubleSide,
    envMapIntensity: 0.9,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'ribbon-road';
  mesh.renderOrder = 0;
  return mesh;
}

function buildRails(track, theme, quality) {
  const group = new THREE.Group();
  const N = quality === 'low' ? 260 : 460;
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N * TAU;
      const sm = track.sample(u, side * (track.halfWidthAt(u) + 0.16));
      points.push(sm.position.addScaledVector(sm.up, 0.05));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, N, 0.115, quality === 'low' ? 4 : 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent).multiplyScalar(1.15),
      toneMapped: false,
      fog: false,
      transparent: true,
      opacity: 0.95,
    });
    group.add(new THREE.Mesh(geo, mat));
  }
  return group;
}

function buildPylons(track, theme) {
  const group = new THREE.Group();
  const count = 16;
  const total = count * 2;
  const postGeo = new THREE.BoxGeometry(0.09, 1.15, 0.09);
  postGeo.translate(0, 0.575, 0);
  const postMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false });
  const posts = new THREE.InstancedMesh(postGeo, postMat, total);
  const bulbGeo = new THREE.SphereGeometry(0.145, 8, 6);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false });
  const bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, total);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const colA = new THREE.Color(theme.accent);
  const colB = new THREE.Color(theme.accent2);
  let idx = 0;
  for (let k = 0; k < count; k++) {
    const u = (k / count) * TAU + 0.05;
    for (const side of [-1, 1]) {
      const sm = track.sample(u, side * (track.halfWidthAt(u) + 0.7));
      q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sm.lateral, sm.up, sm.forward));
      pos.copy(sm.position).addScaledVector(sm.up, 0.02);
      m.compose(pos, q, scale);
      posts.setMatrixAt(idx, m);
      const p2 = pos.clone().addScaledVector(sm.up, 1.17);
      m.compose(p2, q, scale);
      bulbs.setMatrixAt(idx, m);
      const col = (k + (side > 0 ? 1 : 0)) % 3 === 0 ? colB : colA;
      posts.setColorAt(idx, col);
      bulbs.setColorAt(idx, col);
      idx++;
    }
  }
  posts.instanceMatrix.needsUpdate = true;
  bulbs.instanceMatrix.needsUpdate = true;
  if (posts.instanceColor) posts.instanceColor.needsUpdate = true;
  if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
  group.add(posts, bulbs);
  return group;
}

function buildStartGate(track, theme) {
  const group = new THREE.Group();
  const sm = track.sample(0, 0);
  group.position.copy(sm.position);
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sm.lateral, sm.up, sm.forward));

  const darkMat = new THREE.MeshStandardMaterial({ color: 0x081017, metalness: 0.72, roughness: 0.36 });
  const accentMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(theme.accent).multiplyScalar(1.35), toneMapped: false, fog: false,
  });
  const accent2Mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(theme.accent2).multiplyScalar(1.25), toneMapped: false, fog: false,
  });

  const span = track.width + 2.7;
  const postX = span / 2;

  for (const sign of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 6.2, 0.46), darkMat);
    post.position.set(sign * postX, 3.1, 0);
    group.add(post);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 5.2, 0.05), sign < 0 ? accent2Mat : accentMat);
    strip.position.set(sign * (postX - 0.23), 3.0, -0.26);
    group.add(strip);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.16, 1.1), darkMat);
    foot.position.set(sign * postX, 0.08, 0);
    group.add(foot);
  }

  const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 0.4, 0.5), darkMat);
  beam.position.set(0, 6.2, 0);
  group.add(beam);
  const beamNeon = new THREE.Mesh(new THREE.BoxGeometry(span - 0.8, 0.055, 0.07), accentMat);
  beamNeon.position.set(0, 6.39, -0.27);
  group.add(beamNeon);
  const beamNeon2 = new THREE.Mesh(new THREE.BoxGeometry(span - 0.8, 0.03, 0.05), accent2Mat);
  beamNeon2.position.set(0, 5.99, -0.27);
  group.add(beamNeon2);

  const bannerTex = makeStartBannerTexture(theme);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(11, track.width * 0.62), 1.72),
    new THREE.MeshBasicMaterial({
      map: bannerTex, transparent: true, side: THREE.DoubleSide,
      toneMapped: false, fog: false,
    })
  );
  banner.position.set(0, 5.5, -0.29);
  banner.rotation.y = Math.PI;
  group.add(banner);

  // start light pods
  const lightMats = [];
  const podBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.56, 0.14), darkMat);
  podBack.position.set(0, 6.14, -0.34);
  group.add(podBack);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.64;
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.4, 0.18), darkMat);
    housing.position.set(x, 6.14, -0.43);
    group.add(housing);
    const mat = new THREE.MeshBasicMaterial({ color: 0x1a0808, toneMapped: false, fog: false });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 9), mat);
    bulb.position.set(x, 6.14, -0.53);
    group.add(bulb);
    lightMats.push(mat);
  }

  // small chevron strip on the road just before the line
  return { group, lights: lightMats };
}

function buildBillboards(track, theme) {
  const group = new THREE.Group();
  const angles = [0.78, 2.18, 3.62, 5.02];
  const noise = mulberry32(track.config.seed + 17);
  angles.forEach((u, i) => {
    const def = theme.billboards[i % theme.billboards.length];
    const sm = track.sample(u, (i % 2 === 0 ? 1 : -1) * (track.halfWidthAt(u) + 9));
    const tex = makeBillboardTexture(def[0], def[1], theme, i === 0 ? track.config.name : 'MÖBIUS GP');
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 10),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false })
    );
    const holder = new THREE.Group();
    holder.position.copy(sm.position).addScaledVector(sm.up, 10 + noise() * 3);
    holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(sm.lateral, sm.up, sm.forward));
    board.rotation.y = Math.PI;
    board.position.z = -0.2;
    holder.add(board);
    const sideMat = new THREE.MeshBasicMaterial({
      color: i % 2 ? new THREE.Color(theme.accent2).multiplyScalar(1.2) : new THREE.Color(theme.accent).multiplyScalar(1.2),
      toneMapped: false, fog: false,
    });
    for (const sx of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 10.4, 0.09), sideMat);
      bar.position.set(sx * 10.1, 0, -0.05);
      holder.add(bar);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(20.3, 0.07, 0.08), sideMat);
    cap.position.set(0, 5.16, -0.05);
    holder.add(cap);
    group.add(holder);
  });
  return group;
}

function buildShards(track, theme) {
  const group = new THREE.Group();
  const rng = mulberry32(track.config.seed + 101);
  const geo = new THREE.OctahedronGeometry(1, 0);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(theme.accent2), wireframe: true,
    transparent: true, opacity: 0.2, toneMapped: false, fog: false,
  });
  for (let i = 0; i < 22; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    const u = rng() * TAU;
    const side = rng() > 0.5 ? 1 : -1;
    const s = side * (track.halfWidthAt(u) + 18 + rng() * 75);
    const sm = track.sample(u, s);
    const p = sm.position.addScaledVector(sm.up, 8 + rng() * 55);
    mesh.position.copy(p);
    mesh.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    const sc = 0.5 + rng() * 2.1;
    mesh.scale.setScalar(sc);
    mesh.userData.spin = new THREE.Vector3((rng() - 0.5) * 0.12, (rng() - 0.5) * 0.18, (rng() - 0.5) * 0.1);
    mesh.userData.floatSpeed = 0.4 + rng() * 0.8;
    mesh.userData.baseY = p.y;
    group.add(mesh);
  }
  return group;
}

function buildBoostPads(track, theme) {
  const pads = [];
  const group = new THREE.Group();
  const tex = makeBoostTexture(theme);
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, opacity: 0.92,
    toneMapped: false, fog: false,
  });
  track.config.pads.forEach((def, i) => {
    const s = track.padS(def);
    const metric = track.sample(def.u, s).metric;
    const hu = 2.5 / metric;
    const hs = 1.75;
    const mesh = makeSurfacePatch(track, def.u - hu, def.u + hu, s - hs, s + hs, 0.045, mat, 8, 2);
    mesh.renderOrder = 3;
    mesh.userData.padIndex = i;
    group.add(mesh);
    pads.push({ ...def, u: def.u, s, halfU: hu, halfS: hs, mesh, cooldown: 0 });
  });
  return { group, pads, material: mat, texture: tex };
}

function makeIslandTexture(theme) {
  const c = makeCanvas(256, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#04090d';
  ctx.fillRect(0, 0, 256, 64);
  ctx.save();
  ctx.strokeStyle = hexToRgba(theme.accent, 0.4);
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 4;
  for (let x = -64; x < 320; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 66);
    ctx.lineTo(x + 58, -2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  ctx.fillRect(0, 0, 256, 2);
  ctx.fillRect(0, 62, 256, 2);
  return canvasTexture(c, { wrapS: THREE.RepeatWrapping });
}

function makeForkDecalTexture(theme) {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 26;
  ctx.shadowBlur = 20;
  ctx.shadowColor = theme.accent;
  ctx.strokeStyle = hexToRgba(theme.accent, 0.95);
  ctx.beginPath();
  ctx.moveTo(34, 256);
  ctx.lineTo(366, 132);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(theme.accent2, 0.95);
  ctx.shadowColor = theme.accent2;
  ctx.beginPath();
  ctx.moveTo(34, 256);
  ctx.lineTo(366, 380);
  ctx.stroke();

  ctx.fillStyle = hexToRgba(theme.accent, 0.98);
  ctx.beginPath();
  ctx.moveTo(438, 92);
  ctx.lineTo(344, 102);
  ctx.lineTo(390, 174);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hexToRgba(theme.accent2, 0.98);
  ctx.beginPath();
  ctx.moveTo(438, 420);
  ctx.lineTo(344, 410);
  ctx.lineTo(390, 338);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 14;
  ctx.strokeStyle = 'rgba(235,255,255,.8)';
  ctx.shadowColor = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(18, 256);
  ctx.lineTo(118, 256);
  ctx.stroke();
  ctx.restore();
  return canvasTexture(c);
}

function buildBranchDecor(track, theme, quality) {
  const group = new THREE.Group();
  group.name = 'branch-decor';
  if (!track.branches.length) return group;

  const N = quality === 'low' ? 64 : 108;
  const islandTex = makeIslandTexture(theme);
  const islandMat = new THREE.MeshStandardMaterial({
    map: islandTex,
    emissiveMap: islandTex,
    emissive: new THREE.Color(theme.accent),
    emissiveIntensity: 0.55,
    color: 0xffffff,
    metalness: 0.45,
    roughness: 0.4,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8,
  });
  const edgeMats = [
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent).multiplyScalar(1.5),
      toneMapped: false, fog: false,
    }),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent2).multiplyScalar(1.5),
      toneMapped: false, fog: false,
    }),
  ];
  const laneMats = [
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent).multiplyScalar(1.1),
      transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false, fog: false,
    }),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(theme.accent2).multiplyScalar(1.1),
      transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false, fog: false,
    }),
  ];
  const forkMat = new THREE.MeshBasicMaterial({
    map: makeForkDecalTexture(theme), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
    toneMapped: false, fog: false,
  });

  track.branches.forEach((branch) => {
    const u0 = branch.u - branch.len * 0.5;
    const u1 = branch.u + branch.len * 0.5;

    // Raised median island. Its width follows the same taper the physics uses.
    const positions = [], uvs = [], indices = [];
    for (let i = 0; i <= N; i++) {
      const u = u0 + (u1 - u0) * (i / N);
      const h = track.islandHalfAt(u);
      for (const side of [-1, 1]) {
        const sm = track.sample(u, side * h);
        const p = sm.position.addScaledVector(sm.up, 0.14);
        positions.push(p.x, p.y, p.z);
        uvs.push((i / N) * 8, side > 0 ? 1 : 0);
      }
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const island = new THREE.Mesh(geo, islandMat);
    island.renderOrder = 1;
    group.add(island);

    for (const side of [-1, 1]) {
      const edgePoints = [];
      for (let i = 0; i <= N; i++) {
        const u = u0 + (u1 - u0) * (i / N);
        const h = track.islandHalfAt(u);
        if (h < 0.08) continue;
        const sm = track.sample(u, side * h);
        edgePoints.push(sm.position.addScaledVector(sm.up, 0.19));
      }
      if (edgePoints.length > 1) {
        const curve = new THREE.CatmullRomCurve3(edgePoints);
        const tube = new THREE.TubeGeometry(curve, N, 0.055, 4, false);
        group.add(new THREE.Mesh(tube, edgeMats[side > 0 ? 0 : 1]));
      }

      const lanePoints = [];
      for (let i = 0; i <= N; i++) {
        const u = u0 + (u1 - u0) * (i / N);
        const sm = track.sample(u, track.laneCenterAt(u, side));
        lanePoints.push(sm.position.addScaledVector(sm.up, 0.055));
      }
      if (lanePoints.length > 1) {
        const curve = new THREE.CatmullRomCurve3(lanePoints);
        const tube = new THREE.TubeGeometry(curve, N, 0.035, 3, false);
        const line = new THREE.Mesh(tube, laneMats[side > 0 ? 0 : 1]);
        line.renderOrder = 2;
        group.add(line);
      }
    }

    // Painted Y-fork just before the tarmac widens.
    const half = track.halfWidth - 0.25;
    const decal = makeSurfacePatch(
      track, u0 - 0.145, u0 - 0.012, -half, half, 0.052,
      forkMat, 10, 12,
    );
    decal.renderOrder = 2;
    group.add(decal);
  });

  return group;
}

export function createTrackWorld(track, renderer, quality = 'high') {
  const theme = track.config.theme;
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const group = new THREE.Group();
  group.name = `track-${track.config.id}`;

  const road = buildRoad(track, theme, quality, anisotropy);
  group.add(road);
  group.add(buildRails(track, theme, quality));
  group.add(buildPylons(track, theme));
  group.add(buildBillboards(track, theme));
  group.add(buildBranchDecor(track, theme, quality));
  const shards = buildShards(track, theme);
  group.add(shards);

  const gate = buildStartGate(track, theme);
  group.add(gate.group);

  // checkered start strip
  const checkMat = new THREE.MeshBasicMaterial({
    map: makeCheckeredTexture(theme), side: THREE.DoubleSide,
    toneMapped: false, transparent: true, opacity: 0.7, depthWrite: false,
  });
  checkMat.map.anisotropy = anisotropy;
  const startStrip = makeSurfacePatch(track, -0.022, 0.022, -track.halfWidth + 0.2, track.halfWidth - 0.2, 0.035, checkMat, 4, 6);
  startStrip.renderOrder = 2;
  group.add(startStrip);

  const pads = buildBoostPads(track, theme);
  group.add(pads.group);

  // finish line outer markings
  const lineMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(theme.accent2).multiplyScalar(1.4),
    toneMapped: false, transparent: true, opacity: 0.85, depthWrite: false,
  });
  const lineA = makeSurfacePatch(track, -0.03, -0.025, -track.halfWidth, track.halfWidth, 0.04, lineMat, 2, 8);
  const lineB = makeSurfacePatch(track, 0.025, 0.03, -track.halfWidth, track.halfWidth, 0.04, lineMat, 2, 8);
  lineA.renderOrder = 2; lineB.renderOrder = 2;
  group.add(lineA, lineB);

  return {
    group,
    theme,
    gate: gate.group,
    startLights: gate.lights,
    pads,
    shards,
    update(elapsed, dt) {
      shards.children.forEach((m, i) => {
        m.rotation.x += m.userData.spin.x * dt;
        m.rotation.y += m.userData.spin.y * dt;
        m.rotation.z += m.userData.spin.z * dt;
        m.position.y = m.userData.baseY + Math.sin(elapsed * m.userData.floatSpeed + i * 2.1) * 0.9;
      });
      pads.texture.offset.x = (elapsed * 0.55) % 1;
      pads.pads.forEach((p) => {
        if (p.cooldown > 0) p.cooldown -= dt;
        p.mesh.material.opacity = 0.84 + Math.sin(elapsed * 3 + p.u * 2) * 0.08;
      });
    },
    setStartLights(stage) {
      // stage: 0..5 (red lights), 6 = green, 7 = off
      gate.lights.forEach((mat, i) => {
        if (stage >= 0 && stage <= 5) {
          const on = i < stage;
          mat.color.set(on ? '#ff2a1a' : '#1a0808');
          mat.color.multiplyScalar(on ? 1.8 : 1);
        } else if (stage === 6) {
          mat.color.set('#55ff8a').multiplyScalar(2.0);
        } else {
          mat.color.set('#1a0808');
        }
      });
    },
    dispose() {
      disposeGroup(group);
    },
  };
}
