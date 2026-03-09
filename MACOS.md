# macOS 运行指南

本文档说明如何在 macOS（包括 M1/M2 Apple Silicon）上运行和测试 Tauri 应用。

## 环境要求

### 必备软件

1. **Node.js** (建议 LTS 版本)
   ```bash
   node -v  # 建议 v18+ 或 v20+
   ```

2. **Rust 工具链**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   rustc --version
   ```

3. **Xcode Command Line Tools**
   ```bash
   xcode-select --install
   ```

### E2E 测试额外要求

1. **tauri-driver**
   ```bash
   cargo install tauri-driver
   ```

2. **SafariDriver** (macOS 自带)
   ```bash
   which safaridriver  # 应该输出 /System/Cryptexes/App/usr/bin/safaridriver
   ```

## 快速开始

### 1. 安装依赖

```bash
# 主项目
npm install

# E2E 测试
cd e2e && npm install && cd ..
```

### 2. 开发模式

```bash
# 加载 Rust 环境变量（首次需要）
source "$HOME/.cargo/env"

# 启动开发服务器
npm run tauri dev
```

这将：
- 启动 Vite 开发服务器 (http://localhost:1420)
- 编译 Rust 后端
- 打开应用窗口

### 3. 构建 Release 版本

```bash
source "$HOME/.cargo/env"
npm run tauri build
```

构建产物位于：
- 可执行文件：`src-tauri/target/release/tauri-app`
- App Bundle: `src-tauri/target/release/bundle/macos/tauri-app.app`
- DMG 安装包：`src-tauri/target/release/bundle/dmg/tauri-app_0.1.0_aarch64.dmg`

### 4. E2E 测试（仅限 Windows）

**重要限制**: tauri-driver 目前仅支持 Windows，macOS 上无法运行完整的 E2E 测试。

```bash
# macOS 上会收到以下提示：
# ⚠️  Warning: tauri-driver is not supported on darwin
```

**替代方案**：
- 使用 Playwright 进行组件测试
- 使用 Vitest 进行单元测试
- 手动功能验证

详见：`e2e/MACOS_E2E.md`

## macOS 特定配置

### 跨平台 E2E 测试配置

项目已配置为自动检测操作系统并加载正确的应用路径：

- **macOS**: `src-tauri/target/release/tauri-app`
- **Windows**: `src-tauri/target/release/tauri-app.exe`
- **Linux**: `src-tauri/target/release/tauri-app`

配置位置：`e2e/wdio.conf.ts`

### Apple Silicon 注意事项

1. **架构兼容性**：
   - M1/M2 芯片使用 ARM64 架构
   - Rust 默认编译为 `aarch64-apple-darwin`
   - 确保 Node.js 也是 ARM64 版本

2. **Rosetta 2**：
   - 如果需要运行 x86_64 构建，需要安装 Rosetta 2
   - 但本项目原生支持 ARM64，不需要 Rosetta 2

3. **代码签名**：
   - 开发调试阶段可以跳过
   - 发布时需要 Apple Developer ID 和公证 (Notarization)

## 常见问题

### Q: `cargo: command not found`

**A**: Rust 环境变量未加载到当前终端
```bash
source "$HOME/.cargo/env"
```

### Q: 应用窗口打不开

**A**: 检查系统偏好设置 → 安全性与隐私，可能需要允许应用运行

### Q: E2E 测试失败，找不到应用

**A**: 确保已运行 `npm run tauri build` 构建 Release 版本

### Q: SafariDriver 权限问题

**A**: 在系统偏好设置中启用远程自动化：
```bash
# 启用 SafariDriver
defaults write com.apple.Safari UniversalPrivacyInitiativeEnabled false
safaridriver --enable
```

### Q: 构建时遇到编译错误

**A**: 确保 Xcode Command Line Tools 已正确安装
```bash
xcode-select --reset
```

## 性能优化

### 加快编译速度

1. 使用 `mold` 链接器（可选）：
   ```bash
   brew install mold
   export RUSTFLAGS="-C link-arg=-fuse-ld=mold"
   ```

2. 启用并行编译：
   ```bash
   export CARGO_BUILD_JOBS=4
   ```

### 减小应用体积

1. 启用 LTO（链接时优化）：
   在 `src-tauri/Cargo.toml` 中添加：
   ```toml
   [profile.release]
   lto = true
   codegen-units = 1
   ```

2. 移除未使用的依赖

## 文件结构

```
tauri-app/
├── src-tauri/
│   ├── target/release/
│   │   ├── tauri-app              # macOS 可执行文件
│   │   └── bundle/macos/
│   │       └── tauri-app.app      # App Bundle
│   └── tauri.conf.json            # Tauri 配置
├── e2e/
│   ├── wdio.conf.ts               # E2E 测试配置（已支持跨平台）
│   └── test/specs/
│       └── greet.spec.ts          # 测试用例
└── package.json
```

## 下一步

1. [ ] 添加更多 Tauri 命令
2. [ ] 实现状态管理 (Pinia)
3. [ ] 添加路由 (Vue Router)
4. [ ] 配置 CSP 安全策略
5. [ ] 添加代码签名和公证

## 参考资源

- [Tauri v2 文档](https://v2.tauri.app/)
- [Vue 3 文档](https://vuejs.org/)
- [Rust 文档](https://doc.rust-lang.org/)
- [WebdriverIO 文档](https://webdriver.io/)
