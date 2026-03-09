# DEBUG.md

## 1. 项目简介

这是一个基于 **Tauri 2.x + Vue 3 + TypeScript + Rust** 的跨平台桌面应用示例项目。

- 前端：`Vue 3` + `Vite` + `TypeScript`
- 后端：`Rust` + `Tauri 2`
- 通信方式：前端通过 `@tauri-apps/api` 的 `invoke` 调用 Rust 命令

当前默认开发端口：

- Vite Dev Server：`1420`
- Vite HMR：`1421`

## 2. 依赖与环境要求（Windows）

## 2.1 必备软件

1. `Node.js`（建议 LTS 版本，18+ 或 20+）
2. `Rust`（通过 `rustup` 安装）
3. `Microsoft Visual Studio C++ Build Tools`（Tauri/Rust 在 Windows 编译需要）
4. `WebView2`（Windows 10/11 通常已内置）

## 2.2 推荐 VS Code 插件

1. `Vue - Official`（Volar）
2. `Tauri`
3. `rust-analyzer`

## 2.3 项目核心依赖（当前）

前端依赖（`package.json`）：

- `vue`
- `@tauri-apps/api`
- `@tauri-apps/plugin-opener`

前端开发依赖（`package.json`）：

- `vite`
- `typescript`
- `vue-tsc`
- `@vitejs/plugin-vue`
- `@tauri-apps/cli`

Rust 依赖（`src-tauri/Cargo.toml`）：

- `tauri`
- `tauri-plugin-opener`
- `serde`
- `serde_json`

## 3. 初始化与安装

在项目根目录执行：

```bash
npm install
```

检查 Rust 工具链：

```bash
rustc --version
cargo --version
```

如未安装 Rust：

```bash
winget install Rustlang.Rustup
```

## 3.1 启动前快速自检（强烈建议）

每次新开终端，先执行以下检查，避免出现 `cargo metadata ... program not found`：

```bash
node -v
npm -v
rustc --version
cargo --version
```

如果 `cargo --version` 报错，说明当前终端没有拿到 Rust 的 PATH。

- CMD 临时修复：

```bash
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cargo --version
```

- PowerShell 临时修复：

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
cargo --version
```

然后再运行：

```bash
npm run tauri dev
```

## 4. 开发与调试命令

推荐顺序（Windows）：

1. `npm install`
2. `cargo --version`（确认当前终端可用）
3. `npm run tauri dev`

## 4.1 只启动前端（Vite）

```bash
npm run dev
```

访问：`http://localhost:1420`

## 4.2 启动 Tauri 桌面调试（推荐）

```bash
npm run tauri dev
```

该命令会：

1. 启动 Vite 开发服务器（根据 `tauri.conf.json` 的 `beforeDevCommand`）
2. 编译 Rust 后端
3. 打开桌面窗口进行联调

## 4.3 构建前端产物

```bash
npm run build
```

这个命令会先执行 TypeScript 检查（`vue-tsc --noEmit`），再进行 Vite 构建。

## 4.4 预览前端产物

```bash
npm run preview
```

## 4.5 生成桌面安装包（发布）

```bash
npm run tauri build
```

产物一般位于：`src-tauri/target/release/bundle/`

## 5. 调试技巧

## 5.1 查看前端日志

- 打开 Tauri 窗口开发者工具（通常 `F12` 或右键检查）
- 查看 Console 报错与网络请求

## 5.2 查看 Rust 侧日志

在终端启动时设置：

```bash
set RUST_BACKTRACE=1
npm run tauri dev
```

若需要更详细日志：

```bash
set RUST_LOG=debug
npm run tauri dev
```

PowerShell 写法：

```powershell
$env:RUST_BACKTRACE = "1"
npm run tauri dev
```

```powershell
$env:RUST_LOG = "debug"
npm run tauri dev
```

## 5.3 常见问题

1. 端口被占用（`1420`）：关闭占用进程，或在 `vite.config.ts` 中调整端口并同步 `tauri.conf.json` 的 `devUrl`
2. Rust 编译失败：检查是否安装了 MSVC Build Tools，并更新依赖后重试
3. 前端调用 Rust 命令失败：检查命令名、参数名是否与 `#[tauri::command]` 定义一致
4. 热更新不生效：确认没有手动改动 `strictPort` 导致 Tauri 与 Vite 端口不匹配

## 5.4 本次教训记录（已验证）

现象：

- `npm run tauri dev` 报错：`failed to run 'cargo metadata' ... program not found`

根因：

- Rust 已安装，但当前终端会话没有包含 `C:\Users\<user>\.cargo\bin` 到 PATH。

结论：

1. `npm run tauri dev` 命令本身没有问题。
2. 同一台机器上“有的终端能跑、有的不能跑”通常是环境变量继承差异。
3. 处理方式是补 PATH 或重启终端/VS Code 让 PATH 重新加载。

## 6. 继续开发建议

1. 新增 Rust 命令：在 `src-tauri/src/lib.rs` 添加 `#[tauri::command]` 函数，并注册到 `invoke_handler`
2. 前端调用：在 Vue 组件中使用 `invoke("commandName", payload)`
3. 复杂前端状态管理：引入 `Pinia`
4. 多页面：集成 `Vue Router`
5. 安全性：在生产环境收紧 `csp` 配置（当前 `csp` 为 `null`，仅适合开发阶段）

## 7. 常用命令速查

```bash
# 安装依赖
npm install

# 前端开发
npm run dev

# Tauri 联调
npm run tauri dev

# 前端构建（含类型检查）
npm run build

# 预览构建结果
npm run preview

# 桌面发布构建
npm run tauri build
```

## 8. macOS 启动与注意事项

## 8.1 环境准备

1. 安装 Xcode Command Line Tools：

```bash
xcode-select --install
```

2. 安装 Node.js（建议 LTS）
3. 安装 Rust（rustup）

## 8.2 启动调试

```bash
npm install
rustc --version
cargo --version
npm run tauri dev
```

## 8.3 常见注意事项

1. 第一次运行可能弹出系统安全权限提示，按需授权（文件、网络等）。
2. 如果是 Apple Silicon（M 系列），确保 Node/Rust 架构一致，避免混用造成编译或链接问题。
3. 发布到 macOS 时通常需要代码签名与公证（Notarization），开发调试阶段可暂不处理。
