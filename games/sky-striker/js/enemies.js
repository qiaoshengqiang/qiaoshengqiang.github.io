// 敌方单位：8 种机型、编队生成器、延迟队列
import * as THREE from 'three';
import { CTX } from './ctx.js';
import { CONST } from './config.js';
import { Bullets, Pickups } from './entities.js';
import { Effects } from './effects.js';
import { Audio } from './audio.js';
import { rand, randInt, pick, chance, clamp, damp, TAU } from './utils.js';

// ---- 材质缓存 ----
const _hull = new Map();
function hull(color) {
  if (!_hull.has(color)) _hull.set(color, new THREE.MeshLambertMaterial({ color }));
  return _hull.get(color);
}
const _glow = new Map();
function glow(color, opacity = 1) {
  const key = color + '_' + opacity;
  if (!_glow.has(key)) _glow.set(key, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }));
  return _glow.get(key);
}

function M(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}

// 敌人朝 +Z（朝向玩家），几何默认朝 +Y 需转 +Z：rotation.x = PI/2
const FZ = Math.PI / 2;

// ---- 机体建模 ----
function buildDrone(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.ConeGeometry(0.62, 2.4, 6), hull(0x39424e), 0, 0, 0, FZ));
  g.add(M(new THREE.BoxGeometry(4.4, 0.12, 1.0), hull(0x2a323c), 0, -0.1, -0.3));
  g.add(M(new THREE.BoxGeometry(0.9, 0.1, 1.6), hull(0x2a323c), 2.1, -0.1, 0.1));
  g.add(M(new THREE.BoxGeometry(0.9, 0.1, 1.6), hull(0x2a323c), -2.1, -0.1, 0.1));
  const nose = M(new THREE.SphereGeometry(0.3, 6, 6), glow(accent), 0, 0, 1.2);
  g.add(nose);
  return { g, parts: { nose } };
}
function buildInterceptor(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.ConeGeometry(0.5, 3.2, 5), hull(0x454f5e), 0, 0, 0, FZ));
  g.add(M(new THREE.BoxGeometry(3.4, 0.1, 1.3), hull(0x323b47), 0, -0.15, -0.5, 0, 0, 0.12));
  g.add(M(new THREE.BoxGeometry(0.16, 0.9, 1.2), hull(0x323b47), 0.55, 0.35, -1.0));
  g.add(M(new THREE.BoxGeometry(0.16, 0.9, 1.2), hull(0x323b47), -0.55, 0.35, -1.0));
  g.add(M(new THREE.SphereGeometry(0.26, 6, 6), glow(0x9fdcff, 0.9), 0, 0.3, 0.5));
  g.add(M(new THREE.SphereGeometry(0.24, 6, 6), glow(accent), 0, 0, 1.65));
  return { g, parts: {} };
}
function buildGunship(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(2.6, 1.7, 4.6), hull(0x333d4a), 0, 0, 0));
  g.add(M(new THREE.BoxGeometry(1.4, 1.0, 2.0), hull(0x46525f), 0, 0.9, -0.6));
  g.add(M(new THREE.BoxGeometry(0.8, 0.7, 3.0), hull(0x2a323c), 1.8, 0, 0));
  g.add(M(new THREE.BoxGeometry(0.8, 0.7, 3.0), hull(0x2a323c), -1.8, 0, 0));
  g.add(M(new THREE.BoxGeometry(4.6, 0.14, 1.2), hull(0x2a323c), 0, -0.6, -1.6));
  const turret = new THREE.Group();
  turret.add(M(new THREE.SphereGeometry(0.55, 8, 8), hull(0x525f6e)));
  turret.add(M(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 6), hull(0x22282f), 0, 0, 0.8, FZ));
  turret.position.set(0, 0.4, 1.2);
  g.add(turret);
  g.add(M(new THREE.SphereGeometry(0.18, 6, 6), glow(accent), 0, -0.8, 2.2));
  return { g, parts: { turret } };
}
function buildKamikaze(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.IcosahedronGeometry(0.95, 0), hull(0x4a3038)));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    g.add(M(new THREE.ConeGeometry(0.16, 0.9, 4), hull(0x39424e), Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0, 0, 0, a + Math.PI / 2));
  }
  const core = M(new THREE.SphereGeometry(0.42, 8, 8), glow(0xff4444));
  g.add(core);
  return { g, parts: { core } };
}
function buildTurretship(accent) {
  const g = new THREE.Group();
  const base = M(new THREE.CylinderGeometry(2.2, 2.6, 1.1, 6), hull(0x39424e), 0, 0, 0, 0, 0, 0);
  g.add(base);
  g.add(M(new THREE.CylinderGeometry(1.4, 1.8, 0.8, 6), hull(0x46525f), 0, 0.9, 0));
  const ring = M(new THREE.TorusGeometry(2.5, 0.14, 6, 24), glow(accent, 0.85), 0, 0.1, 0);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    g.add(M(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 5), hull(0x22282f), Math.cos(a) * 1.6, -0.2, Math.sin(a) * 1.6, FZ));
  }
  g.add(M(new THREE.SphereGeometry(0.35, 6, 6), glow(accent), 0, 1.4, 0));
  return { g, parts: { ring } };
}
function buildFrigate(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.BoxGeometry(3.0, 1.4, 7.0), hull(0x333d4a), 0, 0, 0));
  g.add(M(new THREE.BoxGeometry(1.6, 1.9, 2.4), hull(0x46525f), 0, 0.9, -1.8));
  g.add(M(new THREE.BoxGeometry(1.0, 0.6, 2.6), hull(0x2a323c), 2.0, 0.5, -1.4));
  g.add(M(new THREE.BoxGeometry(1.0, 0.6, 2.6), hull(0x2a323c), -2.0, 0.5, -1.4));
  g.add(M(new THREE.BoxGeometry(4.0, 0.16, 2.0), hull(0x2a323c), 0, -0.5, -2.2));
  g.add(M(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 5), hull(0x22282f), 0, 1.9, -1.8));
  for (const x of [1.4, -1.4]) g.add(M(new THREE.SphereGeometry(0.24, 6, 6), glow(accent, 0.9), x, -0.4, 3.4));
  return { g, parts: {} };
}
function buildMine(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.IcosahedronGeometry(0.7, 0), hull(0x3c4652)));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, b = rand(-0.6, 0.6);
    g.add(M(new THREE.ConeGeometry(0.13, 0.7, 4), hull(0x2a323c), Math.cos(a) * 0.7, b, Math.sin(a) * 0.7, Math.PI / 2, 0, -a));
  }
  const core = M(new THREE.SphereGeometry(0.3, 6, 6), glow(0xffcc44));
  g.add(core);
  return { g, parts: { core } };
}
function buildAce(accent) {
  const g = new THREE.Group();
  g.add(M(new THREE.ConeGeometry(0.42, 2.8, 5), hull(0x525f6e), 0, 0, 0, FZ));
  g.add(M(new THREE.BoxGeometry(3.0, 0.08, 1.0), hull(0x39424e), 0, -0.1, -0.6, 0, 0, 0.22));
  g.add(M(new THREE.BoxGeometry(0.14, 0.8, 1.0), hull(0x39424e), 0, 0.4, -1.0));
  g.add(M(new THREE.SphereGeometry(0.22, 6, 6), glow(0xbfe8ff, 0.95), 0, 0.26, 0.45));
  g.add(M(new THREE.SphereGeometry(0.2, 6, 6), glow(accent), 0, 0, 1.45));
  return { g, parts: {} };
}

