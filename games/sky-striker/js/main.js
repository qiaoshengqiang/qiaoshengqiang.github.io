// 主引擎：状态机、波次导演、碰撞、相机、菜单与流程
import * as THREE from 'three';
import { CTX, resetRunStats } from './ctx.js';
import { CONST, LEVELS } from './config.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { Effects } from './effects.js';
import { Bullets, Pickups } from './entities.js';
import { Enemies, Spawners } from './enemies.js';
import { createBoss } from './bosses.js';
import { World } from './world.js';
import { Player, buildJet } from './player.js';
import { Hud } from './hud.js';
import { clamp, damp, lerp, rand, pick, TAU, glowTex, canvasTex } from './utils.js';

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'skystriker-save';

class Game {
  constructor() {
    CTX.enemies = Enemies.list; // 敌人列表统一引用（clear 只清空不换数组）
    this.state = 'menu';
    this.paused = false;
    this.levelIdx = 0;
    this.lives = CONST.LIVES;
    this.difficulty = { hp: 1, rate: 1, spd: 1 };
    this.waveIdx = 0;
    this.gameTime = 0;
    this.wavesDone = false;
    this.bossSpawned = false;
    this.bossWarned = false;
    this.seq = [];
    this.levelScore0 = 0;
    this.alertCd = 0;
    this.debugBoss = false;
    this.menuJet = null;
    this.menuJetParts = null;
    this.bullets = Bullets; // HUD 雷达访问
    this.save = this._loadSave();
  }

