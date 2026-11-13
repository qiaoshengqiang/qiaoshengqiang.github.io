import * as THREE from 'three';
import {
  TAU, clamp, damp, mod, smoothstep, formatTime,
  disposeGroup,
} from './utils.js';
import { TRACKS, Track, createTrackWorld } from './track.js';
import { createEnvironment } from './world.js';
import {
  LIVERIES, RIVALS, PlayerCar, RivalCar, buildCar, updateCarVisual,
} from './car.js';
import { ParticleSystem, Shockwaves } from './effects.js';

const LAPS = 3;
const TOTAL_CARS = 1 + RIVALS.length;
const BEST_PREFIX = 'mobius-gp-best-';
const CAMERA_MODES = ['chase', 'close', 'hood'];
const COUNTDOWN_STEPS = [
  { at: 0.0, label: '3', stage: 1, sound: 3 },
  { at: 1.05, label: '2', stage: 3, sound: 2 },
  { at: 2.1, label: '1', stage: 5, sound: 1 },
  { at: 3.1, label: 'GO', stage: 6, sound: 0 },
];
const DIFFICULTY_LABEL = ['休闲', '职业', '极限'];

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const _v5 = new THREE.Vector3();
const _v6 = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();
const _desiredLook = new THREE.Vector3();
const _introPos = new THREE.Vector3();
const _introLook = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);

