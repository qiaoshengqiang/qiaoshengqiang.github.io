# 任务文档

## 任务目标
用 three.js 做一款可玩的网页赛车游戏：赛道位于未来赛博朋克城市中，赛道要依次经过街道、高架、地下隧道等多种路段（可自行扩展更多路段类型，如跨海大桥、废弃工业区、霓虹广场等）。尽最大可能把这款游戏做到足够好：包括但不限于操作手感、镜头、光照与霓虹视觉风格、速度感、多种路段无缝衔接、计时/圈速、障碍与碰撞、HUD、音效、暂停/重开、移动端触控支持。交付可直接打开运行的多文件网页项目，并做真实浏览器运行验证。

返工要求（第 2 轮）：
那款赛博朋克的赛车游戏我发现有问题问题，比如说控制键左右反了，比如说赛道边上的指向标志方向竖着朝上，赛车跑起来时的音效等，我希望能进行修复，并把赛车模型做好，完善下细节。

## 当前状态
- iteration: 2
- phase: complete（已完成）
- status: completed
- thinking: high
- session: task_74e60290.i2
- last_error: （无）
- updated_at: 2026-11-12T21:05:58.355721+00:00

## 迭代 / 阶段历史
- prototype: failed (thinking=max)
- prototype: completed (thinking=max)
- engineering: completed (thinking=high)
- evolution: completed (thinking=high)
- direct: completed (thinking=high)

## 设计意图
# NEON RUNNER // 霓虹疾驰

一个可直接打开游玩的 three.js 赛博朋克城市赛车原型。单圈约 **2.8 km**，依次穿过街道、高架、跨海光桥、地下隧道、废弃工业区和霓虹广场；支持键盘、触控、计时圈速、AI 对手、障碍碰撞、氮气、漂移、镜头切换、暂停/重开与程序化音效。

> **状态：PROTOTYPE READY**  
> 无构建步骤；推荐使用 Chrome / Edge 直接打开 `index.html`。

---

## 1. 快速开始

1. 打开本目录下的 **`index.html`**（双击即可，支持 `file://` 直接运行）。
2. 推荐 Chrome / Edge；需要 WebGL。
3. 点击 **START RACE**，或按 `Enter`。首次点击/按键后浏览器才会允许启动 AudioContext。
4. 倒计时结束后按住油门出发。完成 **3 圈**即可进入成绩页。

可选本地服务器（与直接打开等效，便于开发调试）：

```bash
cd <本目录>
python3 -m http.server 8080
# 打开 http://127.0.0.1:8080/index.html
```

无任何 CDN、网络字体或外部素材请求；断网、`file://` 均可运行。

---

## 2. 操作

### 键盘

| 输入 | 功能 |
|---|---|
| `W` / `↑` | 油门 |
| `S` / `↓` | 刹车；低速时倒车 |
| `A` `D` / `←` `→` | 转向 |
| `Space` | 漂移 / 手刹 |
| `Shift` | N₂O 氮气加速 |
| `C` | 切换镜头：CHASE → CINEMA → HOOD |
| `R` | 比赛中把车复位到赛道中心（保留当前圈计时） |
| `P` / `Esc` | 暂停 / 继续 |
| `M` | 音效开关 |
| `Enter` | 主菜单开始比赛 |

### 触控 / 移动端

- 左下 `◀` / `▶`：转向。
- 右下 `BRAKE` / `GAS`：刹车 / 油门。
- 右下 `N₂O` / `DRIFT`：氮气 / 漂移。
- 右上 `Ⅱ`：暂停；暂停页提供继续、重开、回正、退出。
- 触控 HUD 使用安全分区：竖屏为紧凑数字速度卡片，横屏保留完整圆形速度表；控件与信息面板不重叠、不出屏。

品质（HIGH / LOW）与音效可在主菜单切换。LOW 会降低像素比、Bloom 强度和关闭 FXAA，适合低性能设备。

---

## 3. 比赛结构

- **3 圈**，单圈约 2.8 km，闭合城市环线。
- 玩家与 **4 名 AI 对手**同场，起跑时位于最后一排，HUD 显示实时名次 `P1–P5`。
- 过起跑线后开始计圈；HUD 显示当前圈时间、上一圈、最佳圈、圈数和名次。
- 每进入一个新路段会显示 **SECTOR 01–06** 提示并播放检查点音效；手机上即使路段胶囊被隐藏，也会通过 toast 告知当前路段。
- 跑完 3 圈进入成绩页：总时间、最佳圈、最高速度、名次、逐圈列表（最快圈/更快圈标签）。
- 最佳圈会写入 `localStorage`（键名 `nr.bestLap`），下次主菜单可见；存储不可用时自动降级，不影响游戏。

