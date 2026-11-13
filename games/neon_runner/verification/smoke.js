/*
 * NEON RUNNER // headful browser smoke test
 *
 * Requirements:
 *   npm install puppeteer-core
 *   a local Chrome/Chromium build
 *
 * Run from the project root:
 *   CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *     node verification/smoke.js
 *
 * The game is opened through file:// so this also proves that the delivered
 * project has no server-only dependency.
 */
'use strict';

const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const GAME_URL = process.env.GAME_URL ||
  new URL('file://' + path.resolve(__dirname, '..', 'index.html')).href;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const failures = [];

function check(name, value) {
  if (!value) failures.push(name);
  console.log((value ? 'PASS ' : 'FAIL ') + name);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: ['--no-sandbox', '--window-size=1366,830', '--window-position=20,20'],
    defaultViewport: { width: 1366, height: 768, deviceScaleFactor: 1 }
  });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', err => pageErrors.push(String(err)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('requestfailed', req => failedRequests.push(req.url()));

  try {
    await page.goto(GAME_URL, { waitUntil: 'networkidle0' });
    // Keep the smoke test deterministic if the browser profile already has a
    // best lap from an earlier manual run.
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.bringToFront();
    await sleep(1500);

    const menu = await page.evaluate(() => ({
      loadingDone: document.getElementById('loading').classList.contains('done'),
      fatalHidden: document.getElementById('fatal').classList.contains('hidden'),
      menuVisible: !!document.getElementById('menu').offsetParent,
      startVisible: !!document.getElementById('btn-start').offsetParent,
      best: document.getElementById('menu-best').textContent
    }));
    check('menu is visible', menu.menuVisible && menu.startVisible);
    check('loading overlay finished', menu.loadingDone);
    check('fatal overlay hidden', menu.fatalHidden);
    check('empty best-lap label', menu.best === '--:--.---');

    await page.click('#btn-start');
    await sleep(700);
    const countdown = await page.evaluate(() => ({
      modeVisible: !!document.getElementById('countdown-layer').offsetParent,
      hudVisible: !document.getElementById('hud').classList.contains('hidden')
    }));
    check('countdown overlay visible', countdown.modeVisible);
    check('race HUD visible', countdown.hudVisible);

    await sleep(3000);
    // Re-focus the browser before sending driving keys. On a busy desktop the
    // window can lose focus while the countdown is running, and the game
    // intentionally auto-pauses on blur.
    await page.bringToFront();
    await page.keyboard.down('KeyW');
    await sleep(1500);
    const driving = await page.evaluate(() => ({
      speed: Number(document.getElementById('hud-speed').textContent),
      time: document.getElementById('hud-time').textContent,
      gear: document.getElementById('hud-gear').textContent,
      touchHidden: document.getElementById('touch-controls').classList.contains('hidden')
    }));
    await page.keyboard.up('KeyW');
    check('car reaches speed with W', driving.speed > 0);
    check('race timer advances', driving.time !== '00:00.000');
    check('desktop does not show touch controls', driving.touchHidden);

    await page.click('#btn-pause');
    await sleep(500);
    const paused1 = await page.evaluate(() => ({
      visible: !document.getElementById('pause').classList.contains('hidden'),
      time: document.getElementById('hud-time').textContent
    }));
    await sleep(500);
    const paused2 = await page.evaluate(() => ({
      time: document.getElementById('hud-time').textContent
    }));
    check('pause overlay opens', paused1.visible);
    check('race clock freezes while paused', paused1.time === paused2.time);

    await page.click('#btn-resume');
    await sleep(300);
    check('resume closes pause overlay',
      await page.evaluate(() => document.getElementById('pause').classList.contains('hidden')));

    await page.keyboard.press('KeyR');
    await sleep(300);
    const reset = await page.evaluate(() => ({
      speed: Number(document.getElementById('hud-speed').textContent),
      toast: document.getElementById('toast-layer').innerText
    }));
    check('reset car stops the vehicle', reset.speed === 0);
    check('reset car shows recovery feedback', /VEHICLE RECOVERED/i.test(reset.toast));

    check('no page errors', pageErrors.length === 0);
    check('no console errors', consoleErrors.length === 0);
    check('no failed requests', failedRequests.length === 0);
    if (pageErrors.length) console.log('pageErrors:', pageErrors);
    if (consoleErrors.length) console.log('consoleErrors:', consoleErrors);
    if (failedRequests.length) console.log('failedRequests:', failedRequests);
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('\nSMOKE_FAILED: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nSMOKE_OK');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
