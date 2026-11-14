// 音频引擎：程序化合成 BGM（随关卡/Boss/菜单变化）+ 全套音效，零外部素材
import { LEVELS, MENU_MUSIC } from './config.js';
import { rand, randInt, pick, clamp } from './utils.js';

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  majorPent: [0, 2, 4, 7, 9],
  minorPent: [0, 3, 5, 7, 10],
};

const DRUMS = {
  four: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 4, 8, 12], hatOpen: [2, 6, 10, 14] },
  rock: { kick: [0, 7, 8, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  break: { kick: [0, 7, 10], snare: [4, 12, 15], hat: [0, 2, 4, 6, 8, 10, 12, 14, 15] },
  tense: { kick: [0, 8], snare: [12], hat: [0, 3, 6, 9, 12, 15] },
  none: null,
};

const BASS = {
  four: [0, 0, 12, 0, 0, 0, 12, 7, 0, 0, 12, 0, 0, 7, 12, 7],
  rock: [0, -1, 0, 0, -1, 0, -1, 0, 0, -1, 0, 0, -1, 7, -1, 7],
  break: [0, -1, -1, 0, -1, -1, 12, -1, 0, -1, -1, 7, -1, 0, -1, -1],
  tense: [0, -1, -1, -1, 0, -1, -1, -1, 0, -1, -1, -1, 0, -1, 1, -1],
  none: [],
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ok = false;
    this.musicVol = 0.75;
    this.sfxVol = 0.9;
    this.trackKey = '';
    this.cfg = null;
    this.step = 0;
    this.bar = 0;
    this.nextT = 0;
    this.timer = null;
    this.phrase = null;
    this.eng = null;
    this._alertT = 0;
  }

  // 必须在用户手势里调用
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const c = this.ctx;
        this.master = c.createGain(); this.master.gain.value = 0.9;
        this.master.connect(c.destination);
        this.musicGain = c.createGain(); this.musicGain.gain.value = this.musicVol;
        this.musicGain.connect(this.master);
        this.sfxGain = c.createGain(); this.sfxGain.gain.value = this.sfxVol;
        this.sfxGain.connect(this.master);
        // 主音延迟总线
        this.leadBus = c.createGain(); this.leadBus.gain.value = 1;
        const delay = c.createDelay(0.6); delay.delayTime.value = 0.22;
        const fb = c.createGain(); fb.gain.value = 0.32;
        this.leadBus.connect(this.musicGain);
        this.leadBus.connect(delay); delay.connect(fb); fb.connect(delay);
        delay.connect(this.musicGain);
        // 噪声缓冲
        const len = c.sampleRate;
        this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.ok = true;
        this._loadVol();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { console.warn('Audio init failed', e); }
  }

  suspend() { if (this.ok && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ok && this.ctx.state === 'suspended') this.ctx.resume(); }

  setMusicVol(v) { this.musicVol = clamp(v, 0, 1); if (this.ok) this.musicGain.gain.setTargetAtTime(this.musicVol, this.ctx.currentTime, 0.05); this._saveVol(); }
  setSfxVol(v) { this.sfxVol = clamp(v, 0, 1); if (this.ok) this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.05); this._saveVol(); }
  _saveVol() { try { localStorage.setItem('skystriker-audio', JSON.stringify({ m: this.musicVol, s: this.sfxVol })); } catch (e) {} }
  _loadVol() { try { const v = JSON.parse(localStorage.getItem('skystriker-audio')); if (v) { this.musicVol = v.m; this.sfxVol = v.s; this.musicGain.gain.value = v.m; this.sfxGain.gain.value = v.s; } } catch (e) {} }

  // ---- 基础合成 ----
  _tone(o) {
    if (!this.ok) return;
    const c = this.ctx, t = o.when ?? c.currentTime;
    const osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(1, o.f0), t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + o.dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.vol, t + (o.att || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g);
    g.connect(o.dest || this.sfxGain);
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.disconnect(); g.connect(f); f.connect(o.dest || this.sfxGain); }
    osc.start(t); osc.stop(t + o.dur + 0.1);
  }

  _noise(o) {
    if (!this.ok) return;
    const c = this.ctx, t = o.when ?? c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.ftype || 'lowpass';
    f.frequency.setValueAtTime(Math.max(20, o.f0 || 1000), t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.dur);
    f.Q.value = o.q || 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.vol, t + (o.att || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfxGain);
    src.start(t); src.stop(t + o.dur + 0.1);
  }

  // ---- 音效目录 ----
  sfx(name, v = 1) {
    if (!this.ok) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'shoot':
        this._tone({ type: 'triangle', f0: 1500, f1: 500, dur: 0.055, vol: 0.10 * v });
        this._noise({ dur: 0.03, vol: 0.05 * v, ftype: 'highpass', f0: 3000 });
        break;
      case 'shootE':
        this._tone({ type: 'sawtooth', f0: 620, f1: 240, dur: 0.09, vol: 0.07 * v, lp: 1400 });
        break;
      case 'missile':
        this._noise({ dur: 0.55, vol: 0.22 * v, f0: 2600, f1: 300 });
        this._tone({ type: 'sawtooth', f0: 240, f1: 70, dur: 0.5, vol: 0.12 * v, lp: 900 });
        break;
      case 'lockTick':
        this._tone({ type: 'square', f0: 1250, dur: 0.03, vol: 0.07 * v });
        break;
      case 'lockOn':
        this._tone({ type: 'square', f0: 1500, f1: 2100, dur: 0.13, vol: 0.1 * v });
        break;
      case 'hitPlayer':
        this._noise({ dur: 0.18, vol: 0.3 * v, ftype: 'highpass', f0: 500 });
        this._tone({ type: 'sawtooth', f0: 320, f1: 90, dur: 0.16, vol: 0.22 * v, lp: 1200 });
        break;
      case 'hitEnemy':
        this._tone({ type: 'square', f0: 880, f1: 660, dur: 0.03, vol: 0.06 * v });
        break;
      case 'explosionS':
        this._noise({ dur: 0.28, vol: 0.3 * v, f0: 2400, f1: 200 });
        this._tone({ type: 'sine', f0: 240, f1: 50, dur: 0.24, vol: 0.3 * v });
        break;
      case 'explosionM':
        this._noise({ dur: 0.5, vol: 0.42 * v, f0: 2000, f1: 120 });
        this._tone({ type: 'sine', f0: 200, f1: 36, dur: 0.45, vol: 0.42 * v });
        this._tone({ type: 'sawtooth', f0: 120, f1: 30, dur: 0.4, vol: 0.12 * v, lp: 500 });
        break;
      case 'explosionL':
        this._noise({ dur: 1.1, vol: 0.55 * v, f0: 1500, f1: 60, att: 0.01 });
        this._tone({ type: 'sine', f0: 160, f1: 26, dur: 1.0, vol: 0.55 * v });
        this._tone({ type: 'sawtooth', f0: 90, f1: 20, dur: 0.9, vol: 0.18 * v, lp: 400 });
        this._noise({ dur: 0.4, vol: 0.2 * v, ftype: 'highpass', f0: 900, when: now + 0.05 });
        break;
      case 'bomb':
        this._noise({ dur: 1.5, vol: 0.6 * v, f0: 1200, f1: 50 });
        this._tone({ type: 'sine', f0: 110, f1: 22, dur: 1.4, vol: 0.6 * v });
        break;
      case 'pickup':
        this._tone({ type: 'square', f0: 660, dur: 0.07, vol: 0.1 * v });
        this._tone({ type: 'square', f0: 990, dur: 0.09, vol: 0.1 * v, when: now + 0.08 });
        break;
      case 'powerup':
        [523, 659, 784, 1046].forEach((f, i) => this._tone({ type: 'square', f0: f, dur: 0.09, vol: 0.09 * v, when: now + i * 0.07 }));
        break;
      case 'warningSiren':
        for (let i = 0; i < 6; i++)
          this._tone({ type: 'square', f0: i % 2 ? 960 : 680, dur: 0.24, vol: 0.12 * v, when: now + i * 0.3, lp: 2200 });
        break;
      case 'missileAlert':
        this._tone({ type: 'square', f0: 1080, dur: 0.09, vol: 0.1 * v });
        break;
      case 'beamCharge':
        this._tone({ type: 'sawtooth', f0: 70, f1: 640, dur: 0.85, vol: 0.16 * v, lp: 1500 });
        break;
      case 'beamFire':
        this._tone({ type: 'sawtooth', f0: 58, dur: 0.5, vol: 0.24 * v, lp: 800 });
        this._noise({ dur: 0.5, vol: 0.2 * v, f0: 500, f1: 200, q: 2 });
        break;
      case 'lightning':
        this._noise({ dur: 0.3, vol: 0.28 * v, ftype: 'highpass', f0: 1200 });
        this._noise({ dur: 0.8, vol: 0.2 * v, f0: 400, f1: 60, when: now + 0.06 });
        break;
      case 'uiClick':
        this._tone({ type: 'square', f0: 840, dur: 0.045, vol: 0.08 * v });
        break;
      case 'uiStart':
        [392, 523, 659].forEach((f, i) => this._tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.1 * v, when: now + i * 0.06 }));
        break;
      case 'playerDeath':
        this.sfx('explosionL', 1);
        this._tone({ type: 'sawtooth', f0: 400, f1: 40, dur: 1.2, vol: 0.2 * v, lp: 900 });
        break;
      case 'bossDie':
        this._noise({ dur: 2.2, vol: 0.65 * v, f0: 900, f1: 40 });
        this._tone({ type: 'sine', f0: 130, f1: 18, dur: 2.2, vol: 0.6 * v });
        break;
      case 'boost':
        this._noise({ dur: 0.5, vol: 0.25 * v, f0: 400, f1: 3200, att: 0.08 });
        break;
    }
  }

  boomDuck() {
    if (!this.ok) return;
    const g = this.musicGain.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(this.musicVol * 0.35, t);
    g.setTargetAtTime(this.musicVol, t + 0.35, 0.5);
  }

  // ---- 引擎循环声 ----
  engineStart() {
    if (!this.ok || this.eng) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 220; f.Q.value = 1.1;
    const g = c.createGain(); g.gain.value = 0.05;
    const sub = c.createOscillator(); sub.type = 'sawtooth'; sub.frequency.value = 46;
    const subF = c.createBiquadFilter(); subF.type = 'lowpass'; subF.frequency.value = 160;
    const subG = c.createGain(); subG.gain.value = 0.045;
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    sub.connect(subF); subF.connect(subG); subG.connect(this.sfxGain);
    src.start(); sub.start();
    this.eng = { src, f, g, sub, subG };
  }
  engineSet(v) {
    if (!this.eng) return;
    const t = this.ctx.currentTime;
    this.eng.f.frequency.setTargetAtTime(180 + v * 520, t, 0.1);
    this.eng.g.gain.setTargetAtTime(0.035 + v * 0.075, t, 0.1);
    this.eng.sub.frequency.setTargetAtTime(42 + v * 26, t, 0.1);
    this.eng.subG.gain.setTargetAtTime(0.035 + v * 0.04, t, 0.1);
  }
  engineStop() {
    if (!this.eng) return;
    const { src, sub } = this.eng;
    try { src.stop(); sub.stop(); } catch (e) {}
    this.eng = null;
  }

  // ---- 音乐调度器 ----
  _degMidi(root, scale, deg) {
    const L = scale.length;
    return root + 12 * Math.floor(deg / L) + scale[((deg % L) + L) % L];
  }

  setTrack(key, cfg) {
    if (!this.ok) { this.trackKey = key; this._pendingCfg = cfg; return; }
    this.trackKey = key;
    this.cfg = cfg;
    this.step = 0;
    this.bar = 0;
    this.phrase = null;
    this.nextT = this.ctx.currentTime + 0.08;
    if (!this.timer) this.timer = setInterval(() => this._sched(), 25);
  }

  // 关卡 / Boss 曲目
  setLevelTrack(idx) { this.setTrack('level' + idx, LEVELS[idx].music); }
  setBossTrack(idx) {
    const m = LEVELS[idx].music;
    const minorish = ['minor', 'dorian', 'phrygian'].includes(m.scale);
    this.setTrack('boss' + idx, {
      bpm: m.bpm + 18,
      root: m.root - 2,
      scale: minorish ? 'phrygian' : 'minor',
      prog: [0, 5, 1, 4],
      drums: 'break',
      arp: Math.min(0.9, m.arp + 0.25),
      lead: true,
      bright: 1.0,
    });
  }
  setMenuTrack() { this.setTrack('menu', MENU_MUSIC); }
  stopTrack() {
    this.trackKey = '';
    this.cfg = null;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  _sched() {
    if (!this.ok || !this.cfg) return;
    const SPB = 60 / this.cfg.bpm / 4; // 每步（16 分音符）时长
    while (this.nextT < this.ctx.currentTime + 0.18) {
      this._playStep(this.step, this.bar, this.nextT, SPB);
      this.nextT += SPB;
      this.step++;
      if (this.step >= 16) { this.step = 0; this.bar++; }
    }
  }

  _genPhrase() {
    // 生成 4 小节旋律乐句
    const S = SCALES[this.cfg.scale] || SCALES.major;
    this.phrase = [];
    let deg = randInt(7, 11);
    for (let i = 0; i < 12; i++) {
      const step = i * randInt(1, 2) + randInt(0, 1);
      if (step > 15 || Math.random() < 0.22) continue;
      deg += pick([-2, -1, -1, 1, 1, 2, 3]);
      deg = clamp(deg, 6, 14);
      this.phrase.push({ bar: Math.floor(step / 4), step: step % 4 * 4, dur: rand(0.18, 0.3) });
      this.phrase[this.phrase.length - 1].deg = deg;
    }
    this.phraseBar = this.bar;
  }

  _playStep(step, bar, t, SPB) {
    const cfg = this.cfg;
    const S = SCALES[cfg.scale] || SCALES.major;
    const chordDeg = cfg.prog[bar % cfg.prog.length];
    const chordRoot = this._degMidi(cfg.root, S, chordDeg);
    const br = cfg.bright ?? 0.8;

    // 鼓
    const D = DRUMS[cfg.drums];
    if (D) {
      if (D.kick.includes(step)) this._kick(t, 0.85);
      if (D.snare.includes(step)) this._snare(t, 0.42);
      if (D.hat.includes(step)) this._hat(t, 0.16, false);
      if (D.hatOpen && D.hatOpen.includes(step)) this._hat(t, 0.2, true);
      if (bar % 4 === 3 && step >= 13 && Math.random() < 0.55) this._snare(t, 0.22);
    }
    // 贝斯
    const bp = BASS[cfg.drums];
    if (bp && bp[step] >= 0) {
      this._bass(t, chordRoot - 12 + bp[step], SPB * 1.7, 0.4, br);
    }
    // 和声垫（每小节开始）
    if (step === 0) {
      const third = this._degMidi(cfg.root, S, chordDeg + 2);
      const fifth = this._degMidi(cfg.root, S, chordDeg + 4);
      this._pad(t, [chordRoot, third, fifth], SPB * 16, 0.13, br);
    }
    // 琶音
    if (Math.random() < cfg.arp) {
      const deg = 7 + randInt(0, 6);
      this._arp(t, this._degMidi(cfg.root, S, deg), SPB * 0.95, 0.09, br);
    }
    // 主旋律（4 小节乐句，偶数小节演奏）
    if (cfg.lead) {
      if (step === 0 && bar % 4 === 0) this._genPhrase();
      if (this.phrase && bar % 2 === 1) {
        const rel = bar % 4;
        for (const n of this.phrase) {
          if (n.bar === rel && n.step === step) {
            this._lead(t, this._degMidi(cfg.root, S, n.deg), n.dur, 0.13, br);
          }
        }
      }
    }
  }

  // ---- 乐器 ----
  _kick(t, v) {
    this._tone({ type: 'sine', f0: 150, f1: 42, dur: 0.13, vol: 0.5 * v, when: t, dest: this.musicGain });
    this._noise({ dur: 0.02, vol: 0.12 * v, ftype: 'highpass', f0: 4000, when: t, dest: this.musicGain });
  }
  _snare(t, v) {
    this._noise({ dur: 0.12, vol: 0.3 * v, ftype: 'bandpass', f0: 1900, q: 0.8, when: t, dest: this.musicGain });
    this._tone({ type: 'triangle', f0: 190, f1: 120, dur: 0.06, vol: 0.2 * v, when: t, dest: this.musicGain });
  }
  _hat(t, v, open) {
    this._noise({ dur: open ? 0.16 : 0.035, vol: (open ? 0.16 : 0.1) * v, ftype: 'highpass', f0: 7200, when: t, dest: this.musicGain });
  }
  _bass(t, midi, dur, v, br) {
    if (!this.ok) return;
    const c = this.ctx;
    const osc = c.createOscillator(); osc.type = 'square';
    osc.frequency.setValueAtTime(mtof(midi), t);
    const f = c.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(300 + br * 700, t);
    f.frequency.exponentialRampToValueAtTime(160, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(f); f.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.1);
  }
  _pad(t, midis, dur, v, br) {
    if (!this.ok) return;
    const c = this.ctx;
    for (const m of midis) {
      for (const det of [-6, 6]) {
        const osc = c.createOscillator(); osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(mtof(m), t);
        osc.detune.setValueAtTime(det, t);
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420 + br * 1600;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v / 3, t + dur * 0.25);
        g.gain.setValueAtTime(v / 3, t + dur * 0.7);
        g.gain.linearRampToValueAtTime(0, t + dur);
        osc.connect(f); f.connect(g); g.connect(this.musicGain);
        osc.start(t); osc.stop(t + dur + 0.1);
      }
    }
  }
  _arp(t, midi, dur, v, br) {
    if (!this.ok) return;
    const c = this.ctx;
    const osc = c.createOscillator(); osc.type = 'triangle';
    osc.frequency.setValueAtTime(mtof(midi), t);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900 + br * 3000;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(f); f.connect(g); g.connect(this.musicGain);
    osc.start(t); osc.stop(t + dur + 0.1);
  }
  _lead(t, midi, dur, v, br) {
    if (!this.ok) return;
    const c = this.ctx;
    const osc = c.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(mtof(midi), t);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200 + br * 3600;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.4);
    osc.connect(f); f.connect(g); g.connect(this.leadBus);
    osc.start(t); osc.stop(t + dur * 1.6 + 0.1);
  }

  // ---- 一次性过场曲 ----
  playStinger(kind) {
    if (!this.ok) return;
    const now = this.ctx.currentTime;
    if (kind === 'victory') {
      const notes = [60, 64, 67, 72, 67, 72, 76];
      notes.forEach((m, i) => {
        this._tone({ type: 'triangle', f0: mtof(m), dur: i === 6 ? 1.2 : 0.22, vol: 0.16, when: now + i * 0.16, dest: this.leadBus });
        this._tone({ type: 'sawtooth', f0: mtof(m - 12), dur: i === 6 ? 1.2 : 0.2, vol: 0.07, when: now + i * 0.16, lp: 1200, dest: this.leadBus });
      });
    } else if (kind === 'gameover') {
      const notes = [57, 53, 50, 45];
      notes.forEach((m, i) => {
        this._tone({ type: 'sawtooth', f0: mtof(m), dur: 0.9, vol: 0.13, when: now + i * 0.55, lp: 900, dest: this.leadBus });
        this._tone({ type: 'sine', f0: mtof(m - 12), dur: 1.0, vol: 0.14, when: now + i * 0.55 });
      });
    }
  }
}

export const Audio = new AudioEngine();
