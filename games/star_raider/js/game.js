/* 游戏主循环、波次、碰撞、HUD 与界面状态 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  const CFG = SR.CONFIG;
  const U = SR.utils;
  const W = CFG.W;
  const H = CFG.H;
  const TAU = U.TAU;

  const FONT_MONO = 'ui-monospace, Menlo, Consolas, monospace';
  const FONT_UI = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.dpr = 1;
      this.audio = new SR.SoundFX();
      this.input = new SR.Input(canvas, this);
      this.starfield = new SR.Starfield();
      this.background = this.buildBackground();

      this.highScore = this.loadHighScore();
      this.state = 'menu';
      this.overlay = 'start';
      this.score = 0;
      this.wave = 0;
      this.time = 0;
      this.kills = 0;

      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.powerups = [];
      this.particles = [];
      this.texts = [];
      this.shockwaves = [];
      this.boss = null;

      this.wavePhase = 'idle';
      this.waveTime = 0;
      this.spawnQueue = [];
      this.clearTimer = 0;
      this.banner = null;

      this.shake = 0;
      this.flash = 0;
      this.hitVignette = 0;
      this.dyingTimer = 0;

      this.player = new SR.Player(this);

      this.lastTime = U.now();
      this.fps = 60;
      this.fpsFrames = 0;
      this.fpsElapsed = 0;
      this._bombKey = '';

      this.els = this.collectElements();
      this.bindUI();
      this.resize();
      this.updateSoundButton();
      this.updateBestLabels();
      this.syncBombButton();
      this.showOverlay('start');
      this.render();

      window.addEventListener('resize', () => this.resize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.state === 'playing') this.pause();
      });
      window.addEventListener('pagehide', () => this.saveHighScore());

      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    /* ------------------------------------------------ 初始化 / 存储 */
    loadHighScore() {
      const raw = parseInt(U.storageGet(CFG.STORAGE.high, '0'), 10);
      return Number.isFinite(raw) && raw > 0 ? raw : 0;
    }

    saveHighScore() {
      if (this.score > this.highScore) this.highScore = this.score;
      U.storageSet(CFG.STORAGE.high, this.highScore);
    }

    collectElements() {
      const byId = (id) => document.getElementById(id);
      return {
        startOverlay: byId('startOverlay'),
        pauseOverlay: byId('pauseOverlay'),
        gameOverOverlay: byId('gameOverOverlay'),
        startBtn: byId('startBtn'),
        resumeBtn: byId('resumeBtn'),
        restartBtn: byId('restartBtn'),
        retryBtn: byId('retryBtn'),
        pauseBtn: byId('pauseBtn'),
        soundBtn: byId('soundBtn'),
        bombBtn: byId('bombBtn'),
        bombCount: byId('bombCount'),
        menuBest: byId('menuBest'),
        finalScore: byId('finalScore'),
        finalBest: byId('finalBest'),
        finalWave: byId('finalWave')
      };
    }

    bindUI() {
      const els = this.els;
      els.startBtn.addEventListener('click', () => {
        els.startBtn.blur();
        this.startGame();
      });
      els.resumeBtn.addEventListener('click', () => {
        els.resumeBtn.blur();
        this.resume();
      });
      els.restartBtn.addEventListener('click', () => {
        els.restartBtn.blur();
        this.startGame();
      });
      els.retryBtn.addEventListener('click', () => {
        els.retryBtn.blur();
        this.startGame();
      });
      els.pauseBtn.addEventListener('click', () => {
        els.pauseBtn.blur();
        this.togglePause();
      });
      els.soundBtn.addEventListener('click', () => {
        els.soundBtn.blur();
        this.toggleSound();
      });
      els.bombBtn.addEventListener('click', () => {
        if (this.state === 'playing') {
          this.audio.init();
          this.useBomb();
        }
        this.canvas.focus({ preventScroll: true });
      });
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, CFG.MAX_DPR);
      const bw = Math.round(W * dpr);
      const bh = Math.round(H * dpr);
      if (this.canvas.width !== bw || this.canvas.height !== bh) {
        this.canvas.width = bw;
        this.canvas.height = bh;
      }
      this.dpr = dpr;
      this.render();
    }

    buildBackground() {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d');

      const base = g.createLinearGradient(0, 0, 0, H);
      base.addColorStop(0, '#070818');
      base.addColorStop(0.45, '#090b22');
      base.addColorStop(1, '#04050d');
      g.fillStyle = base;
      g.fillRect(0, 0, W, H);

      const blob = (x, y, r, color, alpha) => {
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        g.globalAlpha = alpha;
        g.fillStyle = grad;
        g.fillRect(x - r, y - r, r * 2, r * 2);
        g.globalAlpha = 1;
      };

      g.globalCompositeOperation = 'lighter';
      blob(80, 120, 280, 'rgba(91, 33, 182, 0.55)', 0.55);
      blob(420, 250, 240, 'rgba(14, 116, 144, 0.5)', 0.42);
      blob(140, 620, 300, 'rgba(157, 23, 77, 0.32)', 0.4);
      blob(360, 540, 200, 'rgba(67, 56, 202, 0.3)', 0.35);
      g.globalCompositeOperation = 'source-over';

      // 远处的行星
      const planet = g.createRadialGradient(96, 34, 10, 96, 34, 150);
      planet.addColorStop(0, 'rgba(125, 211, 252, 0.10)');
      planet.addColorStop(0.55, 'rgba(59, 130, 246, 0.05)');
      planet.addColorStop(0.78, 'rgba(15, 23, 42, 0.18)');
      planet.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = planet;
      g.beginPath();
      g.arc(96, 34, 150, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(125, 211, 252, 0.08)';
      g.lineWidth = 1;
      g.beginPath();
      g.arc(96, 34, 118, 0.35, 2.4);
      g.stroke();

      // 星尘
      for (let i = 0; i < 170; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const a = Math.random() * 0.12 + 0.015;
        g.fillStyle = `rgba(226, 242, 255, ${a.toFixed(3)})`;
        g.fillRect(x, y, Math.random() < 0.8 ? 1 : 1.5, Math.random() < 0.8 ? 1 : 1.5);
      }

      // 暗角
      const vig = g.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.48, H * 0.75);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.58)');
      g.fillStyle = vig;
      g.fillRect(0, 0, W, H);

      return c;
    }

    /* ------------------------------------------------ 状态流转 */
    showOverlay(name) {
      this.overlay = name;
      this.els.startOverlay.hidden = name !== 'start';
      this.els.pauseOverlay.hidden = name !== 'pause';
      this.els.gameOverOverlay.hidden = name !== 'gameover';
    }

    hideOverlays() {
      this.overlay = null;
      this.els.startOverlay.hidden = true;
      this.els.pauseOverlay.hidden = true;
      this.els.gameOverOverlay.hidden = true;
    }

    updateBestLabels() {
      const best = U.formatScore(this.highScore);
      this.els.menuBest.textContent = best;
      this.els.finalBest.textContent = best;
    }

    updateSoundButton() {
      const btn = this.els.soundBtn;
      btn.classList.toggle('is-muted', this.audio.muted);
      btn.setAttribute('aria-pressed', String(!this.audio.muted));
      btn.title = this.audio.muted ? '开启音效 (M)' : '静音 (M)';
    }

    syncBombButton() {
      const player = this.player;
      const canUse = this.state === 'playing' && player.bombs > 0;
      const key = `${this.state}|${player.bombs}|${canUse}`;
      if (key === this._bombKey) return;
      this._bombKey = key;
      this.els.bombBtn.disabled = !canUse;
      this.els.bombBtn.classList.toggle('is-empty', player.bombs <= 0);
      this.els.bombCount.textContent = player.bombs;
    }

    toggleSound() {
      this.audio.init();
      this.audio.toggle();
      this.updateSoundButton();
    }

    startGame() {
      this.audio.init();
      this.audio.ui();
      this.resetWorld();
      this.state = 'playing';
      this.overlay = null;
      this.hideOverlays();
      this.els.pauseBtn.disabled = false;
      this.startWave(1);
      this.syncBombButton();
      this.lastTime = U.now();
      this.canvas.focus({ preventScroll: true });
    }

    resetWorld() {
      this.score = 0;
      this.wave = 0;
      this.time = 0;
      this.kills = 0;
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.powerups = [];
      this.particles = [];
      this.texts = [];
      this.shockwaves = [];
      this.boss = null;
      this.wavePhase = 'idle';
      this.waveTime = 0;
      this.spawnQueue = [];
      this.clearTimer = 0;
      this.banner = null;
      this.shake = 0;
      this.flash = 0;
      this.hitVignette = 0;
      this.dyingTimer = 0;
      this.player = new SR.Player(this);
      this.input.mode = 'keyboard';
      this.input.pointer.active = false;
      this.input.pointer.down = false;
      this.input.keys.clear();
      this.highScore = this.loadHighScore();
      this.updateBestLabels();
      this.syncBombButton();
    }

    pause() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      this.showOverlay('pause');
      this.els.pauseBtn.disabled = true;
      this.audio.ui();
      this.syncBombButton();
    }

    resume() {
      if (this.state !== 'paused') return;
      this.state = 'playing';
      this.hideOverlays();
      this.els.pauseBtn.disabled = false;
      this.audio.resume();
      this.audio.ui();
      this.lastTime = U.now();
      this.canvas.focus({ preventScroll: true });
      this.syncBombButton();
    }

    togglePause() {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }

    onAction(action) {
      if (action === 'mute') {
        this.toggleSound();
        return;
      }
      if (action === 'pause') {
        this.togglePause();
        return;
      }
      if (action === 'bomb') {
        if (this.state === 'playing') {
          this.audio.init();
          this.useBomb();
        }
        return;
      }
      if (action === 'confirm') {
        if (this.state === 'menu' || this.state === 'gameover') this.startGame();
        else if (this.state === 'paused') this.resume();
      }
    }

    gameOver() {
      if (this.state !== 'playing') return;
      this.state = 'dying';
      this.dyingTimer = 1.55;
      this.player.alive = false;
      this.els.pauseBtn.disabled = true;
      this.saveHighScore();
      this.updateBestLabels();
      this.syncBombButton();
      this.addShake(22);
      this.flash = 0.45;
      this.hitVignette = 1;
      this.audio.gameOver();
    }

    showGameOver() {
      this.els.finalScore.textContent = U.formatScore(this.score);
      this.els.finalBest.textContent = U.formatScore(this.highScore);
      this.els.finalWave.textContent = `WAVE ${String(Math.max(1, this.wave)).padStart(2, '0')}`;
      this.updateBestLabels();
      this.showOverlay('gameover');
    }

    /* ------------------------------------------------ 波次 */
    startWave(n) {
      this.wave = n;
      this.wavePhase = 'active';
      this.waveTime = 0;
      this.clearTimer = 0;
      this.spawnQueue = [];

      if (n % CFG.BOSS_EVERY === 0) {
        this.banner = { text: '警告 · BOSS', sub: 'WARNING', t: 0, dur: 2.7, danger: true };
        this.audio.bossWarn();
        this.spawnQueue.push({ t: 1.55, fn: () => this.spawnBoss() });
      } else {
        this.banner = { text: `WAVE ${String(n).padStart(2, '0')}`, sub: this.waveSubtitle(n), t: 0, dur: 1.9, danger: false };
        this.audio.wave();
        this.spawnQueue = this.buildWave(n);
      }
    }

    waveSubtitle(n) {
      const list = ['敌机接近', '编队突入', '火力压制', '深入空域', '高危区域'];
      return list[Math.min(list.length - 1, Math.floor((n - 1) / 2))];
    }

    buildWave(n) {
      const entries = [];
      let t = 0.75;
      const groups = Math.min(7, 3 + Math.floor((n - 1) / 2));

      for (let g = 0; g < groups; g++) {
        const roll = Math.random();

        if (n >= 2 && roll < 0.3) {
          entries.push({
            t,
            type: 'gunner',
            x: U.rand(95, 170),
            opts: { targetY: U.rand(125, 195) }
          });
          entries.push({
            t: t + 0.55,
            type: 'gunner',
            x: U.rand(310, 385),
            opts: { targetY: U.rand(125, 195) }
          });
          t += 1.3;
        } else if (n >= 2 && roll < 0.52) {
          const count = 2 + Math.min(2, Math.floor(n / 4));
          for (let i = 0; i < count; i++) {
            entries.push({ t: t + i * 0.3, type: 'diver', x: U.rand(80, W - 80) });
          }
          t += 0.8 + count * 0.2;
        } else if (n >= 4 && roll < 0.64) {
          entries.push({
            t,
            type: 'tank',
            x: U.rand(130, W - 130),
            opts: { targetY: U.rand(130, 175) }
          });
          t += 0.85;
        } else {
          const count = Math.min(7, 4 + Math.floor(n / 3));
          const fromLeft = U.chance(0.5);
          for (let i = 0; i < count; i++) {
            const span = W - 160;
            const x = fromLeft ? 80 + (i / Math.max(1, count - 1)) * span : W - 80 - (i / Math.max(1, count - 1)) * span;
            entries.push({
              t: t + i * 0.12,
              type: 'scout',
              x,
              opts: { phase: U.rand(0, TAU), amp: U.rand(18, 44) }
            });
          }
          t += 0.95 + count * 0.1;
        }

        t += Math.max(0.32, 1.4 - n * 0.045);
      }

      entries.sort((a, b) => a.t - b.t);
      return entries;
    }

    spawnEnemy(type, x, opts = {}) {
      this.enemies.push(new SR.Enemy(this, type, x, opts.y !== undefined ? opts.y : -42, opts));
    }

    spawnBoss() {
      if (this.state !== 'playing') return;
      this.boss = new SR.Boss(this, this.wave);
      this.banner = { text: 'BOSS', sub: '毁灭者级战舰', t: 0, dur: 2.2, danger: true };
    }

    updateWaveState(dt) {
      if (this.wavePhase === 'active') {
        if (this.spawnQueue.length === 0 && this.enemies.length === 0 && !this.boss) {
          this.wavePhase = 'clear';
          this.clearTimer = 2.2;
          this.clearEnemyBullets(false);
          const bonus = this.wave * 100;
          this.addScore(bonus);
          this.addFloat(W / 2, H * 0.42, `WAVE CLEAR +${bonus}`, '#6ee7b7', {
            size: 20,
            life: 1.9,
            vy: -18
          });
          this.audio.waveClear();
          this.addShockwave(W / 2, H / 2, {
            maxR: 300,
            life: 0.9,
            color: 'rgba(110, 231, 183, 0.85)',
            width: 2
          });
        }
      } else if (this.wavePhase === 'clear') {
        this.clearTimer -= dt;
        if (this.clearTimer <= 0) this.startWave(this.wave + 1);
      }
    }

    /* ------------------------------------------------ 主循环 */
    loop(ts) {
      const raw = Math.min(0.1, (ts - this.lastTime) / 1000 || 0);
      this.lastTime = ts;
      this.fpsElapsed += raw;
      this.fpsFrames += 1;
      if (this.fpsElapsed >= 0.5) {
        this.fps = Math.round(this.fpsFrames / this.fpsElapsed);
        this.fpsFrames = 0;
        this.fpsElapsed = 0;
      }

      const dt = Math.min(raw, 1 / 30);
      if (this.state === 'playing') this.update(dt);
      else if (this.state === 'dying') this.updateDying(dt);
      else this.updateIdle(dt);

      this.render();
      requestAnimationFrame(this.loop);
    }

    updateIdle(dt) {
      if (this.state === 'menu') {
        this.starfield.update(dt, 0.5);
      } else if (this.state === 'paused') {
        this.starfield.update(dt, 0.16);
      } else if (this.state === 'gameover') {
        this.starfield.update(dt, 0.3);
      }
      this.decayEffects(dt);
      if (this.banner) {
        this.banner.t += dt;
        if (this.banner.t > this.banner.dur) this.banner = null;
      }
    }

    update(dt) {
      this.time += dt;
      this.starfield.update(dt, 1 + Math.min(1.2, this.wave * 0.035));

      this.player.update(dt);

      if (this.wavePhase === 'active') {
        this.waveTime += dt;
        while (this.spawnQueue.length > 0 && this.spawnQueue[0].t <= this.waveTime) {
          const entry = this.spawnQueue.shift();
          if (entry.fn) entry.fn();
          else this.spawnEnemy(entry.type, entry.x, entry.opts || {});
        }
      }

      for (const enemy of this.enemies) {
        enemy.update(dt);
        if (enemy.offscreen()) enemy.dead = true;
      }

      const bossRef = this.boss;
      if (bossRef) {
        bossRef.update(dt);
        if (bossRef.dead) this.boss = null;
      }

      for (const b of this.bullets) b.update(dt);
      for (const b of this.enemyBullets) b.update(dt);
      for (const p of this.powerups) p.update(dt, this.player);
      for (const p of this.particles) p.update(dt);
      for (const s of this.shockwaves) s.update(dt);
      for (const t of this.texts) t.update(dt);

      this.checkCollisions();
      this.updateWaveState(dt);

      this.bullets = this.bullets.filter((b) => !b.dead);
      this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
      this.enemies = this.enemies.filter((e) => !e.dead);
      this.powerups = this.powerups.filter((p) => !p.dead);
      this.particles = this.particles.filter((p) => !p.dead);
      this.shockwaves = this.shockwaves.filter((s) => !s.dead);
      this.texts = this.texts.filter((t) => !t.dead);
      if (this.particles.length > 520) {
        this.particles.splice(0, this.particles.length - 520);
      }

      if (this.banner) {
        this.banner.t += dt;
        if (this.banner.t > this.banner.dur) this.banner = null;
      }

      this.decayEffects(dt);
      this.syncBombButton();
    }

    updateDying(dt) {
      this.starfield.update(dt, 0.5);
      for (const p of this.particles) p.update(dt);
      for (const s of this.shockwaves) s.update(dt);
      for (const t of this.texts) t.update(dt);
      this.particles = this.particles.filter((p) => !p.dead);
      this.shockwaves = this.shockwaves.filter((s) => !s.dead);
      this.texts = this.texts.filter((t) => !t.dead);
      this.decayEffects(dt);
      this.dyingTimer -= dt;
      if (this.dyingTimer <= 0) {
        this.state = 'gameover';
        this.showGameOver();
      }
    }

    decayEffects(dt) {
      this.shake *= Math.exp(-6.5 * dt);
      if (this.shake < 0.15) this.shake = 0;
      this.flash = Math.max(0, this.flash - dt * 2.4);
      this.hitVignette = Math.max(0, this.hitVignette - dt * 2.2);
    }

    /* ------------------------------------------------ 碰撞 */
    checkCollisions() {
      const player = this.player;

      // 玩家子弹 → 敌机 / BOSS
      for (const b of this.bullets) {
        if (b.dead) continue;
        let hit = false;

        for (const e of this.enemies) {
          if (e.dead) continue;
          const rr = e.r + b.r;
          if (U.dist2(b.x, b.y, e.x, e.y) <= rr * rr) {
            b.dead = true;
            e.hit(b.dmg, b.x, b.y);
            hit = true;
            break;
          }
        }
        if (hit) continue;

        if (this.boss && !this.boss.dying && !this.boss.dead) {
          const rr = this.boss.r + b.r;
          if (U.dist2(b.x, b.y, this.boss.x, this.boss.y) <= rr * rr) {
            b.dead = true;
            this.boss.hit(b.dmg, b.x, b.y);
          }
        }
      }

      if (!player.alive) return;

      // 敌弹 → 玩家
      for (const b of this.enemyBullets) {
        if (b.dead) continue;
        const rr = player.r + b.r;
        if (U.dist2(b.x, b.y, player.x, player.y) <= rr * rr) {
          b.dead = true;
          player.hit();
          if (!player.alive) return;
        }
      }

      // 敌机撞击 → 玩家
      for (const e of this.enemies) {
        if (e.dead) continue;
        const rr = player.r + e.r * 0.55;
        if (U.dist2(e.x, e.y, player.x, player.y) <= rr * rr) {
          player.hit();
          if (!player.alive) return;
        }
      }

      if (this.boss && !this.boss.dying && !this.boss.dead) {
        const rr = player.r + this.boss.r * 0.6;
        if (U.dist2(this.boss.x, this.boss.y, player.x, player.y) <= rr * rr) {
          player.hit();
          if (!player.alive) return;
        }
      }

      // 补给拾取
      for (const p of this.powerups) {
        if (p.dead) continue;
        const rr = player.r + p.r + 10;
        if (U.dist2(p.x, p.y, player.x, player.y) <= rr * rr) {
          this.collectPowerUp(p);
        }
      }
    }

    /* ------------------------------------------------ 事件回调 */
    onEnemyKilled(enemy) {
      this.kills += 1;
      this.addScore(enemy.score);
      this.addFloat(enemy.x, enemy.y - 6, `+${enemy.score}`, enemy.def.glow, {
        size: 13,
        life: 0.85,
        vy: -46
      });
      this.spawnExplosion(enemy.x, enemy.y, enemy.r, enemy.def.color, 1);
      this.addShake(enemy.type === 'tank' ? 7 : 2.6);
      this.audio.explode(enemy.type === 'tank' ? 1.3 : 0.9);
      this.maybeDropPowerUp(enemy);
    }

    onPlayerHit(player) {
      this.spawnExplosion(player.x, player.y, 58, '#22d3ee', 1.5);
      this.spawnExplosion(player.x, player.y, 32, '#f472b6', 1.2);
      this.addShockwave(player.x, player.y, {
        maxR: 160,
        life: 0.55,
        color: '#fda4af',
        width: 3
      });
      this.addFloat(player.x, player.y - 34, 'LIFE -1', '#fda4af', {
        size: 16,
        life: 1.4,
        vy: -36
      });
      this.clearEnemyBullets(true);
      this.addShake(20);
      this.flash = 0.4;
      this.hitVignette = 1;
      this.audio.playerExplode();
    }

    onShieldBreak() {
      const p = this.player;
      this.addShockwave(p.x, p.y, { maxR: 130, life: 0.5, color: '#6ee7b7', width: 3 });
      this.addSparks(p.x, p.y, '#a7f3d0', 18);
      this.addFloat(p.x, p.y - 30, '护盾破碎', '#fda4af', { size: 14, life: 1.1, vy: -30 });
      this.addShake(6);
      this.hitVignette = 0.5;
      this.audio.hit();
    }

    bossDefeated(boss) {
      this.boss = null;
      this.addShake(18);
      this.flash = 0.5;
      this.spawnExplosion(boss.x, boss.y, 110, '#fbbf24', 1.8);
      this.spawnExplosion(boss.x - 50, boss.y + 16, 60, '#f472b6', 1.4);
      this.spawnExplosion(boss.x + 50, boss.y + 16, 60, '#a78bfa', 1.4);
      this.addFloat(boss.x, boss.y - 80, 'BOSS DESTROYED', '#fde68a', {
        size: 22,
        life: 2.2,
        vy: -22
      });

      const drops = ['power', 'bomb', 'shield'];
      drops.forEach((type, i) => {
        const pu = new SR.PowerUp(type, boss.x + (i - 1) * 46, boss.y + 20);
        this.powerups.push(pu);
      });
    }

    maybeDropPowerUp(enemy) {
      const chances = { scout: 0.055, diver: 0.08, gunner: 0.19, tank: 0.7 };
      let chance = chances[enemy.type] || 0.05;
      if (this.player.power >= this.player.maxPower) chance *= 0.85;
      if (!U.chance(chance)) return;

      const roll = Math.random();
      let type = 'power';
      if (roll >= 0.5 && roll < 0.72) type = 'bomb';
      else if (roll >= 0.72 && roll < 0.9) type = 'shield';
      else if (roll >= 0.9) type = 'life';

      if (type === 'power' && this.player.power >= this.player.maxPower) {
        type = U.chance(0.5) ? 'bomb' : 'shield';
      }
      if (type === 'bomb' && this.player.bombs >= this.player.maxBombs) type = 'power';
      if (type === 'life' && this.player.lives >= this.player.maxLives) type = 'shield';

      this.powerups.push(new SR.PowerUp(type, enemy.x, enemy.y));
    }

    collectPowerUp(powerup) {
      powerup.dead = true;
      const p = this.player;
      let text = '';
      let color = powerup.def.color;

      switch (powerup.type) {
        case 'power': {
          if (p.addPower()) {
            text = '火力提升';
            this.audio.pickup();
          } else {
            text = '火力已满 +300';
            this.addScore(300);
            color = '#fde68a';
            this.audio.pickup();
          }
          break;
        }
        case 'bomb': {
          if (p.addBomb()) {
            text = '炸弹 +1';
            this.audio.pickup();
          } else {
            text = '炸弹已满 +300';
            this.addScore(300);
            color = '#fde68a';
            this.audio.pickup();
          }
          break;
        }
        case 'shield': {
          p.shield = CFG.PLAYER.shieldTime;
          text = '护盾启动';
          this.audio.shield();
          break;
        }
        case 'life': {
          if (p.addLife()) {
            text = '生命 +1';
            this.audio.pickup();
          } else {
            text = '生命已满 +500';
            this.addScore(500);
            color = '#fde68a';
            this.audio.pickup();
          }
          break;
        }
      }

      this.addScore(50);
      this.addFloat(p.x, p.y - 34, text, color, { size: 14, life: 1.25, vy: -38 });
      this.addSparks(powerup.x, powerup.y, powerup.def.color, 10);
      this.addShockwave(powerup.x, powerup.y, {
        maxR: 46,
        life: 0.35,
        color: powerup.def.color,
        width: 2
      });
      this.syncBombButton();
    }

    useBomb() {
      if (this.state !== 'playing' || this.player.bombs <= 0 || !this.player.alive) return;
      const p = this.player;
      p.bombs -= 1;
      p.invuln = Math.max(p.invuln, 1.0);

      this.audio.bomb();
      this.addShake(20);
      this.flash = 0.55;
      this.addShockwave(p.x, p.y, { maxR: 520, life: 0.75, color: '#fde68a', width: 5 });
      this.addShockwave(p.x, p.y, { maxR: 380, life: 0.55, color: '#67e8f9', width: 3 });
      this.addFloat(W / 2, H * 0.52, 'BOMB !', '#fde68a', { size: 28, life: 1.1, vy: -26 });

      // 敌弹化为得分
      for (const b of this.enemyBullets) {
        if (b.dead) continue;
        b.dead = true;
        this.addScore(10);
        this.addSparks(b.x, b.y, '#fbbf24', 1);
      }

      for (const e of this.enemies) {
        if (!e.dead) e.hit(8, e.x, e.y);
      }
      if (this.boss && !this.boss.dying && !this.boss.dead) {
        this.boss.hit(14, this.boss.x, this.boss.y);
      }

      this.addSparks(p.x, p.y, '#fef3c7', 26);
      this.syncBombButton();
    }

    /* ------------------------------------------------ 分数 / 效果 */
    addScore(n) {
      this.score += n;
      if (this.score > this.highScore) this.highScore = this.score;
    }

    addShake(n) {
      this.shake = Math.min(26, this.shake + n);
    }

    addFloat(x, y, text, color, opts = {}) {
      this.texts.push(new SR.FloatText(x, y, text, color, opts));
    }

    addShockwave(x, y, opts = {}) {
      this.shockwaves.push(new SR.Shockwave(x, y, opts));
    }

    addSparks(x, y, color, count = 2) {
      for (let i = 0; i < count; i++) {
        const a = U.rand(0, TAU);
        const speed = U.rand(30, 160);
        this.particles.push(
          new SR.Particle({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: U.rand(0.16, 0.46),
            size: U.rand(0.8, 2.1),
            color,
            drag: 2.8,
            additive: true,
            streak: true
          })
        );
      }
    }

    addMuzzleFlash(x, y, color, scale = 1) {
      this.particles.push(
        new SR.Particle({
          x,
          y,
          vx: U.rand(-26, 26),
          vy: U.rand(10, 60),
          life: 0.13,
          size: 2.5 * scale,
          color,
          drag: 3.4,
          additive: true
        })
      );
    }

    addEngineTrail(x, y, vy) {
      this.particles.push(
        new SR.Particle({
          x: x + U.rand(-2.5, 2.5),
          y: y + U.rand(0, 3),
          vx: U.rand(-14, 14),
          vy: Math.max(45, Math.abs(vy) * 0.18 + U.rand(42, 88)),
          life: U.rand(0.16, 0.3),
          size: U.rand(0.9, 1.9),
          color: U.chance(0.28) ? '#a78bfa' : '#22d3ee',
          drag: 1.8,
          additive: true
        })
      );
    }

    spawnExplosion(x, y, r, color, intensity = 1) {
      const count = Math.min(32, Math.round((8 + r * 0.7) * intensity));
      for (let i = 0; i < count; i++) {
        const a = U.rand(0, TAU);
        const speed = U.rand(28, 90 + r * 2.6);
        const palette = [color, color, '#fff7ed', '#fbbf24'];
        this.particles.push(
          new SR.Particle({
            x,
            y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            life: U.rand(0.28, 0.85),
            size: U.rand(1.2, 3.1),
            color: palette[Math.floor(Math.random() * palette.length)],
            drag: 2,
            additive: true,
            streak: true
          })
        );
      }
      this.addShockwave(x, y, {
        maxR: r * 2 + 18,
        life: 0.42,
        color,
        width: 2.2
      });
    }

    clearEnemyBullets(convertToScore = false) {
      for (const b of this.enemyBullets) {
        if (b.dead) continue;
        b.dead = true;
        if (convertToScore) {
          this.addScore(10);
          this.addSparks(b.x, b.y, '#fbbf24', 1);
        }
      }
    }

    /* ------------------------------------------------ 绘制 */
    render() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(this.background, 0, 0);
      this.starfield.draw(ctx);

      if (this.state === 'menu') {
        this.renderMenuAtmosphere(ctx);
        return;
      }

      const shakeX = this.shake > 0 ? U.rand(-this.shake, this.shake) * 0.55 : 0;
      const shakeY = this.shake > 0 ? U.rand(-this.shake, this.shake) * 0.55 : 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      for (const s of this.shockwaves) s.draw(ctx);
      for (const p of this.powerups) p.draw(ctx);
      for (const e of this.enemies) e.draw(ctx);
      if (this.boss) this.boss.draw(ctx);
      for (const b of this.bullets) b.draw(ctx);
      this.player.draw(ctx);
      for (const b of this.enemyBullets) b.draw(ctx);
      for (const p of this.particles) p.draw(ctx);
      for (const t of this.texts) t.draw(ctx);

      ctx.restore();

      if (this.boss) this.drawBossBar(ctx);
      this.drawHUD(ctx);
      this.drawBanner(ctx);
      this.drawEffects(ctx);
    }

    renderMenuAtmosphere(ctx) {
      // 菜单背后缓慢掠过的光带
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const t = this.starfield.time;
      for (let i = 0; i < 2; i++) {
        const y = 180 + i * 260 + Math.sin(t * 0.2 + i) * 30;
        const grad = ctx.createLinearGradient(0, y, W, y + 60);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
        grad.addColorStop(0.5, `rgba(34, 211, 238, ${0.03 + i * 0.012})`);
        grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, W, 60);
      }
      ctx.restore();
    }

    drawBossBar(ctx) {
      const boss = this.boss;
      if (!boss) return;
      const w = 360;
      const x = (W - w) / 2;
      const y = 102;
      const pct = U.clamp(boss.hp / boss.maxHp, 0, 1);

      ctx.save();
      ctx.textBaseline = 'alphabetic';
      ctx.font = `700 9px ${FONT_MONO}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(253, 164, 175, 0.85)';
      ctx.fillText('BOSS', x, y - 5);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(`${Math.ceil(pct * 100)}%`, x + w, y - 5);

      U.roundRect(ctx, x, y, w, 9, 4.5);
      ctx.fillStyle = 'rgba(6, 10, 20, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (pct > 0) {
        ctx.save();
        U.roundRect(ctx, x + 1, y + 1, Math.max(1, (w - 2) * pct), 7, 3.5);
        ctx.clip();
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#fb7185');
        grad.addColorStop(0.55, '#f472b6');
        grad.addColorStop(1, '#fbbf24');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, 9);
        ctx.restore();
      }

      // 刻度
      ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
      for (let i = 1; i < 8; i++) ctx.fillRect(x + (w / 8) * i, y + 1, 1, 7);

      if (boss.flash > 0.05 && !boss.dying) {
        ctx.globalAlpha = Math.min(0.8, boss.flash * 4);
        ctx.fillStyle = '#ffffff';
        U.roundRect(ctx, x, y, w, 9, 4.5);
        ctx.fill();
      }
      ctx.restore();
    }

    drawHUD(ctx) {
      ctx.save();
      ctx.textBaseline = 'alphabetic';

      const fade = ctx.createLinearGradient(0, 0, 0, 96);
      fade.addColorStop(0, 'rgba(3, 7, 18, 0.88)');
      fade.addColorStop(0.7, 'rgba(3, 7, 18, 0.38)');
      fade.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, 96);

      // 分数
      ctx.textAlign = 'left';
      ctx.font = `600 9px ${FONT_MONO}`;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
      ctx.fillText('SCORE', 18, 19);
      ctx.font = `700 24px ${FONT_MONO}`;
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(U.formatScore(this.score), 18, 45);

      // 最高分
      ctx.textAlign = 'right';
      ctx.font = `600 9px ${FONT_MONO}`;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.78)';
      ctx.fillText('HI-SCORE', W - 18, 19);
      ctx.font = `700 14px ${FONT_MONO}`;
      ctx.fillStyle = '#fde68a';
      ctx.fillText(U.formatScore(this.highScore), W - 18, 38);

      // 波次胶囊
      const waveText = this.wave > 0 ? `WAVE ${String(this.wave).padStart(2, '0')}` : 'WAVE --';
      ctx.textAlign = 'center';
      ctx.font = `700 10px ${FONT_MONO}`;
      const tw = ctx.measureText(waveText).width;
      const pillW = Math.max(92, tw + 30);
      U.roundRect(ctx, W / 2 - pillW / 2, 12, pillW, 24, 12);
      ctx.fillStyle = 'rgba(8, 17, 32, 0.72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#a5f3fc';
      ctx.fillText(waveText, W / 2, 28);

      // 第二行：生命 / 炸弹 / 火力
      const rowLabelY = 66;
      const rowIconY = 76;
      ctx.textAlign = 'left';
      ctx.font = `600 8px ${FONT_MONO}`;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.62)';
      ctx.fillText('LIFE', 18, rowLabelY);
      for (let i = 0; i < this.player.lives; i++) {
        this.drawLifeIcon(ctx, 20 + i * 15, rowIconY);
      }

      ctx.fillStyle = 'rgba(148, 163, 184, 0.62)';
      ctx.fillText('BOMB', 120, rowLabelY);
      for (let i = 0; i < this.player.bombs; i++) {
        ctx.beginPath();
        ctx.arc(124 + i * 13, rowIconY - 2, 3.2, 0, TAU);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = 'rgba(254, 243, 199, 0.7)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(148, 163, 184, 0.62)';
      ctx.fillText('PWR', 224, rowLabelY);
      for (let i = 0; i < CFG.PLAYER.maxPower; i++) {
        const on = i < this.player.power;
        U.roundRect(ctx, 224 + i * 13, rowIconY - 7, 8, 6, 2);
        ctx.fillStyle = on ? '#67e8f9' : 'rgba(103, 232, 249, 0.14)';
        ctx.fill();
        if (on) {
          ctx.strokeStyle = 'rgba(236, 254, 255, 0.55)';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      if (this.player.shield > 0) {
        ctx.textAlign = 'right';
        ctx.font = `600 9px ${FONT_MONO}`;
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(`SHIELD ${this.player.shield.toFixed(1)}s`, W - 18, rowIconY);
      } else if (this.player.invuln > 0.05 && this.state === 'playing') {
        ctx.textAlign = 'right';
        ctx.font = `600 9px ${FONT_MONO}`;
        ctx.fillStyle = 'rgba(103, 232, 249, 0.6)';
        ctx.fillText('INVULNERABLE', W - 18, rowIconY);
      }

      ctx.restore();
    }

    drawLifeIcon(ctx, x, y) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 3);
      ctx.lineTo(0, 1.5);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawBanner(ctx) {
      const b = this.banner;
      if (!b) return;
      const t = b.t / b.dur;
      const fadeIn = U.clamp(t * 5.5, 0, 1);
      const fadeOut = U.clamp((1 - t) * 4.5, 0, 1);
      const alpha = Math.min(fadeIn, fadeOut);
      const pop = 1 + (1 - U.easeOutCubic(U.clamp(t * 5, 0, 1))) * 0.12;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, 262);
      ctx.scale(pop, pop);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const font = b.danger ? `900 32px ${FONT_UI}` : `900 30px ${FONT_UI}`;
      ctx.font = font;
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.82)';
      ctx.strokeText(b.text, 0, 0);

      const grad = ctx.createLinearGradient(-150, 0, 150, 0);
      if (b.danger) {
        grad.addColorStop(0, '#fecdd3');
        grad.addColorStop(0.5, '#fb7185');
        grad.addColorStop(1, '#fda4af');
      } else {
        grad.addColorStop(0, '#f0f9ff');
        grad.addColorStop(0.5, '#67e8f9');
        grad.addColorStop(1, '#a78bfa');
      }
      ctx.fillStyle = grad;
      ctx.fillText(b.text, 0, 0);

      ctx.font = `600 9px ${FONT_MONO}`;
      ctx.fillStyle = b.danger ? 'rgba(254, 205, 211, 0.8)' : 'rgba(165, 243, 252, 0.7)';
      ctx.fillText(b.sub, 0, 28);
      ctx.restore();
    }

    drawEffects(ctx) {
      if (this.flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.62, this.flash * 0.75)})`;
        ctx.fillRect(0, 0, W, H);
      }

      if (this.hitVignette > 0.01) {
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.72);
        g.addColorStop(0, 'rgba(244, 63, 94, 0)');
        g.addColorStop(1, `rgba(244, 63, 94, ${0.5 * this.hitVignette})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      if (this.state === 'playing' && this.player.lives === 1) {
        const pulse = 0.12 + 0.08 * Math.sin(this.time * 4);
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, H * 0.74);
        g.addColorStop(0, 'rgba(244, 63, 94, 0)');
        g.addColorStop(1, `rgba(244, 63, 94, ${pulse})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }

    /* ------------------------------------------------ 调试接口 */
    debugState() {
      return {
        state: this.state,
        overlay: this.overlay,
        score: this.score,
        highScore: this.highScore,
        wave: this.wave,
        wavePhase: this.wavePhase,
        spawnQueue: this.spawnQueue.length,
        lives: this.player.lives,
        bombs: this.player.bombs,
        power: this.player.power,
        shield: Number(this.player.shield.toFixed(2)),
        invuln: Number(this.player.invuln.toFixed(2)),
        player: {
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          alive: this.player.alive
        },
        enemies: this.enemies.length,
        enemyPositions: this.enemies.slice(0, 12).map((e) => ({
          type: e.type,
          x: Math.round(e.x),
          y: Math.round(e.y)
        })),
        powerups: this.powerups.length,
        playerBullets: this.bullets.length,
        enemyBullets: this.enemyBullets.length,
        boss: this.boss
          ? {
              hp: this.boss.hp,
              maxHp: this.boss.maxHp,
              state: this.boss.state,
              x: Math.round(this.boss.x),
              y: Math.round(this.boss.y)
            }
          : null,
        fps: this.fps,
        canvas: {
          width: this.canvas.width,
          height: this.canvas.height,
          cssWidth: this.canvas.clientWidth,
          cssHeight: this.canvas.clientHeight
        }
      };
    }
  }

  SR.Game = Game;
})();
