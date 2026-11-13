# 星际突击 STAR RAIDER · 工程记录

## 1. 交付形态

纯静态多文件项目，入口 `index.html`。双击即可通过 `file://` 运行，无需 Node、Python、构建步骤或本地服务器。

```
index.html                页面骨架 / HUD 之外的 DOM 界面
css/style.css             布局、霓虹菜单、响应式与动效
js/config.js              全局常量与平衡参数
js/utils.js               数学、格式化、localStorage 安全封装
js/audio.js               WebAudio 实时合成音效
js/input.js               键盘 + Pointer Events 输入
js/entities.js            星空、子弹、敌机、BOSS、补给、粒子
js/player.js              玩家战机、武器等级、护盾、受击
js/game.js                主循环、波次、碰撞、HUD、状态机、调试快照
js/main.js                启动入口、可选调试接口
assets/favicon.svg        本地图标
verification/             真实浏览器验证脚本、报告、截图
```

## 2. 关键技术决策

### 2.1 使用经典 script 而不是 ES Module

`file://` 下浏览器对 ES Module 的跨文件加载受 CORS 限制。项目按依赖顺序使用 8 个经典 `<script>`，所有模块挂到 `window.SR` 命名空间。这样双击打开和本地 HTTP 服务器下行为一致。

### 2.2 固定逻辑分辨率 + DPR 自适应

- 逻辑坐标系固定为 480×720（2:3），所有物理量以“逻辑像素/秒”为单位，游戏手感不受窗口大小影响。
- Canvas backing store 按 `min(devicePixelRatio, 2)` 放大，绘制前 `setTransform(dpr, 0, 0, dpr, 0, 0)`，高分屏保持清晰。
- 页面用 CSS `--stage-w: min(视口宽, (视口高 - 144px) × 2/3, 560px)` 计算舞台尺寸，保持比例并避免页面滚动。

### 2.3 帧率无关的更新

主循环用 `requestAnimationFrame`；每帧 `dt` 限制在 1/30 秒以内，所有移动、冷却、动画均按秒缩放。低帧或切回标签页时不会出现瞬移。

### 2.4 程序化美术与音频

- 没有图片/音频资源请求：星空、星云、战机、BOSS、粒子全部用 Canvas 2D 路径/渐变绘制。
- WebAudio 使用振荡器 + 预生成白噪声缓冲合成音效；首次点击开始按钮时初始化 `AudioContext`，遵守浏览器自动播放策略。
- 所有音效在 `SoundFX` 内集中管理；射击音做了节流和多音高交替，避免自动连射时声音过密。

### 2.5 实体与碰撞

- 实体用普通数组管理，每帧更新后统一 `filter` 清理，便于阅读和调试。
- 碰撞采用圆形距离平方比较；玩家真实判定半径 7px，远小于机身，提供街机式擦弹空间。
- 玩家子弹优先命中最近遍历到的敌机；BOSS 单独作为 `game.boss` 引用并拥有独立血条和死亡演出。

### 2.6 波次系统

- 波次由 `buildWave(n)` 生成一个按时间排序的 `{t, type, x, opts}` 队列；`waveTime` 推进时按时间出队生成。
- 全部敌机离场/被击落且 BOSS 为空后进入 2.2 秒清场间隔，再开始下一波。
- 每 5 波使用 `spawnQueue` 中的函数式条目生成 BOSS，复用同一套波次状态机。
- 敌方速度、开火频率与 BOSS 血量随波次增长，并设置上限避免不可控。

### 2.7 状态机

`menu → playing → paused / dying → gameover → playing`

- `dying` 是 1.55 秒的死亡演出态，粒子继续播放，1.55 秒后切到 `gameover` 并显示结算。
- 页面 `visibilitychange` 隐藏时自动暂停；切回需玩家手动继续。
- 重开只重置世界与状态，不重置历史最高分。

### 2.8 调试接口

常规运行下 `window.__SR_GAME` 可供控制台观察。带 `?debug=1` 时额外暴露 `window.__SR_DEBUG`（状态快照、强制 BOSS、扣血、生成补给等），仅用于自动化验证，不影响正常双击打开的页面。

## 3. 验证方法

验证脚本 `verification/verify.mjs` 使用 Node 24 内置 WebSocket 直连 Chrome DevTools Protocol，不依赖 Playwright/Puppeteer：

1. 以 `file://.../index.html?debug=1` 启动 headless Chrome；
2. 记录控制台、未捕获异常、网络请求；
3. 用 `Input.dispatchMouseEvent` / `dispatchKeyEvent` / `dispatchTouchEvent` 模拟**真实输入**；
4. 读取游戏状态快照与 DOM 布局进行断言；
5. 用 `Page.captureScreenshot` 保存 9 张截图；
6. 最后再次以**不带调试参数**的纯 `file://` 地址打开页面，验证双击场景。

运行：

```bash
node verification/verify.mjs
```

产物：`verification/browser-report.json`、`verification/run.log`、`verification/screenshots/`、`verification/ocr-evidence.txt`、`verification/VERIFICATION.md`。

## 4. 迭代记录

### v1 初版

- 完成菜单、游戏循环、四类敌机、波次、BOSS、补给、粒子、音效、暂停、结算、触屏。
- 首轮 53 项检查通过 51 项，发现/确认两个问题：
  1. **真实 Bug**：`Enemy.fireAtPlayer` 与 `Boss.fireAtPlayer` 使用了不存在的 `player.dead` 属性，导致炮艇/坦克/BOSS 的瞄准弹永不发射。统一改为 `!player.alive` 后，普通敌机弹幕出现。
  2. **验证口径问题**：`file://` 下 `performance.getEntriesByType('resource')` 不返回资源条目，改为从 DOM 收集 script/style/icon 并检查 URL 均为本地文件，结合 Network 失败为 0 交叉验证。
- 修正后 55 项检查全部通过；随后补强护盾吸收、敌弹扣命两项真实碰撞检查，最终 57 项全部通过。

### 可玩性微调

- 初始 2.6 秒无敌，防止开场被俯冲机撞死。
- 死亡后清空敌弹、武器降一级并重置位置，给玩家恢复空间。
- BOSS 战前 2.7 秒警告横幅 + 三声警报；BOSS 死亡连爆约 1.9 秒。
- 低生命时屏幕边缘脉冲红晕；受击/炸弹有独立闪光和震屏强度。

## 5. 已知限制

- 移动端横屏时按高度适配，舞台会很小；这是竖版射击的固有取舍，建议竖屏游玩。
- 未实现存档断点续玩；最高分通过 localStorage 持久化，部分浏览器在 `file://` 下可能禁用 localStorage，此时最高分仅本局有效（Chrome 实测可用）。
- 音频为程序化短音效，没有背景音乐；静音偏好会保存。
- 触屏移动带有 58 逻辑像素的“抬升”，以适应手指遮挡；鼠标无抬升。

## 6. 运维/修改入口

- 难度与数值：`js/config.js`、`js/entities.js` 中 `ENEMY_DEFS`、`js/game.js` 的 `buildWave` / `Boss` 血量。
- 关卡节奏：`Game.startWave`、`Game.buildWave`、`CFG.BOSS_EVERY`。
- HUD/菜单样式：`css/style.css`。
- 验证断言：`verification/verify.mjs`。
