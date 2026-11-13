import * as THREE from 'three';

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const mod = (n, m) => ((n % m) + m) % m;
export const TAU = Math.PI * 2;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function formatTime(seconds, showMs = true) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const totalMs = Math.floor(seconds * 1000);
  const m = Math.floor(totalMs / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return showMs
    ? `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDelta(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  if (Math.abs(seconds) < 0.0005) return '±0.000';
  return `${seconds > 0 ? '+' : '−'}${Math.abs(seconds).toFixed(3)}`;
}

export function ordinalZh(n) {
  return ['冠军', '亚军', '季军', '第四名', '第五名', '第六名'][n - 1] || `${n} 名`;
}

export function mulberry32(seed) {
  return function () {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function canvasTexture(canvas, opts = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = opts.colorSpace ?? THREE.SRGBColorSpace;
  t.wrapS = opts.wrapS ?? THREE.ClampToEdgeWrapping;
  t.wrapT = opts.wrapT ?? THREE.ClampToEdgeWrapping;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  t.anisotropy = opts.anisotropy ?? 4;
  t.needsUpdate = true;
  return t;
}

let _glowTex = null;
export function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,.92)');
  g.addColorStop(0.35, 'rgba(255,255,255,.35)');
  g.addColorStop(0.72, 'rgba(255,255,255,.06)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _glowTex = canvasTexture(c, { colorSpace: THREE.SRGBColorSpace });
  _glowTex.userData.shared = true;
  return _glowTex;
}

export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 256) {
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, inner.replace(/[\d.]+\)$/, '0.55)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvasTexture(c);
}

export function makeAsphaltTexture(theme, anisotropy = 8) {
  const W = 768, H = 768;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d');
  const base = new THREE.Color(theme.road);
  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, W, H);

  // subtle tonal streaks along the driving direction
  const rng = mulberry32(theme.seed || 7);
  for (let i = 0; i < 260; i++) {
    const y = rng() * H;
    const a = 0.015 + rng() * 0.04;
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 0.5 + rng() * 2.2;
    ctx.beginPath();
    ctx.moveTo(rng() * W, y);
    ctx.lineTo(rng() * W, y + (rng() - 0.5) * 8);
    ctx.stroke();
  }
  // coarse asphalt grain
  for (let i = 0; i < 4200; i++) {
    const x = rng() * W, y = rng() * H;
    const light = rng() > 0.55;
    ctx.fillStyle = light ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.09)';
    const s = rng() * 2;
    ctx.fillRect(x, y, s, s);
  }

  // tyre lines
  for (const v of [0.255, 0.39, 0.62, 0.745]) {
    const y = v * H;
    const g = ctx.createLinearGradient(0, y - 22, 0, y + 22);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 22, W, 44);
  }

  // lane dashes
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = 'rgba(214,245,250,.34)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([58, 46]);
  for (const v of [0.333, 0.667]) {
    ctx.beginPath();
    ctx.moveTo(0, v * H);
    ctx.lineTo(W, v * H);
    ctx.stroke();
  }
  ctx.restore();

  // center racing line dash
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 11;
  ctx.strokeStyle = 'rgba(225,252,255,.5)';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([84, 58]);
  ctx.beginPath();
  ctx.moveTo(0, H * 0.5);
  ctx.lineTo(W, H * 0.5);
  ctx.stroke();
  ctx.restore();

  // rumble strips / neon borders
  const border = 26;
  for (const side of [0, H - border]) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,10,14,.7)';
    ctx.fillRect(0, side, W, border);
    const segW = 44;
    for (let x = 0; x < W; x += segW) {
      ctx.fillStyle = ((x / segW) | 0) % 2 === 0 ? theme.accent : theme.accent2;
      ctx.globalAlpha = 0.58;
      ctx.fillRect(x + 2, side + 5, segW - 4, border - 10);
    }
    ctx.restore();
  }

  // hard glowing edge lines
  ctx.save();
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 14;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(W, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H - 4); ctx.lineTo(W, H - 4); ctx.stroke();
  ctx.restore();

  // faint hex / service markings to give texture scale
  ctx.globalAlpha = 0.055;
  ctx.strokeStyle = '#dffaff';
  ctx.lineWidth = 1;
  for (let x = 60; x < W; x += 130) {
    for (let y = 130; y < H - 100; y += 150) {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 3 * k + Math.PI / 6;
        const px = x + Math.cos(a) * 17;
        const py = y + Math.sin(a) * 17;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  const tex = canvasTexture(c, {
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    anisotropy,
  });
  return tex;
}

export function makeCheckeredTexture(theme) {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  const cols = 4, rows = 22;
  const cw = c.width / cols, ch = c.height / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(204,240,246,.6)' : 'rgba(3,7,11,.88)';
      ctx.fillRect(x * cw, y * ch, cw + 0.5, ch + 0.5);
    }
  }
  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 9;
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, c.width, c.height);
  ctx.restore();
  return canvasTexture(c);
}

export function makeBoostTexture(theme) {
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);

  const bg = ctx.createLinearGradient(0, 0, 512, 0);
  bg.addColorStop(0, `rgba(${hexToRgbTuple(theme.accent)},0)`);
  bg.addColorStop(0.2, `rgba(${hexToRgbTuple(theme.accent)},.16)`);
  bg.addColorStop(0.8, `rgba(${hexToRgbTuple(theme.accent)},.16)`);
  bg.addColorStop(1, `rgba(${hexToRgbTuple(theme.accent)},0)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 30, 512, 196);

  ctx.save();
  ctx.translate(0, 128);
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 20;
  for (let i = 0; i < 4; i++) {
    const x = 55 + i * 112;
    ctx.strokeStyle = i === 3 ? '#ffffff' : theme.accent;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(x - 28, -60);
    ctx.lineTo(x + 24, 0);
    ctx.lineTo(x - 28, 60);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '600 18px Rajdhani, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('NITRO +', 490, 52);

  return canvasTexture(c, { wrapS: THREE.RepeatWrapping });
}