### 六段赛道

赛道由 **30 个控制点、闭合 Catmull-Rom 曲线**生成，所有路段共用同一条连续路面，不需要加载或传送。

| # | 英文名 | 中文 | 特征 |
|---|---|---|---|
| 01 | NEON AVENUE | 霓虹大道 | 起跑直道、城市街区、湿滑反光路面、密集招牌 |
| 02 | SKYLINE FREEWAY | 高架动脉 | 持续爬升到约 24 m 高度，护栏、桥墩、远景塔楼 |
| 03 | ABYSS BRIDGE | 跨海光桥 | 高空粉色霓虹桥面，强风感与远景城市灯海 |
| 04 | UNDERPASS 09 | 地底环线 | 穿过隧道入口下降到负高度，琥珀色隧道灯、封闭空间 |
| 05 | RUST YARDS | 废弃工业区 | 绿色工业照明、仓库/集装箱轮廓、粗糙路面氛围 |
| 06 | NEON PLAZA | 霓虹广场 | 终点前的品红霓虹广场与看板，回到起跑直道 |

高架、桥、隧道入口和出口都通过高度与路面法线平滑衔接；没有独立场景切换。

---

## 4. 玩法系统

### 驾驶与手感

- 自定义轻量车辆物理：油门/刹车/倒车、速度相关转向、侧向抓地、手刹漂移、坡度影响、空气阻力。
- 转向使用阻尼插值，低速不失控；高速转向角自动收窄。
- 漂移时降低侧向抓地并增加转向角，松开后逐渐恢复；持续漂移会累计漂移分数并弹出 `DRIFT +N`。
- 车辆被限制在赛道横向边界内；撞墙会移除向外速度并擦除部分速度，不产生夸张反弹。
- 速度上限：常规约 82 单位/秒，氮气约 101；HUD 以 km/h 显示。

### 氮气

- 初始 100；按住 Shift / N₂O 时以 25/s 消耗，提供额外推力与更高极速。
- 松开后以 4.5/s 回充；漂移时 12/s 回充。
- 低于 18 时 HUD 氮气条进入低量警示；耗尽时弹出提示。

### 障碍与碰撞

- 赛道沿途布置 8 个程序化障碍：护栏、混凝土块、油桶、检查门。
- 圆形碰撞体 + 推离 + 速度衰减；碰撞触发火花、烟雾、屏幕红色 damage flash、镜头震动和 `IMPACT // HAZARD` toast。
- 与 AI 车辆接触也会推离、减速并产生接触提示。
- 没有生命值/车辆损毁系统；碰撞是街机式惩罚，不会直接结束比赛。

### AI 与名次

- 4 名 AI 沿赛道进度行驶，带车道摆动和弯道预判
…（已截断）

## 工程记录
# NEON RUNNER // 工程化验收记录

> 阶段：prototype → engineering  
> 交付入口：`index.html`（无需构建、无需服务器）  
> 原型设计说明：`PROTOTYPE.md`

## 1. 本轮工作范围

本轮没有重做玩法，而是以可交付版本为基线做以下工作：

1. 复核 `PROTOTYPE.md` 与现有代码/运行时状态；
2. 在真实 headful Chrome 中复测启动、驾驶、碰撞、计时、暂停、重开、结算、触控和音频；
3. 针对边界状态做代码审查和修复；
4. 为本项目补一个可复现的 headful 冒烟测试；
5. 记录验证结果、已知限制和后续可选项。

## 2. 测试环境与原则

- macOS + Chrome（headful），Node `v24.21.0`。
- 测试通过 Puppeteer 控制真实窗口；headless SwiftShader 不作为有效视觉验证。
- 测试既走过本地 HTTP，也走过 `file://`。最终冒烟测试固定使用 `file://`，证明交付物不依赖服务器。
- 玩法边界测试使用 `/tmp` 中的临时调试副本；交付工作区不包含 `__NR_DEBUG` 或任何调试出口。
- 所有交付 JS 均通过 `node --check`。

## 3. 代码审查与运行时发现

### 3.1 已修复

