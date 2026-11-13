import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createBrowserAPI(options: {
  tabs: Array<{ id?: number }>;
  query?: ReturnType<typeof vi.fn>;
  sendMessage?: ReturnType<typeof vi.fn>;
}): { api: WebExtensionAPI; query: ReturnType<typeof vi.fn>; sendMessage: ReturnType<typeof vi.fn> } {
  const query = options.query ?? vi.fn().mockResolvedValue(options.tabs);
  const sendMessage = options.sendMessage ?? vi.fn().mockResolvedValue({ status: 'success' });

  const api = {
    tabs: { query, sendMessage },
    runtime: { onMessage: { addListener: vi.fn() } },
    action: { onClicked: { addListener: vi.fn() } },
    commands: { onCommand: { addListener: vi.fn() } },
  } as unknown as WebExtensionAPI;

  return { api, query, sendMessage };
}

async function loadBackground(): Promise<() => Promise<void>> {
  vi.resetModules();
  const { convertActiveTab } = await import('../src/background');
  return convertActiveTab;
}

describe('background convertActiveTab', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('向当前活动标签页发送转换消息', async () => {
    const { api, query, sendMessage } = createBrowserAPI({ tabs: [{ id: 7 }] });
    vi.stubGlobal('browser', api);

    const convertActiveTab = await loadBackground();
    await convertActiveTab();

    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(sendMessage).toHaveBeenCalledWith(7, { action: 'convertToTitleCase' });
  });

  it('没有活动标签页时记录错误且不发送消息', async () => {
    const { api, sendMessage } = createBrowserAPI({ tabs: [] });
    vi.stubGlobal('browser', api);

    const convertActiveTab = await loadBackground();
    await convertActiveTab();

    expect(sendMessage).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('未找到活动标签页');
  });

  it('消息发送失败时注入 content.js 并重试一次', async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockResolvedValueOnce({ status: 'success' });
    const { api } = createBrowserAPI({ tabs: [{ id: 7 }], sendMessage });
    const executeScript = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal('browser', api);
    vi.stubGlobal('chrome', { scripting: { executeScript } } as unknown as WebExtensionAPI);

    const convertActiveTab = await loadBackground();
    await convertActiveTab();

    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 7 },
      files: ['content.js'],
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('环境不支持 scripting 时不重试', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('Receiving end does not exist'));
    const { api } = createBrowserAPI({ tabs: [{ id: 7 }], sendMessage });

    vi.stubGlobal('browser', api);
    vi.stubGlobal('chrome', {} as unknown as WebExtensionAPI);

    const convertActiveTab = await loadBackground();
    await convertActiveTab();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('操作失败:', expect.any(Error));
  });
});
