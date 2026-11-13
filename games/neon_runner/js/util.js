/* ============================================================
   NEON RUNNER // shared helpers, procedural textures
   ============================================================ */
(function (global) {
  'use strict';
  const NR = global.NR = global.NR || {};

  const TAU = Math.PI * 2;
  NR.TAU = TAU;
  NR.DEG = Math.PI / 180;
  NR.clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  NR.lerp = (a, b, t) => a + (b - a) * t;
  NR.invLerp = (a, b, v) => (v - a) / (b - a);
  NR.smoothstep = (a, b, x) => {
    const t = NR.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  NR.damp = (current, target, lambda, dt) => NR.lerp(current, target, 1 - Math.exp(-lambda * dt));
  NR.wrap = (v, n) => ((v % n) + n) % n;
  NR.wrapAngle = a => {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  };
  NR.dampAngle = (current, target, lambda, dt) => current + NR.wrapAngle(target - current) * (1 - Math.exp(-lambda * dt));
  NR.rand = (a, b) => a + Math.random() * (b - a);
  NR.pick = arr => arr[(Math.random() * arr.length) | 0];
  NR.clamp01 = v => v < 0 ? 0 : (v > 1 ? 1 : v);

  // deterministic RNG for city layout
  NR.mulberry32 = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  NR.rng = NR.mulberry32(20870413);
  NR.rr = (a, b) => a + NR.rng() * (b - a);
  NR.rpick = arr => arr[(NR.rng() * arr.length) | 0];

  NR.pad = (n, l) => String(n).padStart(l, '0');
  NR.fmtTime = function (seconds, forceMin) {
    if (!isFinite(seconds) || seconds < 0) return '--:--.---';
    const ms = Math.floor(seconds * 1000);
    const m = Math.floor(ms / 60000);
    const s = Math.floor(ms / 1000) % 60;
    const milli = ms % 1000;
    return NR.pad(m, 2) + ':' + NR.pad(s, 2) + '.' + NR.pad(milli, 3);
  };
  NR.fmtTimeShort = function (seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '--.--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toFixed(2).padStart(5, '0')}` : s.toFixed(2);
  };

  /* ---------------------------------------------------------
     Canvas / texture helpers
     --------------------------------------------------------- */
  NR.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  NR.canvasTexture = function (canvas, opts) {
    const t = new THREE.CanvasTexture(canvas);
    opts = opts || {};
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = opts.wrapS || THREE.RepeatWrapping;
    t.wrapT = opts.wrapT || THREE.RepeatWrapping;
    t.anisotropy = opts.anisotropy || 8;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    t.needsUpdate = true;
    return t;
  };

  function noiseFill(ctx, w, h, base, amount, seed) {
    const rng = NR.mulberry32(seed || 7);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rng() - 0.5) * amount;
      d[i] = NR.clamp(d[i] + n, 0, 255);
      d[i + 1] = NR.clamp(d[i + 1] + n, 0, 255);
      d[i + 2] = NR.clamp(d[i + 2] + n, 0, 255);
    }
    ctx.putImageData(img, 0, 0);
  }

  NR.asphaltTexture = function () {
    const w = 512, h = 512;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1b1d25'); g.addColorStop(.5, '#12141b'); g.addColorStop(1, '#1a1c24');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    noiseFill(ctx, w, h, 0, 30, 41);
    // tar seams
    const rng = NR.mulberry32(91);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      let x = rng() * w, y = rng() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (rng() - .5) * 100; y += rng() * 70;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(4,5,9,.32)';
      ctx.lineWidth = .7 + rng() * 1.5;
      ctx.stroke();
    }
    // wet patches
    for (let i = 0; i < 24; i++) {
      const x = rng() * w, y = rng() * h, r = 16 + rng() * 60;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(120,180,210,.035)');
      rg.addColorStop(1, 'rgba(120,180,210,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    // tiny bright aggregate
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rng() > .5 ? 'rgba(190,205,225,.055)' : 'rgba(0,0,0,.12)';
      ctx.fillRect(rng() * w, rng() * h, 1, 1);
    }
    return NR.canvasTexture(c, { repeat: [1, 1] });
  };

  NR.concreteTexture = function (tint) {
    const w = 256, h = 256;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = tint || '#242630'; ctx.fillRect(0, 0, w, h);
    noiseFill(ctx, w, h, 0, 20, 73);
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    return NR.canvasTexture(c);
  };

  NR.sidewalkTexture = function () {
    const w = 256, h = 256;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = '#20232c'; ctx.fillRect(0, 0, w, h);
    noiseFill(ctx, w, h, 0, 16, 22);
    ctx.strokeStyle = 'rgba(5,7,12,.7)'; ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(90,240,255,.045)'; ctx.lineWidth = 1;
    for (let x = 32; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    return NR.canvasTexture(c, { repeat: [2, 2] });
  };

  NR.metalTexture = function () {
    const w = 256, h = 256;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = '#141824'; ctx.fillRect(0, 0, w, h);
    const rng = NR.mulberry32(55);
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(130,180,210,${rng() * .035})`;
      ctx.fillRect(0, y, w, 1);
    }
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3;
    for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let x = 0; x < w; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    return NR.canvasTexture(c);
  };

  NR.checkerTexture = function () {
    const w = 512, h = 96;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    const s = 24;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        const on = ((x / s) + (y / s)) % 2 === 0;
        ctx.fillStyle = on ? '#f4fbff' : '#0b0d16';
        ctx.fillRect(x, y, s, s);
      }
    }
    ctx.strokeStyle = 'rgba(37,237,255,.9)'; ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    return NR.canvasTexture(c, { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping });
  };

  NR.windowTexture = function (variant) {
    const w = 512, h = 512;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    const rng = NR.mulberry32(1200 + variant * 77);
    const palettes = [
      ['#081120', '#2df3ff', '#ff2d95', '#b7f9ff'],
      ['#12081a', '#ff2d95', '#8a6dff', '#ffd1ec'],
      ['#141006', '#ffb347', '#25edff', '#fff2ce'],
      ['#07120e', '#63ffb0', '#25edff', '#e0fff0']
    ];
    const pal = palettes[variant % palettes.length];
    ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h);
    // vertical structure
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 8, h);
    const cols = 10, rows = 20, cellW = w / cols, cellH = h / rows;
    for (let y = 0; y < rows; y++) {
      if (rng() < .08) continue;
      for (let x = 0; x < cols; x++) {
        const lit = rng() < .52;
        const px = x * cellW + 8, py = y * cellH + 6;
        const ww = cellW - 16, hh = cellH - 12;
        if (lit) {
          const col = pal[1 + ((rng() * (pal.length - 1)) | 0)];
          ctx.fillStyle = col;
          ctx.globalAlpha = .35 + rng() * .65;
          ctx.fillRect(px, py, ww, hh);
          ctx.globalAlpha = 1;
          if (rng() < .26) {
            ctx.fillStyle = 'rgba(255,255,255,.65)';
            ctx.fillRect(px + 2, py + 2, ww * .4, 2);
          }
        } else {
          ctx.fillStyle = 'rgba(5,8,14,.65)';
          ctx.fillRect(px, py, ww, hh);
        }
      }
      if (y % 5 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, y * cellH, w, 3);
      }
    }
    // neon vertical strips on edges
    ctx.shadowBlur = 20;
    for (let i = 0; i < 3; i++) {
      ctx.shadowColor = pal[1 + i % 2];
      ctx.fillStyle = pal[1 + i % 2];
      ctx.globalAlpha = .7;
      const x = 20 + rng() * (w - 40);
      ctx.fillRect(x, 0, 2 + rng() * 2, h);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    // rooftop/antenna band
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(0, 0, w, 10);
    return NR.canvasTexture(c);
  };

  NR.corrugatedTexture = function (color) {
    const w = 256, h = 256;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.fillStyle = color || '#1b202a'; ctx.fillRect(0, 0, w, h);
    const rng = NR.mulberry32(9);
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = `rgba(0,0,0,${.12 + rng() * .1})`;
      ctx.fillRect(x, 0, 3, h);
      ctx.fillStyle = `rgba(180,220,240,${.025 + rng() * .03})`;
      ctx.fillRect(x + 4, 0, 2, h);
    }
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.fillRect(rng() * w, rng() * h, 20 + rng() * 50, 2 + rng() * 4);
    }
    return NR.canvasTexture(c);
  };

  NR.glowTexture = function (size) {
    const w = size || 128;
    const c = NR.makeCanvas(w, w), ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.18, 'rgba(255,255,255,.75)');
    g.addColorStop(.45, 'rgba(160,230,255,.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  };

  NR.rainTexture = function () {
    const c = NR.makeCanvas(32, 128), ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(150,230,255,0)');
    g.addColorStop(.5, 'rgba(180,245,255,.6)');
    g.addColorStop(1, 'rgba(230,255,255,1)');
    ctx.fillStyle = g; ctx.fillRect(12, 0, 6, 128);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  };

  const SIGN_WORDS = [
    ['NEON', 'NIGHT DIVISION'], ['龍', 'RYU CORP'], ['未来', 'MIRAI 未来'],
    ['DRIVE', 'NO LIMIT'], ['夜', 'YORU'], ['サイバー', 'CYBERWARE'],
    ['NO FUTURE', 'SECTOR 07'], ['SYNTH', 'AUDIO LAB'], ['RAMEN', 'OPEN 24H'],
    ['電気', 'DENKI'], ['GHOST', 'SHELL DIV'], ['HOTEL', 'LOVE / VACANCY'],
    ['KAIJU', 'COLD BEER'], ['零', 'ZERO'], ['HYPER', 'DRIVE'],
    ['東京', 'TOKYO 2087'], ['BIO', 'MODS'], ['SIGNAL', 'LOST'],
    ['AFTERLIFE', 'CLUB'], ['電脳', 'DENNO'], ['赤', 'AKA'],
    ['DREAM', 'SYNDICATE'], ['NOVA', 'CORP'], ['666', 'NIGHT RADIO']
  ];
  NR.SIGN_WORDS = SIGN_WORDS;

  NR.signTexture = function (opts) {
    opts = opts || {};
    const vertical = !!opts.vertical;
    const w = vertical ? 320 : 640, h = vertical ? 640 : 320;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    const col = opts.color || '#25edff';
    const col2 = opts.color2 || '#ff2d95';
    ctx.clearRect(0, 0, w, h);
    // panel
    ctx.fillStyle = 'rgba(4,6,14,.3)';
    ctx.fillRect(0, 0, w, h);
    // glow frame
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 22;
    const inset = 13;
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
    ctx.strokeStyle = col2; ctx.lineWidth = 2; ctx.shadowColor = col2;
    ctx.strokeRect(inset + 9, inset + 9, w - (inset + 9) * 2, h - (inset + 9) * 2);
    ctx.restore();
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,.16)';
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
    const text = opts.text || 'NEON';
    const sub = opts.sub || 'NIGHT CITY';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = col;
    ctx.fillStyle = vertical ? '#eaffff' : col;
    if (vertical) {
      const chars = text.split('');
      const fs = Math.min(150, (h - 130) / Math.max(chars.length, 1));
      ctx.font = `900 ${fs}px "Arial Black","Hiragino Sans","PingFang SC",sans-serif`;
      chars.forEach((ch, i) => {
        ctx.save();
        ctx.fillStyle = i % 2 ? col2 : '#eaffff';
        ctx.shadowColor = i % 2 ? col2 : col;
        ctx.shadowBlur = 28;
        ctx.fillText(ch, w / 2, 80 + (i + .5) * fs * 1.02);
        ctx.restore();
      });
      ctx.font = '600 26px "SFMono-Regular",Menlo,monospace';
      ctx.fillStyle = col; ctx.shadowBlur = 16;
      ctx.fillText(sub, w / 2, h - 58);
    } else {
      const fs = Math.min(150, (w - 80) / Math.max(text.length * .68, 1));
      ctx.font = `900 ${fs}px "Arial Black","Hiragino Sans","PingFang SC",sans-serif`;
      ctx.shadowBlur = 34;
      ctx.fillStyle = '#effeff';
      ctx.fillText(text, w / 2, h * .45);
      ctx.font = '600 27px "SFMono-Regular",Menlo,monospace';
      ctx.fillStyle = col2; ctx.shadowColor = col2; ctx.shadowBlur = 18;
      ctx.fillText(sub.toUpperCase(), w / 2, h * .66);
      // little bar code
      ctx.shadowBlur = 0;
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = i % 3 ? 'rgba(200,250,255,.35)' : 'rgba(255,45,149,.5)';
        ctx.fillRect(w - 150 + i * 4, h - 54, 2, 22);
      }
    }
    // glitch slices
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col2; ctx.globalAlpha = .16;
    ctx.fillRect(inset, h * .28, w, 3);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  };

  // Directional corner chevrons. dir = 1 points to the driver's right,
  // dir = -1 points to the driver's left. The texture is portrait because
  // the boards are tall roadside panels, but each chevron points sideways
  // along the racing line (never straight up).
  NR.chevronTexture = function (color, dir) {
    const w = 256, h = 512;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    const d = dir < 0 ? -1 : 1;
    ctx.clearRect(0, 0, w, h);
    const col = color || '#25edff';
    ctx.strokeStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 22;
    ctx.lineWidth = 19;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    // three stacked chevrons, apex pointing left or right
    for (let row = 0; row < 3; row++) {
      const cy = 116 + row * 140;
      const backX = d > 0 ? 62 : w - 62;
      const apexX = d > 0 ? w - 56 : 56;
      ctx.beginPath();
      ctx.moveTo(backX, cy - 56);
      ctx.lineTo(apexX, cy);
      ctx.lineTo(backX, cy + 56);
      ctx.stroke();
    }
    // faint reflective frame so the panel reads as a sign, not a floating glyph
    ctx.shadowBlur = 10;
    ctx.globalAlpha = .5;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  };

  // Diagonal hazard stripes for tunnel portals / barriers.
  NR.hazardStripeTexture = function (color) {
    const w = 256, h = 512;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    const col = color || '#ffb347';
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.lineWidth = 26;
    ctx.lineCap = 'butt';
    for (let x = -h; x < w + h; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, h + 20);
      ctx.lineTo(x + h + 40, -20);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  };

  NR.fishTexture = function () {
    const w = 1024, h = 512;
    const c = NR.makeCanvas(w, h), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * .54, h * .52);
    ctx.shadowColor = '#25edff'; ctx.shadowBlur = 28;
    // body
    ctx.beginPath();
    ctx.moveTo(-260, 0);
    ctx.bezierCurveTo(-210, -120, 80, -150, 250, -20);
    ctx.bezierCurveTo(315, 20, 315, 70, 250, 110);
    ctx.bezierCurveTo(100, 175, -170, 130, -260, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(-260, 0, 280, 0);
    g.addColorStop(0, 'rgba(255,45,149,.16)');
    g.addColorStop(.45, 'rgba(37,237,255,.22)');
    g.addColorStop(1, 'rgba(150,107,255,.08)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(120,245,255,.85)'; ctx.lineWidth = 3; ctx.stroke();
    // tail
    ctx.beginPath();
    ctx.moveTo(-250, 0);
    ctx.quadraticCurveTo(-360, -100, -430, -125);
    ctx.quadraticCurveTo(-400, -10, -430, 130);
    ctx.quadraticCurveTo(-350, 90, -250, 5);
    ctx.strokeStyle = 'rgba(255,90,175,.6)'; ctx.lineWidth = 2; ctx.stroke();
    // fin
    ctx.beginPath();
    ctx.moveTo(-20, -130); ctx.quadraticCurveTo(40, -220, 160, -205);
    ctx.quadraticCurveTo(75, -125, 30, -120);
    ctx.strokeStyle = 'rgba(150,120,255,.5)'; ctx.stroke();
    // wireframe
    ctx.strokeStyle = 'rgba(120,245,255,.22)'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-230, i * 22);
      ctx.quadraticCurveTo(30, i * 28, 260, i * 12);
      ctx.stroke();
    }
    for (let x = -210; x < 250; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, -115); ctx.lineTo(x + 20, 120);
      ctx.stroke();
    }
    // eye
    ctx.beginPath(); ctx.arc(165, -30, 19, 0, TAU);
    ctx.fillStyle = '#ff2d95'; ctx.shadowColor = '#ff2d95'; ctx.shadowBlur = 30; ctx.fill();
    ctx.beginPath(); ctx.arc(165, -30, 7, 0, TAU);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    // little glyphs
    ctx.shadowBlur = 12;
    ctx.font = '600 22px "SFMono-Regular",monospace';
    ctx.fillStyle = 'rgba(150,245,255,.6)';
    ctx.fillText('LEVIATHAN // AQUA-07', -180, 195);
    ctx.restore();
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  };

  NR.makeCubeEnv = function () {
    const faces = [];
    for (let f = 0; f < 6; f++) {
      const c = NR.makeCanvas(128, 128), ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      if (f === 2) { g.addColorStop(0, '#c8ecff'); g.addColorStop(1, '#ff5db1'); }
      else if (f === 3) { g.addColorStop(0, '#0a0714'); g.addColorStop(1, '#08060f'); }
      else { g.addColorStop(0, '#120b24'); g.addColorStop(.55, '#1d1233'); g.addColorStop(1, '#02030a'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      const rng = NR.mulberry32(700 + f);
      // neon horizon smears
      for (let i = 0; i < 15; i++) {
        const x = rng() * 128, y = 40 + rng() * 88;
        const col = rng() > .5 ? 'rgba(37,237,255,' : 'rgba(255,45,149,';
        ctx.fillStyle = col + (0.05 + rng() * .2) + ')';
        ctx.fillRect(x, y, 2 + rng() * 26, 1 + rng() * 4);
      }
      // sky dots
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(210,240,255,.3)';
        ctx.fillRect(rng() * 128, rng() * 55, 1, 1);
      }
      faces.push(c);
    }
    const cube = new THREE.CubeTexture(faces);
    cube.encoding = THREE.sRGBEncoding;
    cube.needsUpdate = true;
    return cube;
  };

  NR.envCube = null;

  /* ---------------------------------------------------------
     Three.js geometry helpers
     --------------------------------------------------------- */
  NR.box = function (w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  };

  NR.addLights = function (group, color, count, radius) {
    // fake point-light glow sprites, cheap
    const tex = NR.glowTexture();
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, color, transparent: true, opacity: .8,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      }));
      s.scale.set(radius, radius, 1);
      group.add(s);
    }
  };

  NR.makeLineSegments = function (segments, color, opacity) {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(segments.length * 3);
    for (let i = 0; i < segments.length; i++) {
      arr[i * 3] = segments[i].x; arr[i * 3 + 1] = segments[i].y; arr[i * 3 + 2] = segments[i].z;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const m = new THREE.LineBasicMaterial({
      color: color, transparent: true, opacity: opacity == null ? .8 : opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    return new THREE.LineSegments(g, m);
  };

  // Returns a THREE.Group oriented on the track at sample i.
  NR.frameGroup = function (sample, yOffset) {
    const g = new THREE.Group();
    g.position.copy(sample.pos);
    g.position.y += yOffset || 0;
    g.rotation.y = Math.atan2(sample.tangent.x, sample.tangent.z);
    return g;
  };

  NR.secondsToLap = s => NR.fmtTime(s);
  NR.shorten = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  NR.safeLocalStorage = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  NR.PALETTE = {
    cyan: 0x25edff,
    magenta: 0xff2d95,
    violet: 0x946bff,
    amber: 0xffb347,
    green: 0x74ffb0,
    red: 0xff4568,
    white: 0xeafcff
  };

  NR.SECTORS = [
    { id: 'street', index: 1, en: 'NEON AVENUE', cn: '霓虹大道', color: 0x25edff, css: '#25edff' },
    { id: 'elevated', index: 2, en: 'SKYLINE FREEWAY', cn: '高架动脉', color: 0x9a6bff, css: '#9a6bff' },
    { id: 'bridge', index: 3, en: 'ABYSS BRIDGE', cn: '跨海光桥', color: 0xff2d95, css: '#ff2d95' },
    { id: 'tunnel', index: 4, en: 'UNDERPASS 09', cn: '地底环线', color: 0xffb347, css: '#ffb347' },
    { id: 'industrial', index: 5, en: 'RUST YARDS', cn: '废弃工业区', color: 0x74ffb0, css: '#74ffb0' },
    { id: 'plaza', index: 6, en: 'NEON PLAZA', cn: '霓虹广场', color: 0xff5ea8, css: '#ff5ea8' }
  ];

})(window);