1. **暂停在倒计时阶段时，`RESET CAR` 会残留倒计时遮罩**
   - 路径：`js/game.js` 的 `#btn-reset-car` 回调。
   - 旧行为：暂停发生在倒计时时，重置直接切到 `race`，但 `#countdown-layer` 仍显示，且灯态/阶段状态不明确。
   - 修复：重置时隐藏倒计时层、清空 `game.countdownStage`、关闭起跑灯，再进入自由驾驶。
   - 验证：重置后 `mode='race'`、`countdown-layer hidden`、`pause-screen hidden`、计时从 `00:00.300` 起走。

2. **AI 完赛后进度回卷到起点**
   - 路径：`updateRivals`。
   - 旧行为：AI 的 `progress` 达到 3 圈后被 `wrap` 到 `s=0`，可能重新出现在起跑格，且仍参与玩家碰撞。
   - 修复：完赛 AI 停在 `LAPS * L - 1` 的位置；设置 `lapsDone = LAPS`；玩家碰撞函数跳过 `finished` 的 AI。
   - 验证：强制完赛后 `finished=true`、世界 `s≈0.9996`、距起跑线约 3.1 单位；玩家叠到该位置不会收到 `CONTACT // RIVAL`；玩家排名正确变为 P2。

3. **倒计时阶段失焦没有自动暂停**
   - 路径：`bindInput` 的 `blur` / `visibilitychange`。
   - 修复：`countdown` 与 `race` 都进入暂停。
   - 验证：倒计时中触发失焦后进入 `paused`，恢复时继续倒计时。

4. **暂停恢复后模式记录不完整**
   - 路径：`resumeGame` 与 `pauseResumeMode`。
   - 修复：从暂停恢复进入比赛时显式记录 `game.pauseResumeMode = 'race'`，避免从倒计时/重开路径恢复后模式错乱。

5. **启动时 favicon 404**
   - 路径：`index.html`。
   - 修复：加入内联 SVG data URI favicon。
   - 验证：页面请求失败列表为空，控制台错误为空。

6. **声音按钮缺少可访问状态**
   - 路径：`index.html` 与 `toggleSound`。
   - 修复：`#btn-sound` 增加初始 `aria-pressed="true"`，切换时同步 `aria-pressed`。
   - 验证：OFF 时 `aria-pressed="false"` 且 `audio.muted=true`；ON 时恢复 true。

7. **重复/死状态清理**
   - 删除 `createRivals` 中重复的 `r.lat` 赋值；
   - 删除 `placeCameraSnap` 中重复的 `ui.menu.classList.add('hidden')`；
   - 删除未使用的 `game.started`、`race.startToast`、`player.wrongDisplay`。

### 3.2 复核未发现回归的关键路径

- 启动倒计时 → GO → 计时开始；
- 圈边界触发 `completeLap`、三圈后 `finishRace`；
- `finishRace` 生成 P1–P5 文案、总时间、最快圈、最高速度、圈列表；
- 暂停冻结 `race.time` 与 HUD；恢复后继续；
- `RESET CAR` 将车放回赛道中心且保留圈进度；
- 移动端暂停/恢复/重置会正确隐藏/恢复 `#touch-controls`；
- `file://` 下 vendor 后处理、SVG 纹理、localStorage 安全降级均无请求失败。

## 4. 验证结果

### 4.1 静态检查

- `node --check js/*.js`：通过（`JS_FINAL_OK`）。
- `node --check verification/smoke.js`：通过。
- 工作区无 `__NR_DEBUG` / `__NR` 残留。
- 无外部运行时链接；favicon 为内联 data URI。

### 4.2 Headful 冒烟测试

`verif
…（已截断）

## 未解决问题
- （暂无）

## 当前文件
- ENGINEERING.md
- PROTOTYPE.md
- RESULT.md
- TASK_DOC.md
- css/style.css
- index.html
- js/audio.js
- js/car.js
- js/effects.js
- js/environment.js
- js/game.js
- js/track.js
- js/util.js
- js/vendor/CopyShader.js
- js/vendor/EffectComposer.js
- js/vendor/FXAAShader.js
- js/vendor/LuminosityHighPassShader.js
- js/vendor/RenderPass.js
- js/vendor/ShaderPass.js
- js/vendor/UnrealBloomPass.js
- js/vendor/three.min.js
- verification/README.md
- verification/smoke.js