export function makeBillboardTexture(title, sub, theme, tag = 'MÖBIUS GP') {
  const c = makeCanvas(1024, 512);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 1024, 512);
  const bg = ctx.createLinearGradient(0, 0, 1024, 512);
  bg.addColorStop(0, 'rgba(4,10,16,.9)');
  bg.addColorStop(0.55, 'rgba(9,19,26,.82)');
  bg.addColorStop(1, 'rgba(3,8,13,.92)');
  ctx.fillStyle = bg;
  ctx.fillRect(24, 24, 976, 464);

  ctx.save();
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, 24); ctx.lineTo(300, 24);
  ctx.moveTo(724, 24); ctx.lineTo(1000, 24);
  ctx.moveTo(24, 488); ctx.lineTo(180, 488);
  ctx.moveTo(844, 488); ctx.lineTo(1000, 488);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = 'rgba(160,230,245,.12)';
  ctx.lineWidth = 1;
  for (let x = 64; x < 1000; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x, 488); ctx.stroke();
  }

  ctx.fillStyle = theme.accent2;
  ctx.font = '700 22px Rajdhani, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText(tag, 64, 104);

  ctx.fillStyle = '#f2feff';
  ctx.font = '700 80px Orbitron, sans-serif';
  ctx.fillText(title, 62, 222);

  ctx.fillStyle = theme.accent;
  ctx.font = '600 34px Rajdhani, sans-serif';
  ctx.fillText(sub, 66, 286);

  ctx.fillStyle = 'rgba(190,235,245,.5)';
  ctx.font = '600 20px Rajdhani, sans-serif';
  ctx.fillText('NON-ORIENTABLE · ONE SIDE · INFINITE', 66, 382);

  ctx.fillStyle = theme.accent;
  ctx.fillRect(66, 412, 180, 3);
  ctx.fillStyle = 'rgba(190,235,245,.18)';
  ctx.fillRect(66, 440, 720, 1);

  ctx.fillStyle = 'rgba(190,235,245,.4)';
  ctx.font = '600 16px Rajdhani, sans-serif';
  ctx.fillText('SECTOR 07 / LIVE FEED', 780, 446);
  return canvasTexture(c);
}

export function makeNumberTexture(number, accent) {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.save();
  ctx.translate(128, 128);
  ctx.strokeStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 7;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i + Math.PI / 6;
    const x = Math.cos(a) * 92;
    const y = Math.sin(a) * 92;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(4,10,15,.8)';
  ctx.fill();
  ctx.fillStyle = '#effeff';
  ctx.font = '900 104px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), 0, 6);
  ctx.restore();
  return canvasTexture(c);
}

export function makeEnvironmentTexture(theme) {
  const c = makeCanvas(1024, 512);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, theme.skyTop);
  g.addColorStop(0.42, theme.skyBottom);
  g.addColorStop(0.56, theme.fog);
  g.addColorStop(1, '#01030a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  const glow = ctx.createRadialGradient(720, 220, 10, 720, 220, 260);
  glow.addColorStop(0, hexToRgba(theme.accent, 0.65));
  glow.addColorStop(0.25, hexToRgba(theme.accent, 0.18));
  glow.addColorStop(1, hexToRgba(theme.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(360, 0, 720, 512);

  const glow2 = ctx.createRadialGradient(260, 280, 10, 260, 280, 300);
  glow2.addColorStop(0, hexToRgba(theme.accent2, 0.35));
  glow2.addColorStop(1, hexToRgba(theme.accent2, 0));
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, 620, 512);

  ctx.fillStyle = 'rgba(235,255,255,.12)';
  ctx.fillRect(0, 282, 1024, 1);
  ctx.fillStyle = 'rgba(235,255,255,.045)';
  ctx.fillRect(0, 306, 1024, 2);
  ctx.fillStyle = 'rgba(235,255,255,.03)';
  ctx.fillRect(0, 330, 1024, 1);

  const t = canvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

export function makeNebulaTexture(theme, seed = 1) {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  const rng = mulberry32(seed);
  ctx.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 18; i++) {
    const x = 100 + rng() * 312;
    const y = 100 + rng() * 312;
    const r = 30 + rng() * 130;
    const color = rng() > 0.45 ? theme.accent : theme.accent2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexToRgba(color, 0.1 + rng() * 0.12));
    g.addColorStop(0.4, hexToRgba(color, 0.035));
    g.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return canvasTexture(c);
}

export function hexToRgba(hex, a = 1) {
  const col = new THREE.Color(hex);
  return `rgba(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)},${a})`;
}

export function hexToRgbTuple(hex) {
  const col = new THREE.Color(hex);
  return `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
}

export function disposeGroup(root) {
  if (!root) return;
  const geos = new Set();
  const mats = new Set();
  const textures = new Set();
  root.traverse((obj) => {
    if (obj.geometry) geos.add(obj.geometry);
    const m = obj.material;
    if (m) {
      (Array.isArray(m) ? m : [m]).forEach((mat) => mats.add(mat));
    }
  });
  mats.forEach((mat) => {
    for (const key of Object.keys(mat)) {
      if (mat[key] && mat[key].isTexture && !mat[key].userData?.shared) {
        textures.add(mat[key]);
      }
    }
    mat.dispose();
  });
  geos.forEach((g) => g.dispose());
  textures.forEach((t) => t.dispose());
}

export function screenShakeIntensity(amount) {
  return clamp(amount, 0, 1);
}