// ---- 敌人定义 ----
const ENEMY_DEFS = {
  drone: {
    hp: 10, score: 100, radius: 1.6, boom: 0.8, speed: 44,
    build: buildDrone,
    update(e, dt) {
      e.t += dt;
      e.pos.z += e.speed * dt;
      e.pos.x = e.baseX + Math.sin(e.t * 1.8 + e.phase) * e.sway;
      e.pos.y = e.baseY + Math.sin(e.t * 1.15 + e.phase) * e.sway * 0.45 + e.driftY * e.t;
      e.mesh.rotation.z = Math.cos(e.t * 1.8 + e.phase) * 0.35;
      e.tryFire(() => {
        Bullets.aimed(e.pos, { speed: 30 * e.spdMul, dmg: 9, color: e.accent });
      });
    },
  },
  interceptor: {
    hp: 16, score: 150, radius: 1.6, boom: 0.9, speed: 56,
    build: buildInterceptor,
    update(e, dt) {
      e.t += dt;
      if (e.state === 0) {
        e.pos.z += e.speed * dt;
        e.pos.x = damp(e.pos.x, CTX.player.pos.x, 1.2, dt);
        e.pos.y = damp(e.pos.y, CTX.player.pos.y, 1.2, dt);
        if (e.pos.z > -42) e.state = 1;
      } else {
        // 环绕玩家射击
        e.orbA += dt * 1.6 * e.orbDir;
        const px = CTX.player.pos.x, py = CTX.player.pos.y;
        e.pos.x = px + Math.cos(e.orbA) * 13;
        e.pos.y = py + Math.sin(e.orbA) * 8;
        e.pos.z = damp(e.pos.z, -34 + Math.sin(e.orbA * 2) * 6, 2, dt);
        e.mesh.rotation.z = Math.cos(e.orbA) * 0.5;
        e.burstT -= dt;
        if (e.burstT <= 0 && e.burstN > 0) {
          e.burstN--;
          e.burstT = 0.14;
          Bullets.aimed(e.pos, { speed: 58 * e.spdMul, dmg: 9, color: e.accent, kind: 'bolt' });
        } else if (e.burstN <= 0) {
          e.fireT -= dt;
          if (e.fireT <= 0) { e.fireT = e.fireCd; e.burstN = 3; e.burstT = 0; }
        }
      }
    },
  },
  gunship: {
    hp: 45, score: 300, radius: 2.6, boom: 1.6, speed: 34, drop: true, fireCd: 2.3,
    build: buildGunship,
    update(e, dt) {
      e.t += dt;
      if (e.state === 0) {
        e.pos.z += e.speed * dt;
        if (e.pos.z > -62) e.state = 1;
      } else if (e.holdT > 0) {
        e.holdT -= dt;
        e.pos.y = e.baseY + Math.sin(e.t * 0.9) * 2;
        e.pos.x = e.baseX + Math.sin(e.t * 0.5) * 3;
        // 炮塔瞄准
        const tp = e.parts.turret;
        tp.lookAt(CTX.player.pos.x, CTX.player.pos.y, CTX.player.pos.z);
        e.tryFire(() => {
          for (let i = 0; i < 3; i++) {
            Bullets.aimed(e.pos, { speed: 34 * e.spdMul, dmg: 10, spread: 0.06, color: e.accent, delay: i * 0.1 });
          }
        });
        if (e.holdT <= 0) e.state = 2;
      } else {
        e.pos.z += e.speed * 1.4 * dt;
      }
    },
  },
  kamikaze: {
    hp: 12, score: 120, radius: 1.4, boom: 1.3, speed: 40,
    build: buildKamikaze,
    update(e, dt) {
      e.t += dt;
      e.lifeT -= dt;
      const p = CTX.player.pos;
      const d = new THREE.Vector3().copy(p).sub(e.pos);
      const dist = d.length();
      d.normalize();
      const acc = 60 * e.spdMul;
      e.vel.addScaledVector(d, acc * dt);
      const sp = e.vel.length();
      const maxSp = 78 * e.spdMul;
      if (sp > maxSp) e.vel.multiplyScalar(maxSp / sp);
      e.pos.addScaledVector(e.vel, dt);
      e.mesh.rotation.z += dt * 6;
      // 闪烁加速
      const blink = 1 + Math.max(0, 1.6 - dist * 0.05) * 6;
      const s = 0.75 + Math.abs(Math.sin(e.t * blink * 4)) * 0.6;
      e.parts.core.scale.setScalar(s);
      if (dist < 3.4 || e.lifeT <= 0) {
        // 自爆
        Effects.explosion(e.pos, 1.3);
        if (dist < 5.5 && CTX.player.alive) CTX.player.hit(24);
        e.dead = true;
        e.silent = true;
      }
    },
  },
  turretship: {
    hp: 60, score: 400, radius: 2.8, boom: 1.8, speed: 30, drop: true, fireCd: 2.5,
    build: buildTurretship,
    update(e, dt) {
      e.t += dt;
      e.parts.ring.rotation.z += dt * 2.2;
      if (e.state === 0) {
        e.pos.z += e.speed * dt;
        if (e.pos.z > -78) e.state = 1;
      } else if (e.holdT > 0) {
        e.holdT -= dt;
        e.pos.x = e.baseX + Math.sin(e.t * 0.6) * 5;
        e.ringT -= dt;
        if (e.ringT <= 0 && e.pos.z > -140 && e.pos.z < -12) {
          e.ringT = e.fireCd;
          Bullets.ring(e.pos, { n: 8, speed: 26 * e.spdMul, dmg: 10, color: e.accent, phase: e.t });
        }
        e.aimT -= dt;
        if (e.aimT <= 0 && e.pos.z < -20) {
          e.aimT = e.fireCd * 1.25;
          Bullets.aimed(e.pos, { speed: 40 * e.spdMul, dmg: 11, color: e.accent });
        }
        if (e.holdT <= 0) e.state = 2;
      } else {
        e.pos.z += e.speed * 1.5 * dt;
      }
    },
  },
  frigate: {
    hp: 55, score: 450, radius: 3.0, boom: 1.8, speed: 26, drop: true, fireCd: 3.6,
    build: buildFrigate,
    update(e, dt) {
      e.t += dt;
      if (e.state === 0) {
        e.pos.z += e.speed * dt;
        if (e.pos.z > -88) e.state = 1;
      } else if (e.holdT > 0) {
        e.holdT -= dt;
        e.pos.x = e.baseX + Math.sin(e.t * 0.45) * 9;
        e.mesh.rotation.z = Math.cos(e.t * 0.45) * 0.12;
        e.tryFire(() => {
          Bullets.eMissile(e.pos.clone().add(new THREE.Vector3(rand(-2, 2), 1, 1)));
        });
        e.aimT -= dt;
        if (e.aimT <= 0 && e.pos.z < -30) {
          e.aimT = 2.6;
          Bullets.aimed(e.pos, { speed: 34 * e.spdMul, dmg: 10, color: e.accent });
        }
        if (e.holdT <= 0) e.state = 2;
      } else {
        e.pos.z += e.speed * 1.5 * dt;
      }
    },
  },
  mine: {
    hp: 6, score: 80, radius: 1.2, boom: 1.0, speed: 26,
    build: buildMine,
    update(e, dt) {
      e.t += dt;
      e.pos.z += e.speed * dt;
      e.pos.x += Math.sin(e.t * 1.4 + e.phase) * 1.2 * dt * 6;
      e.pos.y += Math.cos(e.t * 1.1 + e.phase) * 1.0 * dt * 6;
      e.mesh.rotation.y += dt * 1.8;
      e.mesh.rotation.x += dt * 1.1;
      e.parts.core.scale.setScalar(0.8 + Math.abs(Math.sin(e.t * 5)) * 0.5);
      const d = e.pos.distanceTo(CTX.player.pos);
      if (d < 4.6) {
        Effects.explosion(e.pos, 1.1);
        if (CTX.player.alive) CTX.player.hit(16);
        e.dead = true;
        e.silent = true;
      }
    },
  },
  ace: {
    hp: 30, score: 250, radius: 1.5, boom: 1.0, speed: 62, fireCd: 1.5,
    build: buildAce,
    update(e, dt) {
      e.t += dt;
      e.pos.z += e.speed * dt;
      e.pos.x = e.baseX + Math.sin(e.t * 2.1 + e.phase) * 11;
      e.pos.y = e.baseY + Math.sin(e.t * 3.3 + e.phase * 1.7) * 4.5;
      e.mesh.rotation.z += dt * 7; // 桶滚
      e.tryFire(() => {
        Bullets.aimed(e.pos, { speed: 66 * e.spdMul, dmg: 10, color: e.accent, kind: 'bolt' });
        if (e.dual) Bullets.aimed(e.pos, { speed: 60 * e.spdMul, dmg: 10, spread: 0.08, color: e.accent, kind: 'bolt' });
      });
    },
  },
};