  _loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { best: 0, unlocked: 0 }; }
    catch (e) { return { best: 0, unlocked: 0 }; }
  }
  _commitSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) {} }

  // ============ 关卡生命周期 ============
  startLevel(idx, carry = null) {
    // 清理旧场景
    this._teardown();
    this.levelIdx = idx;
    CTX.levelIdx = idx;
    CTX.levelCfg = LEVELS[idx];

    const scene = new THREE.Scene();
    CTX.scene = scene;
    Effects.init(scene);
    Bullets.init(scene);
    Pickups.init(scene);

    CTX.world = new World(LEVELS[idx]);
    CTX.player = new Player(carry || this.carry || {});
    this.lives = CONST.LIVES;
    this.carry = { power: CTX.player.power, missiles: CTX.player.missiles, bombs: CTX.player.bombs };

    resetRunStats();
    this.levelScore0 = 0;
    this.difficulty = { hp: 1 + idx * 0.18, rate: 1 + idx * 0.12, spd: 1 + idx * 0.07 };
    this.waveIdx = 0;
    this.gameTime = 0;
    this.wavesDone = false;
    this.bossSpawned = false;
    this.bossWarned = false;
    this.seq.length = 0;
    this.alertCd = 0;
    CTX.scrollSpeed = 62;
    this.paused = false;
    this.state = 'playing';

    Audio.unlock();
    Audio.engineStart();
    Audio.engineSet(0.5);
    Audio.setLevelTrack(idx);

    Hud.show();
    Hud.setStage(idx, LEVELS[idx]);
    Hud.bossHide();
    Hud.stageBanner(idx, LEVELS[idx]);
    this._hideScreens();
    this._updateTitleInfo();
  }

  _teardown() {
    if (CTX.world) { CTX.world.dispose(); CTX.world = null; }
    if (CTX.player) { CTX.player.destroy(); CTX.player = null; }
    if (CTX.boss) { CTX.boss.destroy(); CTX.boss = null; }
    Enemies.clear();
    Bullets.clear();
    Pickups.clear();
    Effects.clear();
    Audio.engineStop();
  }

  backToMenu() {
    this._teardown();
    this.state = 'menu';
    Hud.hide();
    Hud.bossHide();
    this._hideScreens();
    $('menu').classList.remove('hidden');
    Audio.stopTrack();
    Audio.setMenuTrack();
    this._updateTitleInfo();
  }

  // ============ 玩家死亡 / Boss ============
  onPlayerDeath() {
    this.lives--;
    if (this.lives <= 0) {
      this.seq.push({ t: 1.6, fn: () => this.gameOver() });
    }
  }

  gameOver() {
    this.state = 'gameover';
    Audio.engineStop();
    Audio.stopTrack();
    Audio.playStinger('gameover');
    const total = CTX.stats.score;
    if (total > this.save.best) { this.save.best = total; this._commitSave(); }
    $('go-score').textContent = String(total).padStart(7, '0');
    $('go-best').textContent = `最高纪录 ${String(this.save.best).padStart(7, '0')}`;
    this._showScreen('screen-gameover');
  }

  onBossDefeated(boss) {
    CTX.stats.score += boss.score;
    CTX.boss = null;
    Hud.bossHide();
    this.seq.push({ t: 2.4, fn: () => this.levelClear() });
  }

  levelClear() {
    this.state = 'clear';
    Audio.engineStop();
    Audio.stopTrack();
    Audio.playStinger('victory');
    const gained = CTX.stats.score - this.levelScore0;
    // 解锁下一关
    if (this.levelIdx + 1 > this.save.unlocked) { this.save.unlocked = this.levelIdx + 1; this._commitSave(); }
    if (CTX.stats.score > this.save.best) { this.save.best = CTX.stats.score; this._commitSave(); }
    $('clear-stage').textContent = `STAGE ${this.levelIdx + 1} ${LEVELS[this.levelIdx].name} — 完成`;
    $('clear-score').textContent = `本关得分 +${gained}`;
    $('clear-kills').textContent = `击坠 ${CTX.stats.kills}`;
    const acc = CTX.stats.shots > 0 ? Math.round((CTX.stats.hits / CTX.stats.shots) * 100) : 0;
    $('clear-acc').textContent = `命中率 ${acc}%`;
    $('clear-total').textContent = `总积分 ${String(CTX.stats.score).padStart(7, '0')}`;
    $('clear-next').textContent = this.levelIdx >= LEVELS.length - 1 ? '进入终局' : '下一关';
    this._showScreen('screen-clear');
  }

  nextLevel() {
    if (this.levelIdx >= LEVELS.length - 1) { this.victory(); return; }
    this.carry = { power: CTX.player.power, missiles: CTX.player.missiles, bombs: CTX.player.bombs };
    this.startLevel(this.levelIdx + 1, this.carry);
  }

  victory() {
    this.state = 'victory';
    if (CTX.stats.score > this.save.best) { this.save.best = CTX.stats.score; this._commitSave(); }
    $('v-score').textContent = String(CTX.stats.score).padStart(7, '0');
    $('v-best').textContent = `最高纪录 ${String(this.save.best).padStart(7, '0')}`;
    this._showScreen('screen-victory');
    Audio.playStinger('victory');
  }

  retryLevel() {
    this.startLevel(this.levelIdx, {});
  }

  togglePause() {
    if (this.state !== 'playing') return;
    this.paused = !this.paused;
    if (this.paused) {
      this._showScreen('screen-pause');
      Audio.suspend();
    } else {
      this._hideScreens();
      Audio.resume();
    }
  }

  addKill(enemy) {
    const s = CTX.stats;
    s.kills++;
    s.combo++;
    s.comboT = CONST.COMBO_TIME;
    const mult = 1 + Math.min(s.combo, 20) * 0.05;
    s.score += Math.round(enemy.score * mult);
    if (s.kills % 8 === 0) Pickups.spawn(randPickup(), enemy.pos.clone());
  }

  // ============ 每帧更新 ============
  update(dt) {
    // 延迟事件
    for (let i = this.seq.length - 1; i >= 0; i--) {
      this.seq[i].t -= dt;
      if (this.seq[i].t <= 0) { const f = this.seq[i].fn; this.seq.splice(i, 1); f(); }
    }

    if (this.state !== 'playing' && this.state !== 'clear' && this.state !== 'gameover' && this.state !== 'victory') return;
    if (this.paused) return;

    const playing = this.state === 'playing';
    if (playing) {
      this.gameTime += dt;
      CTX.gameTime = this.gameTime;
      Input.update(dt);

      // 波次导演
      const waves = CTX.levelCfg.waves;
      if (this.debugBoss && this.gameTime > 2.5) {
        this.wavesDone = true;
        this.waveIdx = waves.length;
      }
      while (this.waveIdx < waves.length && waves[this.waveIdx].t <= this.gameTime) {
        const ev = waves[this.waveIdx++];
        if (ev.spawner === 'end') this.wavesDone = true;
        else Spawners[ev.spawner]?.(ev);
      }

      // 连击衰减
      CTX.stats.comboT -= dt;
      if (CTX.stats.comboT <= 0) CTX.stats.combo = 0;

      // Boss 触发
      if (this.wavesDone && !this.bossSpawned && Enemies.list.length === 0 && Enemies._queue.length === 0) {
        this.bossSpawned = true;
        const def = CTX.levelCfg.boss;
        Hud.warning('⚠ WARNING ⚠', `巨型目标接近 ── ${def.name}`);
        Audio.sfx('warningSiren', 1);
        Audio.boomDuck();
        this.seq.push({ t: 2.4, fn: () => {
          if (this.state !== 'playing') return;
          CTX.boss = createBoss(this.levelIdx);
          CTX.boss.start();
          Hud.bossShow(def.name, def.en);
          Audio.setBossTrack(this.levelIdx);
        } });
      }
    }

    // 实体更新（clear/gameover 状态下让残骸继续动）
    if (CTX.world) CTX.world.update(dt);
    if (CTX.player && playing) CTX.player.update(dt);
    Enemies.update(dt);
    Bullets.update(dt);
    Pickups.update(dt);
    if (CTX.boss) CTX.boss.update(dt);
    Effects.update(dt);

    if (playing) {
      this._collide();
      this._missileAlert(dt);
      this._updateCamera(dt);
      Hud.refresh(dt);
    }
  }

  // ============ 碰撞检测 ============
  _segDist2(a, b, p) {
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
    const ab2 = abx * abx + aby * aby + abz * abz;
    let t = ab2 > 0 ? (apx * abx + apy * aby + apz * abz) / ab2 : 0;
    t = clamp(t, 0, 1);
    const dx = apx - abx * t, dy = apy - aby * t, dz = apz - abz * t;
    return dx * dx + dy * dy + dz * dz;
  }

  _collide() {
    const p = CTX.player;
    const boss = CTX.boss;

    // 玩家弹药 → 敌人 / Boss
    for (const pool of [Bullets.pVulcan, Bullets.pMissiles]) {
      const isMissilePool = pool === Bullets.pMissiles;
      for (const b of pool.items) {
        if (!b.active) continue;
        const prev = { x: b.pos.x - b.vel.x * CTX.dt, y: b.pos.y - b.vel.y * CTX.dt, z: b.pos.z - b.vel.z * CTX.dt };
        let consumed = false;
        for (const e of CTX.enemies) {
          if (e.dead) continue;
          const r = e.radius + b.radius + (isMissilePool ? 1.4 : 0.6);
          if (this._segDist2(prev, b.pos, e.pos) < r * r) {
            e.hit(b.dmg, b.pos.clone());
            if (b.dmg >= 30) Effects.explosion(b.pos, 0.8); // 导弹命中
            consumed = true;
            break;
          }
        }
        if (!consumed && boss && boss.state === 'fight') {
          const r = boss.radius + b.radius;
          if (this._segDist2(prev, b.pos, boss.pos) < r * r) {
            boss.hit(b.dmg, b.pos.clone());
            if (b.dmg >= 30) Effects.explosion(b.pos, 0.8);
            consumed = true;
          }
        }
        if (consumed) pool._deactivate(b);
      }
    }

    if (!p || !p.alive) return;

    // 敌方弹药 → 玩家
    for (const pool of [Bullets.eOrbs, Bullets.eBolts, Bullets.eMissiles]) {
      for (const b of pool.items) {
        if (!b.active) continue;
        const prev = { x: b.pos.x - b.vel.x * CTX.dt, y: b.pos.y - b.vel.y * CTX.dt, z: b.pos.z - b.vel.z * CTX.dt };
        const r = CONST.PLAYER_RADIUS + b.radius + 0.4;
        if (this._segDist2(prev, b.pos, p.pos) < r * r) {
          p.hit(b.dmg);
          Effects.spark(b.pos, 0xff8866);
          pool._deactivate(b);
        }
      }
    }

    // 敌机冲撞
    for (const e of CTX.enemies) {
      if (e.dead) continue;
      const dx = e.pos.x - p.pos.x, dy = e.pos.y - p.pos.y, dz = e.pos.z - p.pos.z;
      const r = e.radius + CONST.PLAYER_RADIUS;
      if (dx * dx + dy * dy + dz * dz < r * r) {
        e.hit(60, e.pos.clone());
        p.hit(20);
      }
    }

    // Boss 冲撞
    if (boss && boss.state === 'fight') {
      const dx = boss.pos.x - p.pos.x, dy = boss.pos.y - p.pos.y, dz = boss.pos.z - p.pos.z;
      const r = boss.radius * 0.85 + CONST.PLAYER_RADIUS;
      if (dx * dx + dy * dy + dz * dz < r * r) p.hit(22);
    }
  }

  _missileAlert(dt) {
    this.alertCd -= dt;
    if (this.alertCd > 0 || !CTX.player?.alive) return;
    for (const b of Bullets.eMissiles.items) {
      if (!b.active) continue;
      const d2 = b.pos.distanceToSquared(CTX.player.pos);
      if (d2 < 4900) {
        Audio.sfx('missileAlert', 0.9);
        this.alertCd = 0.7;
        return;
      }
    }
  }

  // ============ 相机 ============
  _updateCamera(dt) {
    const cam = CTX.camera;
    const p = CTX.player;
    const shake = Effects.shake;
    const shx = (Math.random() - 0.5) * shake * 1.5;
    const shy = (Math.random() - 0.5) * shake * 1.2;
    const px = p ? p.pos.x : 0, py = p ? p.pos.y : 12;
    cam.position.set(px * 0.42 + shx, py * 0.5 + 5.2 + shy, 15.5);
    cam.lookAt(px * 0.75 + shx * 0.5, py * 0.82 + 1.8 + shy * 0.5, -40);
    const fovT = 62 + (p ? (p.throttle - 0.55) * 12 : 0);
    cam.fov = damp(cam.fov, fovT, 4, dt);
    cam.updateProjectionMatrix();
  }

  // ============ 屏幕切换 ============
  _showScreen(id) {
    this._hideScreens();
    $(id).classList.remove('hidden');
  }
  _hideScreens() {
    document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
    $('menu').classList.add('hidden');
  }
  _updateTitleInfo() {
    $('title-best').textContent = `最高分 ${String(this.save.best).padStart(7, '0')}`;
    // 关卡选择按钮状态
    LEVELS.forEach((lv, i) => {
      const card = $('level-card-' + i);
      if (!card) return;
      const locked = i > this.save.unlocked;
      card.classList.toggle('locked', locked);
      card.querySelector('.lv-status').textContent = locked ? '🔒 未解锁' : '可挑战';
    });
  }

  // ============ 主菜单场景 ============
  buildMenuScene() {
    const scene = new THREE.Scene();
    const bg = canvasTex(16, 256, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0a1230');
      grad.addColorStop(0.5, '#16305e');
      grad.addColorStop(1, '#3a6a9e');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
    scene.background = bg;
    const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
    cam.position.set(4.4, 2.2, 7.5);
    cam.lookAt(0, 0.4, 0);
    this.menuScene = scene;
    this.menuCam = cam;

    scene.add(new THREE.HemisphereLight(0x8ab4ff, 0x1a2438, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(5, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4488ff, 1.6);
    rim.position.set(-6, 3, -8);
    scene.add(rim);

    const built = buildJet(0x2aa7ff);
    this.menuJet = built.g;
    this.menuJetParts = built.parts;
    this.menuJet.scale.setScalar(1.15);
    scene.add(this.menuJet);

    // 漂浮光点
    for (let i = 0; i < 30; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex(pick(['#66d9ff', '#a78dff', '#ffffff'])),
        transparent: true, opacity: rand(0.3, 0.8), depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      s.position.set(rand(-12, 12), rand(-6, 8), rand(-14, 4));
      s.scale.setScalar(rand(0.3, 1.4));
      s.userData.v = rand(0.2, 1);
      scene.add(s);
      this.menuDust = this.menuDust || [];
      this.menuDust.push(s);
    }
  }

  updateMenu(dt) {
    if (!this.menuJet) return;
    this.menuJet.rotation.y += dt * 0.55;
    this.menuJet.position.y = Math.sin(performance.now() * 0.001) * 0.25;
    const bl = 0.8 + Math.sin(performance.now() * 0.02) * 0.2;
    for (const b of this.menuJetParts.burns) b.scale.set(0.8, 0.8, bl * 1.4);
    for (const s of this.menuDust) {
      s.position.y += s.userData.v * dt;
      if (s.position.y > 9) s.position.y = -7;
    }
  }

  renderMenu() {
    CTX.renderer.render(this.menuScene, this.menuCam);
  }
}

function randPickup() {
  const r = Math.random();
  if (r < 0.3) return 'P';
  if (r < 0.55) return 'M';
  if (r < 0.75) return 'H';
  if (r < 0.9) return 'B';
  return 'S';
}

// ============ 启动 ============
const game = new Game();
CTX.game = game;
CTX.audio = Audio;
CTX.hud = Hud;
CTX.input = Input;
CTX.effects = Effects;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, (now - (game._last || now)) / 1000);
  game._last = now;
  CTX.dt = dt;

  if (Input.wasPressed('pause') && game.state === 'playing') game.togglePause();
  else if (Input.wasPressed('pause') && game.paused) game.togglePause();

  if (game.state === 'menu') {
    game.updateMenu(dt);
    game.renderMenu();
  } else {
    game.update(dt);
    CTX.renderer.render(CTX.scene, CTX.camera);
  }
  Input.endFrame();
}

