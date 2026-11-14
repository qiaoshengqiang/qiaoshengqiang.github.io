import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
// 帧率无关的指数趋近
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const chance = (p) => Math.random() < p;
export const fmtScore = (n) => String(Math.max(0, n)).padStart(7, '0');

export function dist2(ax, ay, az, bx, by, bz) {
  const dx = ax - bx, dy = ay - by, dz = az - bz;
  return dx * dx + dy * dy + dz * dz;
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function canvasTex(w, h, draw, opts = {}) {
  const [c, g] = makeCanvas(w, h);
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(opts.repeat[0], opts.repeat[1]); }
  tex.anisotropy = 4;
  return tex;
}

// ---- 常用贴图缓存 ----
const _cache = new Map();
function cached(key, fn) {
  if (!_cache.has(key)) _cache.set(key, fn());
  return _cache.get(key);
}

// 柔和圆形粒子贴图
export function softCircleTex(color = '#ffffff') {
  return cached('soft:' + color, () => canvasTex(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, colorWithAlpha(color, 0.55));
    grad.addColorStop(1, colorWithAlpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }));
}

// 中心亮点光晕
export function glowTex(color = '#ffffff') {
  return cached('glow:' + color, () => canvasTex(128, 128, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.18, color);
    grad.addColorStop(0.45, colorWithAlpha(color, 0.35));
    grad.addColorStop(1, colorWithAlpha(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }));
}

// 拖尾（横向渐隐长条）
export function streakTex(color = '#ffffff') {
  return cached('streak:' + color, () => canvasTex(64, 16, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, colorWithAlpha(color, 0));
    grad.addColorStop(0.6, colorWithAlpha(color, 0.5));
    grad.addColorStop(1, '#ffffff');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }));
}

// 云朵
export function cloudTex(tint = '#ffffff') {
  return cached('cloud:' + tint, () => canvasTex(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const x = rand(w * 0.15, w * 0.85), y = rand(h * 0.3, h * 0.7), r = rand(14, 42);
      const grad = g.createRadialGradient(x, y, 1, x, y, r);
      grad.addColorStop(0, colorWithAlpha(tint, rand(0.25, 0.5)));
      grad.addColorStop(1, colorWithAlpha(tint, 0));
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }));
}

function parseColor(c) {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return [255, 255, 255];
}
export function colorWithAlpha(c, a) {
  const [r, g, b] = parseColor(c);
  return `rgba(${r},${g},${b},${a})`;
}
