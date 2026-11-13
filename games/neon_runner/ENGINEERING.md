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

`verification/smoke.js` 在 `file://` 下真实打开游戏，17 项检查全部通过：

- 菜单、loading、fatal 状态正确；
- START → 倒计时 → HUD；
- `W` 加速、计时推进、桌面端不显示触控层；
- `P` 暂停且计时冻结，恢复后遮罩关闭；
- `R` 恢复车辆并出现 `VEHICLE RECOVERED`；
- 无 page error、无 console error、无失败请求。

最终输出：`SMOKE_OK`。

同一脚本通过 `http://127.0.0.1:8777` 复跑也得到 `SMOKE_OK`。测试在倒计时结束后主动 `bringToFront()` 再发送按键，避免窗口失焦触发的自动暂停造成假阴性。

### 4.3 视口矩阵

覆盖 `320×568`、`360×640`、`390×844`、`568×320`、`768×360`、`844×390`、`768×1024`、`1024×768`、`1280×800`：

- 所有用例 `overlaps: []`、`overflow: []`；
- HUD 读数（lap / pos / time / speed / gear / nitro）均正常；
- 触控设备下 `sector-chip` 隐藏，路段信息通过 toast 提示。

### 4.4 移动端触控回归（390×844）

- START 后触控层显示；
- 按住 GAS 约 1.5 s：`speed=103`、`time=00:02.599`、`gear=3`；
- 暂停：`pause-screen` 显示、触控层隐藏；
- `RESET CAR`：暂停关闭、触控层恢复、`speed=000`；
- 无 page error。

### 4.5 结算页布局（真实 headful，注入完赛状态）

在 `320×568`、`390×844`、`568×320`、`844×390`、`1366×768` 五种视口下验证真实结果弹窗：

- 5 个视口的 `RACE AGAIN` / `MENU` 均在屏内；
- 320×568：modal `58.3–509.8`，`again 397.8–443.8`，`menu 451.8–482.8`；
- 568×320：modal `14.8–305.3`，两个按钮均在 320 px 高度内；
- 844×390 / 1366×768：完整横向按钮布局正常；
- 三行圈速列表均生成，无溢出或 page error。

### 4.6 完赛与排名路径

测试注入圈边界完成三圈：

- 圈速：`42.783 / 41.567 / 40.867 s`；
- 最快圈 `40.867`，结果标题 `CIRCUIT DOMINATED`，排名 `P1`；
- 结果页出现 3 行圈速、`RACE AGAIN`、`MENU`；
- 点击 AGAIN 后回到倒计时，`laps=0`、成绩清空、计时归零；
- 无 page error。

> 说明：三圈完赛通过测试边界注入完成，并未由真人手动连续跑完三圈；真实物理连续驾驶已另外验证。

### 4.7 真实物理连续驾驶

- 20 秒自动驾驶：实际物理推进约 `650 m`，速度正常，无 NaN、无速度爆炸；
- 连续两圈：圈速 `66.55 / 51.20 s`，无物理崩溃；
- **真实物理三圈完赛**：自动驾驶完成 3 圈，圈速 `70.59 / 61.80 / 50.93 s`，最终 `mode='finished'`、`laps=3`、排名 `P1`、标题 `CIRCUIT DOMINATED`，结果页真实打开，无 page error；
- 长测中浏览器窗口失焦会触发自动暂停（符合设计）；测试恢复窗口并点击继续后继续完成，不是游戏异常。

### 4.8 碰撞与音频回归

- 障碍碰撞：`IMPACT // HAZARD`、hit cooldown、damage flash、位置推出均生效；
- 墙体：横向被限制在约 `9.92`，外推速度归零，无反弹放大；
- 音频：点击 START 前 `AudioContext` 不存在；手势后 `state='running'`、`AudioContext` 数 1、振荡器正常创建；按钮 `aria-pressed` 正确；
- 品质/声音切换：HIGH↔LOW 生效并写入 `nr.quality`；AUDIO OFF/ON 与 `audio.muted`、`aria-pressed` 同步。

## 5. 交付变更清单

| 文件 | 变更 |
| --- | --- |
| `js/game.js` | 倒计时重置修复、AI 完赛停车/跳过碰撞、失焦倒计时暂停、aria 状态、死状态清理 |
| `index.html` | 内联 favicon、声音按钮 `aria-pressed` |
| `verification/smoke.js` | 新增 headful `file://` 冒烟测试 |
| `verification/README.md` | 测试说明与运行命令 |
| `ENGINEERING.md` | 本记录 |

