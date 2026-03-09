# E2E 测试计划

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

- [ ] 基础 UI 渲染
- [ ] Greet 功能（输入 → 点击 → 显示结果）
- [ ] IPC 通信（前端调用 Rust 命令）
- [ ] 边界情况（空输入、特殊字符等）

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