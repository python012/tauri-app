/// <reference types="@wdio/globals/types" />

const MAIN_WINDOW_TITLE = 'Tauri App - Main Workspace';
const APPLE_WINDOW_TITLE = 'Tauri App - Apple Greeting';

/**
 * Tauri 应用 E2E 测试套件
 * 
 * 测试目标：验证 Tauri 应用的基本功能，包括应用启动、页面渲染和 Rust 命令调用
 */
describe('Tauri App E2E Tests', () => {
  /**
   * 每个测试前的准备工作
   * 暂停 500ms 确保页面元素已完全渲染
   */
  beforeEach(async () => {
    await browser.pause(500);
  });

  /**
   * 测试 1: 应用启动与页面标题验证
   * 
   * 测试点：
   *   - 验证应用能够正常启动
   *   - 验证窗口标题正确显示
   *   - 验证页面主标题元素存在且内容正确
   * 
   * 测试步骤：
   *   1. 获取浏览器窗口标题
   *   2. 断言标题为 "Tauri + Vue + Typescript App"
   *   3. 查找 h1 元素
   *   4. 断言 h1 元素可见
   *   5. 断言 h1 文本内容为 "Welcome to Tauri + Vue"
   */
  it('should launch the app and display the title', async () => {
    const title = await browser.getTitle();
    expect(title).toBe(MAIN_WINDOW_TITLE);
    
    const h1 = await $('h1');
    await expect(h1).toBeDisplayed();
    await expect(h1).toHaveText(MAIN_WINDOW_TITLE);
  });

  /**
   * 测试 2: 正常输入并调用 greet 命令
   * 
   * 测试点：
   *   - 验证输入框可以正常输入文本
   *   - 验证点击按钮能够触发 Rust 后端的 greet 命令
   *   - 验证后端返回的正确问候语能够显示在页面上
   * 
   * 测试步骤：
   *   1. 找到输入框元素（#greet-input）
   *   2. 清空输入框并输入 "World"
   *   3. 找到提交按钮并点击
   *   4. 等待 500ms 让后端处理并更新页面
   *   5. 查找所有 p 元素，遍历找到包含 "Hello" 的问候语
   *   6. 断言问候语为 "Hello, World! You've been greeted from Rust!"
   */
  it('should greet with valid name', async () => {
    const input = await $('#greet-input');
    await input.clearValue();
    await input.setValue('World');
    
    const button = await $('button[type="submit"]');
    await button.click();
    
    await browser.pause(500);
    
    const paragraphs = await $$('p');
    let foundGreeting = false;
    
    for (const p of paragraphs) {
      const text = await p.getText();
      if (text.includes('Hello')) {
        expect(text).toBe("Hello, World! You've been greeted from Rust!");
        foundGreeting = true;
        break;
      }
    }
    
    expect(foundGreeting).toBe(true);
  });

  /**
   * 测试 3: 空输入处理
   * 
   * 测试点：
   *   - 验证输入框为空时提交不会导致应用崩溃
   *   - 验证后端能够正确处理空字符串参数
   *   - 验证问候语能够正常显示（名字为空）
   * 
   * 测试步骤：
   *   1. 找到输入框元素
   *   2. 使用 JavaScript 直接清空输入框并触发 Vue 的 input 事件
   *      （注：WebView2 的 clearValue 有 bug，不会触发 Vue 响应式更新）
   *   3. 找到提交按钮并点击
   *   4. 等待 500ms
   *   5. 查找并断言问候语为 "Hello, ! You've been greeted from Rust!"
   *      （名字为空，注意逗号后有空格）
   */
  it('should handle empty input', async () => {
    const input = await $('#greet-input');
    // 使用 JS 直接触发 Vue 的响应式更新（WebView2 的 clearValue 有 bug）
    await browser.execute(`
      const el = document.querySelector("#greet-input");
      el.value = "";
      el.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await browser.pause(100);
    
    const button = await $('button[type="submit"]');
    await button.click();
    
    await browser.pause(500);
    
    const paragraphs = await $$('p');
    let foundGreeting = false;
    
    for (const p of paragraphs) {
      const text = await p.getText();
      if (text.includes('Hello')) {
        expect(text).toBe("Hello, ! You've been greeted from Rust!");
        foundGreeting = true;
        break;
      }
    }
    
    expect(foundGreeting).toBe(true);
  });

  /**
   * 测试 4: 中文字符处理
   * 
   * 测试点：
   *   - 验证输入框支持中文字符输入
   *   - 验证 Rust 后端能够正确处理 UTF-8 编码的中文字符
   *   - 验证问候语能够正确显示中文用户名
   * 
   * 测试步骤：
   *   1. 找到输入框元素
   *   2. 清空输入框，输入中文 "测试用户"
   *   3. 找到提交按钮并点击
   *   4. 等待 500ms
   *   5. 查找并断言问候语为 "Hello, 测试用户! You've been greeted from Rust!"
   * 
   * 注意：
   *   - 此测试不包含 emoji，因为 msedgedriver 不支持 BMP 外的 Unicode 字符
   *   - 如需测试 emoji，需要使用 JavaScript 直接设置输入值
   */
  it('should handle Chinese characters', async () => {
    const input = await $('#greet-input');
    await input.clearValue();
    await browser.pause(100);
    await input.setValue('测试用户');
    
    const button = await $('button[type="submit"]');
    await button.click();
    
    await browser.pause(500);
    
    const paragraphs = await $$('p');
    let foundGreeting = false;
    
    for (const p of paragraphs) {
      const text = await p.getText();
      if (text.includes('Hello')) {
        expect(text).toBe("Hello, 测试用户! You've been greeted from Rust!");
        foundGreeting = true;
        break;
      }
    }
    
    expect(foundGreeting).toBe(true);
  });

  /**
   * 测试 5: Apple 条件跳转与返回主页面
   *
   * 测试点：
   *   - 验证输入 Apple 后会进入 Apple 页面（条件导航）
   *   - 验证 Apple 页面会显示正确问候语
   *   - 验证窗口标题切换为 Apple 页面标题
   *   - 验证点击 Back 后会返回主页面
   *   - 验证返回后窗口标题恢复为主页面标题
   *
   * 测试步骤：
   *   1. 找到输入框并用 JavaScript 清空（触发 Vue input 事件）
   *   2. 输入 "Apple" 并点击提交按钮
   *   3. 等待 Apple 页面元素 `#apple-greet-msg` 可见并断言文本
   *   4. 获取窗口标题并断言为 Apple 标题
   *   5. 点击返回按钮 `#back-button`
   *   6. 断言主页面标题与输入框重新可见
   *   7. 断言窗口标题恢复为主页面标题
   */
  it('should navigate to Apple page and go back to main page', async () => {
    const input = await $('#greet-input');
    await browser.execute(`
      const el = document.querySelector("#greet-input");
      el.value = "";
      el.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await browser.pause(100);
    await input.setValue('Apple');

    const button = await $('button[type="submit"]');
    await button.click();

    const appleMsg = await $('#apple-greet-msg');
    await appleMsg.waitForDisplayed({ timeout: 5000 });
    await expect(appleMsg).toHaveText("Hello, Apple! You've been greeted from Rust!");

    const appleWindowTitle = await browser.getTitle();
    expect(appleWindowTitle).toBe(APPLE_WINDOW_TITLE);

    const backButton = await $('#back-button');
    await expect(backButton).toBeDisplayed();
    await backButton.click();

    const mainTitle = await $('h1');
    await mainTitle.waitForDisplayed({ timeout: 5000 });
    await expect(mainTitle).toHaveText(MAIN_WINDOW_TITLE);

    const mainWindowTitle = await browser.getTitle();
    expect(mainWindowTitle).toBe(MAIN_WINDOW_TITLE);

    const mainInput = await $('#greet-input');
    await expect(mainInput).toBeDisplayed();
  });

  /**
   * 测试 6: 非 Apple 输入不触发跳转
   *
   * 测试点：
   *   - 验证输入非 Apple（如 World）时不会跳转到 Apple 页面
   *   - 验证页面保持在主页面
   *   - 验证窗口标题保持为主页面标题
   *   - 验证 Apple 页面元素与返回按钮不存在
   *
   * 测试步骤：
   *   1. 找到输入框并用 JavaScript 清空（触发 Vue input 事件）
   *   2. 输入 "World" 并点击提交按钮
   *   3. 断言主页面标题仍然可见且文本正确
   *   4. 断言窗口标题仍为主页面标题
   *   5. 断言 `#apple-greet-msg` 不存在
   *   6. 断言 `#back-button` 不存在
   */
  it('should stay on main page when input is not Apple', async () => {
    const input = await $('#greet-input');
    await browser.execute(`
      const el = document.querySelector("#greet-input");
      el.value = "";
      el.dispatchEvent(new Event('input', { bubbles: true }));
    `);
    await browser.pause(100);
    await input.setValue('World');

    const button = await $('button[type="submit"]');
    await button.click();

    const mainTitle = await $('h1');
    await mainTitle.waitForDisplayed({ timeout: 5000 });
    await expect(mainTitle).toHaveText(MAIN_WINDOW_TITLE);

    const mainWindowTitle = await browser.getTitle();
    expect(mainWindowTitle).toBe(MAIN_WINDOW_TITLE);

    const appleMsg = await $('#apple-greet-msg');
    await expect(appleMsg).not.toExist();

    const backButton = await $('#back-button');
    await expect(backButton).not.toExist();
  });
});