// ---- Enemy 实体 ----
class Enemy {
  constructor(type, opts = {}) {
    this.type = type;
    this.def = ENEMY_DEFS[type];
    const mul = opts.mul || {};
    this.hp = this.def.hp * (mul.hp ?? 1);
    this.hpMax = this.hp;
    this.score = this.def.score;
    this.radius = this.def.radius;
    this.accent = opts.accent ?? 0xff5566;
    this.spdMul = mul.spd ?? 1;
    this.fireCd = (this.def.fireCd ?? 2.2) / (mul.rate ?? 1);
    this.fireT = rand(0.8, this.fireCd);
    this.speed = this.def.speed * (0.9 + Math.random() * 0.2) * (mul.spd ?? 1);
    this.t = 0;
    this.phase = rand(TAU);
    this.state = 0;
    this.sway = opts.sway ?? rand(2, 5);
    this.baseX = opts.x ?? 0;
    this.baseY = opts.y ?? rand(8, 24);
    this.driftY = opts.driftY ?? 0;
    this.holdT = opts.holdT ?? 16;
    this.ringT = rand(1, 2);
    this.aimT = rand(1.5, 3);
    this.orbA = rand(TAU);
    this.orbDir = chance(0.5) ? 1 : -1;
    this.burstN = 0;
    this.burstT = 0;
    this.lifeT = 12;
    this.vel = new THREE.Vector3(0, 0, this.speed);
    this.dead = false;
    this.silent = false; // 静默移除（出界/自爆）
    this.flashT = 0;

    const built = this.def.build(this.accent);
    this.mesh = built.g;
    this.parts = built.parts;
    this.pos = this.mesh.position;
    this.pos.set(opts.x ?? 0, this.baseY, opts.z ?? CONST.SPAWN_Z - rand(0, 20));
    this.dual = false;
    CTX.scene.add(this.mesh);
  }

