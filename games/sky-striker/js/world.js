// 关卡场景环境：天空穹顶、地面、装饰物、天气与天体
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { CONST } from './config.js';
import { Audio } from './audio.js';
import { canvasTex, cloudTex, glowTex, softCircleTex, rand, randInt, pick, chance, TAU } from './utils.js';

// ---- 地面/建筑纹理 ----
function oceanTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#0d5c9e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${10 + rand(0, 30)},${90 + rand(0, 50)},${160 + rand(0, 40)},0.35)`;
      g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(20, 70), rand(10, 30), 0, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(220,240,255,0.5)';
    for (let i = 0; i < 90; i++) {
      const y = rand(0, h), x = rand(0, w), len = rand(6, 26);
      g.lineWidth = rand(0.5, 1.6);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + rand(-1, 1)); g.stroke();
    }
  }, { repeat: [6, 8] });
}
function sandTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b0603a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(${120 + rand(0, 60)},${60 + rand(0, 30)},${30 + rand(0, 20)},0.4)`;
      const y = rand(0, h);
      g.fillRect(0, y, w, rand(4, 18));
    }
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(${180 + rand(0, 60)},${110 + rand(0, 50)},${60 + rand(0, 30)},${rand(0.15, 0.5)})`;
      g.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 3));
    }
  }, { repeat: [6, 8] });
}
function cityGroundTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#07090f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#0d1119';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g.fillRect(i * 32 + 3, j * 32 + 3, 26, 26);
    g.strokeStyle = 'rgba(80,180,255,0.55)'; g.lineWidth = 1.2;
    for (let i = 0; i <= 8; i++) {
      g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke();
    }
    g.fillStyle = 'rgba(255,180,80,0.5)';
    for (let i = 0; i < 20; i++) g.fillRect(Math.floor(rand(0, 8)) * 32 + rand(6, 20), Math.floor(rand(0, 8)) * 32 + rand(6, 20), 3, 3);
  }, { repeat: [5, 7] });
}
function darkSeaTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1a2c3d'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `rgba(${28 + rand(0, 30)},${48 + rand(0, 30)},${66 + rand(0, 36)},0.4)`;
      g.beginPath(); g.ellipse(rand(0, w), rand(0, h), rand(20, 60), rand(8, 26), 0, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(170,200,225,0.35)';
    for (let i = 0; i < 60; i++) {
      const y = rand(0, h), x = rand(0, w);
      g.lineWidth = rand(0.5, 1.2);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand(5, 20), y); g.stroke();
    }
  }, { repeat: [6, 8] });
}
function cloudSeaTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8fb0d8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      const x = rand(0, w), y = rand(0, h), r = rand(14, 50);
      const grad = g.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, `rgba(${225 + rand(0, 20)},${235 + rand(0, 15)},${245},0.5)`);
      grad.addColorStop(1, 'rgba(200,220,240,0)');
      g.fillStyle = grad;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }, { repeat: [5, 7] });
}
function buildingTex() {
  return canvasTex(64, 128, (g, w, h) => {
    g.fillStyle = '#0a0d14'; g.fillRect(0, 0, w, h);
    const colors = ['#5fd0ff', '#ff5fd0', '#ffcf6a', '#a0ffa0'];
    for (let x = 4; x < w - 3; x += 8) {
      for (let y = 5; y < h - 4; y += 9) {
        if (chance(0.55)) {
          g.fillStyle = chance(0.12) ? pick(colors) : `rgba(140,190,230,${rand(0.25, 0.75)})`;
          g.fillRect(x, y, 4, 5);
        }
      }
    }
  });
}
function planetTex() {
  return canvasTex(256, 128, (g, w, h) => {
    const bands = ['#7a3c8a', '#9a4a6a', '#c46a4a', '#8a5a9a', '#5a3c7a', '#b05a50'];
    for (let i = 0; i < 12; i++) {
      g.fillStyle = bands[i % bands.length];
      g.fillRect(0, (i / 12) * h, w, h / 12 + 1);
    }
    g.fillStyle = 'rgba(255,220,180,0.25)';
    for (let i = 0; i < 30; i++) g.fillRect(rand(0, w), rand(0, h), rand(10, 60), rand(2, 6));
  });
}

