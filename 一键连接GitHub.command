#!/bin/bash
# ============================================================
#  一键连接 GitHub（macOS）
#  双击运行本文件即可。全程中文提示。
# ============================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# 官方预编译版 gh 会装到这里；放到 PATH 最前面，保证脚本能找到
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

BOLD=$'\033[1m'
DIM=$'\033[2m'
RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BLUE=$'\033[34m'
CYAN=$'\033[36m'
RESET=$'\033[0m'

GH_LOGIN=""

# ---------- 基础输出 ----------
line()  { printf '%s\n' "────────────────────────────────────────────────────────"; }
title() { printf '\n%s%s%s\n' "$BOLD$CYAN" "$1" "$RESET"; line; }
info()  { printf '%sℹ️  %s%s\n' "$BLUE" "$1" "$RESET"; }
ok()    { printf '%s✅ %s%s\n' "$GREEN" "$1" "$RESET"; }
warn()  { printf '%s⚠️  %s%s\n' "$YELLOW" "$1" "$RESET"; }
err()   { printf '%s❌ %s%s\n' "$RED" "$1" "$RESET"; }

pause() {
  printf '\n%s按回车键继续...%s' "$DIM" "$RESET"
  read -r _
}

confirm() {
  local prompt="${1:-确认继续吗？}" answer
  printf '%s [y/N]: ' "$prompt"
  read -r answer || return 1
  case "$answer" in
    y|Y|yes|YES|Yes) return 0 ;;
    *) return 1 ;;
  esac
}

# 默认“是”的确认，适合推荐启用的安全选项
confirm_yes() {
  local prompt="${1:-继续吗？}" answer
  printf '%s [Y/n]: ' "$prompt"
  read -r answer || return 1
  case "$answer" in
    n|N|no|NO|No) return 1 ;;
    *) return 0 ;;
  esac
}

# 提示输出到 stderr，结果输出到 stdout，便于 $(ask ...) 取值
ask() {
  local prompt="${1:-请输入}" default="${2:-}" answer
  if [ -n "$default" ]; then
    printf '%s [%s]: ' "$prompt" "$default" >&2
  else
    printf '%s: ' "$prompt" >&2
  fi
  read -r answer
  if [ -z "$answer" ] && [ -n "$default" ]; then
    answer="$default"
  fi
  printf '%s' "$answer"
}

is_valid_email() {
  printf '%s' "${1:-}" | grep -Eq '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
}