  tryFire(fn) {
    this.fireT -= CTX.dt;
    if (this.fireT <= 0) {
      this.fireT = this.fireCd * rand(0.85, 1.25);
      if (this.pos.z > -150 && this.pos.z < -8 && CTX.player.alive) fn();
    }
  }

  hit(dmg, from) {
    if (this.dead) return;
    this.hp -= dmg;
    CTX.stats.hits++;
    this.flashT = 0.08;
    if (from) Effects.spark(from, 0xffe08a);
    Audio.sfx('hitEnemy', 0.4);
    if (this.hp <= 0) this.die(true);
  }

  die(byPlayer) {
    if (this.dead) return;
    this.dead = true;
    if (!this.silent) {
      Effects.explosion(this.pos, this.def.boom);
      if (byPlayer) {
        CTX.game.addKill(this);
        if (this.def.drop || chance(0.055)) {
          Pickups.spawn(this.def.drop ? pick(['H', 'P', 'M', 'B', 'H', 'P']) : pick(['P', 'M', 'H', 'S']), this.pos);
        }
      }
    }
  }

  update(dt) {
    this.def.update(this, dt);
    if (this.flashT > 0) {
      this.flashT -= dt;
      const s = 1 + this.flashT * 1.4;
      this.mesh.scale.setScalar(s);
    } else if (this.mesh.scale.x !== 1) {
      this.mesh.scale.setScalar(1);
    }
  }

