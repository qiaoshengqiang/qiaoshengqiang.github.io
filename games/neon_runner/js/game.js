/* ============================================================
   NEON RUNNER // game: race director, camera, HUD, controls
   ============================================================ */
(function (NR) {
  'use strict';

  const TAU = Math.PI * 2;
  const LAPS = 3;
  const $ = id => document.getElementById(id);

  NR.LOW_POWER = (function () {
    const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const cores = navigator.hardwareConcurrency || 8;
    return touch && (cores <= 4 || window.innerWidth < 820);
  })();

  const game = {
    mode: 'menu',
    quality: NR.safeLocalStorage.get('nr.quality', 'high') || 'high',
    camMode: 0,
    menuAngle: .65,
    countdownStage: -1,
    lightGen: 0,
    rank: 5,
    rankTimer: 0,
    fps: 60,
    fpsFrames: 0,
    fpsTime: 0,
    drawTick: 0,
    lastHud: {}
  };

  const race = {
    time: 0,
    lapStart: 0,
    lapsDone: 0,
    timing: false,
    lapTimes: [],
    lastLap: null,
    bestLap: null,
    topSpeed: 0,
    countdown: 0,
    finished: false,
    visited: new Set(),
    lastSector: null,
    wrongTimer: 0,
    wrongway: false
  };

  const player = {
    progress: -56.7,
    s: 0,
    prevS: 0,
    lat: -3.1,
    yaw: 0,
    vel: new THREE.Vector3(),
    speed: 0,
    steer: 0,
    nitro: 100,
    boosting: false,
    drifting: false,
    driftScore: 0,
    driftTimer: 0,
    hint: 0,
    q: null,
    wallCd: 0,
    scrapeCd: 0,
    hitCd: 0,
    ghost: 0,
    finished: false,
    finishTime: 0
  };

  const input = {
    gas: false, brake: false, left: false, right: false,
    drift: false, nitro: false
  };

  const rivals = [];
  const obstacles = [];

  let renderer, scene, camera, composer, bloomPass, fxaaPass, gammaPass;
  let track, env, fx, audio, playerCar;
  let elapsed = 0, lastNow = 0;
  let ui = null;

  const tmpV = new THREE.Vector3();
  const tmpV2 = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const target = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */
  function init() {
    try {
      ui = collectUI();
      setupRenderer();
      NR.envCube = NR.makeCubeEnv();

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, .08, 1400);
      camera.position.set(0, 8, 20);
      scene.add(camera);

      track = NR.makeTrack();
      track.build(scene);
      env = NR.buildEnvironment(scene, track);
      fx = NR.buildEffects(scene, camera, track);
      audio = new NR.AudioEngine();

      createCars();
      createObstacles();
      setupComposer();
      bindUI();
      bindInput();
      resetToGrid();
      updateMenuBest();
      applyQuality(game.quality, true);

      window.addEventListener('resize', onResize);
      if (document.fonts && document.fonts.ready) document.fonts.ready.catch(() => {});

      const loading = $('loading');
      setTimeout(() => {
        loading.classList.add('done');
        setTimeout(() => loading.classList.add('hidden'), 750);
      }, 260);

      lastNow = performance.now();
      requestAnimationFrame(loop);
    } catch (err) {
      fatal(err);
    }
  }

  function collectUI() {
    const ids = [
      'hud', 'menu', 'countdown-layer', 'pause', 'results', 'loading', 'fatal', 'touch-controls',
      'hud-lap', 'hud-pos', 'hud-time', 'hud-last', 'hud-best', 'sector-chip', 'sector-index',
      'sector-name', 'sector-cn', 'map-sector', 'map-name', 'map-speed', 'nitro-value',
      'nitro-fill', 'hud-speed', 'hud-gear', 'drift-tag', 'wrongway-tag', 'wrongway-big',
      'drift-big', 'drift-score', 'toast-layer', 'speed-vignette', 'damage-flash',
      'minimap', 'speedo', 'menu-best', 'menu-fps', 'speedo-wrap', 'countdown-number',
      'countdown-kicker', 'countdown-sub', 'pause-lap', 'pause-time', 'pause-pos',
      'result-rank', 'result-title', 'result-sub', 'result-total', 'result-best',
      'result-top', 'result-place', 'lap-list', 'btn-quality', 'btn-sound'
    ];
    const o = {};
    ids.forEach(id => { o[id] = $(id); });
    o['speedo-wrap'] = document.querySelector('.speedo-wrap');
    o.speedoWrap = o['speedo-wrap'];
    return o;
  }

  function setupRenderer() {
    const canvas = $('gl');
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: false, stencil: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x04030c, 1);
  }

  function setupComposer() {
    const w = window.innerWidth, h = window.innerHeight;
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(w, h);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), .88, .52, .7);
    composer.addPass(bloomPass);
    fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
    fxaaPass.material.uniforms.resolution.value.set(1 / (w * renderer.getPixelRatio()), 1 / (h * renderer.getPixelRatio()));
    fxaaPass.enabled = game.quality !== 'low';
    composer.addPass(fxaaPass);
    // Composer render targets are linear; convert to sRGB for the canvas.
    gammaPass = new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(pow(max(c.rgb, 0.0), vec3(0.45454545)), c.a); }'
    });
    gammaPass.renderToScreen = true;
    composer.addPass(gammaPass);
    composer.setPixelRatio(renderer.getPixelRatio());
  }

  function pixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    if (game.quality === 'low') return Math.min(dpr, 1);
    return Math.min(dpr, NR.LOW_POWER ? 1.25 : 1.55);
  }

  function applyQuality(q, initial) {
    game.quality = q === 'low' ? 'low' : 'high';
    NR.safeLocalStorage.set('nr.quality', game.quality);
    const pr = pixelRatio();
    if (renderer) {
      renderer.setPixelRatio(pr);
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      composer.setPixelRatio(pr);
    }
    if (bloomPass) bloomPass.strength = game.quality === 'low' ? .55 : .88;
    if (fxaaPass) fxaaPass.enabled = game.quality !== 'low';
    if (fx) fx.setQuality(game.quality === 'low');
    if (ui && ui['btn-quality']) {
      ui['btn-quality'].innerHTML = 'QUALITY <b>' + (game.quality === 'low' ? 'LOW' : 'HIGH') + '</b>';
    }
    if (!initial) toast('RENDER QUALITY // ' + game.quality.toUpperCase(), 'gold');
  }

  /* ---------------------------------------------------------
     cars / obstacles / grid
     --------------------------------------------------------- */
  function createCars() {
    playerCar = NR.createCar({
      player: true, color: 0x430c46, accent: 0x25edff, accent2: 0xff2d95, number: 7
    });
    scene.add(playerCar.group);

    const defs = [
      { color: 0x0b2b46, accent: 0x25edff, accent2: 0x25edff, number: 12 },
      { color: 0x2d1250, accent: 0x9a6bff, accent2: 0xff2d95, number: 23 },
      { color: 0x3e1c0a, accent: 0xffb347, accent2: 0xffb347, number: 31 },
      { color: 0x0b3324, accent: 0x74ffb0, accent2: 0x25edff, number: 44 }
    ];
    const grid = [
      { s: 9.5, lat: -3.1, base: 58 },
      { s: 21.3, lat: 3.1, base: 61 },
      { s: 33.1, lat: -3.1, base: 56 },
      { s: 44.9, lat: 3.1, base: 63 }
    ];
    for (let i = 0; i < defs.length; i++) {
      const car = NR.createCar({
        player: false, color: defs[i].color,
        accent: defs[i].accent, accent2: defs[i].accent2, number: defs[i].number
      });
      scene.add(car.group);
      rivals.push({
        car,
        progress: -grid[i].s,
        prevProgress: -grid[i].s,
        lat: grid[i].lat,
        latTarget: grid[i].lat,
        base: grid[i].base,
        speed: 0,
        lapsDone: 0,
        started: false,
        finished: false,
        finishTime: 0,
        phase: i * 1.7 + .4,
        color: '#' + defs[i].accent.toString(16).padStart(6, '0')
      });
    }
    player.lat = -3.1;
    player.progress = -56.7;
  }

  function createObstacles() {
    const defs = [
      { s: .155, lat: -5.7, type: 'barrier', radius: 2.3, color: 0xffb347 },
      { s: .265, lat: 5.8, type: 'block', radius: 1.7, color: 0xff2d95 },
      { s: .385, lat: -5.9, type: 'drum', radius: 1.1, color: 0xffb347 },
      { s: .475, lat: 5.6, type: 'barrier', radius: 2.3, color: 0xff4568 },
      { s: .585, lat: -5.4, type: 'block', radius: 1.7, color: 0x25edff },
      { s: .705, lat: 5.9, type: 'drum', radius: 1.1, color: 0xffb347 },
      { s: .825, lat: -5.6, type: 'barrier', radius: 2.3, color: 0xff2d95 },
      { s: .925, lat: 5.5, type: 'drum', radius: 1.1, color: 0x25edff }
    ];
    const L = track.length;
    for (const d of defs) {
      const sNorm = d.s;
      const f = track.frameAt(sNorm);
      const p = track.pointAt(sNorm, d.lat, 0);
      const mesh = NR.createObstacle(d.type, d.color);
      mesh.position.copy(p);
      mesh.rotation.y = f.yaw;
      scene.add(mesh);
      obstacles.push({
        mesh, s: sNorm, lat: d.lat, radius: d.radius,
        x: p.x, z: p.z, cooldown: 0
      });
    }
  }

  function poseFromProgress(obj, progress, lat) {
    const L = track.length;
    const s = NR.wrap(progress, L) / L;
    const p = track.pointAt(s, lat, 0);
    const f = track.frameAt(s);
    obj.group.position.set(p.x, p.y + .025, p.z);
    obj.group.rotation.y = f.yaw;
    obj.tilt.rotation.x = -f.pitch;
    return f;
  }

  function resetToGrid() {
    const L = track.length;
    player.progress = -56.7;
    player.lat = -3.1;
    player.vel.set(0, 0, 0);
    player.speed = 0;
    player.steer = 0;
    player.nitro = 100;
    player.boosting = false;
    player.drifting = false;
    player.driftScore = 0;
    player.hitCd = 0;
    player.wallCd = 0;
    player.ghost = 0;
    player.finished = false;
    player.finishTime = 0;
    player.q = track.query(track.pointAt(NR.wrap(-56.7, L) / L, -3.1, 0), 0);
    player.prevS = player.q.dist;
    player.hint = player.q.idx;
    const pf = poseFromProgress(playerCar, player.progress, player.lat);
    player.yaw = pf.yaw;

    for (let i = 0; i < rivals.length; i++) {
      const r = rivals[i];
      const starts = [9.5, 21.3, 33.1, 44.9];
      r.progress = -starts[i];
      r.prevProgress = r.progress;
      r.lat = [-3.1, 3.1, -3.1, 3.1][i];
      r.latTarget = r.lat;
      r.speed = 0;
      r.lapsDone = 0;
      r.started = false;
      r.finished = false;
      r.finishTime = 0;
      poseFromProgress(r.car, r.progress, r.lat);
      r.car.update(0, 0, 0, 0, 0, false, false);
    }
    race.time = 0;
    race.lapStart = 0;
    race.lapsDone = 0;
    race.timing = false;
    race.lapTimes = [];
    race.lastLap = null;
    race.bestLap = null;
    race.topSpeed = 0;
    race.finished = false;
    race.visited.clear();
    race.lastSector = null;
    race.wrongTimer = 0;
    race.wrongway = false;
    game.countdownStage = -1;
    game.rank = 5;
    game.rankTimer = 0;
    input.gas = input.brake = input.left = input.right = input.drift = input.nitro = false;
    env.startLights(0, false);
    game.lightGen++;
    updateHUD(true);
  }

  /* ---------------------------------------------------------
     race flow
     --------------------------------------------------------- */
  function startRace() {
    ensureAudio();
    if (audio) { audio.setPaused(false); audio.startMusic(); }
    ui.menu.classList.add('hidden');
    ui.results.classList.add('hidden');
    ui.pause.classList.add('hidden');
    ui.hud.classList.remove('hidden');
    ui['countdown-layer'].classList.remove('hidden');
    resetToGrid();
    game.mode = 'countdown';
    race.countdown = 0;
    game.countdownStage = -1;
    setCountdown('3', 'GRID LOCKED', 'HOLD THE LINE', false);
    audio && audio.ui(true);
    if (document.body.classList.contains('touch')) ui['touch-controls'].classList.remove('hidden');
    placeCameraSnap();
  }

  function startCountdownStage(stage) {
    if (stage === game.countdownStage) return;
    game.countdownStage = stage;
    if (stage === 0) {
      setCountdown('3', 'GRID LOCKED', 'HOLD THE LINE', false);
      env.startLights(0, false);
      audio && audio.countdown(false);
    } else if (stage === 1) {
      setCountdown('2', 'SYSTEMS ARMED', 'HOLD THE LINE', false);
      env.startLights(1, false);
      audio && audio.countdown(false);
    } else if (stage === 2) {
      setCountdown('1', 'TRACTION READY', 'HOLD THE LINE', false);
      env.startLights(2, false);
      audio && audio.countdown(false);
    } else if (stage === 3) {
      setCountdown('GO', 'LAUNCH', 'NO BRAKES // 全速', true);
      env.startLights(3, false);
      audio && audio.countdown(true);
      fx && fx.startBurnout(playerCar);
    } else if (stage === 4) {
      env.startLights(0, true);
      game.mode = 'race';
      race.time = 0;
      race.lapStart = 0;
      race.timing = false;
      toast('LIGHT SPEED // <b>GO</b>', 'gold');
      const gen = ++game.lightGen;
      setTimeout(() => {
        if (gen === game.lightGen) env.startLights(0, false);
      }, 1800);
    }
  }

  function setCountdown(number, kicker, sub, go) {
    const num = ui['countdown-number'];
    num.textContent = number;
    num.classList.toggle('go', !!go);
    num.classList.remove('pop');
    // force animation restart
    void num.offsetWidth;
    num.classList.add('pop');
    ui['countdown-kicker'].textContent = kicker;
    ui['countdown-sub'].textContent = sub;
  }

  function updateCountdown(dt) {
    race.countdown += dt;
    const t = race.countdown;
    if (game.countdownStage < 0) startCountdownStage(0);
    if (t >= 1 && game.countdownStage < 1) startCountdownStage(1);
    if (t >= 2 && game.countdownStage < 2) startCountdownStage(2);
    if (t >= 2.95 && game.countdownStage < 3) startCountdownStage(3);
    if (t >= 3.0 && game.countdownStage < 4) startCountdownStage(4);
    if (t >= 3.9) ui['countdown-layer'].classList.add('hidden');
    // stationary idle / rev
    player.speed = 0;
    player.steer = NR.damp(player.steer, 0, 8, dt);
    playerCar.update(dt, 0, player.steer, input.gas ? 1 : 0, input.brake ? 1 : 0, false, false);
    for (const r of rivals) {
      poseFromProgress(r.car, r.progress, r.lat);
      r.car.update(dt, 0, 0, 0, 0, false, false);
    }
  }

  function startTiming() {
    race.timing = true;
    race.lapStart = race.time;
    race.visited.clear();
    race.lastSector = player.q ? player.q.sector.id : null;
    if (race.lastSector) race.visited.add(race.lastSector);
    toast('LAP 01 // <b>TIMING LIVE</b>', 'gold');
    audio && audio.checkpoint();
  }

  function completeLap() {
    if (!race.timing) return;
    const lt = Math.max(0, race.time - race.lapStart);
    race.lapTimes.push(lt);
    race.lastLap = lt;
    if (race.bestLap == null || lt < race.bestLap) race.bestLap = lt;
    race.lapsDone++;
    race.lapStart = race.time;
    race.visited.clear();
    race.lastSector = player.q ? player.q.sector.id : null;
    if (race.lastSector) race.visited.add(race.lastSector);
    audio && audio.lap(race.bestLap === lt);
    if (race.lapsDone >= LAPS) {
      finishRace();
    } else {
      const lapNo = race.lapsDone + 1;
      toast('LAP ' + NR.pad(lapNo, 2) + ' // <b>' + NR.fmtTime(lt) + '</b>', lapNo === LAPS ? 'gold' : '');
      ui['sector-chip'].classList.remove('flash');
      void ui['sector-chip'].offsetWidth;
      ui['sector-chip'].classList.add('flash');
    }
  }

  function finishRace() {
    if (game.mode === 'finished') return;
    race.finished = true;
    player.finished = true;
    player.finishTime = race.time;
    game.mode = 'finished';
    const finishedBefore = rivals.filter(r => r.finished).length;
    const place = Math.min(5, 1 + finishedBefore);
    game.rank = place;
    const total = race.time;
    const top = Math.round(race.topSpeed);
    const storedBest = parseFloat(NR.safeLocalStorage.get('nr.bestLap', '0')) || 0;
    if (!storedBest || (race.bestLap && race.bestLap < storedBest)) {
      NR.safeLocalStorage.set('nr.bestLap', String(race.bestLap || 0));
    }
    updateMenuBest();
    ui.results.classList.remove('hidden');
    ui['touch-controls'].classList.add('hidden');
    ui['countdown-layer'].classList.add('hidden');

    const titles = {
      1: ['CIRCUIT DOMINATED', 'YOU OWN THE NIGHT'],
      2: ['MILLISECONDS SHORT', 'THE CITY REMEMBERS'],
      3: ['PODIUM SECURED', 'NOT BAD FOR A GHOST'],
      4: ['KEEP THE THROTTLE OPEN', 'THE NIGHT IS YOUNG'],
      5: ['SURVIVED THE CIRCUIT', 'RUN IT BACK']
    };
    const t = titles[place] || titles[5];
    ui['result-rank'].textContent = 'P' + place;
    ui['result-title'].textContent = t[0];
    ui['result-sub'].textContent = t[1];
    ui['result-total'].textContent = NR.fmtTime(total);
    ui['result-best'].textContent = NR.fmtTime(race.bestLap || 0);
    ui['result-top'].textContent = NR.pad(top, 3) + ' KM/H';
    ui['result-place'].textContent = place + ' / 5';
    ui['lap-list'].innerHTML = '';
    race.lapTimes.forEach((lt, i) => {
      const row = document.createElement('div');
      row.className = 'lap-row';
      const best = race.bestLap != null && Math.abs(lt - race.bestLap) < .0005;
      row.innerHTML = '<span>LAP ' + NR.pad(i + 1, 2) + '</span><b class="' + (best ? 'fast' : '') + '">' +
        NR.fmtTime(lt) + '</b><span class="tag">' + (best ? 'BEST' : '') + '</span><span>' +
        (i === 0 ? 'CLEAN AIR' : (lt < race.lapTimes[i - 1] ? 'FASTER' : 'TRAFFIC')) + '</span>';
      ui['lap-list'].appendChild(row);
    });
    audio && audio.setPaused(true);
    audio && audio.lap(true);
    fx && fx.spawnImpact(playerCar.group.position.clone().setY(playerCar.group.position.y + 1), null, .35);
    ui['pause-pos'].textContent = place + ' / 5';
  }

  function pauseGame() {
    if (game.mode !== 'race' && game.mode !== 'countdown') return;
    game.pauseResumeMode = game.mode;
    game.mode = 'paused';
    ui.pause.classList.remove('hidden');
    ui['pause-lap'].textContent = Math.min(LAPS, race.lapsDone + 1) + ' / ' + LAPS;
    ui['pause-time'].textContent = NR.fmtTime(race.timing ? race.time - race.lapStart : race.time);
    ui['pause-pos'].textContent = game.rank + ' / 5';
    ui['touch-controls'].classList.add('hidden');
    audio && audio.setPaused(true);
    audio && audio.ui(false);
    clearInput();
  }

  function resumeGame() {
    if (game.mode !== 'paused') return;
    game.mode = game.pauseResumeMode || 'race';
    ui.pause.classList.add('hidden');
    if (document.body.classList.contains('touch')) ui['touch-controls'].classList.remove('hidden');
    audio && audio.setPaused(false);
    audio && audio.ui(true);
    clearInput();
    lastNow = performance.now();
  }

  function quitToMenu() {
    game.mode = 'menu';
    game.menuAngle = .65;
    game.lightGen++;
    ui.pause.classList.add('hidden');
    ui.results.classList.add('hidden');
    ui.hud.classList.add('hidden');
    ui['countdown-layer'].classList.add('hidden');
    ui['touch-controls'].classList.add('hidden');
    ui.menu.classList.remove('hidden');
    resetToGrid();
    env.startLights(0, false);
    audio && audio.setPaused(false);
    audio && audio.setSkid(0);
    audio && audio.setNitro(0);
    clearInput();
  }

  /* ---------------------------------------------------------
     player physics
     --------------------------------------------------------- */
  function updatePlayer(dt) {
    if (game.mode !== 'race') return;
    const canDrive = !player.finished;
    let throttle = canDrive && input.gas ? 1 : 0;
    let brake = canDrive && input.brake ? 1 : 0;
    const handbrake = canDrive && input.drift;
    if (!canDrive) brake = .4;

    // World forward is +Z and yaw grows towards +X, which is screen-LEFT when
    // the chase camera looks down +Z. Invert the input so D / ArrowRight turns
    // right on screen (and the front wheels, body roll and camera all follow).
    const steerTarget = canDrive ? ((input.left ? 1 : 0) - (input.right ? 1 : 0)) : 0;
    player.steer = NR.damp(player.steer, steerTarget, canDrive ? 8.5 : 5, dt);

    const L = track.length;
    fwd.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    let vF = player.vel.dot(fwd);
    let vLat = player.vel.dot(right);
    const absV = Math.abs(vF);

    player.boosting = canDrive && input.nitro && player.nitro > .5 && vF > 2 && throttle > 0;
    if (player.boosting) {
      player.nitro = Math.max(0, player.nitro - 25 * dt);
      if (player.nitro <= 0.01) {
        player.boosting = false;
        toast('NITRO CELL DEPLETED', 'gold');
      }
    } else {
      const regen = player.drifting ? 12 : 4.5;
      player.nitro = Math.min(100, player.nitro + regen * dt);
    }

    const maxSpeed = player.boosting ? 101 : 82;
    let accel = 0;
    if (throttle > 0 && vF < maxSpeed) {
      accel += 25.5 * throttle * (1 - Math.max(0, vF) / maxSpeed);
    }
    if (player.boosting) accel += 21;
    if (brake > 0) {
      if (vF > .8) accel -= 34 * brake;
      else accel -= 11 * brake;
    }
    // rolling / aero drag
    accel -= vF * .085 + vF * Math.abs(vF) * .0009;
    if (!throttle && !brake) accel -= Math.sign(vF) * 1.35;
    if (handbrake) accel -= vF * .65;
    // slope
    if (player.q) {
      const slope = Math.atan2(player.q.tangent.y, Math.hypot(player.q.tangent.x, player.q.tangent.z));
      accel -= Math.sin(slope) * 6.2;
    }

    player.vel.addScaledVector(fwd, accel * dt);

    // yaw from steering (bicycle-ish, clamped)
    const speedK = NR.clamp(absV / 62, 0, 1);
    const steerMax = .48 * (1 - .48 * speedK);
    const steerAngle = player.steer * steerMax;
    let yawRate = (vF / 2.65) * Math.tan(steerAngle);
    yawRate = NR.clamp(yawRate, -1.45, 1.45);
    if (handbrake) yawRate *= 1.28;
    if (absV < 1.4) yawRate *= absV / 1.4;
    player.yaw += yawRate * dt;

    fwd.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    vF = player.vel.dot(fwd);
    vLat = player.vel.dot(right);
    const grip = handbrake ? 1.55 : (Math.abs(vLat) > 5 ? 3.3 : 6.8);
    vLat *= Math.exp(-grip * dt);
    // clamp horizontal velocity
    const cap = maxSpeed + 6;
    let hSpeed = Math.hypot(vF, vLat);
    if (hSpeed > cap) {
      const k = cap / hSpeed;
      vF *= k; vLat *= k; hSpeed = cap;
    }
    player.vel.copy(fwd).multiplyScalar(vF).addScaledVector(right, vLat);
    player.speed = player.vel.dot(fwd);

    // integrate
    const pos = playerCar.group.position;
    pos.addScaledVector(player.vel, dt);

    // drift detection
    const slip = Math.abs(vLat);
    const wasDrifting = player.drifting;
    player.drifting = canDrive && absV > 8 && (slip > 2.15 || (handbrake && absV > 5));
    if (player.drifting) {
      player.driftScore += (slip * 3.4 + absV * .2) * dt;
      player.driftTimer = 0;
    } else {
      player.driftTimer += dt;
      if (wasDrifting && player.driftScore > 18) {
        toast('DRIFT +' + Math.round(player.driftScore), 'gold');
      }
      if (player.driftTimer > .55) player.driftScore = 0;
    }

    // track query
    let q = track.query(pos, player.hint);
    player.hint = q.idx;
    player.q = q;
    const lim = track.wallLimit;
    let wallHit = 0;
    if (Math.abs(q.lat) > lim) {
      const sign = Math.sign(q.lat);
      const excess = Math.abs(q.lat) - lim;
      pos.addScaledVector(q.right, -sign * excess);
      const out = player.vel.dot(q.right) * sign;
      if (out > 0) {
        // remove the outward component and scrub a little speed; no bounce amplification
        player.vel.addScaledVector(q.right, -player.vel.dot(q.right));
        player.vel.multiplyScalar(Math.exp(-2.4 * dt));
        wallHit = out;
      }
      q = track.query(pos, player.hint);
      player.q = q;
      player.hint = q.idx;
    }
    // road surface & orientation
    pos.y = q.groundY + .025;
    player.lat = q.lat;
    player.s = q.dist;
    const prev = player.prevS;
    let delta = player.s - prev;
    if (delta > L / 2) delta -= L;
    if (delta < -L / 2) delta += L;
    if (Math.abs(delta) < L / 2) player.progress += delta;
    player.prevS = player.s;
    player.yaw = player.yaw;
    playerCar.group.rotation.y = player.yaw;
    playerCar.tilt.rotation.x = -Math.atan2(q.tangent.y, Math.hypot(q.tangent.x, q.tangent.z));

    // wall scrape + impact
    player.wallCd = Math.max(0, player.wallCd - dt);
    player.scrapeCd = Math.max(0, player.scrapeCd - dt);
    player.hitCd = Math.max(0, player.hitCd - dt);
    player.ghost = Math.max(0, player.ghost - dt);
    if (wallHit > 1.2 && player.hitCd <= 0) {
      player.hitCd = .42;
      impact(playerCar.group.position.clone().addScaledVector(q.right, Math.sign(q.lat) * .9), q.right.clone().multiplyScalar(-Math.sign(q.lat)), wallHit / 15);
    } else if (Math.abs(q.lat) > lim - .18 && absV > 10 && player.scrapeCd <= 0) {
      player.scrapeCd = .075;
      const p = playerCar.group.position.clone().addScaledVector(q.right, Math.sign(q.lat) * 1.0);
      if (fx) fx.spawnImpact(p, q.right.clone().multiplyScalar(-Math.sign(q.lat)), .045);
      audio && audio.impact(.06);
    }

    // checkpoints / sectors
    if (q.sector.id !== race.lastSector) {
      race.lastSector = q.sector.id;
      if (race.timing) {
        race.visited.add(q.sector.id);
        audio && audio.checkpoint();
        toast('SECTOR ' + NR.pad(q.sector.index, 2) + ' // <b>' + q.sector.en + '</b>');
      }
      updateSector(q.sector);
    }

    // lap timing
    if (!race.timing && player.progress >= 0) startTiming();
    if (race.timing && player.progress >= (race.lapsDone + 1) * L - .01) completeLap();

    // rivals collision
    collideRivals(dt);
    collideObstacles(dt);

    // hard safety clamp after all collision responses
    const hCap = maxSpeed + 8;
    let hv = Math.hypot(player.vel.x, player.vel.z);
    if (hv > hCap) {
      const k = hCap / hv;
      player.vel.x *= k; player.vel.z *= k;
      hv = hCap;
    }
    player.speed = player.vel.dot(fwd);
    if (!isFinite(player.speed)) {
      player.vel.set(0, 0, 0);
      player.speed = 0;
      player.yaw = q.tangent ? Math.atan2(q.tangent.x, q.tangent.z) : player.yaw;
    }

    // visuals
    const kmh = Math.abs(player.speed) * 3.6;
    if (kmh > race.topSpeed) race.topSpeed = kmh;
    playerCar.update(dt, player.speed, player.steer, throttle, Math.max(brake, handbrake ? .5 : 0), player.boosting, player.drifting);

    // wrong way
    const dot = player.vel.x * q.tangent.x + player.vel.z * q.tangent.z;
    if (dot < -4.5 && Math.abs(player.speed) > 4) race.wrongTimer += dt;
    else race.wrongTimer = Math.max(0, race.wrongTimer - dt * 2.5);
    race.wrongway = race.wrongTimer > .7;

    // audio state
    const gearData = getGear(kmh);
    const rpm = gearData.rpm + (player.boosting ? .12 : 0);
    audio && audio.setEngine(player.speed, rpm, throttle, player.boosting, false);
    audio && audio.setSkid(player.drifting ? NR.clamp(Math.abs(vLat) / 18, .2, 1) : 0);
    audio && audio.setNitro(player.boosting ? 1 : 0);
  }

  function collideRivals(dt) {
    if (player.ghost > 0) return;
    for (const r of rivals) {
      if (r.finished) continue;
      const rp = r.car.group.position;
      const pp = playerCar.group.position;
      const dx = pp.x - rp.x, dz = pp.z - rp.z;
      const d = Math.hypot(dx, dz);
      if (d < 2.7 && d > .001 && Math.abs(pp.y - rp.y) < 2.2) {
        const nx = dx / d, nz = dz / d;
        const push = (2.7 - d) * .65;
        pp.x += nx * push; pp.z += nz * push;
        const dot = player.vel.x * nx + player.vel.z * nz;
        if (dot < 0) {
          player.vel.x -= nx * dot * 1.2;
          player.vel.z -= nz * dot * 1.2;
          player.vel.multiplyScalar(.88);
        }
        r.speed *= .94;
        if (player.hitCd <= 0) {
          player.hitCd = .5;
          impact(tmpV.set(pp.x - nx * .8, pp.y + .5, pp.z - nz * .8), tmpV2.set(nx, 0, nz), Math.min(1, Math.abs(dot) / 18));
          toast('CONTACT // <b>RIVAL</b>');
        }
      }
    }
  }

  function collideObstacles(dt) {
    if (player.ghost > 0) return;
    const pp = playerCar.group.position;
    for (const o of obstacles) {
      const dx = pp.x - o.x, dz = pp.z - o.z;
      const d = Math.hypot(dx, dz);
      const rad = o.radius + 1.05;
      if (d < rad && d > .001 && Math.abs(pp.y - o.mesh.position.y) < 2.5) {
        const nx = dx / d, nz = dz / d;
        const push = (rad - d) * .9;
        pp.x += nx * push; pp.z += nz * push;
        const dot = player.vel.x * nx + player.vel.z * nz;
        if (dot < 0) {
          player.vel.x -= nx * dot * 1.3;
          player.vel.z -= nz * dot * 1.3;
          player.vel.multiplyScalar(.72);
        }
        if (player.hitCd <= 0) {
          player.hitCd = .6;
          impact(tmpV.set(o.x, pp.y + .6, o.z), tmpV2.set(nx, 0, nz), Math.min(1, Math.abs(dot) / 16 + .2));
          toast('IMPACT // <b>HAZARD</b>');
        }
      }
    }
  }

  function impact(pos, normal, strength) {
    const s = NR.clamp(strength || .3, .1, 1);
    fx && fx.spawnImpact(pos, normal, s);
    audio && audio.impact(s);
    ui['damage-flash'].style.opacity = String(Math.min(.75, .2 + s * .55));
    if (s > .45) {
      // small extra camera punch
      fx.trauma = Math.min(1, fx.trauma + s * .35);
    }
  }

  function getGear(kmh) {
    const bands = [0, 48, 88, 132, 182, 238, 330];
    let g = 0;
    while (g < bands.length - 2 && kmh >= bands[g + 1]) g++;
    const within = NR.clamp((kmh - bands[g]) / (bands[g + 1] - bands[g] || 1), 0, 1);
    return {
      gear: g + 1,
      rpm: .18 + within * .72 + (g === 0 ? .05 : 0)
    };
  }

  function resetPlayerCar() {
    if (game.mode !== 'race') return;
    const q = track.query(playerCar.group.position, player.hint);
    const L = track.length;
    const sNorm = q.dist / L;
    const p = track.pointAt(sNorm, 0, 0);
    const f = track.frameAt(sNorm);
    playerCar.group.position.set(p.x, p.y + .03, p.z);
    playerCar.group.rotation.y = f.yaw;
    playerCar.tilt.rotation.x = -f.pitch;
    player.yaw = f.yaw;
    player.vel.set(0, 0, 0);
    player.speed = 0;
    player.steer = 0;
    player.drifting = false;
    player.boosting = false;
    player.hint = q.idx;
    player.s = q.dist;
    player.prevS = q.dist;
    player.lat = 0;
    player.ghost = 1.2;
    player.hitCd = .8;
    game.mode = 'race';
    toast('VEHICLE RECOVERED // <b>TRACK RESET</b>');
    audio && audio.ui(true);
    placeCameraSnap();
  }

  /* ---------------------------------------------------------
     rivals
     --------------------------------------------------------- */
  function updateRivals(dt) {
    const L = track.length;
    const canRace = game.mode === 'race' || game.mode === 'finished';
    for (const r of rivals) {
      if (!canRace) {
        poseFromProgress(r.car, r.progress, r.lat);
        r.car.update(dt, 0, 0, 0, 0, false, false);
        continue;
      }
      if (!r.finished) {
        const ahead = r.progress - player.progress;
        let rubber = 0;
        if (ahead < -180) rubber = 7.5;
        else if (ahead > 170) rubber = -3.5;
        // curvature lookahead (compound)
        const lookS = NR.wrap((r.progress + 55) / L, 1);
        const sm = track.sampleAtS(lookS);
        const look2 = track.sampleAtS(NR.wrap((r.progress + 130) / L, 1));
        const curve = (sm.curvature || 0) * 10 + (look2.curvature || 0) * 16;
        const slow = NR.clamp(curve, 0, .34);
        const targetSpeed = (r.base + rubber) * (1 - slow) * (r.started ? 1 : .55);
        const diff = targetSpeed - r.speed;
        r.speed += NR.clamp(diff, -24 * dt, 17 * dt);
        if (r.speed < 0) r.speed = 0;
        r.progress += r.speed * dt;
        if (!r.started && r.progress >= 0) r.started = true;
        r.lapsDone = Math.max(0, Math.floor(r.progress / L));
        if (r.progress >= LAPS * L - .01) {
          // Park just short of the line instead of wrapping to s=0 and
          // reappearing on the start grid while the player is still racing.
          r.progress = LAPS * L - 1;
          r.lapsDone = LAPS;
          r.finished = true;
          r.finishTime = race.time;
          r.speed = 0;
          r.latTarget = 7.5;
        }
      } else {
        r.speed = NR.damp(r.speed, 0, 2, dt);
        r.progress += r.speed * dt;
        r.latTarget = 7.4;
      }
      // lane movement
      const sNorm = NR.wrap(r.progress, L) / L;
      const laneWave = Math.sin(r.progress * .013 + r.phase) * 1.6;
      if (!r.finished) r.latTarget = NR.clamp(laneWave + (r.progress < 0 ? (Math.floor(-r.progress) % 2 ? 2.2 : -2.2) : 0), -3.8, 3.8);
      r.lat = NR.damp(r.lat, r.latTarget, 1.2, dt);
      const p = track.pointAt(sNorm, r.lat, 0);
      const f = track.frameAt(sNorm);
      r.car.group.position.set(p.x, p.y + .025, p.z);
      r.car.group.rotation.y = f.yaw;
      r.car.tilt.rotation.x = -f.pitch;
      const steerVis = NR.clamp((r.latTarget - r.lat) * .5, -1, 1);
      r.car.update(dt, r.speed, steerVis, 1, 0, false, false);
    }
  }

  /* ---------------------------------------------------------
     camera
     --------------------------------------------------------- */
  function menuCamera(dt) {
    game.menuAngle += dt * .075;
    const p = playerCar.group.position;
    const a = game.menuAngle;
    const rad = 13.5;
    camera.position.set(p.x + Math.cos(a) * rad, p.y + 4.2 + Math.sin(a * .7) * .6, p.z + Math.sin(a) * rad);
    camera.lookAt(p.x, p.y + 1.0, p.z);
    camera.fov = NR.damp(camera.fov, 54, 2, dt);
    camera.updateProjectionMatrix();
  }

  function finishedCamera(dt) {
    game.menuAngle += dt * .16;
    const p = playerCar.group.position;
    const a = game.menuAngle;
    const rad = 9;
    const want = tmpV.set(p.x + Math.cos(a) * rad, p.y + 3.2, p.z + Math.sin(a) * rad);
    camera.position.lerp(want, 1 - Math.exp(-dt * 2));
    camera.lookAt(p.x, p.y + .9, p.z);
    camera.fov = NR.damp(camera.fov, 52, 2, dt);
    camera.updateProjectionMatrix();
  }

  function placeCameraSnap() {
    const p = playerCar.group.position;
    fwd.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    camera.position.set(p.x - fwd.x * 7.8 + right.x * -.4, p.y + 3.3, p.z - fwd.z * 7.8 + right.z * -.4);
    camPos.copy(camera.position);
    camTarget.set(p.x + fwd.x * 10, p.y + 1.15, p.z + fwd.z * 10);
    camera.lookAt(camTarget);
    camera.fov = 64;
    camera.updateProjectionMatrix();
  }

  function updateCamera(dt) {
    if (game.mode === 'menu') { menuCamera(dt); return; }
    if (game.mode === 'paused') return;
    if (game.mode === 'finished') { finishedCamera(dt); return; }
    const p = playerCar.group.position;
    const speedK = NR.clamp(Math.abs(player.speed) / 82, 0, 1);
    fwd.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    const mode = game.camMode % 3;
    let dist = 7.6 + speedK * 1.6;
    let height = 3.15 + speedK * .55;
    let lookAhead = 9 + speedK * 12;
    if (mode === 1) { dist = 11.8 + speedK * 2.2; height = 4.8 + speedK * .8; lookAhead = 14 + speedK * 15; }
    if (mode === 2) { dist = -.2; height = 1.45; lookAhead = 21 + speedK * 10; }

    let lateral = -player.steer * .75 * speedK;
    if (player.drifting) lateral -= NR.clamp(player.vel.dot(right) * .07, -1.2, 1.2);
    const desiredY = p.y + height + (game.mode === 'countdown' ? .35 : 0);
    desired.set(p.x - fwd.x * dist + right.x * lateral, desiredY, p.z - fwd.z * dist + right.z * lateral);
    // keep chase camera above the local road surface
    if (mode !== 2) {
      const qc = track.query(desired, player.hint);
      if (Math.abs(qc.lat) < 30 && desired.y < qc.groundY + 1.25) desired.y = qc.groundY + 1.25;
    }
    target.set(p.x + fwd.x * lookAhead + right.x * player.steer * 1.2, p.y + 1.05 + speedK * .35, p.z + fwd.z * lookAhead + right.z * player.steer * 1.2);

    const stiff = game.mode === 'countdown' ? 2.4 : (mode === 2 ? 10 : 6.5);
    camPos.lerp(desired, 1 - Math.exp(-stiff * dt));
    camTarget.lerp(target, 1 - Math.exp(-(stiff + 1.8) * dt));
    const shake = fx.getShake(elapsed);
    camera.position.copy(camPos);
    camera.position.x += shake.x;
    camera.position.y += shake.y;
    camera.lookAt(camTarget);
    camera.rotateZ(shake.roll + player.steer * .0035 + (player.drifting ? -player.vel.dot(right) * .0007 : 0));
    const targetFov = (mode === 2 ? 72 : 64) + speedK * 10 + (player.boosting ? 6 : 0) - (game.mode === 'countdown' ? 3 : 0);
    if (Math.abs(camera.fov - targetFov) > .01) {
      camera.fov = NR.damp(camera.fov, targetFov, 4.5, dt);
      camera.updateProjectionMatrix();
    }
  }

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */
  function setText(el, value) {
    if (!el) return;
    if (el.textContent !== value) el.textContent = value;
  }

  function updateSector(sector) {
    if (!sector) return;
    setText(ui['sector-index'], 'SECTOR ' + NR.pad(sector.index, 2));
    setText(ui['sector-name'], sector.en);
    setText(ui['sector-cn'], sector.cn);
    setText(ui['map-sector'], 'S' + sector.index);
    setText(ui['map-name'], sector.en);
    ui['sector-chip'].style.setProperty('--sector-color', sector.css);
    ui['sector-chip'].classList.remove('flash');
    void ui['sector-chip'].offsetWidth;
    ui['sector-chip'].classList.add('flash');
  }

  function updateMenuBest() {
    const v = parseFloat(NR.safeLocalStorage.get('nr.bestLap', '0')) || 0;
    setText(ui['menu-best'], v ? NR.fmtTime(v) : '--:--.---');
  }

  function updateHUD(force) {
    if (!ui) return;
    if (game.mode === 'menu') return;
    const kmh = Math.round(Math.abs(player.speed) * 3.6);
    const gearData = getGear(kmh);
    const lapNo = Math.min(LAPS, race.lapsDone + 1);
    const current = race.timing ? Math.max(0, race.time - race.lapStart) : race.time;
    setText(ui['hud-lap'], String(lapNo));
    setText(ui['hud-pos'], String(game.rank));
    setText(ui['hud-time'], NR.fmtTime(current));
    setText(ui['hud-last'], race.lastLap != null ? NR.fmtTime(race.lastLap) : '--:--.---');
    setText(ui['hud-best'], race.bestLap != null ? NR.fmtTime(race.bestLap) : '--:--.---');
    setText(ui['hud-speed'], NR.pad(kmh, 3));
    setText(ui['map-speed'], NR.pad(kmh, 3));
    setText(ui['hud-gear'], player.speed < -.5 ? 'R' : (kmh < 2 ? 'N' : String(gearData.gear)));
    setText(ui['nitro-value'], String(Math.round(player.nitro)));
    ui['nitro-fill'].style.width = player.nitro.toFixed(1) + '%';
    ui['nitro-fill'].classList.toggle('low', player.nitro < 18);
    ui['speedo-wrap'].classList.toggle('boosting', player.boosting);
    ui['drift-tag'].classList.toggle('on', player.drifting);
    ui['drift-big'].classList.toggle('on', player.drifting && player.driftScore > 3);
    setText(ui['drift-score'], String(Math.round(player.driftScore)));
    ui['wrongway-tag'].classList.toggle('on', race.wrongway);
    ui['wrongway-big'].classList.toggle('on', race.wrongway);
    ui['speed-vignette'].style.opacity = String(NR.clamp((kmh - 100) / 230, 0, .72) + (player.boosting ? .12 : 0));
    ui['damage-flash'].style.opacity = String(NR.clamp(fx ? fx.hitFlash * .8 : 0, 0, .8));

    drawSpeedo(kmh, gearData.gear, player.boosting);
    game.drawTick++;
    if (game.drawTick % 2 === 0 || force) drawMinimap();
  }

  function drawSpeedo(kmh, gear, boosting) {
    const c = ui['speedo'];
    // The compact touch HUD uses the DOM readout; skip the hidden canvas work.
    if (document.body.classList.contains('touch') && window.innerWidth <= 700 && window.innerHeight > window.innerWidth) return;
    const ctx = c.__ctx || (c.__ctx = c.getContext('2d'));
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2, r = W * .39;
    ctx.clearRect(0, 0, W, H);
    const start = Math.PI * .78, end = Math.PI * 2.22;
    // base
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(120,220,255,.12)';
    ctx.beginPath(); ctx.arc(cx, cy, r, start, end); ctx.stroke();
    // ticks
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const a = start + (end - start) * t;
      const big = i % 4 === 0;
      const r1 = r - (big ? 14 : 8), r2 = r + 4;
      ctx.strokeStyle = big ? 'rgba(180,250,255,.65)' : 'rgba(90,190,230,.28)';
      ctx.lineWidth = big ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    const k = NR.clamp(kmh / 330, 0, 1);
    const aEnd = start + (end - start) * k;
    // glow
    ctx.lineWidth = 15;
    ctx.strokeStyle = boosting ? 'rgba(255,45,149,.22)' : 'rgba(37,237,255,.12)';
    ctx.beginPath(); ctx.arc(cx, cy, r, start, aEnd); ctx.stroke();
    const grad = ctx.createLinearGradient(cx - r, cy + r, cx + r, cy - r);
    grad.addColorStop(0, '#25edff');
    grad.addColorStop(.62, '#8fb7ff');
    grad.addColorStop(1, '#ff2d95');
    ctx.lineWidth = 5;
    ctx.strokeStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r, start, aEnd); ctx.stroke();
    // needle
    const na = start + (end - start) * k;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(na);
    ctx.strokeStyle = boosting ? '#ff8fc4' : '#ecfeff';
    ctx.lineWidth = 2;
    ctx.shadowColor = boosting ? '#ff2d95' : '#25edff';
    ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(r - 20, 0); ctx.stroke();
    ctx.restore();
    // center cap
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU);
    ctx.fillStyle = '#bffbff'; ctx.shadowBlur = 18; ctx.shadowColor = '#25edff';
    ctx.fill();
    ctx.shadowBlur = 0;
    // labels
    ctx.font = '8px "SFMono-Regular",Menlo,monospace';
    ctx.fillStyle = 'rgba(150,230,255,.5)';
    ctx.textAlign = 'center';
    for (let v = 0; v <= 320; v += 80) {
      const t = v / 330;
      const a = start + (end - start) * t;
      ctx.fillText(String(v), cx + Math.cos(a) * (r - 30), cy + Math.sin(a) * (r - 30) + 3);
    }
    // gear pips
    for (let i = 0; i < 6; i++) {
      const a = start + (end - start) * (.08 + i * .135);
      ctx.fillStyle = i < gear ? 'rgba(37,237,255,.8)' : 'rgba(80,120,150,.22)';
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 12), cy + Math.sin(a) * (r + 12), 1.8, 0, TAU); ctx.fill();
    }
  }

  let mapStatic = null;
  function buildMapStatic() {
    const c = document.createElement('canvas');
    c.width = 232; c.height = 232;
    const ctx = c.getContext('2d');
    const b = track.bounds;
    const pad = 24;
    const sx = (232 - pad * 2) / Math.max(1, b.maxX - b.minX);
    const sz = (232 - pad * 2) / Math.max(1, b.maxZ - b.minZ);
    const scale = Math.min(sx, sz);
    const ox = (232 - (b.maxX - b.minX) * scale) / 2;
    const oz = (232 - (b.maxZ - b.minZ) * scale) / 2;
    const pts = track.mapPoints.map(p => ({
      x: ox + (p.x - b.minX) * scale,
      y: oz + (p.z - b.minZ) * scale,
      color: '#' + (p.zone && p.zone.color ? p.zone.color.toString(16).padStart(6, '0') : '25edff')
    }));
    // glow underlay
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(90,235,255,.18)'; ctx.lineWidth = 13;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(2,5,14,.9)'; ctx.lineWidth = 8;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], n = pts[(i + 1) % pts.length];
      ctx.strokeStyle = p.color; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
    }
    // start line
    const p0 = pts[0];
    ctx.save(); ctx.translate(p0.x, p0.y);
    ctx.strokeStyle = '#f4feff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, 5); ctx.moveTo(-5, 5); ctx.lineTo(5, -5); ctx.stroke();
    ctx.restore();
    mapStatic = { canvas: c, pts, scale, ox, oz, b };
  }

  function mapXY(x, z) {
    return {
      x: mapStatic.ox + (x - mapStatic.b.minX) * mapStatic.scale,
      y: mapStatic.oz + (z - mapStatic.b.minZ) * mapStatic.scale
    };
  }

  function drawMinimap() {
    if (!mapStatic) buildMapStatic();
    const c = ui['minimap'];
    const ctx = c.__ctx || (c.__ctx = c.getContext('2d'));
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(mapStatic.canvas, 0, 0);
    // rivals
    for (const r of rivals) {
      const p = r.car.group.position;
      const m = mapXY(p.x, p.z);
      ctx.fillStyle = r.color;
      ctx.shadowColor = r.color; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(m.x, m.y, 3.1, 0, TAU); ctx.fill();
    }
    ctx.shadowBlur = 0;
    // player triangle
    const p = playerCar.group.position;
    const m = mapXY(p.x, p.z);
    const tx = Math.sin(player.yaw), tz = Math.cos(player.yaw);
    const ang = Math.atan2(tx, -tz);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(ang);
    ctx.shadowColor = '#25edff'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#e9ffff';
    ctx.beginPath(); ctx.moveTo(0, -7.5); ctx.lineTo(5, 5); ctx.lineTo(0, 2.8); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = player.drifting ? '#ff2d95' : '#25edff'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function toast(html, cls) {
    if (!ui || !ui['toast-layer']) return;
    const el = document.createElement('div');
    el.className = 'toast' + (cls ? ' ' + cls : '');
    el.innerHTML = html;
    ui['toast-layer'].appendChild(el);
    while (ui['toast-layer'].children.length > 3) ui['toast-layer'].removeChild(ui['toast-layer'].firstChild);
    setTimeout(() => {
      el.classList.add('off');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, 2500);
  }

  /* ---------------------------------------------------------
     input
     --------------------------------------------------------- */
  function bindInput() {
    window.addEventListener('keydown', e => {
      const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
      if (blocked.includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': input.gas = true; break;
        case 'KeyS': case 'ArrowDown': input.brake = true; break;
        case 'KeyA': case 'ArrowLeft': input.left = true; break;
        case 'KeyD': case 'ArrowRight': input.right = true; break;
        case 'Space': input.drift = true; break;
        case 'ShiftLeft': case 'ShiftRight': input.nitro = true; break;
        case 'KeyC':
          if (game.mode === 'race' || game.mode === 'countdown') {
            game.camMode = (game.camMode + 1) % 3;
            toast('CAMERA // <b>' + ['CHASE', 'CINEMA', 'HOOD'][game.camMode] + '</b>');
            audio && audio.ui(true);
          }
          break;
        case 'KeyR':
          if (game.mode === 'race') resetPlayerCar();
          break;
        case 'KeyP': case 'Escape':
          if (game.mode === 'paused') resumeGame();
          else pauseGame();
          e.preventDefault();
          break;
        case 'KeyM':
          toggleSound();
          break;
        case 'Enter':
          if (game.mode === 'menu') startRace();
          break;
      }
      if ((e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' || e.code === 'Space') && audio) {
        // browsers need a gesture; start audio on first keyboard input too
        ensureAudio();
      }
    });
    window.addEventListener('keyup', e => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': input.gas = false; break;
        case 'KeyS': case 'ArrowDown': input.brake = false; break;
        case 'KeyA': case 'ArrowLeft': input.left = false; break;
        case 'KeyD': case 'ArrowRight': input.right = false; break;
        case 'Space': input.drift = false; break;
        case 'ShiftLeft': case 'ShiftRight': input.nitro = false; break;
      }
    });
    window.addEventListener('blur', () => {
      clearInput();
      if (game.mode === 'race' || game.mode === 'countdown') pauseGame();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && (game.mode === 'race' || game.mode === 'countdown')) pauseGame();
    });

    // touch
    const touch = document.body.classList.contains('touch');
    document.body.classList.toggle('touch', touch || NR.LOW_POWER || matchMedia('(pointer:coarse)').matches);
    if (navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
    document.querySelectorAll('.touch-btn').forEach(btn => {
      const key = btn.getAttribute('data-input');
      const set = (v) => {
        if (key === 'left' || key === 'right' || key === 'gas' || key === 'brake' || key === 'drift' || key === 'nitro') input[key] = v;
        btn.classList.toggle('pressed', v);
      };
      const down = e => {
        e.preventDefault();
        ensureAudio();
        if (btn.setPointerCapture) { try { btn.setPointerCapture(e.pointerId); } catch (err) {} }
        set(true);
      };
      const up = e => {
        e.preventDefault();
        set(false);
      };
      btn.addEventListener('pointerdown', down);
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });

    window.addEventListener('pointerdown', ensureAudio, { once: true });
  }

  function clearInput() {
    input.gas = input.brake = input.left = input.right = input.drift = input.nitro = false;
    document.querySelectorAll('.touch-btn.pressed').forEach(b => b.classList.remove('pressed'));
  }

  function ensureAudio() {
    if (!audio) return;
    if (!audio.ready) audio.init();
    else if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
  }

  function bindUI() {
    const on = (id, fn) => {
      const el = $(id);
      if (el) el.addEventListener('click', e => { e.preventDefault(); fn(); });
    };
    on('btn-start', () => startRace());
    on('btn-pause', () => pauseGame());
    on('btn-resume', () => resumeGame());
    on('btn-restart', () => { ensureAudio(); ui.pause.classList.add('hidden'); startRace(); });
    on('btn-reset-car', () => {
      ui.pause.classList.add('hidden');
      // A pause can happen during the countdown; RESET CAR drops straight into
      // free driving, so make sure the old countdown overlay cannot linger.
      ui['countdown-layer'].classList.add('hidden');
      game.mode = 'race';
      game.pauseResumeMode = 'race';
      game.countdownStage = -1;
      env.startLights(0, false);
      if (document.body.classList.contains('touch')) ui['touch-controls'].classList.remove('hidden');
      audio && audio.setPaused(false);
      resetPlayerCar();
    });
    on('btn-quit', () => quitToMenu());
    on('btn-again', () => { ui.results.classList.add('hidden'); startRace(); });
    on('btn-menu', () => quitToMenu());
    on('btn-quality', () => applyQuality(game.quality === 'low' ? 'high' : 'low'));
    on('btn-sound', () => toggleSound());
  }

  function toggleSound() {
    ensureAudio();
    if (!audio) return;
    audio.setMuted(!audio.muted);
    if (ui['btn-sound']) {
      ui['btn-sound'].innerHTML = 'AUDIO <b>' + (audio.muted ? 'OFF' : 'ON') + '</b>';
      ui['btn-sound'].setAttribute('aria-pressed', String(!audio.muted));
    }
    if (!audio.muted) audio.startMusic();
    toast('AUDIO // <b>' + (audio.muted ? 'MUTED' : 'ONLINE') + '</b>');
  }

  /* ---------------------------------------------------------
     loop / resize
     --------------------------------------------------------- */
  function loop(now) {
    requestAnimationFrame(loop);
    if (!lastNow) lastNow = now;
    let dt = (now - lastNow) / 1000;
    lastNow = now;
    if (!(dt > 0)) dt = .016;
    dt = Math.min(dt, .05);
    elapsed += dt;
    update(dt);
    try {
      composer.render();
    } catch (err) {
      console.error(err);
      fatal(err);
    }
    updateFPS(dt);
  }

  function update(dt) {
    if (game.mode === 'menu') {
      updateRivals(dt);
      playerCar.update(dt, 0, 0, 0, 0, false, false);
    } else if (game.mode === 'countdown') {
      updateCountdown(dt);
      updateRivals(dt);
    } else if (game.mode === 'race') {
      race.time += dt;
      updatePlayer(dt);
      updateRivals(dt);
      updateRaceMeta(dt);
    } else if (game.mode === 'paused') {
      // keep the city alive but do not advance the race
    } else if (game.mode === 'finished') {
      updateRivals(dt);
    }

    updateCamera(dt);
    env.update(dt, elapsed, camera);
    const state = {
      drifting: game.mode === 'race' && player.drifting,
      boosting: game.mode === 'race' && player.boosting,
      handbrake: game.mode === 'race' && input.drift
    };
    fx.update(dt, elapsed, playerCar, player.speed, state);
    if (game.mode !== 'menu' && game.mode !== 'paused') updateHUD();
    if (game.mode === 'race' && !ui['countdown-layer'].classList.contains('hidden') && race.time > .85) {
      ui['countdown-layer'].classList.add('hidden');
    }
    // Countdown lets the player blip the throttle; the engine revs without
    // moving the car. A single mode-aware call avoids the countdown rev being
    // overwritten by the generic per-frame engine update.
    const countingDown = game.mode === 'countdown';
    const audioRpm = countingDown
      ? .18 + (input.gas ? .42 : .05)
      : getGear(Math.abs(player.speed) * 3.6).rpm;
    audio && audio.setEngine(
      game.mode === 'paused' ? 0 : player.speed,
      audioRpm,
      (game.mode === 'race' || countingDown) && input.gas ? 1 : 0,
      game.mode === 'race' && player.boosting,
      game.mode === 'paused'
    );
    if (game.mode === 'paused' || game.mode === 'menu') {
      audio && audio.setSkid(0);
      audio && audio.setNitro(0);
    }
  }

  function updateRaceMeta(dt) {
    game.rankTimer += dt;
    if (game.rankTimer > .18) {
      game.rankTimer = 0;
      game.rank = computeRank();
    }
    // hide countdown layer a bit after launch if still visible
    if (!ui['countdown-layer'].classList.contains('hidden') && race.countdown > 3.9) {
      ui['countdown-layer'].classList.add('hidden');
    }
  }

  function computeRank() {
    const pScore = player.finished
      ? LAPS * track.length + 5000 - player.finishTime * .01
      : player.progress;
    const entries = [{ id: 'player', p: pScore, fin: player.finished }];
    for (let i = 0; i < rivals.length; i++) {
      const r = rivals[i];
      entries.push({
        id: 'rival' + i,
        p: r.finished ? LAPS * track.length + 5000 - r.finishTime * .01 : r.progress,
        fin: r.finished
      });
    }
    entries.sort((a, b) => b.p - a.p);
    return entries.findIndex(e => e.id === 'player') + 1;
  }

  function updateFPS(dt) {
    game.fpsFrames++;
    game.fpsTime += dt;
    if (game.fpsTime >= .5) {
      game.fps = Math.round(game.fpsFrames / game.fpsTime);
      game.fpsFrames = 0;
      game.fpsTime = 0;
      if (ui && ui['menu-fps']) setText(ui['menu-fps'], String(game.fps));
    }
  }

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pr = pixelRatio();
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h);
    composer.setSize(w, h);
    composer.setPixelRatio(pr);
    if (fxaaPass) fxaaPass.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
  }

  function fatal(err) {
    console.error(err);
    const f = $('fatal');
    const l = $('loading');
    if (l) l.classList.add('hidden');
    if (f) {
      f.classList.remove('hidden');
      f.innerHTML = 'SYSTEM FAILURE // 启动失败<br><br>' +
        String(err && (err.stack || err.message) || err).replace(/</g, '&lt;').slice(0, 900) +
        '<br><br>CHECK CONSOLE / WEBGL SUPPORT';
    }
  }

  window.addEventListener('error', e => {
    console.error('Runtime error:', e.error || e.message);
  });

  init();
})(window.NR = window.NR || {});