function boot() {
  const params = new URLSearchParams(location.search);
  if (params.get('god') === '1') CTX.godMode = true;
  if (params.get('mute') === '1') { /* 音频仍需手势解锁，此处仅标记 */ }

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  $('app').appendChild(renderer.domElement);
  CTX.renderer = renderer;

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1200);
  CTX.camera = camera;

  Hud.init();
  Input.init();
  // 动态生成关卡选择卡片
  const grid = $('level-grid');
  LEVELS.forEach((lv, i) => {
    const card = document.createElement('div');
    card.className = 'level-card';
    card.id = 'level-card-' + i;
    card.innerHTML = `<div class="lv-num">STAGE ${i + 1}</div><div class="lv-name">${lv.name}</div><div class="lv-sub">${lv.sub}</div><div class="lv-status"></div>`;
    grid.appendChild(card);
  });
  game.buildMenuScene();
  Audio.setMenuTrack();
  game._updateTitleInfo();

  // ---- 按钮事件 ----
  const click = (fn) => (e) => { Audio.unlock(); Audio.sfx('uiClick'); fn(e); };
  $('btn-start').onclick = click(() => game.startLevel(Math.min(game.save.unlocked, LEVELS.length - 1), {}));
  $('btn-levels').onclick = click(() => { game._hideScreens(); $('screen-levels').classList.remove('hidden'); game._updateTitleInfo(); $('menu').classList.add('hidden'); });
  $('btn-help').onclick = click(() => { $('screen-help').classList.remove('hidden'); });
  LEVELS.forEach((lv, i) => {
    const card = $('level-card-' + i);
    if (card) card.onclick = click(() => {
      if (i > game.save.unlocked) return;
      game.startLevel(i, {});
    });
  });
  document.querySelectorAll('[data-back]').forEach((b) => { b.onclick = click(() => { b.closest('.screen').classList.add('hidden'); if (game.state === 'menu') $('menu').classList.remove('hidden'); }); });
  $('btn-pause-resume').onclick = click(() => game.togglePause());
  $('btn-pause-retry').onclick = click(() => { Audio.resume(); game.retryLevel(); });
  $('btn-pause-quit').onclick = click(() => { Audio.resume(); game.backToMenu(); });
  $('clear-next').onclick = click(() => game.nextLevel());
  $('clear-retry').onclick = click(() => game.retryLevel());
  $('clear-menu').onclick = click(() => game.backToMenu());
  $('go-retry').onclick = click(() => game.retryLevel());
  $('go-menu').onclick = click(() => game.backToMenu());
  $('v-menu').onclick = click(() => game.backToMenu());

  // 音量滑条（菜单 + 暂停）
  const volPairs = [['vol-music', (v) => Audio.setMusicVol(v)], ['vol-sfx', (v) => Audio.setSfxVol(v)]];
  for (const [id, fn] of volPairs) {
    document.querySelectorAll(`.${id}`).forEach((el) => {
      el.value = id === 'vol-music' ? Audio.musicVol : Audio.sfxVol;
      el.oninput = () => { Audio.unlock(); fn(parseFloat(el.value)); };
    });
  }

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    if (game.menuCam) {
      game.menuCam.aspect = camera.aspect;
      game.menuCam.updateProjectionMatrix();
    }
  });

  // 调试参数
  const lvParam = parseInt(params.get('level'));
  if (!isNaN(lvParam) && lvParam >= 1 && lvParam <= LEVELS.length) {
    // 等待首次交互再启动（音频策略）；也支持直接启动
    const start = () => { game.startLevel(lvParam - 1, {}); window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    if (params.get('boss') === '1') game.debugBoss = true;
  } else if (params.get('boss') === '1') {
    const start = () => { game.startLevel(0, {}); game.debugBoss = true; window.removeEventListener('pointerdown', start); window.removeEventListener('keydown', start); };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
  }

  requestAnimationFrame(loop);

  // 调试句柄
  window.__game = { CTX, game, Bullets, Enemies, Audio, Pickups };
}

boot();