slugify() {
  local s
  s=$(printf '%s' "${1:-}" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-{2,}/-/g')
  [ -n "$s" ] || s="my-project"
  printf '%s' "$s"
}

# ---------- 环境检查 ----------
# 自动检测本地代理（你的 HTTP 代理在 10792）
setup_proxy() {
  local proxy=""

  if [ -n "${HTTPS_PROXY:-}" ] || [ -n "${https_proxy:-}" ]; then
    ok "已使用现有代理：${HTTPS_PROXY:-$https_proxy}"
    return 0
  fi

  if /usr/bin/nc -z -G 1 127.0.0.1 10792 >/dev/null 2>&1; then
    proxy="http://127.0.0.1:10792"
  elif /usr/bin/nc -z -G 1 127.0.0.1 10793 >/dev/null 2>&1; then
    proxy="socks5h://127.0.0.1:10793"
  fi

  if [ -n "$proxy" ]; then
    export http_proxy="$proxy"
    export https_proxy="$proxy"
    export HTTP_PROXY="$proxy"
    export HTTPS_PROXY="$proxy"
    export NO_PROXY="localhost,127.0.0.1,::1"
    export no_proxy="$NO_PROXY"
    ok "检测到本地代理，已启用：$proxy"
  else
    info "未检测到本地代理，使用直连。"
  fi
}

ensure_git() {
  if command -v git >/dev/null 2>&1; then
    ok "已检测到 Git：$(git --version)"
    return 0
  fi
  err "没有检测到 Git。"
  if confirm "是否现在安装 Apple 命令行工具（会弹出系统安装窗口）？"; then
    xcode-select --install 2>/dev/null || true
    echo "安装完成后，请重新双击本脚本。"
  fi
  return 1
}

# 把 gh 安装到 ~/.local/bin，不依赖 Homebrew 编译
install_gh_official() {
  local arch ver tmp asset direct sha release_json u host downloaded actual bin
  case "$(uname -m)" in
    arm64|aarch64) arch="arm64" ;;
    x86_64) arch="amd64" ;;
    *) err "不支持的 CPU 架构：$(uname -m)"; return 1 ;;
  esac

  tmp=$(mktemp -d) || { err "无法创建临时目录"; return 1; }

  info "正在查询 GitHub CLI 最新版本..."
  release_json=$(curl -fsSL --max-time 20 https://api.github.com/repos/cli/cli/releases/latest 2>/dev/null || true)
  if [ -n "$release_json" ]; then
    ver=$(printf '%s' "$release_json" | grep '"tag_name"' | head -1 | sed -E 's/.*"v?([0-9][0-9.]*)".*/\1/')
  fi
  if [ -z "${ver:-}" ]; then
    ver="2.104.0"
    warn "无法查询最新版本，改用已知稳定版 v${ver}。"
  fi

  asset="gh_${ver}_macOS_${arch}.zip"
  direct="https://github.com/cli/cli/releases/download/v${ver}/${asset}"

  # 从官方 API 读取 SHA256；第三方镜像下载后用它校验完整性
  sha=""
  if [ -n "$release_json" ]; then
    sha=$(printf '%s' "$release_json" | awk -v name="$asset" '
      index($0, "\"name\": \"" name "\"") { found=1 }
      found && /"digest": "sha256:/ {
        sub(/.*sha256:/, ""); sub(/".*/, ""); print; exit
      }')
  fi
  # 官方 API 不可用时的兜底校验值（v2.104.0 / macOS arm64）
  if [ -z "$sha" ] && [ "$ver" = "2.104.0" ] && [ "$arch" = "arm64" ]; then
    sha="23b12706219b9892e44236f988444a24adcf29284e16b35e03ba5b863fb6eb8e"
  fi

  info "正在下载官方预编译版 v${ver}（约 14MB，不经过 Homebrew）..."
  downloaded=0
  for u in "$direct" \
    "https://ghproxy.net/${direct}" \
    "https://ghfast.top/${direct}" \
    "https://gh-proxy.com/${direct}"; do
    host=$(printf '%s' "$u" | sed -E 's#https://([^/]+)/.*#\1#')
    info "下载通道：${host}"
    if [ "$u" = "$direct" ]; then
      if curl -fL --progress-bar --retry 1 --connect-timeout 10 --max-time 45 -o "$tmp/gh.zip" "$u"; then
        downloaded=1
        break
      fi
    else
      if curl -fL --progress-bar --retry 2 --connect-timeout 15 --max-time 240 -o "$tmp/gh.zip" "$u"; then
        downloaded=1
        break
      fi
    fi
    warn "这个通道失败，换下一个..."
  done

  if [ "$downloaded" -ne 1 ]; then
    err "所有下载通道都失败了。"
    rm -rf "$tmp"
    return 1
  fi

  if [ -n "$sha" ]; then
    actual=$(shasum -a 256 "$tmp/gh.zip" | awk '{print $1}')
    if [ "$actual" != "$sha" ]; then
      err "SHA256 校验失败，文件可能不完整或被篡改，已停止安装。"
      echo "  期望：$sha"
      echo "  实际：$actual"
      rm -rf "$tmp"
      return 1
    fi
    ok "SHA256 校验通过。"
  else
    warn "未获取到官方校验值，已跳过哈希校验。"
  fi

  if ! unzip -q "$tmp/gh.zip" -d "$tmp"; then
    err "解压失败。"
    rm -rf "$tmp"
    return 1
  fi

  bin=$(find "$tmp" -type f -name gh | head -1)
  if [ -z "$bin" ]; then
    err "压缩包里没有找到 gh 可执行文件。"
    rm -rf "$tmp"
    return 1
  fi

  mkdir -p "$HOME/.local/bin" || { rm -rf "$tmp"; return 1; }
  cp "$bin" "$HOME/.local/bin/gh" || { rm -rf "$tmp"; return 1; }
  chmod +x "$HOME/.local/bin/gh"
  xattr -d com.apple.quarantine "$HOME/.local/bin/gh" 2>/dev/null || true
  rm -rf "$tmp"

  export PATH="$HOME/.local/bin:$PATH"
  hash -r

  if ! "$HOME/.local/bin/gh" --version >/dev/null 2>&1; then
    err "安装后无法运行 gh。"
    return 1
  fi

  persist_local_bin
  ok "GitHub CLI 安装完成：$("$HOME/.local/bin/gh" --version | head -1)"
  return 0
}

# 让以后新开的终端也能直接使用 gh
persist_local_bin() {
  local profile
  case "${SHELL:-}" in
    */zsh) profile="$HOME/.zshrc" ;;
    */bash) profile="$HOME/.bash_profile" ;;
    *) profile="$HOME/.zshrc" ;;
  esac
  [ -f "$profile" ] || touch "$profile" 2>/dev/null || return 0

  if grep -q 'Added by 一键连接GitHub' "$profile" 2>/dev/null; then
    return 0
  fi
  if grep -q '\.local/bin' "$profile" 2>/dev/null; then
    return 0
  fi

  {
    echo ""
    echo "# Added by 一键连接GitHub"
    echo 'export PATH="$HOME/.local/bin:$PATH"'
  } >> "$profile" 2>/dev/null && info "已把 ~/.local/bin 加入 PATH（$profile），新终端可直接使用 gh。"
}

