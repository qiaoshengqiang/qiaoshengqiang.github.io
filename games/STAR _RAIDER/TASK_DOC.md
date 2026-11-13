# 任务文档

## 任务目标
做一个简单可玩的打飞机（纵版射击）网页小游戏，交付可直接双击打开运行的多文件网页项目，并做真实浏览器运行验证。

## 当前状态
- iteration: 1
- phase: complete（已完成）
- status: completed
- thinking: max
- session: task_7c077f68
- last_error: （无）
- updated_at: 2026-11-13T03:42:22.140958+00:00

## 迭代 / 阶段历史
- autonomous: completed (thinking=max)

## 设计意图
# 星际突击 STAR RAIDER · 设计意图

## 1. 一句话定位

一个无需安装、双击即玩的竖版街机射击游戏：鼠标/触屏/键盘移动，自动开火，拾取强化，每 5 波挑战一次 BOSS。

## 2. 设计目标

- **零门槛**：不需要教程也能在 10 秒内开始；移动即玩，开火自动。
- **短局有反馈**：10~30 秒内能击落敌机、看到分数和爆炸；2~3 分钟能打到第一个 BOSS。
- **有街机味**：霓虹星空、粒子爆炸、屏幕震动、合成音效、闪烁的 HUD。
- **真正离线**：所有图像与声音均由 Canvas / WebAudio 生成，不依赖任何网络素材。
- **桌面 + 移动端都可玩**：鼠标、WASD/方向键、触屏拖动三种输入；布局随视口缩放。

## 3. 核心循环

```
移动 → 自动开火 → 击落敌机 → 得分 / 掉落补给 → 变强
   ↑                                        ↓
   └──────────── 躲避弹幕 ← BOSS / 更高波次 ┘
```

- 玩家有 3 条命、2 枚炸弹，武器初始 1 级。
- 每 5 波出现一次 BOSS；BOSS 战前有警告横幅和警报音。
- 波次清空后自动进入下一波，并奖励 `WAVE × 100` 分。
- 死亡时清空敌弹、保留已获得的分数；生命耗尽后展示结算面板。

## 4. 操作设计

| 操作 | 鼠标 | 触屏 | 键盘 |
| --- | --- | --- | --- |
| 移动 | 移动鼠标，战机跟随 | 按住并拖动，战机会抬到手指上方 | 方向键 / WASD |
| 开火 | 自动 | 自动 | 自动 |
| 炸弹 | 点击右下角按钮 | 点击右下角按钮 | Space |
| 暂停 | 顶栏暂停键 | 顶栏暂停键 | P / Esc |
| 静音 | 顶栏喇叭键 | 顶栏喇叭键 | M |
| 开始 / 重开 | 点击按钮 | 点击按钮 | Enter |

**设计取舍**：自动开火让移动输入和攻击解耦，降低上手成本；炸弹作为唯一的“主动技能”，提供清屏和救场手段。玩家判定半径（7px）明显小于机身视觉尺寸，鼓励贴弹幕飞行。

## 5. 内容设计

### 敌机

| 类型 | 行为 | 血量 | 分值 |
| --- | --- | --- | --- |
| 侦察机 SCOUT | 正弦横向漂移、直线下降 | 1 | 100 |
| 俯冲机 DIVER | 短暂悬停后锁定玩家位置俯冲 | 2 | 160 |
| 炮艇 GUNNER | 到达上方阵位后左右巡航、瞄准射击 | 4 | 260 |
| 重装坦克 TANK | 慢速进场、横向摆动、三向散射 | 12 | 520 |

### BOSS（每 5 波）

- 毁灭者级战舰，血量 `70 + 波次 × 16`（第 5 波为 150）。
- 四种攻击模式循环：五向瞄准弹、旋转环形弹、短点射连发、交叉环形弹。
- 血量低于 40% 进入狂暴：移动更快、攻击间隔缩短、弹幕变色。
- 死亡时清空敌弹，播放约 1.9 秒的连锁爆炸，掉落三件补给。

### 补给

| 图标 | 效果 |
| --- | --- |
| P | 武器等级 +1（最高 5 级，弹道数量增加） |
| B | 炸弹 +1（最高 5 枚） |
| S | 护盾 7 秒，免疫并消耗一次伤害 |
| H | 生命 +1（最高 5 条命） |

补给从被击落敌机处按概率掉落，靠近玩家时会被轻微吸附。

## 6. 视觉与听觉

- **美术**：深空蓝黑底 + 紫/青星云、三层视差星空、偶发流星；玩家为青白色战机，敌机使用橙/红/紫/粉区分威胁；BOSS 为带旋转能量环的紫粉色巨舰。
- **反馈**：击中闪白、碎屑粒子、爆炸冲击波、屏幕震动、受击红色暗角、低生命脉冲红边、白色闪光。
- **HUD**：分数、最高分、波次胶囊；第二行生命、炸弹、火力等级；BOSS 血条；波次横幅。
- **音频**：WebAudio 实时合成射击、命中、爆炸、补给、警报、GAME OVER 音效；默认开启，可一键静音并记忆偏好。

## 7. 界面流程

```
开始界面 ──开始──> 游戏中 ──P/按钮──> 暂停 ──继续──> 游戏中
                     │                  └─重新开始─> 游戏中
                     ├─炸弹/补给/波次/BOSS
                     └─生命耗尽 ──> 任务失败结算 ──再来一次──> 游戏中
```

## 8. 范围与非目标

- **包含**：单机无尽波次、BOSS、四类敌机、四类补给、最高分、暂停、静音、鼠标/键盘/触屏。
- **不包含**：联网、排行榜、关卡选择、剧情、复杂升级树、外部图片/音频素材。
- **兼容目标**：最新版 Chrome / Edge / Safari，直接以 `file://` 双击打开。

## 9. 验收标准

1. 双击 `index.html` 即可进入开始界面，无构建、无服务器、无外部请求。
2. 鼠标、键盘、触屏均可移动战机；自动开火可击落敌机并加分。
3. 炸弹、暂停、补给、死亡、结算、重开、最高分保存形成完整闭环。
4. 第 5 波 BOSS 正常出现、发射弹幕、可被击破并推进到第 6 波。
5. 桌面与 390×844 移动视口均无溢出，控制台无 JS 错误。
6. 真实 Chrome 中稳定 30fps 以上（本次实测约 60fps）。

## 工程记录
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
node
…（已截断）

## 未解决问题
- （暂无）

## 当前文件
- ENGINEERING.md
- PROTOTYPE.md
- README.md
- TASK_DOC.md
- assets/favicon.svg
- css/style.css
- index.html
- js/audio.js
- js/config.js
- js/entities.js
- js/game.js
- js/input.js
- js/main.js
- js/player.js
- js/utils.js
- verification/VERIFICATION.md
- verification/browser-report.json
- verification/ocr-evidence.txt
- verification/run.log
- verification/screenshots/01-start-desktop.png
- verification/screenshots/02-gameplay.png
- verification/screenshots/03-pause.png
- verification/screenshots/04-bomb.png
- verification/screenshots/05-boss.png
- verification/screenshots/06-gameover.png
- verification/screenshots/07-mobile-menu.png
- verification/screenshots/08-mobile-gameplay.png
- verification/screenshots/09-file-open.png
- verification/verify.mjs
