import { expect, test } from '@playwright/test';
import {
  FIXTURE_URL,
  PACKAGE_INFO,
  convertActiveTab,
  getManifest,
  launchExtension,
  type ExtensionSession,
} from './extension';

let session: ExtensionSession;

test.beforeAll(async () => {
  session = await launchExtension();
});

test.afterAll(async () => {
  await session.context.close();
});

test.beforeEach(async () => {
  await session.page.goto(FIXTURE_URL);
});

test('扩展以 MV3 加载并注册 service worker', async () => {
  expect(session.worker.url()).toMatch(/^chrome-extension:\/\//);

  const manifest = await getManifest(session.worker);
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.name).toBe(PACKAGE_INFO.name);
  expect(manifest.version).toBe(PACKAGE_INFO.version);
  expect(manifest.permissions).toEqual(expect.arrayContaining(['activeTab', 'scripting']));
});

test('普通输入框首次转换、再次触发还原', async () => {
  await session.page.focus('#plain');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'success',
    message: '转换完成',
  });
  await expect(session.page.locator('#plain')).toHaveValue('Hello World');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'success',
    message: '已还原原文',
  });
  await expect(session.page.locator('#plain')).toHaveValue('hello world');
});

test('textarea 同样支持转换与还原', async () => {
  await session.page.focus('#notes');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'success',
    message: '转换完成',
  });
  await expect(session.page.locator('#notes')).toHaveValue('The End');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'success',
    message: '已还原原文',
  });
  await expect(session.page.locator('#notes')).toHaveValue('the end');
});

test('空输入框返回错误且不修改值', async () => {
  await session.page.focus('#empty');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'error',
    message: '输入框为空',
  });
  await expect(session.page.locator('#empty')).toHaveValue('');
});

test('焦点不在输入框时返回成功且不修改其它输入框', async () => {
  await session.page.focus('#not-input');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'success',
    message: '转换完成',
  });
  await expect(session.page.locator('#plain')).toHaveValue('hello world');
  await expect(session.page.locator('#notes')).toHaveValue('the end');
});

test('焦点在复选框上时不修改其值', async () => {
  await session.page.focus('#check');

  expect(await convertActiveTab(session.worker)).toEqual({
    status: 'success',
    message: '转换完成',
  });
  await expect(session.page.locator('#check')).toBeChecked();
  await expect(session.page.locator('#check')).toHaveValue('on');
});

test('派发 input 事件同步受控组件状态', async () => {
  await session.page.focus('#tracked');
  await convertActiveTab(session.worker);

  // 元素自身的 value 描述符（模拟框架 value tracker）未被更新
  const trackerValue = await session.page.evaluate(
    () => (window as unknown as { __trackedValue: string }).__trackedValue,
  );
  expect(trackerValue).toBe('hello world');

  // 原生 setter 已写入真实 DOM 值
  const realValue = await session.page.locator('#tracked').evaluate((element) => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    return descriptor?.get?.call(element) as string;
  });
  expect(realValue).toBe('Hello World');

  // input 事件让模拟的受控组件读到了新值
  await expect(session.page.locator('#tracked-state')).toHaveText('Hello World');
});
