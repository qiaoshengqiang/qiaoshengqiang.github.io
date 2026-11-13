import { TRACKS, Track } from './track.js';
import { LIVERIES } from './car.js';
import { clamp, formatTime, formatDelta, ordinalZh } from './utils.js';

const $ = (id) => document.getElementById(id);

function hexRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

export class UI {
  constructor(callbacks) {
    this.cb = callbacks;
    this.trackLengths = TRACKS.map((c) => new Track(c).getLapLength());
    this.helpOpen = false;
    this.pauseOpen = false;
    this.selectedTrack = 0;
    this.difficulty = 1;
    this.livery = 0;
    this.lbRows = new Map();
    this.mapMarkers = new Map();
    this.lastPos = null;
    this.refs = {
      menu: $('menu'),
      hud: $('hud'),
      help: $('help-modal'),
      pause: $('pause-modal'),
      results: $('results'),
      countdown: $('countdown'),
      countdownNum: $('countdown-num'),
      countdownSub: $('countdown-sub'),
      loading: $('loading'),
      loadingBar: $('loading-bar'),
      loadingCopy: $('loading-copy'),
      wipe: $('wipe'),
      dock: $('track-dock'),
      liveries: $('liveries'),
      difficulty: $('difficulty-seg'),
      speedBars: $('speed-bars'),
      lb: $('leaderboard'),
      lbTrack: $('lb-track'),
      mapMarkers: $('map-markers'),
      toasts: $('toast-stack'),
      speed: $('speed-num'),
      speedMode: $('speed-mode'),
      nitroFill: $('nitro-fill'),
      nitroPct: $('nitro-pct'),
      lap: $('hud-lap'),
      time: $('hud-time'),
      best: $('hud-best'),
      pos: $('hud-pos'),
      total: $('hud-total'),
      gap: $('hud-gap'),
      mapLap: $('map-lap'),
      raceHint: $('race-hint'),
      btnSound: $('btn-sound'),
      btnHudSound: $('btn-hud-sound'),
      resultsPos: $('results-pos'),
      resultsTitle: $('results-title'),
      resultsSub: $('results-sub'),
      resultsKicker: $('results-kicker'),
      resultsTotal: $('results-total'),
      resultsBestLap: $('results-best-lap'),
      resultsTrack: $('results-track'),
      resultsTable: $('results-table'),
      resultsRecord: $('results-record'),
      confetti: $('confetti'),
      bestLap: $('best-lap'),
      bestLapHint: $('best-lap-hint'),
      trackIndex: $('track-index'),
      trackName: $('track-name'),
      trackZh: $('track-zh'),
      trackKicker: $('track-kicker'),
      trackDesc: $('track-desc'),
      trackLength: $('track-length'),
      trackWidth: $('track-width'),
      trackTwist: $('track-twist'),
      trackBranch: $('track-branch'),
      trackDiff: $('track-diff'),
      dockCount: $('dock-count'),
      branchBanner: $('branch-banner'),
      branchSide: $('branch-side'),
      branchName: $('branch-name'),
      branchDetail: $('branch-detail'),
    };
    this._branchKey = '';
    this._buildTrackCards();
    this._buildLiveries();
    this._buildSpeedBars();
    this._buildMapMarkers();
    this._bind();
  }

  _buildTrackCards() {
    this.refs.dock.innerHTML = '';
    TRACKS.forEach((track, i) => {
      const lengthKm = (this.trackLengths[i] / 1000).toFixed(2);
      const splits = track.branches?.length || 0;
      const btn = document.createElement('button');
      btn.className = 'track-card';
      btn.dataset.index = i;
      btn.setAttribute('role', 'option');
      btn.innerHTML = `
        <span class="tc-top"><i>${String(i + 1).padStart(2, '0')}</i><em>×${track.twists} TWIST</em></span>
        <b class="tc-name">${track.name}</b>
        <span class="tc-zh">${track.zh}${splits ? ` · ${splits} SPLIT` : ''}</span>
        <span class="tc-line"></span>
        <span class="tc-meta"><span>${lengthKm} KM · ${track.width} M</span><b>${'▰'.repeat(track.difficulty)}${'▱'.repeat(Math.max(0, 5 - track.difficulty))}</b></span>
      `;
      btn.addEventListener('click', () => {
        this.cb.onSelectTrack?.(i);
      });
      this.refs.dock.appendChild(btn);
    });
    this.refs.dockCount.textContent = String(TRACKS.length).padStart(2, '0');
  }