ensure_gh() {
  if command -v gh >/dev/null 2>&1; then
    ok "已检测到 GitHub CLI：$(gh --version | head -1)"
    return 0
  fi

  warn "没有检测到 GitHub CLI（gh），它是连接 GitHub 最方便的工具。"
  echo "你的系统是 macOS $(sw_vers -productVersion)，Homebrew 没有 gh 的预编译包，"
  echo "用 brew 会从源码编译 Go，耗时长且容易失败。"
  echo "脚本改为直接下载 GitHub 官方预编译版，通常几十秒完成。"

  if ! confirm_yes "是否现在安装 GitHub CLI？"; then
    return 1
  fi

  if install_gh_official; then
    return 0
  fi

  warn "官方预编译版安装失败。"
  if command -v brew >/dev/null 2>&1; then
    if confirm "是否改用 Homebrew 安装（可能从源码编译，较慢）？"; then
      info "正在安装，请稍候...（如果长时间卡住，可按 Ctrl+C 取消）"
      if HOMEBREW_NO_AUTO_UPDATE=1 brew install gh; then
        hash -r
        ok "GitHub CLI 安装完成。"
        return 0
      fi
      err "Homebrew 安装失败。"
    fi
  fi

  echo
  echo "手动安装方法："
  echo "  1. 打开 https://github.com/cli/cli/releases/latest"
  echo "  2. 下载 gh_*_macOS_arm64.zip"
  echo "  3. 解压后把 bin/gh 放到 ~/.local/bin/ 下"
  if confirm "是否现在打开下载页面？"; then
    open "https://github.com/cli/cli/releases/latest" 2>/dev/null || true
  fi
  return 1
}

