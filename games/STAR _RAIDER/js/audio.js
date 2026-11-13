/* 用 WebAudio 实时合成音效，不依赖任何外部音频文件 */
(function () {
  'use strict';
  const SR = (window.SR = window.SR || {});
  const U = SR.utils;
  const CFG = SR.CONFIG;

  class SoundFX {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.muted = U.storageGet(CFG.STORAGE.muted, '0') === '1';
      this.shotCount = 0;
      this.enabled = true;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return this.ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        this.enabled = false;
        return null;
      }
      try {
        this.ctx = new AC();
      } catch (err) {
        this.enabled = false;
        return null;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);

      // 预生成 1 秒白噪声，供爆炸/受击音效复用
      const len = Math.floor(this.ctx.sampleRate * 1.0);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
      return this.ctx;
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    setMuted(muted) {
      this.muted = muted;
      U.storageSet(CFG.STORAGE.muted, muted ? '1' : '0');
      if (this.master && this.ctx) {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(this.master.gain.value, t);
        this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.55, t + 0.12);
      }
    }

    toggle() {
      this.setMuted(!this.muted);
      if (!this.muted) this.ui();
      return this.muted;
    }

    _tone(opts) {
      if (!this.enabled || this.muted) return;
      this.init();
      if (!this.ctx || !this.master) return;
      const {
        f0 = 440,
        f1 = null,
        dur = 0.12,
        type = 'sine',
        vol = 0.08,
        when = 0,
        attack = 0.006
      } = opts;
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, f0), t0);
      if (f1 !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      }
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    _noise(opts) {
      if (!this.enabled || this.muted) return;
      this.init();
      if (!this.ctx || !this.master || !this.noiseBuffer) return;
      const {
        dur = 0.25,
        vol = 0.1,
        when = 0,
        f0 = 1200,
        f1 = 100,
        type = 'lowpass',
        q = 0.8
      } = opts;
      const t0 = this.ctx.currentTime + when;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.Q.value = q;
      filter.frequency.setValueAtTime(Math.max(40, f0), t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.03);
    }

    ui() {
      this._tone({ f0: 620, f1: 880, dur: 0.07, type: 'triangle', vol: 0.05 });
    }

    shoot() {
      this.shotCount = (this.shotCount + 1) % 3;
      if (this.shotCount !== 0) return;
      this._tone({
        f0: 1180,
        f1: 760,
        dur: 0.055,
        type: 'square',
        vol: 0.017
      });
      this._tone({ f0: 2400, f1: 1600, dur: 0.035, type: 'sine', vol: 0.012 });
    }

    enemyShoot() {
      this._tone({ f0: 420, f1: 240, dur: 0.09, type: 'sawtooth', vol: 0.018 });
    }

    hit() {
      this._noise({ dur: 0.06, vol: 0.035, f0: 1800, f1: 500, type: 'bandpass', q: 1.2 });
      this._tone({ f0: 320, f1: 160, dur: 0.05, type: 'triangle', vol: 0.025 });
    }

    explode(size = 1) {
      const big = size > 1.4;
      this._noise({
        dur: big ? 0.6 : 0.34,
        vol: big ? 0.22 : 0.12,
        f0: big ? 2600 : 1700,
        f1: 70,
        type: 'lowpass'
      });
      this._tone({
        f0: big ? 150 : 190,
        f1: 38,
        dur: big ? 0.55 : 0.3,
        type: 'sine',
        vol: big ? 0.2 : 0.1
      });
    }

    playerExplode() {
      this._noise({ dur: 0.85, vol: 0.28, f0: 3200, f1: 50, type: 'lowpass' });
      this._tone({ f0: 220, f1: 32, dur: 0.8, type: 'sawtooth', vol: 0.16 });
      this._tone({ f0: 90, f1: 28, dur: 1.0, type: 'sine', vol: 0.2, when: 0.05 });
    }

    hurt() {
      this._tone({ f0: 180, f1: 60, dur: 0.22, type: 'square', vol: 0.08 });
    }

    pickup() {
      const notes = [660, 880, 1320];
      notes.forEach((f, i) => {
        this._tone({
          f0: f,
          f1: f * 1.02,
          dur: 0.09,
          type: 'triangle',
          vol: 0.07,
          when: i * 0.055
        });
      });
    }

    shield() {
      this._tone({ f0: 280, f1: 920, dur: 0.3, type: 'sine', vol: 0.09 });
      this._tone({ f0: 560, f1: 1400, dur: 0.32, type: 'triangle', vol: 0.04, when: 0.03 });
    }

    bomb() {
      this._noise({ dur: 0.9, vol: 0.26, f0: 4200, f1: 60, type: 'lowpass' });
      this._tone({ f0: 120, f1: 30, dur: 0.9, type: 'sine', vol: 0.24 });
      this._tone({ f0: 900, f1: 120, dur: 0.5, type: 'sawtooth', vol: 0.06 });
    }

    wave() {
      this._tone({ f0: 440, f1: 440, dur: 0.1, type: 'triangle', vol: 0.05 });
      this._tone({ f0: 660, f1: 660, dur: 0.14, type: 'triangle', vol: 0.05, when: 0.11 });
    }

    waveClear() {
      [523, 659, 784, 1046].forEach((f, i) => {
        this._tone({
          f0: f,
          dur: 0.12,
          type: 'triangle',
          vol: 0.05,
          when: i * 0.07
        });
      });
    }

    bossWarn() {
      [0, 0.28, 0.56].forEach((when) => {
        this._tone({ f0: 240, f1: 180, dur: 0.2, type: 'sawtooth', vol: 0.06, when });
        this._tone({ f0: 120, f1: 90, dur: 0.22, type: 'square', vol: 0.035, when });
      });
    }

    bossExplode() {
      this._noise({ dur: 1.4, vol: 0.3, f0: 3600, f1: 40, type: 'lowpass' });
      this._tone({ f0: 160, f1: 26, dur: 1.3, type: 'sawtooth', vol: 0.18 });
      this._tone({ f0: 70, f1: 22, dur: 1.6, type: 'sine', vol: 0.24, when: 0.08 });
    }

    gameOver() {
      [440, 349, 262, 175, 110].forEach((f, i) => {
        this._tone({
          f0: f,
          f1: f * 0.94,
          dur: 0.3,
          type: 'triangle',
          vol: 0.075,
          when: i * 0.19
        });
      });
    }
  }

  SR.SoundFX = SoundFX;
})();
