/**
 * 真实浏览器运行验证（Chrome Headless + CDP，无第三方依赖）
 * 用 file:// 打开页面，模拟真实鼠标 / 键盘 / 触屏操作，并保存截图与报告。
 *
 * 运行： node verification/verify.mjs
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname);
const SHOTS = path.join(OUT, 'screenshots');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const PROFILE = `/tmp/sr-verify-profile-${process.pid}`;
const PAGE_URL = `${pathToFileURL(path.join(ROOT, 'index.html')).href}?debug=1`;

fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.closed = false;
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket open timeout')), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener('error', (event) => {
        clearTimeout(timer);
        reject(new Error(`WebSocket error: ${event.message || 'unknown'}`));
      }, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.id) {
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else pending.resolve(msg.result);
        return;
      }
      const handlers = this.handlers.get(msg.method);
      if (handlers) {
        for (const fn of handlers) {
          try {
            fn(msg.params);
          } catch (err) {
            console.error('CDP handler error:', err);
          }
        }
      }
    });
  }

  send(method, params = {}) {
    if (this.closed) return Promise.reject(new Error('CDP connection closed'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, new Set());
    this.handlers.get(method).add(fn);
    return () => this.handlers.get(method)?.delete(fn);
  }

  once(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const off = this.on(method, (params) => {
        clearTimeout(timer);
        off();
        resolve(params);
      });
      const timer = setTimeout(() => {
        off();
        reject(new Error(`Timeout waiting for ${method}`));
      }, timeout);
    });
  }

  close() {
    this.closed = true;
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}

function waitForDevtools() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
        if (res.ok) {
          const list = await res.json();
          const page = list.find((t) => t.type === 'page');
          if (page) return resolve(page);
        }
      } catch {
        /* retry */
      }
      if (Date.now() - start > 20000) return reject(new Error('DevTools endpoint timeout'));
      setTimeout(tick, 200);
    };
    tick();
  });
}