ensure_login() {
  if gh auth status >/dev/null 2>&1; then
    GH_LOGIN=$(gh api user --jq .login 2>/dev/null || true)
    ok "GitHub 已登录：${GH_LOGIN:-未知用户}"
    # 确保 git 使用 gh 的凭据（幂等操作）
    gh auth setup-git >/dev/null 2>&1 || true
    return 0
  fi

  title "登录 GitHub"
  echo "请选择登录方式："
  echo "  1) 浏览器登录（推荐，会自动打开网页）"
  echo "  2) 粘贴 Personal Access Token（适合无法打开浏览器时）"
  echo "  0) 返回主菜单"
  printf '请选择 [1]: '
  local choice
  read -r choice
  case "${choice:-1}" in
    1)
      echo
      info "即将打开浏览器。请在网页里输入终端显示的一次性代码并授权。"
      if gh auth login --hostname github.com --git-protocol https --web; then
        gh auth setup-git >/dev/null 2>&1 || true
        GH_LOGIN=$(gh api user --jq .login 2>/dev/null || true)
        ok "登录成功：${GH_LOGIN:-未知用户}"
        return 0
      fi
      err "登录失败或已取消。"
      return 1
      ;;
    2)
      echo
      echo "请先在浏览器创建 Token（勾选 repo、workflow、read:org）："
      echo "  https://github.com/settings/tokens/new?scopes=repo,workflow,read:org&description=OpenCode-CLI"
      if confirm "是否现在打开这个页面？"; then
        open "https://github.com/settings/tokens/new?scopes=repo,workflow,read:org&description=OpenCode-CLI" 2>/dev/null || true
      fi
      printf '请粘贴 Token（输入内容不会显示）：'
      local token
      read -rs token
      echo
      if [ -z "$token" ]; then
        err "Token 为空，已取消。"
        return 1
      fi
      if printf '%s\n' "$token" | gh auth login --with-token; then
        gh auth setup-git >/dev/null 2>&1 || true
        GH_LOGIN=$(gh api user --jq .login 2>/dev/null || true)
        ok "登录成功：${GH_LOGIN:-未知用户}"
        return 0
      fi
      err "Token 无效，或权限不足。"
      return 1
      ;;
    *)
      return 1
      ;;
  esac
}

# ---------- Git 提交身份 ----------
configure_identity() {
  local name email login uid suggested
  name=$(git config --global user.name 2>/dev/null || true)
  email=$(git config --global user.email 2>/dev/null || true)

  if [ -z "$name" ]; then
    warn "还没有设置 Git 提交署名。"
    name=$(ask "请输入提交署名（你的名字或昵称）" "$(whoami)")
    [ -n "$name" ] && git config --global user.name "$name"
  fi

  if ! is_valid_email "$email"; then
    warn "当前 Git 邮箱：${email:-（未设置）}"
    warn "这个邮箱格式不正确（可能带了中文引号），GitHub 无法把提交关联到你的账号。"
    login=$(gh api user --jq .login 2>/dev/null || true)
    uid=$(gh api user --jq .id 2>/dev/null || true)
    suggested=""
    if [ -n "$login" ] && [ -n "$uid" ]; then
      suggested="${uid}+${login}@users.noreply.github.com"
    fi
    echo "建议使用 GitHub 提供的匿名邮箱，避免暴露真实邮箱。"
    email=$(ask "请输入 Git 提交邮箱" "$suggested")
    while ! is_valid_email "$email"; do
      email=$(ask "邮箱格式仍不正确，请重新输入" "$suggested")
    done
    git config --global user.email "$email"
    ok "已修正 Git 邮箱：$email"
  fi

  ok "Git 提交身份：$(git config --global user.name) <$(git config --global user.email)>"
}

# ---------- 仓库辅助 ----------
check_large_tracked() {
  local f sz mb total=0 found=0
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    sz=$(stat -f%z "$f" 2>/dev/null || echo 0)
    total=$((total + sz))
    if [ "$sz" -ge 95000000 ]; then
      mb=$((sz / 1024 / 1024))
      warn "超过 GitHub 100MB 限制：$f（约 ${mb}MB）"
      found=1
    fi
  done < <(git ls-files)

  if [ "$total" -ge 800000000 ]; then
    warn "本次提交总大小约 $((total / 1024 / 1024))MB，接近 GitHub 建议上限，推送可能很慢。"
  fi

  if [ "$found" -eq 1 ]; then
    err "发现超大文件，已停止提交，避免推送失败。"
    echo "解决办法：把上面的大文件移出目录，或把它们写进 .gitignore 后重试。"
    return 1
  fi
  return 0
}

