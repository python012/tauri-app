# E2E 测试调试记录

## 概述

本文档记录了 Tauri 应用 E2E 测试的配置和调试过程中遇到的问题、原因分析和解决方案。

## 环境信息

- **Tauri 版本**: 2.x
- **WebdriverIO 版本**: 8.46.0
- **操作系统**: Windows 11
- **WebView2 版本**: 145.0.3800.97
- **测试框架**: Mocha + WebdriverIO

## 问题记录

### 问题 1: TypeScript 编译错误 - `@wdio/types` 找不到 `Config`

**错误信息**:
```
error TS2305: Module '"@wdio/types"' has no exported member 'Config'.
```

**原因**:
1. `@wdio/types` 包未安装
2. WebdriverIO v8 的类型定义与之前版本不兼容，不再导出 `Config` 类型

**解决方案**:
1. 安装 `@wdio/types`:
   ```bash
   npm install -D @wdio/types
   ```
2. 移除 `wdio.conf.ts` 中的类型注解，使用类型推断:
   ```typescript
   // 错误写法
   export const config: Config.Testrunner = { ... }
   
   // 正确写法
   export const config = { ... }
   ```

---

### 问题 2: 全局变量 `browser`、`$`、`expect` 未定义

**错误信息**:
```
error TS2304: Cannot find name 'browser'.
error TS2304: Cannot find name 'expect'.
error TS2592: Cannot find name '$'.
```

**原因**:
WebdriverIO 的全局变量类型定义未正确引入到 TypeScript 编译上下文中。

**解决方案**:
在测试文件顶部添加三斜线指令引用类型:
```typescript
/// <reference types="@wdio/globals/types" />
```

**注意**: 不要在 `tsconfig.json` 的 `types` 数组中添加这些类型，而是使用三斜线指令，因为 WebdriverIO 的类型定义需要特殊的加载方式。

---

### 问题 3: 应用启动但页面内容为空

**现象**:
- 测试运行时应用窗口打开
- 但页面显示类似"网页无法加载"的空白界面
- 测试无法找到任何 DOM 元素

**原因**:
Tauri 的 `devUrl` 配置指向 `http://localhost:1420`（Vite dev server）。Debug 构建的应用期望连接开发服务器，但测试时开发服务器未运行，导致页面加载失败。

**相关配置** (`src-tauri/tauri.conf.json`):
```json
{
  "build": {
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  }
}
```

**解决方案**:
构建 Release 版本，前端资源会打包进可执行文件:
```bash
npm run tauri build
```

然后修改 `wdio.conf.ts` 指向 release 可执行文件:
```typescript
capabilities: [{
  'browserName': 'tauri',
  'tauri:options': {
    application: path.resolve(__dirname, '../src-tauri/target/release/tauri-app.exe'),
  }
}]
```

---

### 问题 4: `clearValue()` 无法清空输入框

**现象**:
调用 `input.clearValue()` 后，输入框内容仍然保留，导致后续测试使用错误的值。

**原因**:
WebView2 的 WebDriver 实现存在 bug，`clearValue` 操作无法正确触发 Vue 的响应式更新。即使 DOM 中的值被清空，Vue 的 v-model 绑定的数据未更新。

**解决方案**:
使用 JavaScript 直接操作 DOM 并触发 Vue 的 input 事件:
```typescript
// 错误方式 - clearValue 不生效
await input.clearValue();

// 正确方式 - 触发 Vue 的响应式更新
await browser.execute(`
  const el = document.querySelector("#greet-input");
  el.value = "";
  el.dispatchEvent(new Event('input', { bubbles: true }));
`);
```

**教训**: 在测试 Vue/React 等前端框架应用时，直接操作 DOM 可能不会触发框架的响应式更新，需要手动触发相应的事件。

---

### 问题 5: msedgedriver 不支持 emoji 字符

**错误信息**:
```
unknown error: msedgedriver only supports characters in the BMP
```

**原因**:
msedgedriver 只支持基本多语言平面（BMP）内的字符，emoji 字符（如 🎉）属于辅助平面，无法通过 `sendKeys` 输入。

**解决方案**:
1. 移除包含 emoji 的测试用例
2. 或使用 JavaScript 直接设置输入值（绕过 WebDriver 的输入限制）

