# 一键连接 GitHub 使用说明

> 脚本位置：`~/Documents/github/一键连接GitHub.command`

## 这个脚本能做什么

双击 `一键连接GitHub.command`，会打开终端并显示中文菜单：

| 序号 | 功能 | 什么时候用 |
|---|---|---|
| 1 | 新建 GitHub 仓库并上传目录 | 第一次把某个文件夹传到 GitHub |
| 2 | 把目录连接到已有 GitHub 仓库 | GitHub 上已经有仓库，想把本地文件接上去 |
| 3 | 克隆（下载）已有仓库 | 换电脑，或想把仓库下载到本地 |
| 4 | 提交并上传当前修改 | 日常改完文件后上传 |
| 5 | 拉取 GitHub 上的最新修改 | 在网页/其他电脑改过，同步到本地 |
| 6 | 查看登录 / 仓库状态 | 检查有没有登录、远程地址对不对 |

脚本不会删除你的文件。它只会：

- 安装 GitHub CLI（如果你同意）
- 登录你的 GitHub 账号
- 在目录里创建 `.git` 和 `.gitignore`
- 提交并推送文件

---

## 第一次使用（3 步）

### 第 1 步：双击运行

在 Finder 里双击：

```text
一键连接GitHub.command
```

如果 macOS 提示“无法打开”，在文件上点右键 → 打开 → 仍要打开。

### 第 2 步：按提示登录

脚本会依次做这些事：

1. 检查 Git（你电脑已经有）
2. 检查 GitHub CLI（已经装好 v2.104.0；以后如果缺失，脚本会直接下载官方预编译版，不经过 Homebrew）
3. 打开浏览器登录 GitHub
   - 终端会显示一个一次性代码，例如 `ABCD-1234`
   - 浏览器打开后粘贴这个代码，点授权
4. 检查 Git 提交身份
   - 你当前的 Git 邮箱带了中文引号 `‘ ’`，脚本会提示修正
   - 直接回车，使用脚本推荐的 GitHub 匿名邮箱即可

### 第 3 步：选择 1 或 2

- 想把当前文件夹新建为一个 GitHub 仓库：选 `1`
- GitHub 上已经有仓库：选 `2`，输入 `用户名/仓库名`

之后按提示输入仓库名、选择私有/公开即可。

> 建议选“私有（Private）”，只有你自己能看到。

---

## 日常使用

改完文件后：

1. 双击 `一键连接GitHub.command`
2. 选 `4`（提交并上传当前修改）
3. 回车使用默认目录
4. 输入一句提交说明，例如“修改首页样式”
5. 回车确认

如果 GitHub 上有新改动，先选 `5` 拉取，再选 `4` 上传。

---

## 代理设置（你的网络）

你的 GitHub 直连不通，代理是 **HTTP 127.0.0.1:10792**。现在已经配置好：

- **git**：`http.https://github.com.proxy = http://127.0.0.1:10792`
- **终端**：`~/.zshrc` 会自动检测 10792，只有代理开着才启用
- **脚本**：启动时自动检测 10792（HTTP）或 10793（SOCKS），并设置 `HTTP_PROXY/HTTPS_PROXY`

验证是否生效：

```bash
git ls-remote https://github.com/qiaoshengqiang/qiaoshengqiang.github.io.git
```

能输出一串 commit 哈希就说明通了。

如果以后代理端口变了，需要改三处：

1. `~/.zshrc` 里的 `10792`
2. 脚本 `setup_proxy` 函数里的 `10792` / `10793`
3. git 配置：

```bash
git config --global http.https://github.com.proxy http://127.0.0.1:新端口
```

取消 git 代理：

```bash
git config --global --unset http.https://github.com.proxy
```

---

## 关于要上传的目录

脚本默认目录是它自己所在的 `~/Documents/github`。如果你想上传别的项目，在提示“要上传的目录”时：

- 直接把文件夹从 Finder 拖进终端窗口，自动填入路径；或
- 输入完整路径，例如 `~/Documents/默认项目`

如果你上传的是 `~/Documents/默认项目`（约 **4.4GB**），直接全部上传会超过 GitHub 限制。脚本会自动忽略：

- `node_modules/`、`.venv/`（依赖）
- `build/`、`dist/`、`release/`、`output/`（构建产物）
- `*.dmg`、`*.mp4`、`*.mov`、`*.zip`（大文件）
- `.DS_Store`、日志、`.env`（系统文件和密钥）