write_gitignore() {
  local force="${1:-no}"
  if [ -f .gitignore ] && [ "$force" != "yes" ]; then
    info "已存在 .gitignore，保留原文件不覆盖。"
    return 0
  fi

  echo "将写入以下推荐忽略规则（只影响 Git，不会删除文件）："
  echo "  .DS_Store / node_modules / .venv / build / dist / release / output"
  echo "  *.dmg / *.mp4 / *.mov / *.zip / .env / 日志文件"
  if ! confirm_yes "是否写入这些规则？"; then
    warn "已跳过。若目录里有大文件，稍后可能无法推送。"
    return 1
  fi

  cat > .gitignore <<'EOF'
# macOS / 编辑器
.DS_Store
Thumbs.db
.idea/
.vscode/

# 依赖与虚拟环境
node_modules/
.venv/
venv/
__pycache__/
*.pyc

# 构建产物
build/
dist/
release/
out/
output/

# 大体积媒体与压缩包
*.dmg
*.mp4
*.mov
*.zip

# 密钥与环境变量
.env
.env.*
!.env.example

# 日志
*.log
npm-debug.log*
EOF
  ok "已创建 .gitignore"
}

ignore_nested_repos() {
  local nested path
  nested=$(find . -mindepth 2 -maxdepth 4 -type d -name .git 2>/dev/null | sed 's#/\.git$##' | sed 's#^\./##')
  if [ -z "$nested" ]; then
    return 0
  fi

  warn "检测到嵌套的 Git 仓库（Git 不能直接上传另一个仓库的内部文件）："
  printf '%s\n' "$nested" | while IFS= read -r path; do
    [ -n "$path" ] && echo "  - $path"
  done

  if confirm_yes "是否把这些目录加入 .gitignore（以后可单独上传它们）？"; then
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      printf '/%s/\n' "$path" >> .gitignore
    done <<< "$nested"
    ok "已忽略嵌套仓库。"
    return 0
  fi

  err "已停止。请先处理嵌套仓库，或取消勾选该目录。"
  return 1
}

stage_and_commit() {
  local default_msg="${1:-提交}" msg
  git add -A || return 1

  if [ -z "$(git status --porcelain)" ]; then
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
      info "没有需要提交的改动。"
      return 0
    fi
    err "目录里没有可提交的文件（可能全部被 .gitignore 忽略了）。"
    return 1
  fi

  if ! check_large_tracked; then
    git reset >/dev/null 2>&1 || true
    return 1
  fi

  msg=$(ask "提交说明" "$default_msg")
  [ -n "$msg" ] || msg="$default_msg"
  if ! git commit -m "$msg"; then
    err "提交失败，请检查上面的错误信息。"
    return 1
  fi
  ok "已提交：$msg"
  return 0
}