---

### 问题 6: 缺少 msedgedriver

**错误信息**:
```
can not find binary msedgedriver.exe in the PATH
```

**原因**:
Windows 上运行 Tauri E2E 测试需要 msedgedriver，它必须与系统 WebView2 版本匹配。

**解决方案**:
1. 确认 Edge/WebView2 版本（打开 Edge 浏览器，访问 `edge://settings/help`）
2. 从 Microsoft 官网下载对应版本的 WebDriver: https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
3. 将 `msedgedriver.exe` 放到系统 PATH 目录中（如 `C:\Windows\System32` 或用户自定义的 PATH 目录）

---

## 最终配置

### wdio.conf.ts

```typescript
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let driverProcess: ChildProcess | null = null;

export const config = {
  runner: 'local',
  specs: ['./test/specs/**/*.ts'],
  exclude: [],
  maxInstances: 1,
  
  capabilities: [{
    'maxInstances': 1,
    'browserName': 'tauri',
    'tauri:options': {
      application: path.resolve(__dirname, '../src-tauri/target/release/tauri-app.exe'),
    }
  }],

  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  hostname: '127.0.0.1',
  port: 4444,
  path: '/',

  framework: 'mocha',
  reporters: ['spec'],
  
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  async onPrepare() {
    console.log('Starting tauri-driver...');
    driverProcess = spawn('tauri-driver', [], {
      stdio: 'inherit',
      shell: true
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
  },

  async onComplete() {
    if (driverProcess) {
      console.log('Stopping tauri-driver...');
      driverProcess.kill();
    }
  }
};
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "types": ["node", "mocha"]
  },
  "ts-node": {
    "compilerOptions": {
      "module": "CommonJS"
    }
  },
  "include": [
    "./**/*.ts",
    "./node_modules/@wdio/globals/types.d.ts",
    "./node_modules/webdriverio/build/types.d.ts"
  ],
  "exclude": ["node_modules", "dist"]
}
```

### 测试文件模板

```typescript
/// <reference types="@wdio/globals/types" />

describe('My Test Suite', () => {
  beforeEach(async () => {
    await browser.pause(500);
  });

  it('should work', async () => {
    // 测试代码
  });
});
```

---

## 在新 Windows 11 机器上从零开始运行测试

### 概述

E2E 测试使用 **Release 构建**版本，前端代码已打包编译进可执行文件。这意味着测试不需要运行 Vite 开发服务器，应用可以独立运行。

### 第一步：安装必备软件

#### 1. 安装 Node.js

- 下载地址: https://nodejs.org/
- 推荐安装 LTS 版本（18+ 或 20+）
- 验证安装:
  ```bash
  node -v
  npm -v
  ```

#### 2. 安装 Rust

- 下载地址: https://rustup.rs/
- 或使用 winget:
  ```bash
  winget install Rustlang.Rustup
  ```
- 验证安装:
  ```bash
  rustc --version
  cargo --version
  ```

#### 3. 安装 Visual Studio Build Tools

Tauri/Rust 在 Windows 上编译需要 MSVC 工具链。

- 下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- 安装时选择 "Desktop development with C++" 工作负载

#### 4. 确认 WebView2 已安装

Windows 11 通常已内置 WebView2。如未安装:
- 下载地址: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### 第二步：安装 msedgedriver

**关键**: msedgedriver 版本必须与系统的 WebView2/Edge 版本匹配。

1. **确认 Edge 版本**:
   - 打开 Edge 浏览器
   - 地址栏输入 `edge://settings/help`
   - 记下版本号（如 `145.0.3800.97`）

2. **下载对应版本的 WebDriver**:
   - 访问: https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
   - 选择与 Edge 版本匹配的版本
   - 下载 Windows 64 位版本

3. **将 msedgedriver.exe 放入 PATH 目录**:
   
   **方法一**: 放入系统目录
   ```
   C:\Windows\System32\msedgedriver.exe
   ```
   
   **方法二**: 创建专用目录并添加到 PATH
   ```
   # 创建目录
   mkdir C:\tools\webdriver
   
   # 将 msedgedriver.exe 放入该目录
   
   # 添加到系统 PATH（PowerShell 管理员模式）
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\tools\webdriver", "Machine")
   ```

