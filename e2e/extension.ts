import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, type BrowserContext, type Page, type Worker } from '@playwright/test';

export const FIXTURE_URL = 'http://127.0.0.1:4173/form.html';

const EXTENSION_PATH = path.resolve(import.meta.dirname, '../dist/chrome');

// 构建产物的 name / description 来自 src/manifest.json，version 来自 package.json
const BASE_MANIFEST = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../src/manifest.json'), 'utf8'),
) as { name: string; description: string };

const PACKAGE_INFO = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../package.json'), 'utf8'),
) as { version: string };

export const EXTENSION_INFO = {
  name: BASE_MANIFEST.name,
  description: BASE_MANIFEST.description,
  version: PACKAGE_INFO.version,
};
const SEND_RETRY_TIMES = 20;
const SEND_RETRY_INTERVAL = 50;

export interface ConvertResponse {
  status: 'success' | 'error';
  message: string;
}

export interface ExtensionManifest {
  manifest_version: number;
  name: string;
  description: string;
  version: string;
  permissions?: string[];
}

// 仅用于类型检查：运行时代码在扩展 service worker 中执行，由浏览器注入这些 API
declare const chrome: {
  runtime: {
    getManifest(): ExtensionManifest;
  };
  tabs: {
    query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Array<{ id?: number; active?: boolean }>>;
    sendMessage(tabId: number, message: unknown): Promise<ConvertResponse>;
  };
};

export interface ExtensionSession {
  context: BrowserContext;
  worker: Worker;
  page: Page;
}

export async function launchExtension(): Promise<ExtensionSession> {
  const context = await chromium.launchPersistentContext('', {
    // channel: 'chromium' 使用完整版 Chromium，headless 下才能加载扩展
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  });

  const worker = context.serviceWorkers()[0]
    ?? (await context.waitForEvent('serviceworker'));
  const page = context.pages()[0] ?? (await context.newPage());

  return { context, worker, page };
}

async function sendConvertMessage(worker: Worker): Promise<ConvertResponse> {
  return worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id ?? (await chrome.tabs.query({}))[0]?.id;

    if (tabId === undefined) {
      throw new Error('未找到活动标签页');
    }

    return chrome.tabs.sendMessage(tabId, { action: 'convertToTitleCase' });
  });
}

/**
 * 向当前标签页发送转换消息。
 * content script 在 document_idle 注入，页面刚加载完时可能尚未就绪，因此对连接错误重试。
 */
export async function convertActiveTab(worker: Worker): Promise<ConvertResponse> {
  for (let attempt = 0; attempt < SEND_RETRY_TIMES; attempt += 1) {
    try {
      return await sendConvertMessage(worker);
    } catch (error) {
      if (attempt === SEND_RETRY_TIMES - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, SEND_RETRY_INTERVAL));
    }
  }

  throw new Error('无法连接 content script');
}

export function getManifest(worker: Worker): Promise<ExtensionManifest> {
  return worker.evaluate(() => chrome.runtime.getManifest());
}
