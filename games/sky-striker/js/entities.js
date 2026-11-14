// 子弹池（机炮/导弹/敌弹/敌方导弹）与补给道具
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { CONST } from './config.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';
import { rand, pick, clamp, TAU, glowTex, canvasTex } from './utils.js';

class Bullet {
  constructor() {
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.life = 0; this.dmg = 0; this.radius = 0.5; this.speed = 0;
    this.active = false; this.mesh = null;
    this.homing = 0; this.target = null; this.accel = 0;
    this.trailT = 0; this.trailColor = 0; this.isMissile = false;
    this.pulseScale = false; this.baseScale = 1; this.pulse = 0;
    this._tmp = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
  }
}

const _norm = new THREE.Vector3();
// 每类子弹共享的“向上”基准
const UP_Y = new THREE.Vector3(0, 1, 0);
function orient(mesh, vel) {
  _norm.copy(vel).normalize();
  mesh.quaternion.setFromUnitVectors(UP_Y, _norm);
}

class BulletPool {
  constructor(scene, max, meshFactory) {
    this.items = [];
    for (let i = 0; i < max; i++) {
      const b = new Bullet();
      b.mesh = meshFactory();
      b.mesh.visible = false;
      scene.add(b.mesh);
      this.items.push(b);
    }
    this.idx = 0;
  }
  fire(o) {
    for (let k = 0; k < this.items.length; k++) {
      const b = this.items[(this.idx + k) % this.items.length];
      if (!b.active) {
        this.idx = (this.idx + k + 1) % this.items.length;
        return this._activate(b, o);
      }
    }
    return null;
  }
  _activate(b, o) {
    b.active = true; b.mesh.visible = true;
    b.pos.copy(o.pos);
    b.vel.copy(o.vel);
    b.speed = o.vel.length();
    b.life = o.life ?? 5;
    b.dmg = o.dmg ?? 10;
    b.radius = o.radius ?? 0.6;
    b.homing = o.homing ?? 0;
    b.target = o.target ?? null;
    b.accel = o.accel ?? 0;
    b.maxSpeed = o.maxSpeed ?? 0;
    b.isMissile = !!o.isMissile;
    b.trailColor = o.trailColor ?? 0;
    b.trailT = 0;
    b.pulseScale = !!o.pulseScale;
    b.baseScale = o.scale ?? 1;
    b.pulse = rand(TAU);
    b.mesh.position.copy(b.pos);
    orient(b.mesh, b.vel);
    b.mesh.scale.setScalar(b.baseScale);
    if (b.mesh.isMesh && b.mesh.material.color && o.color !== undefined) b.mesh.material.color.set(o.color);
    return b;
  }
  _deactivate(b) { b.active = false; b.mesh.visible = false; }

  update(dt) {
    for (const b of this.items) {
      if (!b.active) continue;
      b.life -= dt;
      if (b.life <= 0 || b.pos.z > CONST.KILL_Z + 30 || b.pos.z < CONST.SPAWN_Z - 60 || Math.abs(b.pos.x) > 95 || b.pos.y > 95 || b.pos.y < -25) {
        this._deactivate(b); continue;
      }
      if (b.homing > 0 && b.target && (b.target.hp > 0 || b.target === CTX.player)) {
        if (b.accel) { b.speed = Math.min(b.maxSpeed ?? 999, b.speed + b.accel * dt); }
        // 近距离减速以提高机动性
        const dToT = this._tmpVec().copy(b.target.pos).sub(b.pos).length();
        const sp = dToT < 32 ? b.speed * 0.62 : b.speed;
        const desired = this._tmpVec().copy(b.target.pos).sub(b.pos).normalize();
        const cur = this._tmpVec2().copy(b.vel).normalize();
        cur.lerp(desired, Math.min(1, b.homing * dt)).normalize();
        b.vel.copy(cur).multiplyScalar(sp);
      } else if (b.accel) {
        b.speed = Math.min(b.maxSpeed ?? 999, b.speed + b.accel * dt);
        b.vel.normalize().multiplyScalar(b.speed);
      }
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);
      if (b.homing > 0 || b.isMissile) orient(b.mesh, b.vel);
      if (b.pulseScale) { b.pulse += dt * 9; b.mesh.scale.setScalar(b.baseScale * (1 + Math.sin(b.pulse) * 0.2)); }
      if (b.isMissile || b.homing > 0) {
        b.trailT -= dt;
        if (b.trailT <= 0) {
          b.trailT = 0.018;
          Effects.trail(b.pos, { color: b.trailColor || 0xffffff, size: 1.5, life: 0.28, grow: 3 });
        }
      }
    }
  }
  _tmpVec() { return new THREE.Vector3(); }
  _tmpVec2() { return new THREE.Vector3(); }
  clear() { for (const b of this.items) this._deactivate(b); }
}