4. **验证安装**:
   ```bash
   # 打开新的命令行窗口
   msedgedriver --version
   ```

### 第三步：安装 tauri-driver

```bash
cargo install tauri-driver
```

验证安装:
```bash
tauri-driver --help
```

### 第四步：克隆项目并安装依赖

```bash
# 克隆项目
git clone <your-repo-url>
cd tauri-app

# 安装前端依赖
npm install

# 进入 e2e 目录安装测试依赖
cd e2e
npm install
cd ..
```

### 第五步：构建 Release 版本

**重要**: 必须先构建应用，前端代码才会打包进可执行文件。

```bash
# 在项目根目录
npm run tauri build
```

此命令会:
1. 编译前端代码（Vue + TypeScript）到 `dist/` 目录
2. 将前端资源嵌入 Rust 可执行文件
3. 生成最终应用:
   - `src-tauri/target/release/tauri-app.exe` (可执行文件)
   - `src-tauri/target/release/bundle/msi/` (MSI 安装包)
   - `src-tauri/target/release/bundle/nsis/` (NSIS 安装包)

构建时间约 2-5 分钟（首次构建较慢，后续增量构建较快）。

### 第六步：运行测试

```bash
cd e2e
npm run test
```

### 完整流程总结

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd tauri-app

# 2. 安装依赖
npm install
cd e2e && npm install && cd ..

# 3. 构建 Release 版本
npm run tauri build

# 4. 运行测试
cd e2e && npm run test
```

### 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `cargo: command not found` | Rust 未正确安装/PATH 未设置 | 重启终端或重新安装 Rust |
| `msedgedriver not found` | 未安装或未加入 PATH | 下载并放入 PATH 目录 |
| `can not find binary msedgedriver.exe` | 同上 | 同上 |
| 应用启动但页面空白 | 未构建 Release 版本 | 运行 `npm run tauri build` |
| 测试找不到元素 | 同上 | 同上 |
| `tauri-driver: command not found` | tauri-driver 未安装 | `cargo install tauri-driver` |
| 版本不匹配错误 | msedgedriver 与 Edge 版本不一致 | 下载匹配版本的 msedgedriver |

### 注意事项

1. **版本匹配**: msedgedriver 版本必须与 Edge 浏览器版本精确匹配（包括小版本号）

2. **构建顺序**: 必须先运行 `npm run tauri build`，否则测试会失败

3. **终端重启**: 安装 Rust 或修改 PATH 后，需要重启终端才能生效

4. **管理员权限**: 某些安装步骤可能需要管理员权限

5. **网络问题**: 首次构建会下载大量依赖，确保网络畅通

---

## 运行测试

### 前置条件

1. 确保 Rust 和 Node.js 已安装
2. 确保 `msedgedriver.exe` 在 PATH 中
3. 确保 `tauri-driver` 已安装:
   ```bash
   cargo install tauri-driver
   ```

### 构建应用

```bash
# 在项目根目录
npm run tauri build
```

### 运行测试

```bash
cd e2e
npm install
npm run test
```

---

## 经验教训

1. **类型系统陷阱**: WebdriverIO v8 的类型定义有较大变化，不要盲目复制旧版本的类型导入方式。

2. **Debug vs Release 构建**: Tauri 的 Debug 构建依赖开发服务器，E2E 测试应使用 Release 构建。

3. **框架响应式更新**: 测试 Vue/React 应用时，直接操作 DOM 可能不会触发框架更新，需要手动触发事件。

4. **WebDriver 限制**: 某些 WebDriver 实现可能有限制（如 BMP 字符限制），需要了解这些限制并寻找替代方案。

5. **环境依赖**: Windows 上运行 Tauri E2E 测试需要多个依赖（msedgedriver、tauri-driver），确保版本匹配。

---

## 参考链接

- [Tauri Testing Documentation](https://tauri.app/v2/guides/debugging/application/)
- [WebdriverIO Documentation](https://webdriver.io/docs/gettingstarted)
- [Microsoft Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- [tauri-driver Repository](https://github.com/tauri-apps/tauri-driver)