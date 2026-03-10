# 当前项目的 E2E 测试方案

## 概述

为 Tauri 应用添加端到端（E2E）自动化测试，确保应用功能和用户界面的正确性。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| WebdriverIO | 8.x | 测试框架，提供 WebDriver 协议支持 |
| Tauri Driver | 2.x | Tauri 官方 WebDriver 服务器 |
| Mocha | 10.x | 测试运行器 |
| TypeScript | 5.x | 测试代码语言 |
| WebDriver | - | 通信协议 |

## 与 Python + Pytest + Selenium + chromedriver 对比

下面用对比表说明两套方案在测试分层上的对应关系，帮助快速理解当前 `e2e` 项目这套技术的职责分工。

| 维度 | 当前项目（Tauri E2E） | 常见 Python Web E2E | 说明 |
|------|------------------------|----------------------|------|
| 测试代码语言 | TypeScript | Python | 仅语言不同，核心流程一致 |
| 用例组织/测试运行器 | Mocha | Pytest | 负责 `describe/it` 或 `test_*` 结构、执行顺序、生命周期钩子 |
| 自动化操作 API | WebdriverIO（WDIO） | Selenium WebDriver（Python bindings） | 负责查找元素、点击、输入、等待、断言配合 |
| WebDriver 服务端驱动 | tauri-driver | chromedriver.exe | 都是 WebDriver 协议实现方，接收自动化命令并驱动目标应用 |
| 被测目标 | Tauri 桌面应用（WebView） | Chrome 浏览器中的网页 | 一个偏桌面壳应用，一个偏浏览器网页 |
| 启动方式 | WDIO 在 `onPrepare` 启动 `tauri-driver`，并通过 capability 指定 `.exe` | 常见为 Selenium 连接 chromedriver 并拉起 Chrome | 都可以做到测试时自动拉起被测目标 |
| 构建前置条件 | 需要先有 `src-tauri/target/release/tauri-app.exe` | 通常无需编译本地 exe（除非测本地打包应用） | Tauri E2E 对构建产物更敏感 |
| 常见日志前缀 | `[0-0]`（WDIO worker/capability 标识） | Pytest/Selenium 常见为测试名+步骤日志 | 日志样式不同，不影响测试本质 |

### 一句话理解

- Python 方案可概括为：`Pytest -> Selenium -> chromedriver -> Chrome 页面`
- 当前方案可概括为：`Mocha -> WDIO -> tauri-driver -> Tauri 应用`
- 两者在“分层思想”上是一致的，只是目标环境和工具生态不同。

## 架构设计

```
测试流程:
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WebdriverIO │────▶│  Tauri Driver   │────▶│   Tauri App     │
│  (测试代码)   │     │ (WebDriver 服务器)│     │  (被测应用)      │
└─────────────┘     └─────────────────┘     └─────────────────┘
       │                    │                       │
       └────────────────────┴───────────────────────┘
                 WebDriver 协议通信
```

## 项目结构

```
tauri-app/
├── e2e/                         # E2E 测试目录（独立管理）
│   ├── package.json             # 独立的 npm 配置
│   ├── tsconfig.json            # TypeScript 配置
│   ├── wdio.conf.ts             # WebdriverIO 配置
│   └── test/
│       └── specs/
│           └── greet.spec.ts    # 测试用例
├── src/                         # 前端源码
├── src-tauri/                   # Rust 后端
└── package.json                 # 主项目配置
```

## 代码管理

### 独立管理原则

- **e2e/package.json**: 独立的依赖管理，与主项目分离
- **独立安装**: `cd e2e && npm install`
- **独立运行**: `npm run test` 或 `npm run test:headful`
- **CI 集成**: 可在 CI 流程中单独执行

### 依赖列表

```json
{
  "devDependencies": {
    "@wdio/cli": "^8.x",
    "@wdio/local-runner": "^8.x",
    "@wdio/mocha-framework": "^8.x",
    "@wdio/spec-reporter": "^8.x",
    "typescript": "^5.x",
    "ts-node": "^10.x"
  }
}
```

## 配置策略

### 自动启动机制

WebdriverIO 配置中通过 `capabilities` 自动启动所需服务：

1. **tauri-driver**: WebDriver 服务器，默认端口 4444
2. **Tauri 应用**: 被测应用二进制文件

无需手动启动任何服务，运行测试命令即可。

### 应用路径配置

```typescript
// Windows 平台
binary: '../src-tauri/target/debug/tauri-app.exe'
```

## 运行环境

### 本地开发

```bash
# 进入测试目录
cd e2e

# 安装依赖
npm install

# 运行测试（无头模式）
npm run test

# 运行测试（有头模式，可见窗口）
npm run test:headful
```

### CI 环境

CI 流程中需要：

1. 构建应用：`npm run tauri build -- --debug` 或仅构建二进制
2. 安装测试依赖：`cd e2e && npm install`
3. 运行测试：`npm run test`

## 测试用例

### 示例：Greet 功能测试

```typescript
describe('Greet Feature', () => {
  it('should display greeting message when name is entered', async () => {
    // 定位输入框
    const input = await $('input#greet-input');
    await input.setValue('World');
    
    // 点击按钮
    const button = await $('button#greet-button');
    await button.click();
    
    // 验证结果
    const result = await $('p#greet-msg');
    await expect(result).toHaveText('Hello, World! You\'ve been greeted from Rust!');
  });
});
```

### 测试覆盖范围

- [x] 基础 UI 渲染（应用启动、主标题显示）
- [x] Greet 功能（输入 → 点击 → 显示结果）
- [x] IPC 通信（前端调用 Rust 命令）
- [x] 边界情况（空输入、中文字符等）
- [x] 条件页面跳转（输入 `Apple` 跳转到结果页）
- [x] 页面返回行为（点击 `Back` 返回主页面）
- [x] 窗口标题行为（主页面/Apple 页面标题切换与恢复）
- [x] 负向场景（非 `Apple` 输入不触发跳转）

## 前置条件

### 开发环境

- Node.js 18+
- Rust 工具链
- 已构建的 Tauri 应用（debug 模式）

### 首次运行

```bash
# 1. 构建 Tauri 应用
npm run tauri dev

# 2. 安装 tauri-driver（如未安装）
cargo install tauri-driver

# 3. 运行测试
cd e2e && npm install && npm run test
```

## 未来扩展

- [ ] 跨平台支持（macOS、Linux）
- [ ] 集成到 CI/CD 流程
- [ ] 添加截图对比测试
- [ ] 性能测试
- [ ] 无障碍测试

## 参考资源

- [Tauri WebDriver 文档](https://v2.tauri.app/develop/tests/webdriver/)
- [WebdriverIO 文档](https://webdriver.io/)
- [Mocha 文档](https://mochajs.org/)