// ---- 网格工厂 ----
function mkVulcan() {
  const geo = new THREE.CylinderGeometry(0.07, 0.07, 1.7, 5);
  const mat = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}
function mkMissileMesh(bodyColor, glowColor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 6), new THREE.MeshBasicMaterial({ color: bodyColor }));
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), new THREE.MeshBasicMaterial({ color: glowColor }));
  nose.position.y = 0.75;
  const finG = new THREE.BoxGeometry(0.04, 0.28, 0.28);
  const finMat = new THREE.MeshBasicMaterial({ color: bodyColor });
  [[0.16, -0.45], [-0.16, -0.45]].forEach(([x, y]) => {
    const f = new THREE.Mesh(finG, finMat); f.position.set(x, y, 0); f.rotation.z = x > 0 ? 0.6 : -0.6; g.add(f);
  });
  g.add(body); g.add(nose);
  return g;
}
function mkOrb() {
  const geo = new THREE.SphereGeometry(0.5, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff5566, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}
function mkBolt() {
  const geo = new THREE.CylinderGeometry(0.06, 0.22, 1.5, 5);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa55, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
  return new THREE.Mesh(geo, mat);
}

// ---- 全局子弹管理 ----
export const Bullets = {
  init(scene) {
    this.pVulcan = new BulletPool(scene, 130, mkVulcan);
    this.pMissiles = new BulletPool(scene, 24, () => mkMissileMesh(0xcfd8e2, 0x66d9ff));
    this.eOrbs = new BulletPool(scene, 380, mkOrb);
    this.eBolts = new BulletPool(scene, 120, mkBolt);
    this.eMissiles = new BulletPool(scene, 26, () => mkMissileMesh(0x553333, 0xff5544));
  },

  // 玩家机炮
  vulcan(pos, dir, { dmg = CONST.VULCAN_DMG, color = 0x9fe8ff } = {}) {
    const b = this.pVulcan.fire({
      pos, vel: dir.clone().multiplyScalar(240), dmg, radius: 0.5, life: 2.2, color,
    });
    if (b) CTX.stats.shots++;
    return b;
  },
  // 玩家导弹（锁定/直射）
  pMissile(pos, target, { dmg = CONST.MISSILE_DMG } = {}) {
    const dir = target ? new THREE.Vector3().copy(target.pos).sub(pos).normalize()
      : new THREE.Vector3(0, 0.25, -1).normalize();
    const b = this.pMissiles.fire({
      pos, vel: dir.multiplyScalar(50), accel: 50, maxSpeed: 95, dmg, radius: 1.2, life: 5.5,
      homing: target ? 4.5 : 0, target, isMissile: true, trailColor: 0x86d9ff, scale: 1,
    });
    if (b) { CTX.stats.shots++; Audio.sfx('missile'); }
    return b;
  },

  // ---- 敌方弹药 ----
  orb(pos, dir, { speed = 36, dmg = 10, color = 0xff5566, radius = 0.6, scale = 1, pulse = true } = {}) {
    return this.eOrbs.fire({
      pos, vel: dir.clone().normalize().multiplyScalar(speed), dmg, radius, life: 9,
      color, scale, pulseScale: pulse,
    });
  },
  bolt(pos, dir, { speed = 62, dmg = 9, color = 0xffaa55 } = {}) {
    return this.eBolts.fire({
      pos, vel: dir.clone().normalize().multiplyScalar(speed), dmg, radius: 0.55, life: 6, color,
    });
  },
  // 朝玩家射击
  aimed(pos, { speed = 36, dmg = 10, spread = 0, color = 0xff5566, radius = 0.6, kind = 'orb' } = {}) {
    const dir = new THREE.Vector3().copy(CTX.player.pos).sub(pos).normalize();
    if (spread) {
      dir.x += rand(-spread, spread);
      dir.y += rand(-spread, spread);
      dir.normalize();
    }
    return kind === 'bolt' ? this.bolt(pos, dir, { speed, dmg, color }) : this.orb(pos, dir, { speed, dmg, color, radius });
  },
  // 环形弹幕
  ring(pos, { n = 8, speed = 30, dmg = 10, color = 0xff5566, phase = 0, radius = 0.6 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = phase + (i / n) * TAU;
      this.orb(pos, new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.55, 0.18), { speed, dmg, color, radius });
    }
  },
  // 扇形弹幕
  fan(pos, dir, { n = 5, arcDeg = 40, speed = 34, dmg = 10, color = 0xff5566 } = {}) {
    const arc = (arcDeg * Math.PI) / 180;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const d = dir.clone();
      d.x += Math.tan(t * arc) * (dir.z || -1) * -1;
      d.y += Math.tan(t * arc) * 0.5;
      d.normalize();
      this.orb(pos, d, { speed, dmg, color });
    }
  },
  eMissile(pos, { speed = 24, dmg = 16 } = {}) {
    const dir = new THREE.Vector3(rand(-0.4, 0.4), rand(0.1, 0.5), 1).normalize();
    return this.eMissiles.fire({
      pos, vel: dir.multiplyScalar(speed), accel: 10, maxSpeed: 42, dmg, radius: 0.9, life: 10,
      homing: 1.15, target: CTX.player, isMissile: true, trailColor: 0xff6655,
    });
  },

  update(dt) {
    this.pVulcan.update(dt);
    this.pMissiles.update(dt);
    this.eOrbs.update(dt);
    this.eBolts.update(dt);
    this.eMissiles.update(dt);
  },
  clear() {
    this.pVulcan?.clear(); this.pMissiles?.clear(); this.eOrbs?.clear();
    this.eBolts?.clear(); this.eMissiles?.clear();
  },
};

