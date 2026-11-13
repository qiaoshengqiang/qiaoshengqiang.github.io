# 真实浏览器运行验证报告

## 结论

**通过。57 / 57 项检查全部通过，0 个控制台错误、0 个未捕获异常、0 个资源加载失败、0 个外部网络请求。**

游戏在真实 Chrome 中以 `file://` 直接打开运行，并完成了鼠标、键盘、触屏三种输入下的完整流程验证：开始游戏 → 击落敌机 → 暂停/继续 → 炸弹 → 补给 → 护盾/受击碰撞 → 第 5 波 BOSS → 击破 → 死亡结算 → 重开 → 移动端布局与触屏操作 → 无调试参数的纯双击打开。

| 项目 | 值 |
| --- | --- |
| 验证时间 | 2026-11-13 11:39–11:40（UTC+8） |
| 浏览器 | Chrome 157.0.8103.51（headless=new，arm64 macOS 14.5） |
| 页面地址 | `file:///.../workspace/index.html?debug=1` |
| 视口 | 1280×813 桌面；390×844 / DPR 2 移动端 |
| 验证方式 | Node 24 内置 WebSocket 直连 CDP，无 Playwright/Puppeteer |
| 结果文件 | `browser-report.json`（57 条明细）、`run.log`、`ocr-evidence.txt` |
| 截图 | `screenshots/01`–`09`，共 9 张 |

## 验证方法

1. **真实运行**：用 headless Chrome 打开本地 `file://` 页面，不使用本地服务器。
2. **真实输入**：通过 CDP `Input.dispatchMouseEvent`、`dispatchKeyEvent`、`dispatchTouchEvent` 发送鼠标移动/点击、键盘按下/抬起、触屏拖动与点击，而不是直接调用游戏方法。
3. **状态断言**：通过调试快照读取状态（分数、波次、生命、炸弹、BOSS、弹幕数量、坐标、FPS 等），同时检查 DOM 可见性与布局尺寸。
4. **真实碰撞**：在玩家位置注入一颗敌方子弹，验证护盾吸收、扣命、重生与无敌逻辑确实经过游戏碰撞循环。
5. **像素检查**：读取 Canvas `ImageData` 统计亮度方差，确认画面确实渲染而非空白。
6. **截图 + OCR 抽查**：保存阶段截图，并用 macOS Vision（zh-Hans + en-US）识别截图文字，作为“画面真的渲染出了 UI”的独立证据。原始识别结果见 `ocr-evidence.txt`。
7. **双击场景复测**：最后导航到**不带调试参数**的 `index.html`，确认 `window.__SR_DEBUG` 不存在、页面可正常开始游戏。

> 说明：为了稳定覆盖 BOSS 与死亡流程，验证脚本通过 `?debug=1` 暴露的测试接口强制进入第 5 波、击杀 BOSS、扣除玩家生命；其余移动、射击、拾取、暂停、炸弹、碰撞、开始/重开均为真实输入或在真实碰撞循环中触发。调试接口在普通双击场景中不会暴露。

## 检查明细（按阶段）

### A. 加载与离线（4 项）

- `file://` 页面加载完成（`readyState === complete`）。
- 游戏对象与 7 个关键类初始化成功。
- 10 个本地资源（8 个 JS、1 个 CSS、1 个 icon）全部从本地加载，`0` 个外部 URL。
- 运行期间 Network 无失败请求；验证结束时无任何 `http(s)` 外部请求。

### B. 主菜单与布局（8 项）

- 初始状态 `menu`，开始界面显示、暂停/结算隐藏。
- 舞台 446×669，宽高比严格 2:3；页面横向/纵向溢出均为 0。
- 菜单完整位于舞台内；主标题字号 51.5px，文字为「星际突击」。
- 暂停按钮初始禁用。
- Canvas 非空（亮度均值约 19.0、标准差 7.5）。
- 截图：`01-start-desktop.png`。

### C. 开始 / 鼠标 / 键盘 / 帧率（11 项）

- 真实鼠标点击「开始游戏」后进入 `playing`，Canvas 获得焦点，暂停按钮启用。
- 点击手势后 WebAudio `AudioContext.state === "running"`。
- 真实鼠标移动到逻辑坐标 x=150，玩家精确停在 x=150 / y=596（误差 ≤ 1px）。
- 自动开火产生玩家子弹（本轮采样峰值 6 发同屏）；敌机生成峰值 6 架。
- 真实操作下击落敌机获得分数（本次 1300 分）。
- 敌人弹幕正常出现（本轮观测到 3 发，波次 2）。
- 帧率：2 秒实测 60.2fps，游戏内部统计 60fps。
- 方向键按住 0.52s，玩家 x 从 52 移到 20（有效响应）。
- 截图：`02-gameplay.png`。

### D. 暂停 / 炸弹 / 补给 / 碰撞（8 项）

- `P` 键进入 `paused`，暂停面板可见；点击「继续游戏」恢复 `playing`。
- 空格炸弹：炸弹数 2 → 1，炸弹特效与清屏伤害触发。
- 生成 `P` 补给后，玩家武器等级提升。
- 生成 `S` 补给后，护盾计时变为 7 秒。
- **真实碰撞 1**：向玩家位置注入敌弹，护盾吸收伤害，护盾归零、生命保持 3。
- **真实碰撞 2**：再次注入敌弹，生命 3 → 2，玩家触发重生与无敌。
- 截图：`03-pause.png`、`04-bomb.png`。