  destroy() {
    CTX.scene.remove(this.mesh);
  }
}

// ---- 管理器 ----
export const Enemies = {
  list: [],
  _queue: [],

  spawn(type, opts = {}) {
    opts.accent = opts.accent ?? (CTX.levelCfg ? CTX.levelCfg.accent : 0xff5566);
    opts.mul = opts.mul ?? CTX.game.difficulty;
    const e = new Enemy(type, opts);
    this.list.push(e);
    return e;
  },
  queue(fn, delay) { this._queue.push({ t: delay, fn }); },

  update(dt) {
    for (let i = this._queue.length - 1; i >= 0; i--) {
      const q = this._queue[i];
      q.t -= dt;
      if (q.t <= 0) { q.fn(); this._queue.splice(i, 1); }
    }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (e.dead) { e.destroy(); this.list.splice(i, 1); continue; }
      e.update(dt);
      if (e.pos.z > CONST.KILL_Z || e.pos.z < CONST.SPAWN_Z - 30) {
        e.dead = true;
        e.silent = true;
      }
    }
  },

  aliveCount() { return this.list.filter((e) => !e.dead).length; },
  clear() {
    for (const e of this.list) e.destroy();
    this.list.length = 0;
    this._queue.length = 0;
  },
};

// ---- 编队生成器（供关卡波次配置调用）----
export const Spawners = {
  vee({ n = 5, x = 0, y = 17 } = {}) {
    for (let i = 0; i < n; i++) {
      const off = i - (n - 1) / 2;
      Enemies.queue(() => {
        Enemies.spawn('drone', { x: x + off * 2.8, y: y - Math.abs(off) * 1.4, z: CONST.SPAWN_Z - Math.abs(off) * 7, sway: 2.5 });
      }, Math.abs(off) * 0.15);
    }
  },
  line({ n = 6, side = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      Enemies.queue(() => {
        Enemies.spawn('drone', { x: side * 24, y: rand(10, 22), z: CONST.SPAWN_Z - i * 6, sway: 7 });
      }, i * 0.18);
    }
  },
  wall({ n = 7 } = {}) {
    for (let i = 0; i < n; i++) {
      const off = i - (n - 1) / 2;
      Enemies.spawn('drone', { x: off * (52 / n), y: 16 + Math.sin(i * 1.3) * 6, z: CONST.SPAWN_Z - 10, sway: 1.2 });
    }
  },
  snake({ n = 6 } = {}) {
    const bx = rand(-8, 8);
    for (let i = 0; i < n; i++) {
      Enemies.queue(() => {
        Enemies.spawn('drone', { x: bx, y: 17, z: CONST.SPAWN_Z - i * 8, sway: 17, phase: -i * 0.55 });
      }, i * 0.1);
    }
  },
  pincer({ n = 4 } = {}) {
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0;
      Enemies.queue(() => {
        Enemies.spawn('interceptor', { x: left ? -28 : 28, y: 12 + rand(0, 10) });
      }, i * 0.28);
    }
  },
  mines({ n = 6 } = {}) {
    for (let i = 0; i < n; i++) {
      Enemies.spawn('mine', { x: rand(-22, 22), y: rand(7, 26), z: CONST.SPAWN_Z - rand(0, 60), sway: 0 });
    }
  },
  kamikaze({ n = 3 } = {}) {
    for (let i = 0; i < n; i++) {
      Enemies.queue(() => {
        Enemies.spawn('kamikaze', { x: rand(-20, 20), y: rand(8, 24) });
      }, i * 0.45);
    }
  },
  gunship({ x } = {}) {
    Enemies.spawn('gunship', { x: x ?? rand(-14, 14), y: rand(10, 20) });
  },
  turretship({ x } = {}) {
    Enemies.spawn('turretship', { x: x ?? rand(-16, 16), y: rand(10, 22), holdT: 18 });
  },
  frigate({ x } = {}) {
    Enemies.spawn('frigate', { x: x ?? rand(-12, 12), y: rand(12, 20), holdT: 20 });
  },
  ace({ n = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      Enemies.queue(() => {
        const a = Enemies.spawn('ace', { x: rand(-16, 16), y: rand(10, 22) });
        a.dual = n > 2;
      }, i * 0.5);
    }
  },
};