// ---- 天空渐变 ----
function skyTex(top, bot) {
  return canvasTex(16, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top);
    grad.addColorStop(0.62, bot);
    grad.addColorStop(1, bot);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

const _geoCache = new Map();
function boxGeo(w, h, d) {
  const k = `${w.toFixed(1)}_${h.toFixed(1)}_${d.toFixed(1)}`;
  if (!_geoCache.has(k)) _geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return _geoCache.get(k);
}

export class World {
  constructor(cfg) {
    this.cfg = cfg;
    this.pal = cfg.pal;
    this.time = 0;
    this.group = new THREE.Group();
    this.decor = [];
    this.decoTimer = 0.5;
    this.cloudTimer = 0.2;
    this._tex = [];
    this._geo = [];
    CTX.scene.add(this.group);

    this.buildLights();
    this.buildSky();
    this.buildGround();
    if (this.pal.stars) this.buildStars();
    if (this.pal.aurora) this.buildAurora();
    if (this.pal.nebula) this.buildNebula();
    if (this.pal.planet) this.buildPlanet();
    if (this.pal.lightning) this.buildLightning();

    const sceneDef = {
      ocean: { deco: 1.4, make: () => this.chance2(0.3) ? this.mkIsland() : null, clouds: { tint: '#ffffff', int: 1.1, y: [20, 44], s: [26, 60], op: 0.7 } },
      canyon: { deco: 0.3, make: () => this.mkWall() },
      city: { deco: 0.17, make: () => this.mkBuilding() },
      storm: { deco: 3, make: () => null, clouds: { tint: '#3a4450', int: 0.55, y: [24, 50], s: [70, 120], op: 0.85 } },
      aurora: { deco: 3, make: () => null, clouds: { tint: '#e8f0ff', int: 1.9, y: [0.5, 5], s: [45, 80], op: 0.5 } },
      space: { deco: 0.8, make: () => this.mkAsteroid() },
    }[cfg.scene];
    this.sceneDef = sceneDef;
  }

  chance2(p) { return Math.random() < p; }

  track(res) { this._tex.push(res); return res; }

  buildLights() {
    this.hemi = new THREE.HemisphereLight(this.pal.hemiSky, this.pal.hemiGround, 1.0);
    this.dir = new THREE.DirectionalLight(this.pal.sun ?? '#ffffff', this.pal.dirInt ?? 1.2);
    const sp = this.pal.sunPos || [60, 80, -200];
    this.dir.position.set(sp[0], sp[1], sp[2]);
    this.dirBase = this.pal.dirInt ?? 1.2;
    this.group.add(this.hemi, this.dir);
  }

  buildSky() {
    const tex = this.track(skyTex(this.pal.skyTop, this.pal.skyBot));
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(620, 24, 16), mat);
    this.group.add(this.sky);
    // 太阳 / 月亮
    const isMoon = this.pal.moon;
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex(isMoon ? '#c8d4ff' : this.pal.sun || '#ffe9b0'),
      transparent: true, depthWrite: false, fog: false, blending: isMoon ? THREE.NormalBlending : THREE.AdditiveBlending,
      opacity: isMoon ? 0.9 : 0.95,
    }));
    const sp = this.pal.sunPos || [60, 90, -240];
    sun.position.set(sp[0], sp[1], sp[2]);
    sun.scale.setScalar(isMoon ? 40 : 90);
    this.group.add(sun);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex('#ffffff'), transparent: true, depthWrite: false, fog: false, opacity: isMoon ? 0.9 : 0.8,
    }));
    core.position.copy(sun.position);
    core.scale.setScalar(isMoon ? 12 : 26);
    this.group.add(core);
    // 雾
    CTX.scene.fog = new THREE.Fog(this.pal.fog, this.pal.fogNear, this.pal.fogFar);
  }

  buildGround() {
    const texMap = { ocean: oceanTex, canyon: sandTex, city: cityGroundTex, storm: darkSeaTex, aurora: cloudSeaTex };
    if (!texMap[this.cfg.scene]) return;
    const tex = this.track(texMap[this.cfg.scene]());
    this.groundTex = tex;
    this.texLen = 700 / tex.repeat.y;
    const geo = new THREE.PlaneGeometry(560, 700);
    this._geo.push(geo);
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    if (this.cfg.scene === 'city' || this.cfg.scene === 'storm' || this.cfg.scene === 'aurora') mat.color.setScalar(this.cfg.scene === 'aurora' ? 1 : 0.9);
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, this.cfg.scene === 'aurora' ? -8 : 0, -240);
    this.group.add(this.ground);
  }

  buildStars() {
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rand(TAU), ph = Math.acos(rand(-0.15, 1));
      const r = 560;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._geo.push(geo);
    const mat = new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.8, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 });
    this.stars = new THREE.Points(geo, mat);
    this.group.add(this.stars);
  }

  buildAurora() {
    const mk = (color1, color2, y, z, speed, scale) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uC1: { value: new THREE.Color(color1) }, uC2: { value: new THREE.Color(color2) } },
        vertexShader: `
          varying vec2 vUv;
          uniform float uTime;
          void main() {
            vUv = uv;
            vec3 p = position;
            p.y += sin(p.x * 0.08 + uTime * ${speed}) * 4.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uC1; uniform vec3 uC2;
          void main() {
            float wave = sin(vUv.x * 9.0 + uTime * 0.7 + sin(vUv.y * 4.0 + uTime * 0.5) * 2.0);
            float a = smoothstep(0.05, 0.5, vUv.y) * smoothstep(1.05, 0.55, vUv.y);
            a *= 0.28 + 0.22 * (0.5 + 0.5 * wave);
            a *= 0.5 + 0.5 * sin(vUv.x * 24.0 - uTime * 1.1);
            vec3 col = mix(uC1, uC2, vUv.x * 0.7 + 0.3 * sin(uTime * 0.3 + vUv.x * 3.0));
            gl_FragColor = vec4(col, max(a, 0.0) * 0.85);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(340, 90), mat);
      mesh.position.set(rand(-40, 40), y, z);
      mesh.rotation.x = -0.15;
      mesh.userData.speed = speed;
      this.group.add(mesh);
      this.auroras = this.auroras || [];
      this.auroras.push(mesh);
      return mesh;
    };
    mk('#3dffa8', '#37d0ff', 52, -290, 0.4);
    mk('#7a5cff', '#3dffa8', 66, -320, -0.3);
    mk('#37d0ff', '#b05cff', 40, -255, 0.25);
  }

  buildNebula() {
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: cloudTex(pick(['#8a4aff', '#3a6aff', '#ff4a9a', '#4ac8ff'])),
        transparent: true, opacity: rand(0.16, 0.3), depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
      }));
      s.position.set(rand(-250, 250), rand(-80, 160), rand(-480, -300));
      s.scale.setScalar(rand(160, 300));
      this.group.add(s);
    }
  }

  buildPlanet() {
    const tex = this.track(planetTex());
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(85, 32, 24),
      new THREE.MeshBasicMaterial({ map: tex, fog: false })
    );
    planet.position.set(-130, -50, -420);
    planet.rotation.z = 0.4;
    this.group.add(planet);
    this.planet = planet;
    // 行星环
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(105, 150, 48),
      new THREE.MeshBasicMaterial({ color: 0xc0a8d8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, fog: false })
    );
    ring.position.copy(planet.position);
    ring.rotation.x = Math.PI / 2 - 0.35;
    ring.rotation.y = 0.3;
    this.group.add(ring);
  }

  buildLightning() {
    this.bolt = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.boltMat = mat;
    for (let i = 0; i < 7; i++) this.bolt.add(new THREE.Mesh(boxGeo(0.4, 1, 0.4), mat));
    this.bolt.visible = false;
    this.group.add(this.bolt);
    this.boltT = 0;
    this.nextBolt = rand(2, 5);
  }

  // ---- 装饰物工厂 ----
  mkIsland() {
    const g = new THREE.Group();
    const r = rand(7, 16);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(r, rand(4, 9), 7), new THREE.MeshLambertMaterial({ color: 0xc9a06a }));
    rock.position.y = 1;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.5, 1.5, 9), new THREE.MeshLambertMaterial({ color: 0x2a7cae }));
    base.position.y = -0.4;
    g.add(rock, base);
    g.position.set(rand(0, 1) < 0.5 ? -rand(45, 130) : rand(45, 130), 0, CONST.SPAWN_Z);
    this.addDecor(g, 1.0);
  }
  mkWall() {
    const w = rand(9, 17), h = rand(10, 30), d = rand(16, 26);
    const m = new THREE.Mesh(boxGeo(w, h, d), new THREE.MeshLambertMaterial({ color: Math.random() < 0.5 ? 0xa85c38 : 0x8a4a2e }));
    const side = Math.random() < 0.5 ? -1 : 1;
    m.position.set(side * rand(38, 52), h / 2 - 2, CONST.SPAWN_Z);
    this.addDecor(m, 1.0);
  }
  mkBuilding() {
    const w = rand(6, 13), h = rand(14, 55), d = rand(6, 13);
    const tex = this.track(buildingTex());
    const m = new THREE.Mesh(
      boxGeo(w, h, d),
      new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff })
    );
    const side = Math.random() < 0.5 ? -1 : 1;
    m.position.set(side * rand(33, 70), h / 2, CONST.SPAWN_Z);
    // 霓虹招牌
    if (chance(0.3)) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex(pick(['#ff4fd8', '#35e0ff', '#ffcf6a', '#7dff9e'])),
        transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      s.scale.setScalar(rand(4, 9));
      s.position.set(-side * (w / 2 + 0.5), rand(h * 0.3, h * 0.8), 0);
      m.add(s);
    }
    this.addDecor(m, 1.0);
  }
  mkAsteroid() {
    const geo = new THREE.DodecahedronGeometry(rand(1.5, 5), 0);
    this._geo.push(geo);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: pick([0x4a505c, 0x5a5348, 0x3e4450]) }));
    // 避开中央走廊
    let x, y;
    do { x = rand(-55, 55); y = rand(-4, 40); } while (Math.abs(x) < 20 && y > 5 && y < 28);
    m.position.set(x, y, CONST.SPAWN_Z);
    m.rotation.set(rand(TAU), rand(TAU), rand(TAU));
    m.userData.spin = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(0.8);
    this.addDecor(m, 0.85);
  }
  mkCloud() {
    const c = this.sceneDef.clouds;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: cloudTex(c.tint), transparent: true, opacity: c.op * rand(0.8, 1.1), depthWrite: false,
    }));
    s.position.set(rand(-90, 90), rand(c.y[0], c.y[1]), CONST.SPAWN_Z - rand(0, 80));
    s.scale.setScalar(rand(c.s[0], c.s[1]));
    this.addDecor(s, 0.92);
  }
  addDecor(obj, parallax) {
    this.group.add(obj);
    this.decor.push({ obj, parallax, spin: obj.userData.spin || null });
  }

  update(dt) {
    this.time += dt;
    const scroll = CTX.scrollSpeed;
    if (this.groundTex) this.groundTex.offset.y += (scroll * dt) / this.texLen;
    // 装饰物
    for (let i = this.decor.length - 1; i >= 0; i--) {
      const d = this.decor[i];
      d.obj.position.z += scroll * d.parallax * dt;
      if (d.spin) { d.obj.rotation.x += d.spin.x * dt; d.obj.rotation.y += d.spin.y * dt; d.obj.rotation.z += d.spin.z * dt; }
      if (d.obj.position.z > 80) {
        this.group.remove(d.obj);
        this.decor.splice(i, 1);
      }
    }
    // 装饰生成
    this.decoTimer -= dt;
    if (this.decoTimer <= 0) {
      this.decoTimer = this.sceneDef.deco * rand(0.7, 1.4);
      const o = this.sceneDef.make();
      if (o) {} // make 内部自行 addDecor
    }
    // 云
    if (this.sceneDef.clouds) {
      this.cloudTimer -= dt;
      if (this.cloudTimer <= 0) { this.cloudTimer = this.sceneDef.clouds.int * rand(0.6, 1.4); this.mkCloud(); }
    }
    // 极光
    if (this.auroras) for (const a of this.auroras) a.material.uniforms.uTime.value = this.time * a.userData.speed;
    if (this.planet) this.planet.rotation.y += dt * 0.02;
    // 闪电
    if (this.nextBolt !== undefined) {
      this.nextBolt -= dt;
      if (this.boltT > 0) {
        this.boltT -= dt;
        this.boltMat.opacity = 0.4 + Math.sin(this.time * 60) * 0.5;
        if (this.boltT <= 0) this.bolt.visible = false;
      }
      if (this.nextBolt <= 0) {
        this.nextBolt = rand(2.5, 6.5);
        this.strikeLightning();
      }
      // 光强回落
      this.dir.intensity += (this.dirBase - this.dir.intensity) * Math.min(1, dt * 5);
    }
  }

  strikeLightning() {
    const x = rand(-70, 70), z = rand(-200, -60);
    let px = x, py = 44;
    const kids = this.bolt.children;
    const segs = kids.length;
    const botY = 0;
    for (let i = 0; i < segs; i++) {
      const f0 = i / segs, f1 = (i + 1) / segs;
      const y0 = 44 * (1 - f0), y1 = 44 * (1 - f1);
      const nx = x + rand(-3, 3);
      const seg = kids[i];
      seg.position.set((px + nx) / 2 - x, (y0 + y1) / 2, z);
      seg.scale.set(rand(0.6, 1.4), Math.abs(y1 - y0), rand(0.6, 1.4));
      seg.rotation.z = Math.atan2(nx - px, y0 - y1);
      px = nx;
    }
    this.bolt.position.set(x, 0, 0);
    this.bolt.visible = true;
    this.boltT = 0.16;
    this.dir.intensity = this.dirBase * 3.2;
    Audio.sfx('lightning', 0.5);
  }

  dispose() {
    CTX.scene.fog = null;
    CTX.scene.remove(this.group);
    for (const t of this._tex) t.dispose();
    for (const g of this._geo) g.dispose();
    this.group.traverse((o) => {
      if (o.material && !o.material.map) o.material.dispose?.();
    });
    this.decor.length = 0;
  }
}