`css/style.css`、`js/util.js`、`js/track.js`、`js/environment.js`、`js/car.js`、`js/effects.js`、`js/audio.js` 本轮未做行为性修改。

## 6. 已知限制

1. **AI**：目前是“沿赛道进度 + 摆动 + 橡皮筋”的街机 AI，没有变线超车或障碍物避让；适合原型，不是完整赛车 AI。
2. **碰撞**：车辆、AI、障碍使用圆形/半径近似，没有真实车体 OBB 或可变形车损。
3. **完赛测试方式**：三圈结果路径同时用边界注入和真实物理自动驾驶验证；尚未记录真人手动三圈成绩，实际圈速与难度仍需试玩调校。
4. **极端视口**：320×480 下暂停弹窗高度约 506 px，略高于视口，但全部操作按钮在屏内；继续压缩会牺牲可读性，本轮未强行修改。
5. **平台差异**：Chrome/Edge 验证最充分；Safari/Firefox 依赖各自 WebGL/AudioContext 实现，`file://` 下 localStorage 可能降级（游戏有安全兜底）。
6. **范围外功能**：无手柄、幽灵车、在线排行榜、车辆选择或赛后回放。
7. **仓库内自动化**：已提交冒烟测试；完整的视口矩阵、音频和物理长测仍依赖外部 Puppeteer 脚本与真实浏览器环境。

## 7. 交付检查

- `index.html` 直接双击可运行；脚本按序加载，无外部运行时依赖；
- `PROTOTYPE.md` 保留设计意图与操作说明；
- `verification/smoke.js` 可在装有 `puppeteer-core` 的环境复跑；
- 交付源码不含 `__NR_DEBUG`；
- 无 `QUESTION.json`；
- 本次工程化收尾结论：**可交付，进入后续试玩调优阶段**。

---

## 8. 第 2 轮返工记录（rework:fix）

反馈：左右转向反了、路边指向标志箭头竖着朝上、行驶音效不佳、赛车模型需要加强。

### 8.1 代码变更

| 文件 | 变更 |
| --- | --- |
| `js/game.js` | 翻转左右转向输入（世界 +Z / 相机屏幕右为 -X 的坐标约定）；完赛排名与完赛时间统一；玩家 `finishTime` 与 `game.rank` 同步；倒计时空踩油门转速不再被主循环覆盖 |
| `js/util.js` | `chevronTexture(color, dir)` 改为横向左/右三联箭头；新增 `hazardStripeTexture()` 斜纹 |
| `js/environment.js` | 弯道牌按有符号转向放到弯道外侧，左右纹理分别实例化 |
| `js/track.js` | 隧道立柱改用斜纹危险纹理；墙面文字移除 `▲` |
| `js/audio.js` | 重写引擎：4 层振荡器 + 软饱和 + 排气噪声 + 涡轮啸叫 + 路面滚动 + 换挡点火切断 + 氮气 backfire；暂停时全部淡出 |
| `js/car.js` | 重写赛车：楔形车身、翼子板、前铲侧裙、扩散器、双层尾翼、双排气、灯组、座舱内饰、五辐轮毂/刹车盘/固定卡钳、车号圆牌、车牌、霓虹饰条；静态零件按材质合并 |

### 8.2 验证结果（headful Chrome / file://）

- `verification/smoke.js`：17/17 通过，`SMOKE_OK`；
- `D / →`：`Δyaw = -0.746`，相机右向速度增量 `+18.22`，触控右转 `Δyaw = -1.007`；
- 22 块弯道牌：`22/22` 箭头方向与弯道方向一致；
- 音频：`AudioContext.state='running'`，引擎总线 `0.19–0.20`，主输出 `RMS 0.0525 / peak 0.137`，换挡事件实际触发；倒计时轰油门基频 `90.6→152.8 Hz`、增益 `0→0.145` 且车速为 0；
- 真实物理三圈（无传送/无复位）：`70.85 / 67.18 / 53.32 s`，`mode='finished'`，结果页 `P1` 与内部排名一致，无 page error；
- 390×844 触控：GAS 后 `108 km/h`，六个触控键无重叠/出屏，暂停可用；
- 1366×768 驾驶约 `60.3 FPS`；
- 全部 JS `node --check` 通过，交付源码无 `__NR_DEBUG`。

### 8.3 新增已知限制

- 音效通过节点状态和波形采样验证，未做主观听感试听；
- 赛车外观为程序化低多边形风格，细节提升以合并几何控制 draw call，不追求写实车模；
- 三圈完赛仍由真实物理自动驾驶完成，真人难度需试玩调校。