async function main() {
  const report = {
    task: 'task_7c077f68',
    startedAt: new Date().toISOString(),
    pageUrl: PAGE_URL,
    browser: null,
    checks: [],
    screenshots: [],
    console: [],
    exceptions: [],
    failedRequests: [],
    resources: [],
    notes: []
  };

  let chrome;
  let cdp;
  let checkCount = 0;
  let failCount = 0;

  const check = (name, pass, detail = null) => {
    checkCount++;
    if (!pass) failCount++;
    report.checks.push({ name, pass: !!pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail !== null ? '  ' + JSON.stringify(detail) : ''}`);
    return pass;
  };

  const must = (name, pass, detail = null) => {
    check(name, pass, detail);
    if (!pass) throw new Error(`Required check failed: ${name}`);
  };

  const evalJs = async (expression, awaitPromise = false) => {
    const res = await cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
      userGesture: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Runtime.evaluate exception: ${desc}\nExpression: ${expression.slice(0, 300)}`);
    }
    return res.result.value;
  };

  const getState = () => evalJs('window.__SR_DEBUG ? window.__SR_DEBUG.state() : null');

  const waitState = async (predicate, timeout = 8000, label = '') => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const state = await getState();
      if (state && predicate(state)) return state;
      await sleep(120);
    }
    const latest = await getState();
    throw new Error(`Timeout waiting for state: ${label}; latest=${JSON.stringify(latest)}`);
  };

  const getRect = (selector) =>
    evalJs(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    })()`);

  const screenshot = async (name) => {
    const res = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const file = path.join(SHOTS, name);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(file, buf);
    report.screenshots.push({ file: `screenshots/${name}`, bytes: buf.length });
    console.log(`SHOT  ${name} (${(buf.length / 1024).toFixed(0)} KB)`);
    return file;
  };

  const logicalToScreen = (rect, x, y) => ({
    x: rect.left + (x / 480) * rect.width,
    y: rect.top + (y / 720) * rect.height
  });

  const mouseMove = (x, y) =>
    cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 });

  const clickAt = async (x, y) => {
    await mouseMove(x, y);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      buttons: 1,
      clickCount: 1
    });
    await sleep(50);
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      buttons: 0,
      clickCount: 1
    });
  };

  const clickSelector = async (selector) => {
    const rect = await getRect(selector);
    if (!rect) throw new Error(`No element for ${selector}`);
    await clickAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const keyInfo = {
    Space: { key: ' ', code: 'Space', vk: 32 },
    KeyP: { key: 'p', code: 'KeyP', vk: 80 },
    KeyM: { key: 'm', code: 'KeyM', vk: 77 },
    ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', vk: 37 },
    ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', vk: 39 },
    Enter: { key: 'Enter', code: 'Enter', vk: 13 }
  };

  const keyDown = (name) => {
    const k = keyInfo[name];
    return cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: k.key,
      code: k.code,
      windowsVirtualKeyCode: k.vk,
      nativeVirtualKeyCode: k.vk
    });
  };

  const keyUp = (name) => {
    const k = keyInfo[name];
    return cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: k.key,
      code: k.code,
      windowsVirtualKeyCode: k.vk,
      nativeVirtualKeyCode: k.vk
    });
  };

  const keyPress = async (name) => {
    await keyDown(name);
    await sleep(50);
    await keyUp(name);
  };

  const touchTap = async (x, y) => {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 }]
    });
    await sleep(70);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  try {
    fs.rmSync(PROFILE, { recursive: true, force: true });
    chrome = spawn(
      CHROME,
      [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--remote-debugging-address=127.0.0.1',
        `--user-data-dir=${PROFILE}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=CalculateNativeWinOcclusion',
        '--hide-scrollbars',
        '--mute-audio',
        '--window-size=1280,900',
        '--force-device-scale-factor=1',
        'about:blank'
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    chrome.stderr.on('data', (data) => {
      const text = data.toString();
      if (!/CVDisplayLink|allocator|DevTools listening/.test(text)) {
        report.notes.push(`chrome stderr: ${text.trim().slice(0, 300)}`);
      }
    });

    const target = await waitForDevtools();
    cdp = new CDP(target.webSocketDebuggerUrl);
    await cdp.connect();

    cdp.on('Runtime.exceptionThrown', (params) => {
      report.exceptions.push(params.exceptionDetails?.text || JSON.stringify(params));
    });
    cdp.on('Runtime.consoleAPICalled', (params) => {
      const text = (params.args || []).map((arg) => arg.value ?? arg.description ?? '').join(' ');
      report.console.push({ type: params.type, text });
    });
    cdp.on('Log.entryAdded', (params) => {
      if (params.entry.level === 'error') {
        report.console.push({ type: 'log-error', text: params.entry.text });
      }
    });
    cdp.on('Network.loadingFailed', (params) => {
      report.failedRequests.push({
        url: params.requestId,
        error: params.errorText,
        canceled: !!params.canceled,
        type: params.type
      });
    });
    const networkUrls = [];
    cdp.on('Network.responseReceived', (params) => {
      networkUrls.push({ url: params.response.url, status: params.response.status, type: params.type });
    });

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Network.enable');
    const version = await cdp.send('Browser.getVersion');
    report.browser = { product: version.product, protocolVersion: version.protocolVersion, jsVersion: version.jsVersion };

    /* ================= 1. 启动 & 主菜单 ================= */
    const loadPromise = cdp.once('Page.loadEventFired', 20000);
    await cdp.send('Page.navigate', { url: PAGE_URL });
    await loadPromise;
    await sleep(900);

    must('页面通过 file:// 直接打开并完成加载', await evalJs('document.readyState === "complete"'));
    must('游戏对象初始化成功', await evalJs('typeof window.__SR_GAME === "object" && typeof window.SR.Game === "function"'));
    must('所有关键类均已加载', await evalJs('["Player","Boss","Enemy","PowerUp","Starfield","SoundFX","Input"].every(k => typeof window.SR[k] === "function")'));

    const resourceInfo = await evalJs(`(() => {
      const urls = [
        ...document.querySelectorAll('script[src]'),
        ...document.querySelectorAll('link[rel="stylesheet"]'),
        ...document.querySelectorAll('link[rel="icon"]')
      ].map((el) => el.src || el.href);
      return {
        count: urls.length,
        urls: urls.map((u) => u.replace(/^file:\\/\\//, '')),
        external: urls.filter((u) => /^https?:/i.test(u)),
        nonFile: urls.filter((u) => !u.startsWith('file://')),
        styleSheets: document.styleSheets.length
      };
    })()`);
    report.resources = resourceInfo.urls;
    const keyClasses = await evalJs('typeof window.SR.Game === "function" && typeof window.SR.Player === "function" && typeof window.SR.Boss === "function" && typeof window.SR.Input === "function"');
    check('多文件资源全部由本地加载（无外部网络依赖）', resourceInfo.count >= 10 && resourceInfo.external.length === 0 && resourceInfo.nonFile.length === 0 && resourceInfo.styleSheets >= 1 && keyClasses, {
      count: resourceInfo.count,
      scripts: await evalJs(`[...document.scripts].filter(s => s.src).map(s => s.getAttribute('src'))`),
      external: resourceInfo.external,
      styleSheets: resourceInfo.styleSheets
    });

    const menuState = await getState();
    must('初始状态为主菜单', menuState.state === 'menu' && menuState.overlay === 'start', {
      state: menuState.state,
      overlay: menuState.overlay
    });

    const layout = await evalJs(`(() => {
      const rect = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { left:r.left, top:r.top, width:r.width, height:r.height, right:r.right, bottom:r.bottom }; };
      const stage = rect('.stage');
      const canvas = rect('#game');
      const menu = rect('#startOverlay .menu');
      const title = document.querySelector('.title');
      const ts = getComputedStyle(title);
      return {
        innerWidth, innerHeight, dpr: devicePixelRatio,
        stage, canvas, menu,
        titleFont: parseFloat(ts.fontSize),
        titleText: title.textContent.trim(),
        startHidden: document.querySelector('#startOverlay').hidden,
        pauseHidden: document.querySelector('#pauseOverlay').hidden,
        gameoverHidden: document.querySelector('#gameOverOverlay').hidden,
        overflowX: document.documentElement.scrollWidth - innerWidth,
        overflowY: document.documentElement.scrollHeight - innerHeight,
        pauseDisabled: document.querySelector('#pauseBtn').disabled
      };
    })()`);

    must('舞台保持 2:3 纵向比例', Math.abs(layout.stage.width / layout.stage.height - 2 / 3) < 0.02, {
      width: Math.round(layout.stage.width),
      height: Math.round(layout.stage.height)
    });
    must('页面无横向/纵向溢出', layout.overflowX <= 0 && layout.overflowY <= 0, {
      overflowX: layout.overflowX,
      overflowY: layout.overflowY
    });
    must('主菜单完整位于舞台内', layout.menu.left >= layout.stage.left - 1 && layout.menu.right <= layout.stage.right + 1, null);
    must('主标题有实际字号且文字正确', layout.titleFont >= 30 && layout.titleText === '星际突击', {
      fontSize: layout.titleFont,
      text: layout.titleText
    });
    must('初始只显示开始界面', layout.startHidden === false && layout.pauseHidden === true && layout.gameoverHidden === true);
    must('暂停按钮在未开始时禁用', layout.pauseDisabled === true);

    const initialPixels = await evalJs(`(() => {
      const c = document.getElementById('game');
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0, sum2 = 0, n = 0, bright = 0;
      for (let i = 0; i < d.length; i += 4 * 211) {
        const l = (d[i] + d[i+1] + d[i+2]) / 3;
        sum += l; sum2 += l*l; n++;
        if (l > 120) bright++;
      }
      const mean = sum / n;
      return { mean, std: Math.sqrt(sum2 / n - mean * mean), brightRatio: bright / n, width: c.width, height: c.height };
    })()`);
    must('Canvas 已渲染非空画面', initialPixels.std > 2 && initialPixels.mean > 2, initialPixels);

    await screenshot('01-start-desktop.png');

    /* ================= 2. 开始游戏 + 真实鼠标操作 ================= */
    await clickSelector('#startBtn');
    await sleep(700);
    let state = await getState();
    must('点击开始后进入游戏', state.state === 'playing' && state.overlay === null, {
      state: state.state,
      overlay: state.overlay
    });
    must('开始后 Canvas 获得焦点（键盘可用）', await evalJs('document.activeElement === document.getElementById("game")'));
    must('暂停按钮变为可用', (await evalJs('document.getElementById("pauseBtn").disabled')) === false);

    const audioInfo = await evalJs(`(() => { const a = window.__SR_GAME.audio; return { hasContext: !!a.ctx, state: a.ctx ? a.ctx.state : null, muted: a.muted }; })()`);
    check('WebAudio 音效上下文已创建（点击手势后）', audioInfo.hasContext, audioInfo);

    await evalJs('window.__SR_DEBUG.setInvuln(60)');

    const canvasRect = await getRect('#game');
    let maxScore = 0;
    let maxEnemies = 0;
    let maxPlayerBullets = 0;
    let maxEnemyBullets = 0;
    let gameplayShotTaken = false;

    for (let i = 0; i < 64; i++) {
      state = await getState();
      if (!state || state.state !== 'playing') break;
      maxScore = Math.max(maxScore, state.score);
      maxEnemies = Math.max(maxEnemies, state.enemies);
      maxPlayerBullets = Math.max(maxPlayerBullets, state.playerBullets);
      maxEnemyBullets = Math.max(maxEnemyBullets, state.enemyBullets);

      let targetX = 240 + Math.sin(i * 0.38) * 140;
      if (state.enemyPositions && state.enemyPositions.length) {
        const sorted = [...state.enemyPositions].sort((a, b) => b.y - a.y);
        targetX = sorted[0].x;
      }
      const target = logicalToScreen(canvasRect, targetX, 596);
      await mouseMove(target.x, target.y);

      if (!gameplayShotTaken && state.enemies >= 2 && state.score > 0) {
        await sleep(120);
        await screenshot('02-gameplay.png');
        gameplayShotTaken = true;
      }
      await sleep(150);
    }

    state = await getState();
    const pointerTarget = logicalToScreen(canvasRect, 150, 596);
    await mouseMove(pointerTarget.x, pointerTarget.y);
    await sleep(750);
    state = await getState();
    must('真实鼠标移动可精确操控战机位置', Math.abs(state.player.x - 150) <= 35, {
      expected: 150,
      actual: state.player.x,
      playerY: state.player.y
    });

    // 停在左下角观察敌机开火（自动开火仍在工作，但不覆盖全屏）
    const parkTarget = logicalToScreen(canvasRect, 52, 620);
    await mouseMove(parkTarget.x, parkTarget.y);
    let observedBullets = maxEnemyBullets;
    let observedWave = (await getState()).wave;
    for (let i = 0; i < 48; i++) {
      state = await getState();
      if (!state || state.state !== 'playing') break;
      maxEnemies = Math.max(maxEnemies, state.enemies);
      maxPlayerBullets = Math.max(maxPlayerBullets, state.playerBullets);
      maxEnemyBullets = Math.max(maxEnemyBullets, state.enemyBullets);
      observedBullets = Math.max(observedBullets, state.enemyBullets);
      observedWave = Math.max(observedWave, state.wave);
      await sleep(150);
    }

    must('游戏过程中有敌机生成', maxEnemies > 0, { maxEnemies });
    must('自动开火正常产生子弹', maxPlayerBullets > 0, { maxPlayerBullets });
    must('真实操作下击落敌机并获得分数', maxScore > 0, { maxScore, maxEnemies });
    check('游戏过程中出现敌方弹幕', observedBullets > 0, { maxEnemyBullets: observedBullets, wave: observedWave });

    if (!gameplayShotTaken) {
      await screenshot('02-gameplay.png');
      gameplayShotTaken = true;
    }

    const fpsInfo = await evalJs(`new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function tick() {
        frames++;
        const elapsed = performance.now() - start;
        if (elapsed < 2000) requestAnimationFrame(tick);
        else resolve({ frames, elapsed, fps: frames / (elapsed / 1000), gameFps: window.__SR_GAME.fps });
      }
      requestAnimationFrame(tick);
    })`, true);
    check('实时帧率可玩（>= 30fps）', fpsInfo.fps >= 30, { fps: Number(fpsInfo.fps.toFixed(1)), gameFps: fpsInfo.gameFps });

    /* ================= 3. 键盘移动 ================= */
    state = await getState();
    const beforeKeyboard = state.player;
    await keyDown('ArrowLeft');
    await sleep(520);
    await keyUp('ArrowLeft');
    await sleep(120);
    state = await getState();
    must('键盘（方向键）可操控战机', state.player.x < beforeKeyboard.x - 20, {
      before: beforeKeyboard.x,
      after: state.player.x
    });

    /* ================= 4. 暂停 / 继续 ================= */
    await keyPress('KeyP');
    await sleep(350);
    state = await getState();
    must('P 键暂停生效', state.state === 'paused' && state.overlay === 'pause', {
      state: state.state,
      overlay: state.overlay
    });
    must('暂停面板可见', await evalJs('document.getElementById("pauseOverlay").hidden === false'));
    await screenshot('03-pause.png');

    await clickSelector('#resumeBtn');
    await sleep(400);
    state = await getState();
    must('点击继续后恢复游戏', state.state === 'playing' && state.overlay === null);

    /* ================= 5. 炸弹 ================= */
    const bombsBefore = (await getState()).bombs;
    await keyPress('Space');
    await sleep(230);
    state = await getState();
    must('空格键可释放炸弹且数量减少', state.bombs === bombsBefore - 1, {
      before: bombsBefore,
      after: state.bombs
    });
    await screenshot('04-bomb.png');

    /* ================= 6. 拾取强化 / 护盾 ================= */
    const powerBefore = (await getState()).power;
    await evalJs(`window.__SR_DEBUG.spawnPowerUp('power')`);
    try {
      await waitState((s) => s.power > powerBefore, 3500, 'power pickup');
      check('可拾取火力强化补给', true);
    } catch {
      check('可拾取火力强化补给', false, { powerBefore });
    }

    await evalJs(`window.__SR_DEBUG.spawnPowerUp('shield')`);
    let shieldedState = null;
    try {
      shieldedState = await waitState((s) => s.shield > 0, 3500, 'shield pickup');
      check('可拾取护盾补给', true, { shield: shieldedState.shield });
    } catch {
      check('可拾取护盾补给', false);
    }

    // 真实碰撞：注入一颗贴着玩家下落的敌弹，验证护盾吸收与扣命逻辑
    if (shieldedState) {
      const livesBeforeShield = shieldedState.lives;
      await evalJs(`(() => {
        const g = window.__SR_GAME;
        g.enemyBullets.length = 0;
        g.enemyBullets.push(new SR.EnemyBullet(g.player.x, g.player.y - 30, 0, 220, { r: 5 }));
      })()`);
      await sleep(420);
      state = await getState();
      must('护盾能吸收真实碰撞且不扣命', state.shield === 0 && state.lives === livesBeforeShield, {
        shield: state.shield,
        livesBefore: livesBeforeShield,
        livesAfter: state.lives
      });

      await evalJs(`(() => {
        const g = window.__SR_GAME;
        g.player.invuln = 0;
        g.player.shield = 0;
        g.enemyBullets.length = 0;
        g.enemyBullets.push(new SR.EnemyBullet(g.player.x, g.player.y - 30, 0, 220, { r: 5 }));
      })()`);
      await sleep(500);
      state = await getState();
      must('敌弹真实碰撞会扣除生命', state.lives === livesBeforeShield - 1 && state.player.alive, {
        livesBefore: livesBeforeShield,
        livesAfter: state.lives,
        alive: state.player.alive
      });
      await evalJs('window.__SR_DEBUG.setLives(3)');
      await evalJs('window.__SR_DEBUG.addBombs(1)');
      await evalJs('window.__SR_DEBUG.setInvuln(60)');
    }

    /* ================= 7. BOSS 战 ================= */
    await evalJs('window.__SR_DEBUG.setInvuln(60)');
    await evalJs('window.__SR_DEBUG.forceBoss(5)');
    const bossState = await waitState(
      (s) => s.boss && (s.boss.state === 'fight' || s.boss.state === 'dying'),
      12000,
      'boss fight'
    );
    must('第五波生成 BOSS 并进入战斗', bossState.wave === 5 && bossState.boss && bossState.boss.state === 'fight', {
      wave: bossState.wave,
      boss: bossState.boss
    });
    await sleep(1800);
    state = await getState();
    await screenshot('05-boss.png');
    check('BOSS 会发射弹幕', state.enemyBullets > 0, { enemyBullets: state.enemyBullets, bossHp: state.boss?.hp });

    const scoreBeforeBoss = state.score;
    await evalJs('window.__SR_DEBUG.damageBoss(999)');
    await sleep(220);
    state = await getState();
    check('BOSS 受击进入爆炸演出', state.boss && state.boss.state === 'dying', state.boss);

    await sleep(2500);
    state = await getState();
    check('BOSS 被击破并从场上移除', state.boss === null, { boss: state.boss, score: state.score });
    check('击破 BOSS 获得大量分数', state.score >= scoreBeforeBoss + 2000, {
      before: scoreBeforeBoss,
      after: state.score,
      delta: state.score - scoreBeforeBoss
    });

    try {
      const nextWave = await waitState((s) => s.wave >= 6 && s.boss === null, 9000, 'wave 6');
      check('BOSS 战后自动进入下一波', true, { wave: nextWave.wave, wavePhase: nextWave.wavePhase });
    } catch {
      check('BOSS 战后自动进入下一波', false, await getState());
    }

    /* ================= 8. 玩家死亡 / Game Over / 重开 ================= */
    await evalJs('window.__SR_DEBUG.setInvuln(0)');
    const lifeSeq = [];
    for (let i = 0; i < 3; i++) {
      const res = await evalJs('window.__SR_DEBUG.killPlayer()');
      lifeSeq.push(res.lives);
      await sleep(350);
    }
    check('三次受击分别扣除生命并最终归零', JSON.stringify(lifeSeq) === JSON.stringify([2, 1, 0]), { lives: lifeSeq });

    state = await getState();
    must('生命归零后进入死亡演出状态', state.state === 'dying' || state.state === 'gameover', { state: state.state });

    const overState = await waitState((s) => s.state === 'gameover', 4000, 'gameover');
    must('死亡演出结束后显示结算界面', overState.overlay === 'gameover' && await evalJs('document.getElementById("gameOverOverlay").hidden === false'));

    const overStats = await evalJs(`({
      finalScore: document.getElementById('finalScore').textContent,
      finalBest: document.getElementById('finalBest').textContent,
      finalWave: document.getElementById('finalWave').textContent
    })`);
    must('结算面板分数与游戏状态一致', overStats.finalScore === String(overState.score).padStart(6, '0'), {
      dom: overStats,
      score: overState.score
    });
    await screenshot('06-gameover.png');

    const savedHigh = await evalJs(`(() => { try { return localStorage.getItem('starRaider.highScore'); } catch (e) { return 'ERROR:' + e.name; } })()`);
    check('最高分写入 localStorage（file:// 下）', savedHigh !== null && Number(savedHigh) === overState.highScore, {
      savedHigh,
      highScore: overState.highScore
    });

    await clickSelector('#retryBtn');
    await sleep(800);
    state = await getState();
    must('点击再来一次可重开且分数清零', state.state === 'playing' && state.score === 0 && state.lives === 3 && state.wave === 1, {
      state: state.state,
      score: state.score,
      lives: state.lives,
      wave: state.wave
    });
    check('重开后保留历史最高分', state.highScore >= overState.highScore, {
      highScore: state.highScore
    });

    /* ================= 9. 移动端布局 & 触屏 ================= */
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenWidth: 390,
      screenHeight: 844
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    const reloadPromise = cdp.once('Page.loadEventFired', 20000);
    await cdp.send('Page.reload', { ignoreCache: true });
    await reloadPromise;
    await sleep(1000);

    const mobileState = await getState();
    must('移动端重新加载后回到主菜单', mobileState.state === 'menu');
    const mobileLayout = await evalJs(`(() => {
      const r = (sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return { left:b.left, top:b.top, width:b.width, height:b.height, right:b.right, bottom:b.bottom }; };
      return {
        innerWidth, innerHeight, dpr: devicePixelRatio,
        stage: r('.stage'), canvas: r('#game'), menu: r('#startOverlay .menu'),
        overflowX: document.documentElement.scrollWidth - innerWidth,
        overflowY: document.documentElement.scrollHeight - innerHeight,
        bestText: document.getElementById('menuBest').textContent
      };
    })()`);
    must('移动端舞台完整适配视口', mobileLayout.stage.width <= mobileLayout.innerWidth - 20 && mobileLayout.stage.bottom <= mobileLayout.innerHeight, {
      stage: mobileLayout.stage,
      viewport: { width: mobileLayout.innerWidth, height: mobileLayout.innerHeight }
    });
    must('移动端保持 2:3 比例且无溢出', Math.abs(mobileLayout.stage.width / mobileLayout.stage.height - 2 / 3) < 0.02 && mobileLayout.overflowX <= 0 && mobileLayout.overflowY <= 0);
    check('移动端菜单展示持久化的最高分', mobileLayout.bestText === String(mobileState.highScore).padStart(6, '0'), {
      dom: mobileLayout.bestText,
      state: mobileState.highScore
    });
    await screenshot('07-mobile-menu.png');

    const startRect = await getRect('#startBtn');
    await touchTap(startRect.left + startRect.width / 2, startRect.top + startRect.height / 2);
    await sleep(800);
    state = await getState();
    must('触屏点击开始按钮可进入游戏', state.state === 'playing', { state: state.state, overlay: state.overlay });

    await evalJs('window.__SR_DEBUG.setInvuln(60)');
    const mobileCanvas = await getRect('#game');
    const touchFrom = logicalToScreen(mobileCanvas, 240, 590);
    const touchTo = logicalToScreen(mobileCanvas, 120, 590);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: touchFrom.x, y: touchFrom.y, id: 2, radiusX: 2, radiusY: 2, force: 1 }]
    });
    for (let i = 1; i <= 6; i++) {
      const x = touchFrom.x + ((touchTo.x - touchFrom.x) * i) / 6;
      const y = touchFrom.y + ((touchTo.y - touchFrom.y) * i) / 6;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, id: 2, radiusX: 2, radiusY: 2, force: 1 }]
      });
      await sleep(60);
    }
    await sleep(450);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(250);
    state = await getState();
    must('触屏拖动可操控战机', state.player.x < 190, { playerX: state.player.x });

    const mobileBombsBefore = state.bombs;
    const bombRect = await getRect('#bombBtn');
    await touchTap(bombRect.left + bombRect.width / 2, bombRect.top + bombRect.height / 2);
    await sleep(350);
    state = await getState();
    must('移动端炸弹按钮可触发炸弹', state.bombs === mobileBombsBefore - 1, {
      before: mobileBombsBefore,
      after: state.bombs
    });
    await screenshot('08-mobile-gameplay.png');

    /* ================= 10. 普通双击打开（无调试参数） ================= */
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    const plainUrl = pathToFileURL(path.join(ROOT, 'index.html')).href;
    const plainLoad = cdp.once('Page.loadEventFired', 20000);
    await cdp.send('Page.navigate', { url: plainUrl });
    await plainLoad;
    await sleep(900);
    const plainState = await evalJs(`({
      debugHooks: typeof window.__SR_DEBUG,
      state: window.__SR_GAME ? window.__SR_GAME.state : null,
      best: document.getElementById('menuBest').textContent
    })`);
    must('不带调试参数、直接以 file:// 打开可正常运行', plainState.debugHooks === 'undefined' && plainState.state === 'menu', plainState);
    await clickSelector('#startBtn');
    await sleep(700);
    check('双击场景下点击开始可进入游戏', (await evalJs('window.__SR_GAME.state')) === 'playing');
    await screenshot('09-file-open.png');

    /* ================= 11. 控制台 / 异常 / 网络 ================= */
    await sleep(500);
    const errorConsole = report.console.filter((c) => c.type === 'error' || c.type === 'log-error' || c.type === 'assert');
    check('浏览器控制台无 error', errorConsole.length === 0, errorConsole.slice(0, 5));
    check('运行期间无未捕获 JS 异常', report.exceptions.length === 0, report.exceptions.slice(0, 5));
    const realFailures = report.failedRequests.filter((r) => !r.canceled && !/ERR_ABORTED/.test(r.error || ''));
    check('无资源加载失败', realFailures.length === 0, realFailures.slice(0, 5));

    const externalRequests = networkUrls.filter((r) => /^https?:/i.test(r.url));
    check('运行时无外部网络请求（完全离线）', externalRequests.length === 0, externalRequests.slice(0, 5));

    /* ================= 11. 收尾 ================= */
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    report.finishedAt = new Date().toISOString();
    report.summary = {
      totalChecks: checkCount,
      passed: checkCount - failCount,
      failed: failCount,
      screenshots: report.screenshots.length
    };
    report.passed = failCount === 0;

    fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 2));
    console.log(`\n===== RESULT: ${failCount === 0 ? 'ALL PASS' : 'FAILED'} (${checkCount - failCount}/${checkCount}) =====`);
    if (failCount > 0) process.exitCode = 1;
  } catch (err) {
    report.finishedAt = new Date().toISOString();
    report.error = err && err.stack ? err.stack : String(err);
    report.summary = {
      totalChecks: checkCount,
      passed: checkCount - failCount,
      failed: failCount + 1,
      screenshots: report.screenshots.length
    };
    report.passed = false;
    try {
      fs.writeFileSync(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 2));
    } catch {
      /* ignore */
    }
    console.error('\nFATAL:', report.error);
    console.error('Console:', JSON.stringify(report.console.slice(-10), null, 2));
    console.error('Exceptions:', JSON.stringify(report.exceptions.slice(-10), null, 2));
    process.exitCode = 1;
  } finally {
    try {
      if (cdp) cdp.close();
    } catch {
      /* ignore */
    }
    try {
      if (chrome) chrome.kill('SIGKILL');
    } catch {
      /* ignore */
    }
    await sleep(300);
    try {
      fs.rmSync(PROFILE, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
