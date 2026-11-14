import { describe, expect, it, vi } from 'vitest';
import { setNativeValue } from '../src/lib/native-value';

describe('setNativeValue', () => {
  it('写入 input 与 textarea 的值', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');

    setNativeValue(input, 'Hello');
    setNativeValue(textarea, 'World');

    expect(input.value).toBe('Hello');
    expect(textarea.value).toBe('World');
  });

  it('绕过元素自身重写的 value setter（模拟框架的 value tracker）', () => {
    const input = document.createElement('input');
    let trackedValue = 'initial';

    Object.defineProperty(input, 'value', {
      configurable: true,
      get: () => trackedValue,
      set: (value: string) => {
        trackedValue = value;
      },
    });

    setNativeValue(input, 'Hello World');

    expect(trackedValue).toBe('initial');
    expect(Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.get?.call(input)).toBe('Hello World');
  });

  it('找不到原生 setter 时退化为直接赋值', () => {
    const input = document.createElement('input');
    const spy = vi.spyOn(Object, 'getOwnPropertyDescriptor').mockReturnValue(undefined);

    setNativeValue(input, 'Fallback');

    expect(input.value).toBe('Fallback');
    expect(spy).toHaveBeenCalledWith(HTMLInputElement.prototype, 'value');
  });
});