### E. BOSS（6 项）

- 强制进入第 5 波：BOSS 成功生成并进入 `fight`，进场时血量为 130/150（进场途中被自动火力削去 20 点）。
- BOSS 发射弹幕（采样时屏上有 5 发敌弹）。
- 强制击破后进入 `dying` 连爆状态，随后从场上移除。
- 击破得分 +3050（含 BOSS 奖励），总分推进到 5820，并自动进入第 6 波。
- BOSS 战前警告横幅与血条均渲染（截图 OCR 可识别 `BOSS`、`WAVE 05`；血量由状态断言确认）。
- 截图：`05-boss.png`。

### F. 死亡 / 结算 / 最高分 / 重开（7 项）

- 连续三次强制受击，生命序列严格为 `[2, 1, 0]`。
- 生命归零进入 `dying`，1.55 秒后显示 `gameover` 结算界面。
- 结算面板分数 005820 与内部状态一致；显示最高分 005820 与 `WAVE 06`。
- `localStorage.starRaider.highScore = "5820"`，最高分成功持久化。
- 点击「再来一次」：状态 `playing`、分数 0、生命 3、波次 1；最高分保留。
- 截图：`06-gameover.png`。

### G. 移动端 / 触屏（7 项）

- `Emulation.setDeviceMetricsOverride` 为 390×844 / DPR 2 后重新加载，回到主菜单。
- 舞台 362×543 完整适配视口，保持 2:3，无溢出。
- 移动端菜单显示持久化最高分 005820。
- 触屏点击「开始游戏」进入游戏。
- 触屏拖动后玩家 x = 120（从 240 拖到 120，精确响应）。
- 触屏点击右下角「炸弹」按钮，炸弹 2 → 1。
- 截图：`07-mobile-menu.png`、`08-mobile-gameplay.png`。

### H. 纯双击场景 / 控制台 / 网络（6 项）

- 导航到 `file://.../index.html`（**无 `?debug=1`**）：`__SR_DEBUG` 不存在，页面正常进入主菜单。
- 点击开始按钮进入游戏，证明双击交付场景可用。
- 截图：`09-file-open.png`。
- 控制台 error 数 = 0。
- 未捕获 JS 异常数 = 0。
- 资源加载失败数 = 0。
- 外部网络请求数 = 0（完全离线）。

## 截图证据

| 文件 | 内容 | OCR 抽查 |
| --- | --- | --- |
| `01-start-desktop.png` | 桌面主菜单 | 星际突击 / STAR RAIDER / 历史最高 / 开始游戏 / 移动 / 开火 / 炸弹 / 暂停 |
| `02-gameplay.png` | 真实鼠标操作、自动开火 | SCORE 000200 / WAVE 01 / +100 / LIFE / HI-SCORE |
| `03-pause.png` | 暂停面板 | PAUSED / 暂停 / 继续游戏 / 重新开始 |
| `04-bomb.png` | 炸弹清屏与波次结算 | BOMB! / WAVE CLEAR +200 / SCORE 002670 / WAVE 02 |
| `05-boss.png` | 第 5 波 BOSS 战 | BOSS / WAVE 05 / SCORE 002770 / HI-SCORE 002770 |
| `06-gameover.png` | 任务失败结算 | MISSION FAILED / 005820 / 最高分 / WAVE 06 / 再来一次 |
| `07-mobile-menu.png` | 390×844 移动端菜单 | 星际突击 / 历史最高 005820 / 开始游戏 / 触屏提示 |
| `08-mobile-gameplay.png` | 移动端触屏游戏与炸弹 | SCORE 000400 / WAVE 01 / BOMB! / HI-SCORE 005820 / INVULNERABLE |
| `09-file-open.png` | 无调试参数纯 `file://` 开始后 | SCORE 000000 / WAVE 01 / HI-SCORE 005820 |

OCR 为辅助证据，存在少量识别误差（例如字体艺术化导致「任务失败」被识别成乱码、MISSION FAILED 被拆成两段），不影响截图本身与 DOM/状态断言。

## 修复记录

首轮 53 项检查中通过 51 项，暴露了一个真实游戏 Bug：

- `Enemy.fireAtPlayer` / `Boss.fireAtPlayer` 使用了不存在的 `player.dead` 属性，导致炮艇、坦克和 BOSS 的“瞄准射击”永远提前返回；BOSS 仍能通过环形弹攻击，因此不易发现。
- 统一改为 `!player.alive` 后，炮艇/BOSS 瞄准弹正常生成。

另一项为验证方式修正：Chrome 在 `file://` 下不填充 `performance.getEntriesByType('resource')`，改为检查 DOM 中的 script/style/icon URL + Network 无失败请求。

随后补强了 2 项真实碰撞检查（护盾吸收、敌弹扣命），最终检查项为 57 项并全部通过。

## 复现

```bash
cd /path/to/project
node verification/verify.mjs
```

要求：Node.js 24+、安装于 `/Applications/Google Chrome.app` 的 Chrome、macOS。脚本会自动启动/关闭 headless Chrome，使用临时用户目录，截图输出到 `verification/screenshots/`，报告写入 `verification/browser-report.json`。

原始运行输出见 `run.log`，逐项布尔结果见 `browser-report.json` 的 `checks` 数组。
