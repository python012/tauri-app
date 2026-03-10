# tauri-app

一个基于 **Tauri 2 + Vue 3 + TypeScript + Rust** 的桌面应用示例项目。

当前功能包含：

- 前端调用 Rust `greet` 命令并展示结果。
- 当输入 `Apple` 并提交时进入条件页面（Apple 页面），支持 `Back` 返回。
- 覆盖 `e2e` 自动化测试（包含页面跳转和窗口标题行为测试）。

## 技术栈

### 应用主项目

- Tauri 2.x
- Rust (Edition 2021)
- Vue 3.5.x
- TypeScript 5.x
- Vite 6.x

### E2E 测试子项目（独立）

- WebdriverIO 8.x
- Mocha 10.x
- tauri-driver 2.x
- TypeScript 5.x

## 依赖与环境要求

### 必备环境

- Node.js (建议 LTS)
- Rust + Cargo
- Windows: Visual Studio C++ Build Tools
- Windows: WebView2 Runtime

### E2E 额外要求（Windows）

- `tauri-driver`（建议通过 `cargo install tauri-driver` 安装）
- `msedgedriver.exe` 且版本与本机 Edge/WebView2 匹配，并可在 PATH 中访问

## 项目结构（简要）

```text
tauri-app/
├── src/                 # Vue 前端
├── src-tauri/           # Rust + Tauri 后端
├── e2e/                 # 独立 E2E 测试项目
├── TEST.md              # 测试方案与说明
└── DEBUG.md             # 调试记录与常见问题
```

## 安装

```bash
# 根目录安装主项目依赖
npm install

# 安装 e2e 子项目依赖
cd e2e
npm install
cd ..
```

## 常用命令

### 主项目命令（在仓库根目录执行）

```bash
# 前端开发（仅 Vite）
npm run dev

# Tauri 开发模式
npm run tauri dev

# 前端构建（类型检查 + Vite build）
npm run build

# Tauri 打包（生成 exe / 安装包）
npm run tauri build
```

### E2E 测试命令（在 e2e 目录执行）

```bash
# 执行 E2E 测试
npm run test

# 头显模式运行（可见窗口）
npm run test:headful

# 仅做类型检查
npx tsc --noEmit
```

## 调试与排错（重点）

- 若 `npm run tauri dev` / `npm run tauri build` 报 `cargo ... program not found`：
	当前终端通常缺少 Cargo PATH。

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
```

- 若 E2E 报 `tauri-driver not found`：
	先执行 `cargo install tauri-driver`，或设置 `TAURI_DRIVER_PATH`。

- 若 E2E 使用的是旧 app 产物：
	在跑测试前先重新执行 `npm run tauri build`。

## 参考文档

- `TEST.md`: 测试方案、覆盖范围和框架对比
- `DEBUG_TEST.md`: 调试步骤、问题记录、环境排错