# ---------- 功能 1：新建仓库并上传 ----------
do_new_repo() {
  title "新建 GitHub 仓库并上传目录"
  local dir base default_name name vis_choice vis_flag desc
  dir=$(ask "要上传的目录（回车=当前目录）" "$SCRIPT_DIR")
  dir="${dir/#\~/$HOME}"

  if [ ! -d "$dir" ]; then
    err "目录不存在：$dir"
    return 1
  fi

  (
    cd "$dir" || exit 1

    if [ -d .git ] && git remote get-url origin >/dev/null 2>&1; then
      warn "这个目录已经连接了远程仓库："
      git remote -v
      echo "请使用主菜单的【4. 提交并上传修改】。"
      exit 1
    fi

    info "目录大小：$(du -sh . 2>/dev/null | awk '{print $1}')"
    echo "提示：node_modules、build、output、视频等会被 .gitignore 排除，不会上传。"

    if [ -d .git ]; then
      info "检测到已有 .git，将复用现有仓库。"
    else
      if ! git init -b main >/dev/null 2>&1; then
        git init >/dev/null 2>&1 || { err "git init 失败"; exit 1; }
      fi
      ok "已初始化本地 Git 仓库。"
    fi

    write_gitignore || true
    ignore_nested_repos || exit 1

    base=$(basename "$dir")
    default_name=$(slugify "$base")
    name=$(ask "GitHub 仓库名（只能用英文、数字、-、_、.）" "$default_name")
    while ! printf '%s' "$name" | grep -Eq '^[A-Za-z0-9._-]+$'; do
      err "仓库名格式不正确。"
      name=$(ask "请重新输入仓库名" "$default_name")
    done

    if [ -n "$GH_LOGIN" ] && gh repo view "$GH_LOGIN/$name" >/dev/null 2>&1; then
      err "仓库 $GH_LOGIN/$name 已存在，请换一个名字。"
      name=$(ask "请重新输入仓库名" "${default_name}-2")
    fi

    echo
    echo "仓库可见性："
    echo "  1) 私有（推荐，只有你自己能看到）"
    echo "  2) 公开（所有人都能看到）"
    printf '请选择 [1]: '
    read -r vis_choice
    if [ "${vis_choice:-1}" = "2" ]; then
      vis_flag="--public"
    else
      vis_flag="--private"
    fi

    desc=$(ask "仓库简介（可直接回车跳过）" "")
    echo

    if ! stage_and_commit "初始提交"; then
      exit 1
    fi

    info "正在 GitHub 创建仓库并推送，请稍候..."
    local args=(repo create "$name" "$vis_flag" --source=. --remote=origin --push)
    if [ -n "$desc" ]; then
      args+=(--description "$desc")
    fi

    if ! gh "${args[@]}"; then
      err "创建仓库或推送失败。"
      echo "如果提示仓库已存在，请重新运行并换一个仓库名。"
      exit 1
    fi

    local url
    url=$(gh repo view --json url --jq .url 2>/dev/null || true)
    ok "上传完成！仓库地址：${url:-https://github.com/$GH_LOGIN/$name}"
    if [ -n "$url" ] && confirm "是否在浏览器中打开仓库？"; then
      open "$url" 2>/dev/null || true
    fi
  )
}

# ---------- 功能 2：连接已有仓库 ----------
do_connect_existing() {
  title "把本地目录连接到已有 GitHub 仓库"
  local input dir url branch
  input=$(ask "GitHub 仓库（例如 用户名/仓库名，或完整网址）" "")
  [ -n "$input" ] || return 1

  if ! gh repo view "$input" >/dev/null 2>&1; then
    err "找不到仓库，或当前账号没有权限：$input"
    return 1
  fi
  url=$(gh repo view "$input" --json url --jq .url)
  branch=$(gh repo view "$input" --json defaultBranchRef --jq '.defaultBranchRef.name // "main"' 2>/dev/null || echo main)
  [ -n "$branch" ] && [ "$branch" != "null" ] || branch="main"

  dir=$(ask "本地目录（回车=当前目录）" "$SCRIPT_DIR")
  dir="${dir/#\~/$HOME}"
  if [ ! -d "$dir" ]; then
    err "目录不存在：$dir"
    return 1
  fi

  (
    cd "$dir" || exit 1
    if [ -d .git ]; then
      info "检测到已有 .git，将更新远程地址。"
    else
      git init -b main >/dev/null 2>&1 || git init >/dev/null 2>&1 || exit 1
    fi

    if git remote get-url origin >/dev/null 2>&1; then
      git remote set-url origin "$url.git"
    else
      git remote add origin "$url.git"
    fi
    ok "远程仓库：$url"

    write_gitignore || true
    ignore_nested_repos || exit 1

    if ! git fetch origin; then
      err "无法读取远程仓库，请检查网络或权限。"
      exit 1
    fi

    if git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
      info "远程仓库已有内容。"
      if git rev-parse --verify HEAD >/dev/null 2>&1; then
        warn "本地和远程都有提交，需要先合并远程内容。"
        if ! confirm "是否拉取并合并远程内容后继续？"; then
          exit 1
        fi
        if ! git pull --no-rebase --allow-unrelated-histories --no-edit origin "$branch"; then
          err "合并失败（可能有冲突）。请手动解决冲突后，再使用菜单【4】上传。"
          exit 1
        fi
      else
        info "将保留远程历史，并把当前目录的文件作为一次新提交。"
        if ! confirm "继续吗？"; then
          exit 1
        fi
        if ! git checkout -B "$branch" "origin/$branch"; then
          err "本地有文件与远程同名冲突。请先备份或移走冲突文件，或改用菜单【3】克隆仓库。"
          exit 1
        fi
      fi
    fi

    if ! stage_and_commit "连接本地目录"; then
      exit 1
    fi

    if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
      git push || { err "推送失败。"; exit 1; }
    else
      git push -u origin "HEAD:$branch" || { err "推送失败。"; exit 1; }
    fi

    ok "连接完成：$url"
    if confirm "是否在浏览器中打开仓库？"; then
      open "$url" 2>/dev/null || true
    fi
  )
}

