# E2E 测试 macOS 注意事项

## 当前状态

**重要**: `tauri-driver` 目前仅支持 Windows 平台（使用 WebView2），不支持 macOS 和 Linux。

## macOS 上的替代方案

### 方案 1：使用 Playwright（推荐）

Playwright 支持 WebKit，可以更好地测试 macOS 上的 Tauri 应用。

安装：
```bash
npm install -D @playwright/test
```

### 方案 2：使用 Vitest 进行组件测试

对于 Vue 组件的测试，可以使用 Vitest：
```bash
npm install -D vitest @vue/test-utils
```

### 方案 3：手动测试脚本

创建一个简单的脚本来启动应用并验证基本功能。

## 跨平台 CI 建议

对于持续集成：
- **Windows**: 使用 tauri-driver + WebdriverIO
- **macOS**: 使用 Playwright 或手动测试
- **Linux**: 使用 tauri-driver (需要额外配置)

## 当前配置说明

`e2e/wdio.conf.ts` 已配置为：
- Windows: 启动 tauri-driver
- macOS/Linux: 直接启动应用（需要额外的驱动支持）

## 参考资源

- [Tauri v2 Testing Guide](https://v2.tauri.app/develop/tests/)
- [Playwright for Tauri](https://tauri.app/v2/guides/debugging/application/#testing)