// ---- 补给道具 ----
const PICKUP_DEF = {
  P: { color: 0xffd34d, name: '火力提升' },
  M: { color: 0x66d9ff, name: '导弹 +8' },
  B: { color: 0xff8866, name: '炸弹 +1' },
  H: { color: 0x7dff9e, name: '机体修复' },
  S: { color: 0xa78dff, name: '能量护盾' },
};
const _letterTex = {};
function letterTex(ch) {
  if (!_letterTex[ch]) {
    _letterTex[ch] = canvasTex(64, 64, (g) => {
      g.clearRect(0, 0, 64, 64);
      g.font = '900 44px system-ui, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffffff';
      g.fillText(ch, 32, 35);
    });
  }
  return _letterTex[ch];
}

class PickupManager {
  constructor() { this.items = []; }
  init(scene) {
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.85),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
      );
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex('#ffffff'), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      halo.scale.setScalar(3.2);
      const letter = new THREE.Sprite(new THREE.SpriteMaterial({
        map: letterTex('P'), transparent: true, depthWrite: false,
      }));
      letter.scale.setScalar(1.3);
      letter.position.z = 0.4;
      g.add(core, halo, letter);
      g.visible = false;
      scene.add(g);
      this.items.push({ g, core, halo, letter, active: false, type: 'P', t: 0, vel: new THREE.Vector3() });
    }
  }
  spawn(type, pos) {
    const item = this.items.find((it) => !it.active);
    if (!item) return;
    item.active = true;
    item.g.visible = true;
    item.type = type;
    const c = PICKUP_DEF[type].color;
    item.core.material.color.set(c);
    item.halo.material.color.set(c);
    item.letter.material.map = letterTex(type);
    item.g.position.copy(pos);
    item.t = rand(TAU);
    item.vel.set(rand(-2, 2), rand(0, 2), 20);
  }
  update(dt) {
    const p = CTX.player;
    for (const it of this.items) {
      if (!it.active) continue;
      it.t += dt * 2.4;
      it.g.rotation.y = it.t;
      it.g.position.z += CTX.scrollSpeed * dt * 0.55 + it.vel.z * dt;
      it.g.position.x += it.vel.x * dt;
      it.g.position.y += Math.sin(it.t * 0.7) * 0.02;
      if (it.g.position.z > CONST.KILL_Z) { this._off(it); continue; }
      if (!p || !p.alive) continue;
      const dx = p.pos.x - it.g.position.x, dy = p.pos.y - it.g.position.y, dz = p.pos.z - it.g.position.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < 64) { // 磁吸
        it.g.position.x += dx * 4.2 * dt;
        it.g.position.y += dy * 4.2 * dt;
        it.g.position.z += dz * 4.2 * dt;
      }
      if (d2 < 6.2) {
        this._collect(it, p);
      }
    }
  }
  _collect(it, p) {
    const def = PICKUP_DEF[it.type];
    switch (it.type) {
      case 'P': p.addPower(); break;
      case 'M': p.addMissiles(8); break;
      case 'B': p.addBomb(); break;
      case 'H': p.heal(30); break;
      case 'S': p.addShield(); break;
    }
    Audio.sfx(it.type === 'P' ? 'powerup' : 'pickup');
    if (CTX.hud) CTX.hud.toast(def.name);
    CTX.stats.score += 100;
    Effects.burst(it.g.position, { n: 10, speed: 7, color: def.color, life: 0.4, size: 1, grav: 0 });
    this._off(it);
  }
  _off(it) { it.active = false; it.g.visible = false; }
  clear() { for (const it of this.items) this._off(it); }
}
export const Pickups = new PickupManager();