# ---------- 功能 3：克隆仓库 ----------
do_clone() {
  title "克隆（下载）GitHub 仓库"
  local input name parent target
  input=$(ask "GitHub 仓库（例如 用户名/仓库名，或完整网址）" "")
  [ -n "$input" ] || return 1

  if ! gh repo view "$input" >/dev/null 2>&1; then
    err "找不到仓库，或当前账号没有权限：$input"
    return 1
  fi

  name=$(gh repo view "$input" --json name --jq .name)
  parent=$(ask "克隆到哪个目录下" "$HOME/Documents")
  parent="${parent/#\~/$HOME}"
  mkdir -p "$parent" 2>/dev/null || true
  target="$parent/$name"

  if [ -e "$target" ]; then
    err "目标位置已存在：$target"
    echo "请换一个目录，或先移走已有文件夹。"
    return 1
  fi

  info "正在克隆到：$target"
  if gh repo clone "$input" "$target"; then
    ok "克隆完成：$target"
    if confirm "是否在 Finder 中打开？"; then
      open "$target" 2>/dev/null || true
    fi
  else
    err "克隆失败，请检查网络或权限。"
  fi
}

# ---------- 功能 4：提交并上传 ----------
do_commit_push() {
  title "提交并上传当前修改"
  local dir b
  dir=$(ask "要提交的目录（回车=当前目录）" "$SCRIPT_DIR")
  dir="${dir/#\~/$HOME}"
  if [ ! -d "$dir" ]; then
    err "目录不存在：$dir"
    return 1
  fi

  (
    cd "$dir" || exit 1
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      err "这个目录不是 Git 仓库。请先使用菜单【1】或【2】连接。"
      exit 1
    fi
    if ! git remote get-url origin >/dev/null 2>&1; then
      err "这个仓库还没有配置远程地址。请先使用菜单【2】连接。"
      exit 1
    fi

    echo "当前修改："
    git status --short | head -30
    echo
    if [ -z "$(git status --porcelain)" ]; then
      ok "没有需要提交的修改。"
      exit 0
    fi

    if ! stage_and_commit "更新 $(date '+%Y-%m-%d %H:%M')"; then
      exit 1
    fi

    info "正在推送到 GitHub..."
    if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
      if ! git push; then
        err "推送失败。可能是远程有新提交，请先使用菜单【5】拉取最新修改。"
        exit 1
      fi
    else
      b=$(git symbolic-ref --short HEAD)
      git push -u origin "$b" || { err "推送失败。"; exit 1; }
    fi
    ok "上传完成。"
  )
}

