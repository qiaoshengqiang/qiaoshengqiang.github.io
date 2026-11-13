/* ============================================================
   NEON RUNNER // procedural audio (engine, rain, synth score)
   ============================================================ */
(function (NR) {
  'use strict';

  function AudioEngine() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.paused = false;
    this.volume = .8;
    this.musicOn = true;
    this._engineOn = false;
    this._step = 0;
    this._nextTime = 0;
    this._timer = null;
  }

  AudioEngine.prototype.init = function () {
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      const ctx = this.ctx = new AC();
      this.ready = true;
      const master = this.master = ctx.createGain();
      master.gain.value = this.volume;
      const comp = this.comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 5;
      comp.attack.value = .004;
      comp.release.value = .22;
      master.connect(comp);
      comp.connect(ctx.destination);

      const music = this.musicGain = ctx.createGain();
      music.gain.value = .34;
      music.connect(master);
      const sfx = this.sfxGain = ctx.createGain();
      sfx.gain.value = .9;
      sfx.connect(master);
      this.musicBus = music;
      this.sfxBus = sfx;

      // shared noise
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;

      this._buildEngine();
      this._buildWind();
      this._buildRoll();
      this._buildRain();
      this._buildSkid();
      this._buildNitro();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    } catch (e) {
      console.warn('Audio init failed', e);
      this.ready = false;
      return false;
    }
  };

  AudioEngine.prototype._noiseLoop = function (filterType, freq, q, gainVal, bus) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType; filter.frequency.value = freq; filter.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gainVal;
    src.connect(filter); filter.connect(g); g.connect(bus || this.sfxBus);
    src.start();
    return { src, filter, gain: g };
  };

  AudioEngine.prototype._buildEngine = function () {
    const ctx = this.ctx;
    const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(this.sfxBus);

    // Soft saturation turns the stacked saws into a mechanical growl instead
    // of a thin buzz, and gives the engine a little "load" character.
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 2.4) * .85;
    }
    shaper.curve = curve; shaper.oversample = '2x';

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 900;
    filter.Q.value = 1.6;
    filter.connect(shaper); shaper.connect(bus);

    // Four layers: fundamental, upper harmonic, sub-octave and a high
    // "cam" harmonic. Detuning the upper layer avoids a sterile synth tone.
    const osc1 = ctx.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 70;
    const osc2 = ctx.createOscillator(); osc2.type = 'sawtooth'; osc2.frequency.value = 140; osc2.detune.value = 11;
    const osc3 = ctx.createOscillator(); osc3.type = 'sawtooth'; osc3.frequency.value = 210; osc3.detune.value = -7;
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 35;
    const g1 = ctx.createGain(); g1.gain.value = .22;
    const g2 = ctx.createGain(); g2.gain.value = .10;
    const g3 = ctx.createGain(); g3.gain.value = .045;
    const g3b = ctx.createGain(); g3b.gain.value = .34;
    osc1.connect(g1); g1.connect(filter);
    osc2.connect(g2); g2.connect(filter);
    osc3.connect(g3); g3.connect(filter);
    sub.connect(g3b); g3b.connect(bus);

    // exhaust rasp: band-limited noise, follows throttle and revs
    const exSrc = ctx.createBufferSource();
    exSrc.buffer = this.noiseBuf; exSrc.loop = true;
    const exFilter = ctx.createBiquadFilter();
    exFilter.type = 'bandpass'; exFilter.frequency.value = 240; exFilter.Q.value = .8;
    const exGain = ctx.createGain(); exGain.gain.value = 0;
    exSrc.connect(exFilter); exFilter.connect(exGain); exGain.connect(bus);

    // intake / turbo whistle
    const whine = ctx.createOscillator(); whine.type = 'sine'; whine.frequency.value = 760;
    const whineGain = ctx.createGain(); whineGain.gain.value = 0;
    whine.connect(whineGain); whineGain.connect(bus);

    [osc1, osc2, osc3, sub, exSrc, whine].forEach(o => o.start());
    this.engine = {
      bus, filter, shaper, osc1, osc2, osc3, sub, whine, whineGain,
      exGain, exFilter, gain: bus,
      lastRpm: -1, lastShift: -1, lastBoost: false
    };
  };

  AudioEngine.prototype._buildWind = function () {
    const w = this._noiseLoop('bandpass', 700, .6, 0, this.sfxBus);
    this.wind = w;
  };
  AudioEngine.prototype._buildRain = function () {
    const r = this._noiseLoop('highpass', 2400, .4, 0, this.sfxBus);
    this.rain = r;
    if (r) r.gain.gain.value = .028;
  };
  AudioEngine.prototype._buildRoll = function () {
    this.roll = this._noiseLoop('bandpass', 400, .9, 0, this.sfxBus);
  };
  AudioEngine.prototype._buildSkid = function () {
    const s = this._noiseLoop('bandpass', 1700, 3, 0, this.sfxBus);
    this.skid = s;
  };
  AudioEngine.prototype._buildNitro = function () {
    const n = this._noiseLoop('highpass', 1100, .5, 0, this.sfxBus);
    this.nitro = n;
  };

  AudioEngine.prototype.setEngine = function (speed, rpm, throttle, boosting, paused) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const e = this.engine;
    const sp = Math.abs(speed);
    const on = !paused && (sp > .2 || throttle > .02);
    const speedK = NR.clamp(sp / 92, 0, 1);
    rpm = NR.clamp(rpm || 0, 0, 1.1);

    // Engine loudness: present at idle, swells with speed and throttle, but
    // leaves headroom for music and skids.
    const targetGain = on ? (.10 + .15 * speedK + .045 * throttle + (boosting ? .035 : 0)) : 0;
    e.bus.gain.setTargetAtTime(targetGain, t, .07);

    const f = 52 + rpm * 168 + sp * .32 + (boosting ? 14 : 0);
    e.osc1.frequency.setTargetAtTime(f, t, .045);
    e.osc2.frequency.setTargetAtTime(f * 2.01, t, .055);
    e.osc3.frequency.setTargetAtTime(f * 3.02, t, .06);
    e.sub.frequency.setTargetAtTime(f * .5, t, .06);
    const cutoff = 420 + rpm * 1900 + throttle * 620 + speedK * 500 + (boosting ? 300 : 0);
    e.filter.frequency.setTargetAtTime(cutoff, t, .07);
    e.filter.Q.setTargetAtTime(1.25 + throttle * 1.1, t, .1);

    // Exhaust noise gives the engine a rough, real-world edge.
    e.exGain.gain.setTargetAtTime(on ? (.018 + throttle * .055 + rpm * .028 + speedK * .02) : 0, t, .06);
    e.exFilter.frequency.setTargetAtTime(190 + rpm * 280 + throttle * 90, t, .08);

    // Turbo / intake whistle.
    const whineTarget = on
      ? (boosting ? .05 : .004 + speedK * .012 + throttle * .006)
      : 0;
    e.whineGain.gain.setTargetAtTime(whineTarget, t, .1);
    e.whine.frequency.setTargetAtTime(720 + sp * 9 + (boosting ? 460 : 0), t, .1);

    // Gear-shift: a quick ignition cut + exhaust pop instead of a silent pitch
    // jump. rpm drops sharply at every upshift, which is what we listen for.
    if (e.lastRpm > 0 && e.lastRpm - rpm > .16 && sp > 8 && t - e.lastShift > .32) {
      e.lastShift = t;
      this.noise(t, .09, .10, 'lowpass', 1100, this.sfxBus);
      this.tone(78, t, .10, 'square', .05, this.sfxBus, 340);
    }
    // Small backfire when boost engages.
    if (boosting && !e.lastBoost) {
      this.noise(t, .18, .09, 'highpass', 1500, this.sfxBus);
      this.tone(96, t, .16, 'sawtooth', .05, this.sfxBus, 700);
    }
    e.lastRpm = rpm;
    e.lastBoost = !!boosting;

    // rolling asphalt rumble
    if (this.roll) {
      this.roll.gain.gain.setTargetAtTime(on ? speedK * .035 : 0, t, .18);
      this.roll.filter.frequency.setTargetAtTime(300 + sp * 4.5, t, .2);
    }
    // wind
    const wg = Math.pow(NR.clamp(sp / 95, 0, 1), 1.7) * .19;
    this.wind.gain.gain.setTargetAtTime(paused ? 0 : wg, t, .22);
    this.wind.filter.frequency.setTargetAtTime(500 + sp * 18, t, .2);
    // rain always
    this.rain.gain.gain.setTargetAtTime(paused ? .008 : .028, t, .3);
  };

  AudioEngine.prototype.setSkid = function (amount) {
    if (!this.ready) return;
    this.skid.gain.gain.setTargetAtTime(NR.clamp(amount, 0, 1) * .12, this.ctx.currentTime, .06);
    this.skid.filter.frequency.setTargetAtTime(1200 + amount * 900, this.ctx.currentTime, .08);
  };
  AudioEngine.prototype.setNitro = function (amount) {
    if (!this.ready) return;
    this.nitro.gain.gain.setTargetAtTime(NR.clamp(amount, 0, 1) * .12, this.ctx.currentTime, .05);
  };

  AudioEngine.prototype.tone = function (freq, when, dur, type, gain, dest, filterFreq) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    let node = g;
    if (filterFreq) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = filterFreq;
      g.connect(f); node = f;
    }
    o.connect(g);
    node.connect(dest || this.sfxBus);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain == null ? .12 : gain, when + .008);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.start(when); o.stop(when + dur + .02);
  };

  AudioEngine.prototype.noise = function (when, dur, gain, filterType, freq, dest) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filterType || 'highpass';
    f.frequency.value = freq || 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxBus);
    src.start(when); src.stop(when + dur + .03);
  };

  AudioEngine.prototype.impact = function (strength) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const k = NR.clamp(strength || .5, .1, 1);
    this.noise(t, .18 + k * .25, .20 * k, 'lowpass', 900 + k * 800);
    this.tone(64, t, .28, 'sine', .25 * k, this.sfxBus, 220);
    this.tone(120, t, .12, 'square', .07 * k, this.sfxBus, 500);
    // metal ring
    this.tone(880, t + .01, .3, 'triangle', .045 * k, this.sfxBus);
  };

  AudioEngine.prototype.countdown = function (final) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.tone(final ? 880 : 440, t, final ? .55 : .16, 'square', final ? .10 : .075, this.sfxBus, 2200);
    if (final) {
      this.tone(1320, t + .02, .7, 'sawtooth', .045, this.sfxBus, 3000);
      this.tone(660, t + .02, .7, 'triangle', .055, this.sfxBus);
    }
  };

  AudioEngine.prototype.lap = function (best) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const notes = best ? [660, 880, 1100, 1320] : [660, 880, 990];
    notes.forEach((f, i) => this.tone(f, t + i * .075, .28, 'triangle', .07, this.sfxBus));
  };

  AudioEngine.prototype.checkpoint = function () {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.tone(1046, t, .1, 'sine', .05, this.sfxBus);
    this.tone(1568, t + .06, .16, 'sine', .04, this.sfxBus);
  };

  AudioEngine.prototype.ui = function (up) {
    if (!this.ready) return;
    this.tone(up ? 720 : 420, this.ctx.currentTime, .06, 'square', .04, this.sfxBus, 2000);
  };

  AudioEngine.prototype.nitroFire = function () {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.noise(t, .35, .12, 'highpass', 1600);
    this.tone(180, t, .35, 'sawtooth', .05, this.sfxBus, 900);
  };

  AudioEngine.prototype.setMuted = function (m) {
    this.muted = m;
    if (!this.ready) return;
    this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, .05);
  };
  AudioEngine.prototype.toggleMute = function () {
    this.setMuted(!this.muted);
    return this.muted;
  };
  AudioEngine.prototype.setPaused = function (p) {
    this.paused = p;
    if (!this.ready) return;
    this.musicGain.gain.setTargetAtTime(p ? .12 : .34, this.ctx.currentTime, .25);
    if (p) {
      this.setSkid(0); this.setNitro(0);
      this.wind.gain.gain.setTargetAtTime(0, this.ctx.currentTime, .15);
      if (this.roll) this.roll.gain.gain.setTargetAtTime(0, this.ctx.currentTime, .12);
      if (this.engine) this.engine.bus.gain.setTargetAtTime(0, this.ctx.currentTime, .08);
    }
  };

  /* ---------------- music sequencer ---------------- */
  AudioEngine.prototype.startMusic = function () {
    if (!this.ready || !this.musicOn || this._timer) return;
    this._nextTime = this.ctx.currentTime + .08;
    this._step = 0;
    this._timer = setInterval(() => this._schedule(), 40);
  };
  AudioEngine.prototype.stopMusic = function () {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  };

  AudioEngine.prototype._schedule = function () {
    if (!this.ready || this.paused || this.muted) return;
    const now = this.ctx.currentTime;
    const stepDur = 0.125; // 120 bpm 16ths
    if (this._nextTime < now - .4) this._nextTime = now + .06;
    while (this._nextTime < now + .18) {
      this._playStep(this._step, this._nextTime, stepDur);
      this._nextTime += stepDur;
      this._step = (this._step + 1) % 64;
    }
  };

  AudioEngine.prototype._playStep = function (step, t, stepDur) {
    const bus = this.musicGain;
    const minor = [0, 3, 5, 7, 10, 12];
    const root = 55; // A1
    const chordRoot = [55, 55, 43.65, 49]; // A, A, F, G
    // kick
    if (step % 8 === 0) {
      const o = this.ctx.createOscillator(); o.type = 'sine';
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(42, t + .18);
      g.gain.setValueAtTime(.34, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .24);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + .26);
    }
    // hat
    if (step % 2 === 0) {
      this.noise(t, .035, step % 8 === 4 ? .035 : .02, 'highpass', 6200, bus);
    }
    // snare
    if (step % 16 === 8) {
      this.noise(t, .14, .06, 'bandpass', 1800, bus);
      this.tone(190, t, .13, 'triangle', .035, bus);
    }
    // bass
    if (step % 2 === 0) {
      const bar = Math.floor(step / 16) % 4;
      const seq = [0, 0, 7, 0, 3, 0, 10, 7];
      const n = seq[(step / 2 | 0) % 8];
      const f = chordRoot[bar] * Math.pow(2, n / 12);
      this.tone(f, t, .16, 'sawtooth', .075, bus, 460);
      this.tone(f * 2, t, .12, 'square', .022, bus, 900);
    }
    // arp
    if (step % 4 === 2) {
      const bar = Math.floor(step / 16) % 4;
      const idx = ((step / 4 | 0) * 3) % minor.length;
      const f = chordRoot[bar] * 4 * Math.pow(2, minor[idx] / 12);
      this.tone(f, t, .22, 'triangle', .028, bus, 2400);
    }
    // pad every 16 steps
    if (step % 16 === 0) {
      const bar = Math.floor(step / 16) % 4;
      const r = chordRoot[bar];
      [1, 1.5, 1.19, 2.0].forEach((mul, i) => {
        this.tone(r * 2 * mul, t, 1.85, 'sawtooth', .019, bus, 700 + i * 120);
      });
    }
  };

  NR.AudioEngine = AudioEngine;
})(window.NR = window.NR || {});
