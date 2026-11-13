function safeStorageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = safeStorageGet('mobius-muted') === '1';
    this.mode = 'menu';
    this.ready = false;
    this.lastUpdate = 0;
    this.engineLevel = 0;
    this.gear = 1;
    this.lastGear = 1;
  }

  _gestureAllowed() {
    if (!navigator.userActivation) return true;
    return navigator.userActivation.hasBeenActive;
  }

  _active() {
    return this.ready && this.ctx && this.ctx.state === 'running';
  }

  init() {
    if (this.ready) {
      if (this.ctx.state === 'suspended' && this._gestureAllowed()) {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    // Do not create an AudioContext before the first user gesture: browsers will
    // start it suspended and log autoplay warnings for every scheduled sound.
    if (!this._gestureAllowed()) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.48;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 20;
      comp.ratio.value = 5;
      comp.attack.value = 0.003;
      comp.release.value = 0.22;
      this.master.connect(comp).connect(ctx.destination);

      this._buildNoise();
      this._buildEngine();
      this._buildAmbient();
      this._buildWind();
      this.ready = true;
    } catch (err) {
      console.warn('Audio unavailable', err);
    }
  }

  _buildNoise() {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  _buildEngine() {
    const ctx = this.ctx;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 260;
    this.engineFilter.Q.value = 1.4;
    this.engineMix = ctx.createGain();
    this.engineMix.gain.value = 0.2;
    this.engineMix.connect(this.engineFilter).connect(this.engineGain).connect(this.master);

    this.oscA = ctx.createOscillator();
    this.oscA.type = 'sawtooth';
    this.oscA.frequency.value = 55;
    this.oscB = ctx.createOscillator();
    this.oscB.type = 'square';
    this.oscB.frequency.value = 27.5;
    this.oscC = ctx.createOscillator();
    this.oscC.type = 'sine';
    this.oscC.frequency.value = 27.5;

    const gA = ctx.createGain(); gA.gain.value = 0.32;
    const gB = ctx.createGain(); gB.gain.value = 0.16;
    const gC = ctx.createGain(); gC.gain.value = 0.5;
    this.oscA.connect(gA).connect(this.engineMix);
    this.oscB.connect(gB).connect(this.engineMix);
    this.oscC.connect(gC).connect(this.engineMix);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 6.2;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2.2;
    lfo.connect(lfoGain);
    lfoGain.connect(this.oscA.frequency);
    lfoGain.connect(this.oscB.frequency);

    this.oscA.start();
    this.oscB.start();
    this.oscC.start();
    lfo.start();
  }

  _buildAmbient() {
    const ctx = this.ctx;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.8;
    this.ambientFilter = filter;
    this.ambientGain.connect(this.master);
    filter.connect(this.ambientGain);
    const freqs = [55, 82.5, 110, 164.81];
    const gains = [0.012, 0.008, 0.006, 0.004];
    this.ambientOscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.value = gains[i];
      osc.connect(gain).connect(filter);
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2 + i * 1.2;
      lfo.connect(lfoGain).connect(osc.detune);
      osc.start();
      lfo.start();
      return osc;
    });
  }

  _buildWind() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    src.connect(filter).connect(this.windGain).connect(this.master);
    src.start();
    this.windFilter = filter;
  }

  toggleMute() {
    this.muted = !this.muted;
    safeStorageSet('mobius-muted', this.muted ? '1' : '0');
    if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.48, now, 0.05);
    }
    return this.muted;
  }

  setMode(mode) {
    this.mode = mode;
    if (!this.ready || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.setTargetAtTime(mode === 'menu' ? 0.55 : mode === 'paused' ? 0.35 : 0.16, now, 0.8);
    this.ambientFilter.frequency.setTargetAtTime(mode === 'race' ? 280 : 520, now, 0.7);
  }

  // Zero the engine / wind loops. During a race their gain targets are rewrit-
  // ten every frame, but once the race stops updating (pause, quit to menu)
  // nothing resets them and they drone forever. Called on pause and quit.
  stopDriving() {
    if (!this.ready || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.engineGain.gain.cancelScheduledValues(now);
    this.engineGain.gain.setTargetAtTime(0, now, 0.1);
    this.engineFilter.frequency.setTargetAtTime(220, now, 0.15);
    this.windGain.gain.cancelScheduledValues(now);
    this.windGain.gain.setTargetAtTime(0, now, 0.1);
  }

  update(speedRatio, throttle, active, boost, drifting) {
    if (!this.ready || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now - this.lastUpdate < 0.055) return;
    this.lastUpdate = now;

    const sr = Math.max(0, Math.min(1.3, speedRatio));
    const gear = Math.min(5, Math.floor(sr * 5.2));
    if (gear !== this.lastGear && sr > 0.05) {
      this.lastGear = gear;
      this._blip(1020, 0.03, 0.025, 'square');
    }
    const gearLocal = (sr * 5.2) % 1;
    const freq = 46 + sr * 128 + gearLocal * 16 + (boost ? 26 : 0);
    const engineTarget = active ? 0.055 + Math.min(1, throttle) * 0.055 + sr * 0.025 : 0;
    const filterFreq = active ? 220 + sr * 1150 + Math.min(1, throttle) * 250 : 220;

    this.oscA.frequency.setTargetAtTime(freq, now, 0.06);
    this.oscB.frequency.setTargetAtTime(freq * 0.502, now, 0.07);
    this.oscC.frequency.setTargetAtTime(freq * 0.25, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
    this.engineGain.gain.setTargetAtTime(engineTarget, now, 0.09);
    this.windGain.gain.setTargetAtTime(active ? 0.018 + sr * 0.045 + (drifting ? 0.015 : 0) : 0, now, 0.12);
    this.windFilter.frequency.setTargetAtTime(700 + sr * 1200, now, 0.1);
  }

  _envelope(gainNode, start, attack, duration, peak) {
    const now = this.ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(Math.max(0.0001, start), now);
    gainNode.gain.linearRampToValueAtTime(peak, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  }

  _blip(freq = 660, duration = 0.08, volume = 0.06, type = 'sine') {
    if (!this._active()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(this.master);
    this._envelope(gain, 0.0001, 0.005, duration, volume);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  _chord(freqs, duration = 0.4, volume = 0.035, type = 'triangle') {
    if (!this._active()) return;
    freqs.forEach((f, i) => {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      gain.gain.value = 0.0001;
      osc.connect(gain).connect(this.master);
      const now = ctx.currentTime + i * 0.04;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    });
  }

  ui() {
    if (!this._active()) return;
    this._blip(780, 0.045, 0.025, 'triangle');
  }

  countdown(n) {
    if (!this._active()) return;
    if (n === 0) {
      this._blip(1040, 0.2, 0.06, 'square');
      setTimeout(() => this._chord([523.25, 783.99, 1046.5], 0.5, 0.03), 20);
    } else {
      this._blip(430 + (3 - n) * 35, 0.09, 0.045, 'square');
    }
  }

  lap(final = false) {
    if (!this._active()) return;
    if (final) {
      this._chord([392, 523.25, 659.25, 783.99], 0.6, 0.035);
    } else {
      this._blip(880, 0.08, 0.03, 'sine');
      setTimeout(() => this._blip(1174.66, 0.12, 0.025, 'sine'), 80);
    }
  }

  finish(victory) {
    if (!this._active()) return;
    const notes = victory
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [392, 493.88, 587.33, 783.99];
    notes.forEach((f, i) => setTimeout(() => this._blip(f, 0.25, 0.035, 'triangle'), i * 105));
  }

  boost() {
    if (!this._active()) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter).connect(gain).connect(this.master);
    const now = ctx.currentTime;
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    src.start(now);
    src.stop(now + 0.55);
  }

  collision(intensity = 1) {
    if (!this._active()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.25);
    gain.gain.setValueAtTime(0.16 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.35);

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    src.connect(f).connect(g).connect(this.master);
    src.start(now);
    src.stop(now + 0.22);
  }

  scrape(intensity = 1) {
    if (!this._active()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.028 * intensity, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    src.connect(f).connect(g).connect(this.master);
    src.start(now);
    src.stop(now + 0.16);
  }

  pauseTone() {
    this._blip(260, 0.12, 0.035, 'sine');
  }
}
