import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MessageListener = (
  request: { action?: string },
  sender: unknown,
  sendResponse: (response: unknown) => void,
) => boolean;

let listener: MessageListener | undefined;

async function loadContent(): Promise<MessageListener> {
  vi.resetModules();
  listener = undefined;

  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: {
        addListener: (callback: MessageListener) => {
          listener = callback;
        },
      },
    },
  });

  await import('../src/content');

  if (!listener) {
    throw new Error('content script 未注册消息监听器');
  }
  return listener;
}

function createInput(value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.value = value;
  document.body.append(input);
  input.focus();
  return input;
}

describe('content script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('收到转换消息时执行转换并响应结果', async () => {
    const input = createInput('hello world');
    const onMessage = await loadContent();
    const sendResponse = vi.fn();

    expect(onMessage({ action: 'convertToTitleCase' }, {}, sendResponse)).toBe(true);
    expect(input.value).toBe('Hello World');
    expect(sendResponse).toHaveBeenCalledWith({
      status: 'success',
      message: '转换完成',
    });
  });

  it('非转换消息不响应且不占用消息通道', async () => {
    await loadContent();
    const sendResponse = vi.fn();

    expect(listener?.({ action: 'otherAction' }, {}, sendResponse)).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