  _buildLiveries() {
    this.refs.liveries.innerHTML = '';
    LIVERIES.forEach((livery, i) => {
      const btn = document.createElement('button');
      btn.className = `livery${i === 0 ? ' active' : ''}`;
      btn.style.background = `linear-gradient(135deg, ${livery.main} 0 56%, ${livery.accent} 56% 100%)`;
      btn.title = livery.name;
      btn.setAttribute('aria-label', `涂装 ${livery.name}`);
      btn.addEventListener('click', () => {
        this.setLivery(i);
        this.cb.onLiveryChange?.(i);
      });
      this.refs.liveries.appendChild(btn);
    });
  }

  _buildSpeedBars() {
    this.refs.speedBars.innerHTML = '';
    for (let i = 0; i < 24; i++) this.refs.speedBars.appendChild(document.createElement('i'));
    this.speedBarEls = Array.from(this.refs.speedBars.children);
  }

  _buildMapMarkers() {
    this.refs.mapMarkers.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', i === 4 ? 4.2 : 2.7);
      c.setAttribute('class', 'map-marker');
      c.setAttribute('fill', '#ffffff');
      this.refs.mapMarkers.appendChild(c);
      this.mapMarkers.set(i, c);
    }
  }

  _bind() {
    $('btn-help').addEventListener('click', () => this.showHelp(true));
    document.querySelectorAll('[data-close="help"]').forEach((b) => b.addEventListener('click', () => this.showHelp(false)));
    this.refs.help.addEventListener('click', (e) => {
      if (e.target === this.refs.help) this.showHelp(false);
    });
    $('btn-sound').addEventListener('click', () => this.cb.onToggleSound?.());
    $('btn-hud-sound').addEventListener('click', () => this.cb.onToggleSound?.());
    $('btn-start').addEventListener('click', () => this.cb.onStart?.());
    $('btn-pause').addEventListener('click', () => this.cb.onPause?.());
    $('btn-resume').addEventListener('click', () => this.cb.onResume?.());
    $('btn-restart').addEventListener('click', () => this.cb.onRestart?.());
    $('btn-to-menu').addEventListener('click', () => this.cb.onQuit?.());
    $('btn-race-again').addEventListener('click', () => this.cb.onRestart?.());
    $('btn-results-menu').addEventListener('click', () => this.cb.onQuit?.());
    this.refs.difficulty.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = Number(btn.dataset.difficulty);
        this.setDifficulty(value);
        this.cb.onDifficultyChange?.(value);
      });
    });
  }

  setTheme(theme) {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-2', theme.accent2);
    root.style.setProperty('--accent-rgb', hexRgb(theme.accent));
    root.style.setProperty('--accent2-rgb', hexRgb(theme.accent2));
    document.body.dataset.track = theme.accent;
  }

  selectTrack(config, index, bestLap) {
    this.selectedTrack = index;
    this.setTheme(config.theme);
    const len = this.trackLengths[index] / 1000;
    this.refs.trackIndex.textContent = String(index + 1).padStart(2, '0');
    this.refs.trackName.textContent = config.name;
    this.refs.trackZh.textContent = config.zh;
    this.refs.trackKicker.textContent = config.kicker;
    this.refs.trackDesc.textContent = config.desc;
    this.refs.trackLength.textContent = `${len.toFixed(2)} KM`;
    this.refs.trackWidth.textContent = `${config.width} M`;
    this.refs.trackTwist.textContent = `×${config.twists}`;
    this.refs.trackBranch.textContent = config.branches?.length ? `${config.branches.length} 处` : '—';
    this.refs.trackDiff.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('i');
      if (i < config.difficulty) el.classList.add('on');
      this.refs.trackDiff.appendChild(el);
    }
    this.refs.bestLap.textContent = bestLap ? formatTime(bestLap) : '— — —';
    this.refs.bestLapHint.textContent = bestLap ? `${config.name} 个人最快单圈` : '完成一场比赛以记录成绩';
    Array.from(this.refs.dock.children).forEach((card, i) => {
      card.classList.toggle('active', i === index);
      card.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    this.refs.lbTrack.textContent = config.name;
    if (this.cb.onTrackVisualChange) this.cb.onTrackVisualChange(index);
    const active = this.refs.dock.children[index];
    if (active && this.refs.dock.scrollWidth > this.refs.dock.clientWidth + 4) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  setLivery(index) {
    this.livery = index;
    Array.from(this.refs.liveries.children).forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
  }

  setDifficulty(value) {
    this.difficulty = value;
    this.refs.difficulty.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.difficulty) === value);
    });
  }

  setSoundMuted(muted) {
    this.refs.btnSound.classList.toggle('muted', muted);
    this.refs.btnHudSound.style.opacity = muted ? '0.4' : '1';
  }

  setBranch(state) {
    const key = state ? `${state.active}|${state.side}|${state.name}|${state.detail}` : '';
    if (key === this._branchKey) return;
    this._branchKey = key;
    const banner = this.refs.branchBanner;
    if (!state) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    banner.classList.toggle('active', !!state.active);
    banner.classList.toggle('boost', !!state.boost);
    this.refs.branchSide.textContent = state.side;
    this.refs.branchName.textContent = state.name;
    this.refs.branchDetail.textContent = state.detail;
  }

  showMenu() {
    this.refs.menu.hidden = false;
    this.refs.hud.hidden = true;
    this.refs.results.hidden = true;
    this.refs.help.hidden = true;
    this.refs.pause.hidden = true;
    this.refs.countdown.hidden = true;
    this.refs.branchBanner.hidden = true;
    this._branchKey = '';
    this.helpOpen = false;
    this.pauseOpen = false;
    document.body.classList.remove('racing');
  }

  enterRace(trackName) {
    this.refs.menu.hidden = true;
    this.refs.help.hidden = true;
    this.refs.pause.hidden = true;
    this.refs.results.hidden = true;
    this.refs.countdown.hidden = true;
    this.refs.hud.hidden = false;
    this.refs.lbTrack.textContent = trackName;
    this.refs.toasts.innerHTML = '';
    this.refs.speed.textContent = '000';
    this.refs.nitroFill.style.width = '62%';
    this.refs.nitroPct.textContent = '62%';
    this.lastPos = null;
    this._branchKey = '';
    this.refs.branchBanner.hidden = true;
    document.body.classList.add('racing');
    this._buildLeaderboardPlaceholders();
    this.hideResults();
  }

  _buildLeaderboardPlaceholders() {
    this.refs.lb.innerHTML = '';
    this.lbRows.clear();
    for (let i = 0; i < 5; i++) {
      const row = document.createElement('div');
      row.className = 'lb-row';
      row.innerHTML = `<span class="lb-pos">${i + 1}</span><i class="lb-dot"></i><span class="lb-name">—</span><span class="lb-gap"></span>`;
      this.refs.lb.appendChild(row);
    }
  }

  showCountdown(value) {
    this.refs.countdown.hidden = false;
    const num = this.refs.countdownNum;
    num.textContent = value;
    num.classList.toggle('go', value === 'GO');
    const sub = value === 'GO' ? 'FULL SEND' : value === '2' ? 'FEEL THE TWIST' : value === '1' ? 'HOLD THE LINE' : 'THE TWIST AWAITS';
    this.refs.countdownSub.textContent = sub;
    num.style.animation = 'none';
    void num.offsetWidth;
    num.style.animation = '';
  }

  hideCountdown() {
    this.refs.countdown.hidden = true;
  }

  updateHUD(state) {
    const speedKmh = Math.round(Math.abs(state.speed) * 3.6);
    this.refs.speed.textContent = String(clamp(speedKmh, 0, 999)).padStart(3, '0');
    this.refs.speed.classList.toggle('boosting', !!state.boost);
    this.refs.speedMode.textContent = state.boost ? 'NITRO OVERDRIVE' : state.drifting ? 'DRIFT CHARGE' : !state.active ? 'STANDBY' : speedKmh > 180 ? 'REDLINE' : 'CRUISE';
    this.refs.speedMode.parentElement.classList.toggle('boost', !!state.boost);

    const ratio = clamp(speedKmh / 270, 0, 1);
    const lit = Math.round(ratio * this.speedBarEls.length);
    this.speedBarEls.forEach((el, i) => {
      el.classList.toggle('on', i < lit);
      el.classList.toggle('hot', i < lit && i > this.speedBarEls.length * 0.78);
    });
    this.refs.nitroFill.style.width = `${clamp(state.nitro, 0, 100)}%`;
    this.refs.nitroPct.textContent = `${Math.round(state.nitro)}%`;
    this.refs.nitroFill.classList.toggle('low', state.nitro < 20);

    this.refs.lap.textContent = state.lap;
    this.refs.time.textContent = formatTime(state.time);
    this.refs.best.textContent = state.bestLap ? `BEST ${formatTime(state.bestLap)}` : 'BEST —';
    this.refs.pos.textContent = state.pos;
    this.refs.total.textContent = state.total;
    this.refs.gap.textContent = state.gap || '±0.000';
    if (this.lastPos != null && state.pos !== this.lastPos) {
      const el = this.refs.pos.parentElement;
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
      this.toast(`P${state.pos}`, state.pos < this.lastPos ? '名次上升' : '名次下降');
    }
    this.lastPos = state.pos;
    this.refs.mapLap.textContent = `L${state.lap}`;

    if (state.entries) this._updateLeaderboard(state.entries);
    if (state.mapEntries) this._updateMap(state.mapEntries);
  }

  _updateLeaderboard(entries) {
    if (!this.lbRows.size) {
      this.lbRows.clear();
      Array.from(this.refs.lb.children).forEach((row, i) => this.lbRows.set(i, row));
      entries.forEach((e, i) => {
        const row = this.lbRows.get(i);
        if (!row) return;
        row.children[1].style.background = e.color;
        row.children[1].style.boxShadow = `0 0 8px ${e.color}`;
      });
    }
    entries.forEach((entry, i) => {
      const row = this.lbRows.get(i);
      if (!row) return;
      row.style.display = '';
      row.style.order = i;
      row.classList.toggle('player', entry.isPlayer);
      row.children[0].textContent = i + 1;
      row.children[1].style.background = entry.color;
      row.children[1].style.boxShadow = `0 0 8px ${entry.color}`;
      row.children[2].textContent = entry.name;
      row.children[3].textContent = entry.gap || '';
      row.style.color = '';
    });
  }

  _updateMap(entries) {
    entries.forEach((entry, i) => {
      const marker = this.mapMarkers.get(i);
      if (!marker) return;
      const angle = entry.angle - Math.PI / 2;
      const r = 54;
      marker.setAttribute('cx', 70 + Math.cos(angle) * r);
      marker.setAttribute('cy', 70 + Math.sin(angle) * r);
      marker.setAttribute('fill', entry.isPlayer ? '#ffffff' : entry.color);
      marker.setAttribute('r', entry.isPlayer ? 4.2 : 2.8);
      marker.style.opacity = entry.opacity ?? 1;
    });
  }

  toast(main, sub = '', type = '') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<b>${main}</b>${sub ? `<span>${sub}</span>` : ''}`;
    this.refs.toasts.appendChild(el);
    while (this.refs.toasts.children.length > 3) this.refs.toasts.firstElementChild.remove();
    setTimeout(() => el.remove(), 2800);
  }

  setSpeedFx(ratio, boost) {
    const fx = $('fx-speed');
    fx.style.opacity = String(clamp((ratio - 0.34) * 0.8 + (boost ? 0.28 : 0), 0, 0.82));
  }

  hitFlash() {
    const el = $('fx-hit');
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  flash() {
    const wipe = this.refs.wipe;
    wipe.classList.remove('active');
    void wipe.offsetWidth;
    wipe.classList.add('active');
  }

  showHelp(open) {
    this.helpOpen = open;
    this.refs.help.hidden = !open;
    if (open) this.refs.help.querySelector('.modal-close')?.focus();
  }

  showPause(open, stats = {}) {
    this.pauseOpen = open;
    this.refs.pause.hidden = !open;
    if (open && stats) {
      $('pause-lap').textContent = `${stats.lap} / 3`;
      $('pause-pos').textContent = `${stats.pos} / ${stats.total}`;
      $('pause-time').textContent = formatTime(stats.time);
      $('btn-resume').focus();
    }
  }

  showResults(data) {
    this.refs.hud.hidden = true;
    this.refs.pause.hidden = true;
    this.refs.countdown.hidden = true;
    this.refs.branchBanner.hidden = true;
    this.refs.results.hidden = false;
    const victory = data.place === 1;
    this.refs.resultsKicker.textContent = victory ? 'VICTORY — NON-ORIENTABLE SERIES' : 'RACE COMPLETE — SECTOR 09';
    this.refs.resultsPos.textContent = data.place;
    this.refs.resultsTitle.textContent = ordinalZh(data.place);
    this.refs.resultsSub.textContent = victory
      ? '你征服了只有一面的赛道。重力已经分不清你的上下。'
      : data.place <= 3
        ? '登上领奖台。再快一点，下一场把冠军带走。'
        : '完成三圈就是一回事。下一次，把弯心抢回来。';
    this.refs.resultsTotal.textContent = formatTime(data.total);
    this.refs.resultsBestLap.textContent = formatTime(data.bestLap);
    this.refs.resultsTrack.textContent = data.trackName;
    this.refs.resultsRecord.textContent = data.record || '—';
    this.refs.resultsTable.innerHTML = '';
    data.standings.forEach((entry, i) => {
      const row = document.createElement('div');
      row.className = `result-row${entry.isPlayer ? ' player' : ''}`;
      row.innerHTML = `
        <span class="rr-pos">${i + 1}</span>
        <span class="rr-name"><i class="rr-dot" style="--dot:${entry.color}"></i>${entry.name}</span>
        <span class="rr-result">${entry.result}</span>`;
      this.refs.resultsTable.appendChild(row);
    });
    this._confetti(victory ? 46 : 14);
    document.body.classList.remove('racing');
  }

  _confetti(count) {
    this.refs.confetti.innerHTML = '';
    const colors = ['var(--accent)', 'var(--accent-2)', '#ffffff', '#ffd166'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('i');
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = `${2.4 + Math.random() * 2.6}s`;
      el.style.animationDelay = `${Math.random() * 1.2}s`;
      el.style.width = `${3 + Math.random() * 5}px`;
      el.style.height = `${6 + Math.random() * 9}px`;
      el.style.transform = `rotate(${Math.random() * 360}deg)`;
      this.refs.confetti.appendChild(el);
    }
  }

  hideResults() {
    this.refs.results.hidden = true;
    this.refs.confetti.innerHTML = '';
  }

  loading(progress, copy) {
    if (progress != null) this.refs.loadingBar.style.width = `${clamp(progress, 0, 100)}%`;
    if (copy) this.refs.loadingCopy.textContent = copy;
  }

  finishLoading() {
    this.loading(100);
    setTimeout(() => this.refs.loading.classList.add('done'), 260);
  }

  cameraToast(mode) {
    const names = { chase: '追尾视角', close: '近距追尾', hood: '车头视角' };
    this.toast(names[mode] || mode, 'CAMERA');
  }
}