function safeBestGet(trackId) {
  try {
    const raw = localStorage.getItem(BEST_PREFIX + trackId);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function safeBestSet(trackId, value) {
  try {
    localStorage.setItem(BEST_PREFIX + trackId, String(value));
  } catch {
    /* storage may be unavailable */
  }
}

export class Game {
  constructor({ renderer, scene, camera, composer, quality = 'high', ui, input, audio }) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = composer;
    this.quality = quality;
    this.ui = ui;
    this.input = input;
    this.audio = audio;

    this.state = 'menu';
    this.trackIndex = 0;
    this.livery = 0;
    this.difficulty = clamp(ui?.difficulty ?? 1, 0, 2);

    this.elapsed = 0;
    this.raceTime = 0;
    this.countdownTime = 0;
    this.countdownStep = -1;
    this.goTimer = -1;
    this.goLightsOff = false;
    this.introT = 0;
    this.completedLaps = 0;
    this.lapStart = 0;
    this.lapTimes = [];
    this.bestLap = 0;
    this.storedBest = 0;
    this.recordThisRace = false;
    this.finishTimer = 0;
    this.finishPlace = 0;

    this.cameraMode = 0;
    this.cameraInit = false;
    this.camLook = new THREE.Vector3();
    this.camDesired = new THREE.Vector3();
    this.camLookDesired = new THREE.Vector3();
    this.shake = 0;
    this.wallFxCooldown = 0;
    this.collisionCooldown = 0;
    this.hudTimer = 0;
    this.exhaustTimer = 0;
    this.driftFxTimer = 0;

    this.track = null;
    this.env = null;
    this.world = null;
    this.previewGroup = null;
    this.previewCars = [];
    this.previewPlayer = null;
    this.raceGroup = null;
    this.player = null;
    this.rivals = [];

    this.particles = new ParticleSystem(scene, quality === 'low' ? 520 : 960);
    this.shockwaves = new Shockwaves(scene, 8);

    this._onAction = this._onAction.bind(this);
    this.input.onAction(this._onAction);
    this._onVisibility = () => {
      if (document.hidden && (this.state === 'race' || this.state === 'countdown')) {
        this.pause();
      }
    };
    document.addEventListener('visibilitychange', this._onVisibility);

    this._buildWorld(0);
    this.ui.selectTrack(TRACKS[0], 0, this._loadBest(0));
    this.ui.setSoundMuted(this.audio.muted);
    this.audio.setMode('menu');
  }

  /* ------------------------------------------------------------------ */
  /* Setup                                                              */
  /* ------------------------------------------------------------------ */

  _loadBest(index = this.trackIndex) {
    return safeBestGet(TRACKS[index].id);
  }

  _saveBest(value) {
    safeBestSet(TRACKS[this.trackIndex].id, value);
  }

  _buildWorld(index) {
    this._disposeWorld();

    this.trackIndex = clamp(index, 0, TRACKS.length - 1);
    this.track = new Track(TRACKS[this.trackIndex]);
    this.env = createEnvironment(this.track, this.renderer, this.quality);
    this.world = createTrackWorld(this.track, this.renderer, this.quality);

    this.scene.add(this.env.group, this.world.group);
    this.scene.fog = this.env.fog;
    this.scene.environment = this.env.envTexture;
    this.scene.background = new THREE.Color(this.env.theme.skyTop);
    this.world.setStartLights(7);

    this._buildPreview();
    this.cameraInit = false;
  }

  _disposeWorld() {
    this._disposePreview();
    this._disposeRaceCars();
    if (this.world) {
      this.scene.remove(this.world.group);
      this.world.dispose();
      this.world = null;
    }
    if (this.env) {
      this.scene.remove(this.env.group);
      this.env.dispose();
      this.env = null;
    }
    this.scene.environment = null;
  }

  _buildPreview() {
    this._disposePreview();
    const group = new THREE.Group();
    group.name = 'menu-grid';
    const livery = LIVERIES[this.livery];

    this.previewPlayer = buildCar({
      main: livery.main,
      accent: livery.accent,
      number: 7,
      isPlayer: true,
    });
    group.add(this.previewPlayer);
    this.previewCars = [this.previewPlayer];

    const playerGrid = this.track.startGrid(4);
    updateCarVisual(this.previewPlayer, this.track, playerGrid.u, playerGrid.s, {}, 0, 0);

    RIVALS.forEach((rival, i) => {
      const mesh = buildCar({ main: rival.main, accent: rival.accent, number: rival.number });
      const grid = this.track.startGrid(i);
      updateCarVisual(mesh, this.track, grid.u, grid.s, {}, 0, 0);
      group.add(mesh);
      this.previewCars.push(mesh);
    });

    this.previewGroup = group;
    this.scene.add(group);
  }

  _disposePreview() {
    if (this.previewGroup) {
      this.scene.remove(this.previewGroup);
      disposeGroup(this.previewGroup);
    }
    this.previewGroup = null;
    this.previewCars = [];
    this.previewPlayer = null;
  }

  _buildRaceCars() {
    this._disposeRaceCars();
    const group = new THREE.Group();
    group.name = 'race-cars';
    const livery = LIVERIES[this.livery];

    this.player = new PlayerCar(this.track, livery, this.track.startGrid(4));
    group.add(this.player.mesh);

    // A soft pool of light follows the player. On the flipped side of the
    // Möbius strip the fixed world lights graze the road, so this keeps the
    // tarmac and the car readable from either face.
    this.playerFill = new THREE.PointLight(this.world?.theme.light || '#dffaff', 90, 55, 1.6);
    this.playerFill.position.set(0, 7.4, 1.2);
    this.player.mesh.add(this.playerFill);

    this.rivals = RIVALS.map((config, i) => {
      const rival = new RivalCar(this.track, config, this.track.startGrid(i), 1);
      group.add(rival.mesh);
      return rival;
    });

    this.raceGroup = group;
    this.scene.add(group);
  }

  _disposeRaceCars() {
    if (this.raceGroup) {
      this.scene.remove(this.raceGroup);
      disposeGroup(this.raceGroup);
    }
    this.raceGroup = null;
    this.player = null;
    this.rivals = [];
  }

  /* ------------------------------------------------------------------ */
  /* Menu actions                                                       */
  /* ------------------------------------------------------------------ */

  selectTrack(index) {
    if (this.state !== 'menu') return;
    if (!TRACKS[index] || index === this.trackIndex) return;

    this._buildWorld(index);
    this.ui.selectTrack(TRACKS[index], index, this._loadBest(index));
    this.ui.setSoundMuted(this.audio.muted);
    this.audio.ui();
  }

  _onTrackVisualChange(index) {
    if (this.state !== 'menu') return;
    if (index === this.trackIndex && this.world) return;
    this.selectTrack(index);
  }

  setLivery(index) {
    if (!LIVERIES[index]) return;
    this.livery = index;
    if (!this.previewPlayer) return;

    const livery = LIVERIES[index];
    const ud = this.previewPlayer.userData;
    ud.paint.color.set(livery.main);
    if (ud.paintDark) ud.paintDark.color.copy(new THREE.Color(livery.main).multiplyScalar(0.32));
    ud.accentMat.color.set(livery.accent).multiplyScalar(1.45);
    if (ud.rimMat) ud.rimMat.color.copy(new THREE.Color(livery.accent).multiplyScalar(0.7));
    ud.underglow.material.color.set(livery.accent);

    this.audio.ui();
  }

  onDifficultyChange() {
    this.difficulty = clamp(this.ui.difficulty, 0, 2);
    this.audio.ui();
  }

  toggleSound() {
    this.audio.init();
    const muted = this.audio.toggleMute();
    this.ui.setSoundMuted(muted);
    if (!muted) this.audio.ui();
  }

  /* ------------------------------------------------------------------ */
  /* Race lifecycle                                                     */
  /* ------------------------------------------------------------------ */

  startRace() {
    if (this.state === 'results') {
      this.restartRace();
      return;
    }
    if (this.state !== 'menu') return;

    this.audio.init();
    this.ui.flash();
    this._disposePreview();
    this._buildRaceCars();

    this.ui.enterRace(TRACKS[this.trackIndex].name);
    this.ui.setSoundMuted(this.audio.muted);
    this._resetRace();
    this._beginCountdown();
    this.audio.setMode('race');
  }

  restartRace() {
    if (!['paused', 'results', 'finishing', 'race', 'countdown'].includes(this.state)) {
      this.startRace();
      return;
    }

    this.audio.init();
    this.ui.flash();
    if (!this.raceGroup || !this.player) {
      this._disposePreview();
      this._buildRaceCars();
    }

    this.ui.enterRace(TRACKS[this.trackIndex].name);
    this.ui.setSoundMuted(this.audio.muted);
    this._resetRace();
    this._beginCountdown();
    this.audio.setMode('race');
  }

  returnToMenu() {
    if (this.state === 'menu') return;
    this.ui.flash();
    this.state = 'menu';
    this._disposeRaceCars();
    this._buildPreview();
    this.world?.setStartLights(7);
    this.ui.showMenu();
    this.ui.selectTrack(TRACKS[this.trackIndex], this.trackIndex, this._loadBest());
    this.ui.setSoundMuted(this.audio.muted);
    this.audio.setMode('menu');
    this.audio.stopDriving();
    this.cameraInit = false;
    this.shake = 0;
  }

  _resetRace() {
    this.raceTime = 0;
    this.countdownTime = 0;
    this.countdownStep = -1;
    this.goTimer = -1;
    this.goLightsOff = false;
    this.introT = 0;
    this.completedLaps = 0;
    this.lapStart = 0;
    this.lapTimes = [];
    this.bestLap = 0;
    this.storedBest = this._loadBest();
    this.recordThisRace = false;
    this.finishTimer = 0;
    this.finishPlace = 0;
    this.cameraMode = 0;
    this.cameraInit = false;
    this.hudTimer = 0;
    this.exhaustTimer = 0;
    this.driftFxTimer = 0;
    this.shake = 0;
    this.wallFxCooldown = 0;
    this.collisionCooldown = 0;

    this.player.finished = false;
    this.player.finishTime = 0;
    this.player.lap = 1;
    this.player.reset(this.track.startGrid(4));
    this.rivals.forEach((rival, i) => {
      rival.reset(this.track.startGrid(i));
      rival.finished = false;
      rival.finishTime = 0;
      rival.lap = 1;
    });

    this.world.pads.pads.forEach((pad) => { pad.cooldown = 0; });
    this.world.setStartLights(0);
    this.ui.hideCountdown();
    this._updateHud(0, true);
  }

  _beginCountdown() {
    this.state = 'countdown';
    this.countdownTime = 0;
    this.countdownStep = -1;
    this.goTimer = -1;
    this.goLightsOff = false;
    this.ui.hideCountdown();
    this._applyCountdownStep(0);
  }

  _applyCountdownStep(step) {
    const def = COUNTDOWN_STEPS[step];
    if (!def) return;
    this.countdownStep = step;
    this.ui.showCountdown(def.label);
    this.world.setStartLights(def.stage);
    this.audio.countdown(def.sound);

    if (def.label === 'GO') {
      this.state = 'race';
      this.raceTime = 0;
      this.goTimer = 0.9;
      this.goLightsOff = false;
      this.introT = 1;
      this.player.usingNitro = false;
    }
  }

  pause() {
    if (this.state !== 'race' && this.state !== 'countdown') return;
    this.pausedFrom = this.state;
    this.state = 'paused';
    this.ui.showPause(true, {
      lap: this._lapNumber(),
      pos: this._playerPlace(),
      total: TOTAL_CARS,
      time: this.raceTime,
    });
    this.audio.pauseTone();
    this.audio.setMode('paused');
    this.audio.stopDriving();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = this.pausedFrom || 'race';
    this.ui.showPause(false);
    this.audio.setMode('race');
    this.audio.ui();
  }

  cycleCamera() {
    if (!['race', 'countdown', 'finishing'].includes(this.state)) return;
    this.cameraMode = (this.cameraMode + 1) % CAMERA_MODES.length;
    this.ui.cameraToast(CAMERA_MODES[this.cameraMode]);
    this.audio.ui();
  }

  resetPlayer() {
    if (this.state !== 'race' || !this.player) return;
    const safeS = this.track.safeS(this.player.u, this.player.s);
    this.player.s = safeS;
    this.player.lateralVel = 0;
    this.player.latAccel = 0;
    this.player.steerInput = 0;
    this.player.speed = Math.min(this.player.speed, 4);
    this.player.padKick = 0;
    this.player.wallCooldown = 0.8;
    updateCarVisual(this.player.mesh, this.track, this.player.u, safeS, {}, 0, this.elapsed);
    const sm = this.track.sample(this.player.u, safeS);
    this.particles.spawnBurst(sm.position, {
      count: 22, color: this.player.livery.accent, color2: '#ffffff',
      speed: 4.5, life: 0.55, size: 0.38, direction: sm.up, cone: 1.4, drag: 2.5,
    });
    this.shockwaves.trigger(sm.position, sm.up, this.player.livery.accent, 4.2, 0.5);
    this.ui.toast('赛车已复位', 'RESET ON TRACK');
    this.audio.ui();
  }

  _onAction(code) {
    if (code === 'Escape') {
      if (this.ui.helpOpen) {
        this.ui.showHelp(false);
        this.audio.ui();
        return;
      }
      if (this.state === 'paused') {
        this.resume();
      } else if (this.state === 'race' || this.state === 'countdown') {
        this.pause();
      }
    } else if (code === 'KeyC') {
      this.cycleCamera();
    } else if (code === 'KeyR') {
      this.resetPlayer();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Simulation                                                         */
  /* ------------------------------------------------------------------ */

  update(rawDt) {
    const dt = Math.min(Math.max(rawDt, 0), 0.05);
    this.elapsed += dt;
    if (this.env) this.env.update(dt);

    if (this.state !== 'paused' && this.world) this.world.update(this.elapsed, dt);
    if (this.state !== 'paused') {
      this.particles.update(dt);
      this.shockwaves.update(dt);
    }

    switch (this.state) {
      case 'countdown':
        this._updateCountdown(dt);
        break;
      case 'race':
        this._updateRace(dt);
        break;
      case 'finishing':
        this._updateFinishing(dt);
        break;
      case 'menu':
        this._updateMenu(dt);
        break;
      default:
        break;
    }

    this.wallFxCooldown = Math.max(0, this.wallFxCooldown - dt);
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);
    this._updateCamera(dt);
    this.shake = Math.max(0, this.shake - dt * 2.4);
  }

  _updateMenu() {
    if (!this.previewCars.length) return;
    this.previewCars.forEach((car, i) => {
      const ud = car.userData;
      ud.underglow.material.opacity = 0.24 + Math.sin(this.elapsed * 2 + i * 1.4) * 0.06;
      ud.body.position.y = Math.sin(this.elapsed * 1.5 + i * 0.8) * 0.008;
    });
  }

  _updateCountdown(dt) {
    this.countdownTime += dt;
    while (
      this.countdownStep + 1 < COUNTDOWN_STEPS.length
      && this.countdownTime >= COUNTDOWN_STEPS[this.countdownStep + 1].at
    ) {
      this._applyCountdownStep(this.countdownStep + 1);
      if (this.state === 'race') break;
    }

    const idle = { throttle: 0, brake: 0, steer: 0, nitro: false, drift: false };
    this.player.update(dt, idle, false, this.elapsed);
    this.rivals.forEach((rival) => {
      rival.update(dt, 0, this.player, this.difficulty, false, this.elapsed);
    });

    this.introT = clamp(this.countdownTime / COUNTDOWN_STEPS[COUNTDOWN_STEPS.length - 1].at, 0, 1);
    this._updateHud(dt);
  }

  _updateRace(dt) {
    this.raceTime += dt;

    if (this.goTimer >= 0) {
      this.goTimer -= dt;
      if (!this.goLightsOff && this.goTimer <= 0.28) {
        this.goLightsOff = true;
        this.world.setStartLights(7);
      }
      if (this.goTimer <= 0) {
        this.goTimer = -1;
        this.ui.hideCountdown();
      }
    }

    const inputState = this.input.getState();
    const result = this.player.update(dt, inputState, true, this.elapsed);

    this.rivals.forEach((rival) => {
      rival.update(dt, this.raceTime, this.player, this.difficulty, true, this.elapsed);
    });

    this._checkPads();
    this._checkCarCollisions();
    this._updateLaps();
    this._driveEffects(dt, inputState, result);
    this._updateHud(dt);
    this._updateAudio(inputState, true);

    // The rest of the frame still runs after the player crosses the line.
    if (result.wallImpact > 1.4 && this.wallFxCooldown <= 0) {
      this._wallImpact(result.wallImpact);
    }
  }

  _updateFinishing(dt) {
    this.finishTimer += dt;
    this.raceTime += dt;

    const idle = { throttle: 0, brake: 0, steer: 0, nitro: false, drift: false };
    this.player.update(dt, idle, false, this.elapsed);
    this.rivals.forEach((rival) => {
      rival.update(dt, this.raceTime, this.player, this.difficulty, true, this.elapsed);
    });

    this._updateHud(dt);
    this._updateAudio(idle, false);

    if (this.finishTimer >= 2.15) {
      this._showResults();
    }
  }

  _updateLaps() {
    const crossed = Math.floor(Math.max(0, this.player.u) / TAU);
    while (this.completedLaps < crossed && this.completedLaps < LAPS) {
      this.completedLaps += 1;
      const lapTime = this.raceTime - this.lapStart;
      this.lapStart = this.raceTime;

      if (lapTime > 2) {
        this.lapTimes.push(lapTime);
        const previousBest = this.bestLap;
        if (!previousBest || lapTime < previousBest) {
          this.bestLap = lapTime;
          if (!this.storedBest || lapTime < this.storedBest) this.recordThisRace = true;
          this._saveBest(lapTime);
        }
        const improved = !previousBest || lapTime < previousBest;
        this.audio.lap(this.completedLaps === LAPS - 1);
        if (this.completedLaps < LAPS) {
          const nextLap = this.completedLaps + 1;
          this.ui.toast(
            formatTime(lapTime),
            `${improved ? 'NEW BEST LAP' : 'LAP CLEARED'} · ${nextLap === LAPS ? 'FINAL LAP' : `LAP ${nextLap} / ${LAPS}`}`,
            improved ? 'gold' : '',
          );
          if (nextLap === LAPS) {
            setTimeout(() => {
              if (this.state === 'race') this.ui.toast('FINAL LAP', 'ONE MORE FLIP. SEND IT.', 'gold');
            }, 1400);
          }
        }
      }

      if (this.completedLaps >= LAPS) {
        this._finishPlayer();
        return;
      }
    }
  }

  _finishPlayer() {
    this.player.finished = true;
    this.player.finishTime = this.raceTime;
    this.player.lap = LAPS;
    this.state = 'finishing';
    this.finishTimer = 0;
    this.ui.hideCountdown();
    this.world.setStartLights(7);

    const place = this._playerPlace();
    this.finishPlace = place;
    this.ui.toast(
      place === 1 ? 'VICTORY' : 'RACE COMPLETE',
      `P${place} · ${formatTime(this.raceTime)}`,
      place === 1 ? 'gold' : '',
    );
    this.audio.finish(place === 1);
    this._finishEffects();
    this.addShake(place === 1 ? 0.55 : 0.25);
  }

  _showResults() {
    const standings = this._standings();
    const place = Math.max(1, standings.findIndex((row) => row.isPlayer) + 1);
    const total = this.player.finishTime || this.raceTime;
    const bestLap = this.bestLap || total;

    // Rivals that have not crossed the line yet get a projected finish time so
    // the results table reads like a complete classification instead of a
    // frozen "LAP 3 / 3" snapshot. Order is preserved from current track
    // progress by enforcing a small monotonic gap.
    const metric = this.track.getLapLength() / TAU;
    let previousTime = 0;
    const classified = standings.map((row) => {
      let resultTime = row.finishTime;
      if (!row.finished) {
        const remaining = Math.max(0, TAU * LAPS - row.u) * metric;
        resultTime = this.raceTime + remaining / Math.max(18, row.speed || 32) + 0.35;
      }
      if (row.isPlayer) resultTime = total;
      if (resultTime <= previousTime) resultTime = previousTime + 0.4;
      previousTime = resultTime;
      return {
        name: row.name,
        color: row.color,
        isPlayer: row.isPlayer,
        result: formatTime(resultTime),
      };
    });

    this.ui.showResults({
      place,
      total,
      bestLap,
      trackName: TRACKS[this.trackIndex].name,
      record: this.recordThisRace ? 'YES · NEW BEST' : '—',
      standings: classified,
    });

    this.state = 'results';
    this.audio.setMode('menu');
  }

  _checkPads() {
    if (!this.world || !this.player) return;
    const localU = mod(this.player.u, TAU);
    this.world.pads.pads.forEach((pad) => {
      if (pad.cooldown > 0) return;
      const diff = Math.abs(mod(localU - pad.u + Math.PI, TAU) - Math.PI);
      if (diff > pad.halfU + 0.025) return;
      if (Math.abs(this.player.s - pad.s) > pad.halfS + 0.55) return;

      pad.cooldown = 1.6;
      this.player.applyPadBoost();
      this.audio.boost();
      this.addShake(0.2);

      const sm = this.track.sample(pad.u, pad.s);
      const color = this.env.theme.accent;
      this.particles.spawnBurst(sm.position, {
        count: 30, color, color2: '#ffffff', speed: 10, spread: 1,
        life: 0.55, size: 0.65, direction: sm.up, cone: 1.25, drag: 1.9,
      });
      this.shockwaves.trigger(sm.position, sm.up, color, 5.5, 0.55);
    });
  }

  _checkCarCollisions() {
    if (!this.player || this.collisionCooldown > 0) return;
    const player = this.player;
    for (const rival of this.rivals) {
      if (Math.abs(rival.u - player.u) > 0.12) continue;
      if (this.track.islandHalfAt(player.u) > 0.4
        && Math.sign(player.s) !== Math.sign(rival.s)) continue;
      const dist = player.mesh.position.distanceTo(rival.mesh.position);
      if (dist > 2.55) continue;

      const dir = player.s >= rival.s ? 1 : -1;
      const limit = this.track.limitAt(player.u);
      player.s = clamp(player.s + dir * 0.55, -limit, limit);
      player.lateralVel += dir * 2.2;
      player.bump(0.55);
      rival.s = clamp(rival.s - dir * 0.25, -limit, limit);
      rival.targetS = clamp(rival.targetS - dir * 0.25, -limit, limit);
      this.collisionCooldown = 0.65;
      this.addShake(0.55);
      this.ui.hitFlash();
      this.audio.collision(0.65);

      _v1.copy(player.mesh.position).lerp(rival.mesh.position, 0.5);
      _v1.y += 0.55;
      this.particles.spawnBurst(_v1, {
        count: 18, color: '#ffd166', color2: this.env.theme.accent2,
        speed: 8, spread: 1, life: 0.5, size: 0.45, drag: 2,
      });
      break;
    }
  }

  _driveEffects(dt, inputState, result) {
    const player = this.player;
    if (!player) return;
    const carPos = player.mesh.position;
    const forward = _v1.set(0, 0, 1).applyQuaternion(player.mesh.quaternion);
    const up = _v2.set(0, 1, 0).applyQuaternion(player.mesh.quaternion);
    const lateral = _v3.set(1, 0, 0).applyQuaternion(player.mesh.quaternion);
    const accent = player.livery.accent;

    if (player.speed > 4) {
      this.exhaustTimer += dt;
      const interval = player.usingNitro ? 0.022 : 0.052;
      while (this.exhaustTimer >= interval) {
        this.exhaustTimer -= interval;
        const side = Math.random() > 0.5 ? 0.34 : -0.34;
        _v4.copy(carPos)
          .addScaledVector(up, 0.4)
          .addScaledVector(forward, -1.92)
          .addScaledVector(lateral, side);
        this.particles.spawnBurst(_v4, {
          count: player.usingNitro ? 3 : 1,
          color: player.usingNitro ? accent : accent,
          color2: player.usingNitro ? '#ffffff' : this.env.theme.accent,
          speed: player.usingNitro ? 8 : 3.4,
          spread: 0.38,
          life: player.usingNitro ? 0.32 : 0.38,
          size: player.usingNitro ? 0.5 : 0.28,
          direction: _v5.copy(forward).multiplyScalar(-1),
          cone: 0.5,
          drag: 2.4,
        });
      }
    }

    if (player.drifting && Math.abs(player.speed) > 12) {
      this.driftFxTimer += dt;
      while (this.driftFxTimer >= 0.035) {
        this.driftFxTimer -= 0.035;
        const side = Math.random() > 0.5 ? 0.88 : -0.88;
        _v4.copy(carPos)
          .addScaledVector(up, 0.18)
          .addScaledVector(forward, -1.2)
          .addScaledVector(lateral, side);
        this.particles.spawnBurst(_v4, {
          count: 2, color: '#fff2a8', color2: accent,
          speed: 5.5, spread: 0.8, life: 0.38, size: 0.32,
          direction: _v5.copy(up).multiplyScalar(-0.25).addScaledVector(
            lateral, side > 0 ? -0.7 : 0.7,
          ),
          cone: 0.9, drag: 2.8,
        });
      }
    }

    if (result && result.wallImpact > 1.4 && this.wallFxCooldown <= 0) {
      // wall effects are dispatched by _updateRace
    }

    if (inputState?.nitro && player.usingNitro) {
      this.addShake(0.012);
    }

    this.ui.setSpeedFx(clamp(Math.abs(player.speed) / 68, 0, 1.25), player.usingNitro);
  }

  _wallImpact(impact) {
    this.wallFxCooldown = 0.38;
    const player = this.player;
    const up = _v2.set(0, 1, 0).applyQuaternion(player.mesh.quaternion);
    const lateral = _v3.set(1, 0, 0).applyQuaternion(player.mesh.quaternion);
    const side = Math.sign(player.s) || 1;
    _v4.copy(player.mesh.position)
      .addScaledVector(up, 0.25)
      .addScaledVector(lateral, side * 1.05);
    const intensity = clamp(impact / 16, 0.25, 1);
    this.particles.spawnBurst(_v4, {
      count: Math.round(8 + intensity * 12), color: '#ffd166', color2: '#ff6b4a',
      speed: 4 + intensity * 7, spread: 0.9, life: 0.5, size: 0.4,
      direction: lateral.clone().multiplyScalar(side), cone: 0.9, drag: 2.3,
    });
    this.shockwaves.trigger(
      _v4, up, '#ffd166', 2.6 + intensity * 2.2, 0.35,
    );
    this.addShake(0.18 + intensity * 0.35);
    this.audio.collision(intensity * 0.7);
    this.audio.scrape(intensity);
    if (impact > 5) this.ui.hitFlash();
  }

  _finishEffects() {
    const player = this.player;
    if (!player) return;
    const up = _v2.set(0, 1, 0).applyQuaternion(player.mesh.quaternion);
    const pos = _v1.copy(player.mesh.position).addScaledVector(up, 1.2);
    const colors = [player.livery.accent, player.livery.main, '#ffd166', '#ffffff'];
    colors.forEach((color, i) => {
      this.particles.spawnBurst(pos, {
        count: 28, color, color2: colors[(i + 1) % colors.length],
        speed: 10 + i * 2, spread: 1.2, life: 0.9, lifeSpread: 0.6,
        size: 0.7, direction: up, cone: 1.9, drag: 1.2,
      });
    });
    this.shockwaves.trigger(pos, up, player.livery.accent, 12, 0.8);
  }

  _updateAudio(inputState, active) {
    if (!this.player) return;
    const speedRatio = clamp(Math.abs(this.player.speed) / 70, 0, 1.3);
    this.audio.update(
      speedRatio,
      inputState?.throttle || 0,
      active,
      this.player.usingNitro,
      this.player.drifting,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Standings / HUD                                                    */
  /* ------------------------------------------------------------------ */

  _lapNumber() {
    if (!this.player) return 1;
    return Math.min(LAPS, Math.floor(Math.max(0, this.player.u) / TAU) + 1);
  }

  _standings() {
    if (!this.player) return [];
    const livery = this.player.livery;
    const rows = [{
      name: 'YOU',
      color: livery.main,
      isPlayer: true,
      u: this.player.u,
      s: this.player.s,
      speed: this.player.speed,
      finished: this.player.finished,
      finishTime: this.player.finishTime,
      lap: this.player.finished ? LAPS : this._lapNumber(),
    }];

    this.rivals.forEach((rival) => {
      rows.push({
        name: rival.config.name,
        color: rival.config.main,
        isPlayer: false,
        u: rival.u,
        s: rival.s,
        speed: rival.speed,
        finished: rival.finished,
        finishTime: rival.finishTime,
        lap: rival.finished ? LAPS : Math.min(LAPS, Math.floor(Math.max(0, rival.u) / TAU) + 1),
      });
    });

    rows.sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.u - a.u;
    });
    return rows;
  }

  _playerPlace() {
    const standings = this._standings();
    return Math.max(1, standings.findIndex((row) => row.isPlayer) + 1);
  }

  _updateHud(dt, force = false) {
    this.hudTimer += dt;
    if (!force && this.hudTimer < 0.055) return;
    this.hudTimer = 0;
    if (!this.player || !this.ui) return;

    const standings = this._standings();
    const playerIndex = Math.max(0, standings.findIndex((row) => row.isPlayer));
    const place = playerIndex + 1;
    const leader = standings[0];

    let gap = 'LEADER';
    if (playerIndex > 0) {
      const ahead = standings[playerIndex - 1];
      if (ahead.finished) {
        gap = 'FINISHED';
      } else {
        const metric = this.track.getLapLength() / TAU;
        const seconds = Math.max(0, ahead.u - this.player.u) * metric
          / Math.max(24, Math.abs(this.player.speed || 1));
        gap = seconds > 99 ? '+99.9' : `+${seconds.toFixed(3)}`;
      }
    }

    const entries = standings.map((row, i) => {
      let rowGap = '';
      if (i > 0) {
        if (row.finished) {
          rowGap = 'FIN';
        } else {
          const metric = this.track.getLapLength() / TAU;
          const seconds = Math.max(0, leader.u - row.u) * metric / 46;
          rowGap = seconds > 99 ? '+99.9' : `+${seconds.toFixed(1)}`;
        }
      }
      return {
        name: row.name,
        color: row.color,
        isPlayer: row.isPlayer,
        gap: i === 0 ? 'LEADER' : rowGap,
      };
    });

    const mapEntries = standings.map((row) => ({
      angle: mod(row.u, TAU),
      color: row.color,
      isPlayer: row.isPlayer,
      opacity: row.finished ? 0.4 : 1,
    }));

    const fork = this.track.branchInfoAt(this.player.u, 0.55);
    let branchState = null;
    if (fork) {
      const active = fork.weight > 0.02;
      const side = this.player.s >= 0 ? 1 : -1;
      const sideName = side > 0 ? fork.left : fork.right;
      const onPad = fork.padSide === side;
      const distance = Math.max(0, fork.delta) * (this.track.getLapLength() / TAU);
      branchState = {
        active,
        side: side > 0 ? 'L' : 'R',
        name: active ? sideName : '前方分叉',
        detail: active
          ? `${onPad ? '加速带线' : '弯心线'} · ${side > 0 ? '左' : '右'}侧`
          : `${Math.round(distance)} M · ${fork.left} / ${fork.right}`,
        boost: onPad,
      };
    }
    this.ui.setBranch(branchState);

    this.ui.updateHUD({
      speed: this.player.speed,
      boost: this.player.usingNitro,
      drifting: this.player.drifting,
      active: this.state === 'race',
      nitro: this.player.nitro,
      lap: this.player.finished ? LAPS : this._lapNumber(),
      time: this.raceTime,
      bestLap: this.bestLap,
      pos: place,
      total: TOTAL_CARS,
      gap: place === 1 ? 'LEADER' : gap,
      entries,
      mapEntries,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Camera                                                             */
  /* ------------------------------------------------------------------ */

  _updateCamera(dt) {
    if (this.state === 'paused') return;
    const cam = this.camera;

    if (this.state === 'menu') {
      this._menuCamera(dt);
      this._applyShake();
      return;
    }

    if (!this.player) return;

    if (this.state === 'finishing' || this.state === 'results') {
      this._orbitCamera(dt);
    } else {
      this._driveCamera(dt);
    }
    this._applyShake();
  }

  _menuCamera(dt) {
    const t = this.elapsed;
    const driftU = -0.34 + Math.sin(t * 0.055) * 0.02;
    const sm = this.track.sample(driftU, -this.track.halfWidth * 1.18);
    sm.position.addScaledVector(sm.up, 7.9 + Math.sin(t * 0.09) * 0.4);
    sm.position.addScaledVector(sm.lateral, Math.sin(t * 0.11) * 1.4);

    const lookSm = this.track.sample(-0.01, -this.track.halfWidth * 0.04);
    const look = lookSm.position.addScaledVector(lookSm.up, 2.15);

    if (!this.cameraInit) {
      this.camera.position.copy(sm.position);
      this.camLook.copy(look);
      this.camera.up.set(0, 1, 0);
      this.cameraInit = true;
    } else {
      const k = 1 - Math.exp(-2.8 * dt);
      this.camera.position.lerp(sm.position, k);
      this.camLook.lerp(look, 1 - Math.exp(-4.5 * dt));
      this.camera.up.lerp(_worldUp, 1 - Math.exp(-3.5 * dt)).normalize();
    }
    this.camera.lookAt(this.camLook);
    this._setFov(54, dt);
  }

  _driveCamera(dt) {
    const mode = CAMERA_MODES[this.cameraMode];
    const player = this.player;
    const carPos = player.mesh.position;
    const forward = _v1.set(0, 0, 1).applyQuaternion(player.mesh.quaternion);
    const up = _v2.set(0, 1, 0).applyQuaternion(player.mesh.quaternion);
    const lateral = _v3.set(1, 0, 0).applyQuaternion(player.mesh.quaternion);
    const speedRatio = clamp(Math.abs(player.speed) / 65, 0, 1.3);

    let dist = 9.1;
    let height = 3.45;
    let ahead = 4.2;
    let lookUp = 1.3;
    let baseFov = 61;

    if (mode === 'close') {
      dist = 6.35;
      height = 2.25;
      ahead = 3.4;
      lookUp = 1.05;
      baseFov = 67;
    } else if (mode === 'hood') {
      dist = 0;
      height = 1.5;
      ahead = 18;
      lookUp = 1.15;
      baseFov = 73;
    }

    if (mode === 'hood') {
      _desiredPos.copy(carPos)
        .addScaledVector(up, height)
        .addScaledVector(forward, 0.28);
      _desiredLook.copy(carPos)
        .addScaledVector(forward, ahead)
        .addScaledVector(up, lookUp);
    } else {
      _desiredPos.copy(carPos)
        .addScaledVector(forward, -dist)
        .addScaledVector(up, height)
        .addScaledVector(lateral, clamp(player.lateralVel * 0.022, -0.4, 0.4));
      _desiredLook.copy(carPos)
        .addScaledVector(forward, ahead)
        .addScaledVector(up, lookUp);
    }

    if (this.state === 'countdown' && this.introT < 1) {
      const t = this.countdownTime;
      _introPos.copy(carPos)
        .addScaledVector(forward, -14.5 + t * 0.42)
        .addScaledVector(lateral, 4.6 - t * 0.26)
        .addScaledVector(up, 6.9 + Math.sin(t * 1.6) * 0.12);
      _introLook.copy(carPos)
        .addScaledVector(forward, 9.5)
        .addScaledVector(up, 1.5);
      const k = smoothstep(0.08, 0.94, this.introT);
      _desiredPos.lerpVectors(_introPos, _desiredPos, k);
      _desiredLook.lerpVectors(_introLook, _desiredLook, k);
      baseFov = 56 + k * 6;
    }

    if (!this.cameraInit) {
      this.camera.position.copy(_desiredPos);
      this.camLook.copy(_desiredLook);
      this.cameraInit = true;
    } else {
      const posK = 1 - Math.exp(-(mode === 'hood' ? 22 : 9.5) * dt);
      const lookK = 1 - Math.exp(-(mode === 'hood' ? 26 : 13) * dt);
      this.camera.position.lerp(_desiredPos, posK);
      this.camLook.lerp(_desiredLook, lookK);
    }

    this.camera.up.copy(up);
    this.camera.lookAt(this.camLook);
    const targetFov = baseFov + speedRatio * 9 + (player.usingNitro ? 5 : 0);
    this._setFov(targetFov, dt);
  }

  _orbitCamera(dt) {
    if (!this.player) return;
    const carPos = this.player.mesh.position;
    const up = _v2.set(0, 1, 0).applyQuaternion(this.player.mesh.quaternion);
    const forward = _v1.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
    const lateral = _v3.set(1, 0, 0).applyQuaternion(this.player.mesh.quaternion);
    const angle = this.elapsed * 0.42;

    _desiredPos.copy(carPos)
      .addScaledVector(forward, Math.cos(angle) * 9.5)
      .addScaledVector(lateral, Math.sin(angle) * 9.5)
      .addScaledVector(up, 3.7);
    _desiredLook.copy(carPos).addScaledVector(up, 1.15);

    if (!this.cameraInit) {
      this.camera.position.copy(_desiredPos);
      this.camLook.copy(_desiredLook);
      this.cameraInit = true;
    } else {
      this.camera.position.lerp(_desiredPos, 1 - Math.exp(-3.3 * dt));
      this.camLook.lerp(_desiredLook, 1 - Math.exp(-5.5 * dt));
    }
    this.camera.up.copy(up);
    this.camera.lookAt(this.camLook);
    this._setFov(58, dt);
  }

  _setFov(target, dt) {
    const fov = this.cameraInit ? damp(this.camera.fov, target, 4.5, dt) : target;
    if (Math.abs(fov - this.camera.fov) > 0.001) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  _applyShake() {
    if (this.shake <= 0) return;
    const amp = this.shake * 0.42;
    this.camera.position.x += (Math.random() * 2 - 1) * amp;
    this.camera.position.y += (Math.random() * 2 - 1) * amp * 0.8;
    this.camera.position.z += (Math.random() * 2 - 1) * amp;
    this.camera.rotation.z += (Math.random() * 2 - 1) * this.shake * 0.0025;
  }

  addShake(value) {
    this.shake = Math.min(1.7, this.shake + value);
  }

  /* ------------------------------------------------------------------ */
  /* Misc                                                               */
  /* ------------------------------------------------------------------ */

  get difficultyName() {
    return DIFFICULTY_LABEL[this.difficulty] || '';
  }

  dispose() {
    this.input.actions?.delete(this._onAction);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._disposeWorld();
    this.particles.dispose();
    this.shockwaves.dispose();
  }
}