# ---------- 功能 5：拉取最新 ----------
do_pull() {
  title "拉取 GitHub 上的最新修改"
  local dir b
  dir=$(ask "要更新的目录（回车=当前目录）" "$SCRIPT_DIR")
  dir="${dir/#\~/$HOME}"
  if [ ! -d "$dir" ]; then
    err "目录不存在：$dir"
    return 1
  fi

  (
    cd "$dir" || exit 1
    if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      err "这个目录不是 Git 仓库。"
      exit 1
    fi
    if [ -n "$(git status --porcelain)" ]; then
      warn "本地还有未提交的修改。"
      echo "请先使用主菜单【4. 提交并上传修改】，再回来拉取，避免冲突。"
      exit 1
    fi
    info "正在拉取..."
    if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
      if ! git pull --rebase; then
        err "拉取失败，可能有冲突。请把终端里的错误信息发给我。"
        exit 1
      fi
    else
      b=$(git symbolic-ref --short HEAD)
      if ! git pull --rebase origin "$b"; then
        err "拉取失败，可能有冲突。请把终端里的错误信息发给我。"
        exit 1
      fi
    fi
    ok "已更新到最新版本。"
  )
}

# ---------- 功能 6：查看状态 ----------
do_status() {
  title "当前状态"
  echo "【GitHub 登录】"
  gh auth status 2>&1 | sed 's/^/  /'
  echo
  echo "【Git 提交身份】"
  echo "  名字：$(git config --global user.name 2>/dev/null || echo '未设置')"
  echo "  邮箱：$(git config --global user.email 2>/dev/null || echo '未设置')"
  echo

  local dir top dirty
  dir=$(ask "要查看的本地目录（回车=当前目录）" "$SCRIPT_DIR")
  dir="${dir/#\~/$HOME}"
  if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || echo "$dir")
    echo "【本地仓库】$top"
    git -C "$top" remote -v | sed 's/^/  /'
    echo "  当前分支：$(git -C "$top" branch --show-current 2>/dev/null || echo '未知')"
    echo "  最近提交：$(git -C "$top" log -1 --pretty=format:'%h %s (%cr)' 2>/dev/null || echo '暂无提交')"
    dirty=$(git -C "$top" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    echo "  未提交改动：${dirty} 个文件"
  else
    info "这个目录还不是 Git 仓库：$dir"
  fi
}

# ---------- 主菜单 ----------
print_banner() {
  clear 2>/dev/null || true
  printf '%s' "$BOLD$CYAN"
  cat <<'EOF'
  ╭──────────────────────────────────────────────╮
  │          一键连接 GitHub（macOS）            │
  ╰──────────────────────────────────────────────╯
EOF
  printf '%s' "$RESET"
  echo "  第一次用：先选 1 或 2，把目录连接到 GitHub。"
  echo "  以后修改：选 4 上传，选 5 拉取。"
  echo
}

main_menu() {
  while true; do
    title "主菜单"
    echo "  1) 新建 GitHub 仓库并上传目录（第一次用）"
    echo "  2) 把目录连接到已有 GitHub 仓库"
    echo "  3) 克隆（下载）已有仓库"
    echo "  4) 提交并上传当前修改（日常用）"
    echo "  5) 拉取 GitHub 上的最新修改"
    echo "  6) 查看登录 / 仓库状态"
    echo "  0) 退出"
    echo
    printf '请输入序号 [0-6]: '
    local choice
    read -r choice

    case "${choice:-}" in
      1) do_new_repo; pause ;;
      2) do_connect_existing; pause ;;
      3) do_clone; pause ;;
      4) do_commit_push; pause ;;
      5) do_pull; pause ;;
      6) do_status; pause ;;
      0) echo; ok "再见！"; exit 0 ;;
      *) warn "请输入 0 到 6 之间的数字。" ;;
    esac
  done
}

main() {
  print_banner
  setup_proxy
  ensure_git || { pause; exit 1; }
  ensure_gh || { pause; exit 1; }
  ensure_login || { pause; exit 1; }
  configure_identity
  main_menu
}

main