所以实际会上传的只是源码和小文件。按 `默认项目` 实测：**约 194 个文件、7.1MB**。

> 小技巧：在终端提示“要上传的目录”时，可以直接把文件夹从 Finder 拖进终端窗口，自动填入路径。

另外，`ant-swarm/` 本身是一个独立的 Git 仓库，脚本会提示把它加入忽略列表。如果也想上传它，进入 `ant-swarm` 目录单独运行一次脚本的菜单 `1` 即可。

---

## 手动命令行版（了解原理用）

如果不想用脚本，可以自己执行：

```bash
# 1. 安装 GitHub CLI
# macOS 14 上 Homebrew 会从源码编译 gh，容易卡住/失败。
# 建议直接下载官方预编译版：
# https://github.com/cli/cli/releases/latest
# 解压后把 bin/gh 放到 ~/.local/bin/，并确保 PATH 包含 ~/.local/bin

# 如果 GitHub 直连不通，先设置代理（你的端口是 10792）
export HTTPS_PROXY=http://127.0.0.1:10792
export HTTP_PROXY=http://127.0.0.1:10792
git config --global http.https://github.com.proxy http://127.0.0.1:10792

# 2. 登录（按提示在浏览器授权）
gh auth login

# 3. 让 git 使用 GitHub 的登录凭据
gh auth setup-git

# 4. 设置提交身份（把邮箱换成你自己的）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"

# 5. 进入要上传的目录
cd ~/Documents/默认项目

# 6. 初始化仓库
git init -b main

# 7. 创建 .gitignore（可以先复制脚本生成的那份）

# 8. 提交
git add -A
git commit -m "初始提交"

# 9. 在 GitHub 创建仓库并推送（私有仓库）
gh repo create 仓库名 --private --source=. --remote=origin --push
```

日常修改：

```bash
git add -A
git commit -m "修改说明"
git push
```

拉取：

```bash
git pull --rebase
```

---

## 常见问题

### 1. 提示文件超过 100MB

GitHub 单个文件最大 100MB。把大文件移出目录，或加入 `.gitignore`：

```bash
echo "大文件名" >> .gitignore
```

如果是必须上传的大文件，需要用 Git LFS：

```bash
brew install git-lfs
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

### 2. 推送失败：`rejected (fetch first)`

说明 GitHub 上有你本地没有的提交。先运行脚本菜单 `5` 拉取，再运行菜单 `4` 上传。

### 3. 登录失败 / 浏览器没有弹出

重新运行脚本，登录方式选 `2`，使用 Personal Access Token：

1. 打开 https://github.com/settings/tokens
2. 生成 Classic Token，勾选 `repo`、`workflow`、`read:org`
3. 把 Token 粘贴到终端（输入时不会显示）

### 4. 提交记录没有关联到 GitHub 头像

检查邮箱：

```bash
git config --global user.email
```

必须是你在 GitHub 验证过的邮箱，或 `数字+用户名@users.noreply.github.com`。脚本会自动帮你修正。

### 5. 仓库选公开还是私有

- 私有：只有自己能看到，推荐
- 公开：所有人可见，不要放密钥、密码、个人信息

### 6. 想换账号

```bash
gh auth logout
```

然后重新运行脚本。

### 7. Homebrew 安装 gh 卡住 / 报 `already locked`

macOS 14 上 Homebrew 没有 `gh` 的预编译包，会尝试编译 Go，耗时长且容易失败。不要继续等 brew，直接运行本脚本，它会下载官方预编译版并用 SHA256 校验。

如果提示某个 brew 进程占用锁，先结束它：

```bash
ps aux | grep '[b]rew'
kill 进程号
```

### 8. 新终端提示 `gh: command not found`

`gh` 装在 `~/.local/bin`。运行一次：

```bash
source ~/.zshrc
```

或者直接重新打开终端。脚本内部已经自动把 `~/.local/bin` 加到 PATH，所以双击脚本不受影响。

### 9. 克隆/推送报 `Failure when receiving data from the peer`

这是代理没生效。先确认代理软件开着，然后：

```bash
git config --global http.https://github.com.proxy http://127.0.0.1:10792
```

重新运行脚本即可。脚本现在启动时会自动检测并启用 10792。

---

## 安全提醒

上传前确认目录里没有：

- `.env` 文件、API Key、Token
- 密码、身份证照片、私人文档
- 公司内部代码（如果公司不允许外传）

脚本会自动忽略 `.env`，但不会检查文件内容。公开仓库前请自己再看一眼。
