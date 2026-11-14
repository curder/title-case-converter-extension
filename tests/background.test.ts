import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createBrowserAPI(options: {
  tabs: Array<{ id?: number }>;
  query?: ReturnType<typeof vi.fn>;
  sendMessage?: ReturnType<typeof vi.fn>;
  scripting?: WebExtensionScriptingAPI;
}): {
  api: WebExtensionAPI;
  query: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  onClicked: ReturnType<typeof vi.fn>;
  onCommand: ReturnType<typeof vi.fn>;
} {
  const query = options.query ?? vi.fn().mockResolvedValue(options.tabs);
  const sendMessage = options.sendMessage ?? vi.fn().mockResolvedValue({ status: 'success' });
  const onClicked = vi.fn();
  const onCommand = vi.fn();

  const api = {
    tabs: { query, sendMessage },
    runtime: { onMessage: { addListener: vi.fn() } },
    action: { onClicked: { addListener: onClicked } },
    commands: { onCommand: { addListener: onCommand } },
    scripting: options.scripting,
  } as unknown as WebExtensionAPI;

  return { api, query, sendMessage, onClicked, onCommand };
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

  it('browser API 暴露 scripting 时直接使用', async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('Receiving end does not exist'))
      .mockResolvedValueOnce({ status: 'success' });
    const executeScript = vi.fn().mockResolvedValue(undefined);
    const { api } = createBrowserAPI({
      tabs: [{ id: 7 }],
      sendMessage,
      scripting: { executeScript },
    });

    vi.stubGlobal('browser', api);

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

  it('内容脚本返回错误时记录错误日志', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ status: 'error', message: '输入框为空' });
    const { api } = createBrowserAPI({ tabs: [{ id: 7 }], sendMessage });
    vi.stubGlobal('browser', api);

    const convertActiveTab = await loadBackground();
    await convertActiveTab();

    expect(console.error).toHaveBeenCalledWith('转换失败:', '输入框为空');
  });

  it('点击扩展图标时触发转换', async () => {
    const { api, query, sendMessage, onClicked } = createBrowserAPI({ tabs: [{ id: 7 }] });
    vi.stubGlobal('browser', api);

    await loadBackground();

    expect(onClicked).toHaveBeenCalledOnce();
    const handler = onClicked.mock.calls[0][0] as () => void;
    handler();

    await vi.waitFor(() => {
      expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(sendMessage).toHaveBeenCalledWith(7, { action: 'convertToTitleCase' });
    });
  });

  it('快捷键 _execute_action 触发转换，其它命令忽略', async () => {
    const { api, sendMessage, onCommand } = createBrowserAPI({ tabs: [{ id: 7 }] });
    vi.stubGlobal('browser', api);

    await loadBackground();

    expect(onCommand).toHaveBeenCalledOnce();
    const handler = onCommand.mock.calls[0][0] as (command: string) => void;

    handler('other_command');
    expect(sendMessage).not.toHaveBeenCalled();

    handler('_execute_action');
    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(7, { action: 'convertToTitleCase' });
    });
  });
});
