import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
const compactScreen = Math.min(window.innerWidth, window.innerHeight) < 820;
const mobile = coarsePointer && compactScreen;
const quality = mobile ? 'low' : 'high';
const baseDpr = mobile ? 1.35 : 1.75;

let renderer;
let scene;
let camera;
let composer;
let bloomPass;
let game;
let ui;
let input;
let audio;
let pixelRatio = Math.min(window.devicePixelRatio || 1, baseDpr);
let reducedQuality = false;

function showFatal(message) {
  const loading = document.getElementById('loading');
  const copy = document.getElementById('loading-copy');
  const bar = document.getElementById('loading-bar');
  if (loading) loading.classList.remove('done');
  if (copy) {
    copy.textContent = message;
    copy.style.color = '#ff8a78';
  }
  if (bar) {
    bar.style.width = '100%';
    bar.style.background = '#ff5533';
  }
  console.error(message);
}

async function boot() {
  if (!window.WebGLRenderingContext) {
    showFatal('当前浏览器不支持 WebGL，请使用最新版 Chrome / Edge / Safari。');
    return;
  }

  ui = new UI({
    onSelectTrack: (index) => game?.selectTrack(index),
    onTrackVisualChange: (index) => game?._onTrackVisualChange(index),
    onLiveryChange: (index) => game?.setLivery(index),
    onDifficultyChange: () => game?.onDifficultyChange(),
    onToggleSound: () => game?.toggleSound(),
    onStart: () => game?.startRace(),
    onPause: () => game?.pause(),
    onResume: () => game?.resume(),
    onRestart: () => game?.restartRace(),
    onQuit: () => game?.returnToMenu(),
  });
  input = new Input();
  audio = new AudioEngine();
  ui.setSoundMuted(audio.muted);
  ui.loading(10, '正在初始化渲染管线…');
  await nextFrame();

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    showFatal('无法创建 WebGL 渲染器。请确认浏览器已启用硬件加速。');
    console.error(err);
    return;
  }

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = false;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#02040a');
  camera = new THREE.PerspectiveCamera(
    58,
    window.innerWidth / Math.max(1, window.innerHeight),
    0.12,
    2600,
  );
  camera.position.set(0, 60, 170);

  ui.loading(30, '正在建立后处理与光晕…');
  await nextFrame();

  composer = new EffectComposer(renderer);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(window.innerWidth, window.innerHeight);
  if (!mobile) {
    composer.renderTarget1.samples = 2;
    composer.renderTarget2.samples = 2;
  }
  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    mobile ? 0.58 : 0.74,
    0.52,
    0.82,
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  ui.loading(52, '正在生成非定向赛道…');
  await nextFrame();

  game = new Game({
    renderer,
    scene,
    camera,
    composer,
    quality,
    ui,
    input,
    audio,
  });

  ui.loading(86, '正在校准重力与起跑灯…');
  await nextFrame();

  game.update(0);
  try {
    renderer.compile(scene, camera);
  } catch (err) {
    console.warn('Shader precompile skipped', err);
  }

  input.setEnabled(true);
  ui.loading(100, '准备发车');
  ui.finishLoading();
  clock.start();
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 120));

  const unlockAudio = () => {
    audio.init();
    if (game) audio.setMode(game.state === 'menu' ? 'menu' : 'race');
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { once: true, capture: true });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    if (game && (game.state === 'race' || game.state === 'countdown')) game.pause();
    ui.toast('渲染上下文中断', '请刷新页面');
  });

  window.__MOBIUS_GP__ = { game, renderer, scene, camera, composer, ui, input, audio };
  requestAnimationFrame(frame);
}

const clock = new THREE.Clock(false);
let slowTime = 0;

function frame() {
  requestAnimationFrame(frame);
  const raw = clock.getDelta();
  if (document.hidden) {
    slowTime = 0;
    return;
  }

  const dt = Math.min(raw, 0.05);
  game.update(dt);
  composer.render();
  adaptPerformance(raw);
}

function adaptPerformance(raw) {
  if (reducedQuality) return;
  if (raw > 0.03) slowTime += raw;
  else slowTime = Math.max(0, slowTime - raw * 1.6);
  if (slowTime < 3.2) return;

  reducedQuality = true;
  slowTime = 0;
  pixelRatio = Math.min(pixelRatio, 1);
  renderer.setPixelRatio(pixelRatio);
  composer.setPixelRatio(pixelRatio);
  onResize();
  if (game?.particles) {
    game.particles.material.uniforms.uPixelRatio.value = Math.min(pixelRatio, 2);
  }
  if (bloomPass) bloomPass.strength *= 0.88;
}

function onResize() {
  if (!renderer || !camera || !composer) return;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height);
  composer.setPixelRatio(pixelRatio);
  composer.setSize(width, height);
  if (game?.particles) {
    game.particles.material.uniforms.uPixelRatio.value = Math.min(pixelRatio, 2);
  }
}

boot().catch((err) => {
  console.error(err);
  showFatal('启动失败：' + (err?.message || '未知错误'));
});
