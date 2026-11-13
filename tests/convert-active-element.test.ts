import { describe, expect, it, vi } from 'vitest';
import { convertActiveElement } from '../src/convert-active-element';

function createInput(value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.value = value;
  document.body.append(input);
  return input;
}

describe('convertActiveElement', () => {
  it('没有活动元素时返回错误', () => {
    expect(convertActiveElement(null)).toEqual({
      status: 'error',
      message: '没有找到活动元素',
    });
  });

  it('活动元素不是输入框时保持原有成功响应', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(convertActiveElement(document.createElement('div'))).toEqual({
      status: 'success',
      message: '转换完成',
    });
  });

  it('输入框为空时返回错误', () => {
    expect(convertActiveElement(createInput(''))).toEqual({
      status: 'error',
      message: '输入框为空',
    });
  });

  it('转换文本并派发冒泡的 input 事件', () => {
    const input = createInput('hello world');
    const listener = vi.fn();
    input.addEventListener('input', listener);

    expect(convertActiveElement(input)).toEqual({
      status: 'success',
      message: '转换完成',
    });
    expect(input.value).toBe('Hello World');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toMatchObject({ bubbles: true });
  });

  it('再次调用还原原文并同样派发 input 事件', () => {
    const input = createInput('hello world');
    convertActiveElement(input);

    const listener = vi.fn();
    input.addEventListener('input', listener);

    expect(convertActiveElement(input)).toEqual({
      status: 'success',
      message: '已还原原文',
    });
    expect(input.value).toBe('hello world');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('支持 textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'the end';
    document.body.append(textarea);

    expect(convertActiveElement(textarea)).toEqual({
      status: 'success',
      message: '转换完成',
    });
    expect(textarea.value).toBe('The End');
  });
});
