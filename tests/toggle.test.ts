import { describe, expect, it } from 'vitest';
import { toggleTitleCase } from '../src/lib/toggle';

function createInput(value = ''): HTMLInputElement {
  const input = document.createElement('input');
  input.value = value;
  document.body.append(input);
  return input;
}

function createTextarea(value = ''): HTMLTextAreaElement {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  document.body.append(textarea);
  return textarea;
}

describe('toggleTitleCase', () => {
  it('首次触发转换为标题格式', () => {
    const input = createInput('hello world');

    expect(toggleTitleCase(input)).toEqual({ restored: false });
    expect(input.value).toBe('Hello World');
  });

  it('再次触发还原原文', () => {
    const input = createInput('hello world');
    toggleTitleCase(input);

    expect(toggleTitleCase(input)).toEqual({ restored: true });
    expect(input.value).toBe('hello world');
  });

  it('值被手动修改后按新原文重新转换', () => {
    const input = createInput('hello world');
    toggleTitleCase(input);

    input.value = 'goodbye moon';
    expect(toggleTitleCase(input)).toEqual({ restored: false });
    expect(input.value).toBe('Goodbye Moon');

    expect(toggleTitleCase(input)).toEqual({ restored: true });
    expect(input.value).toBe('goodbye moon');
  });

  it('支持 textarea', () => {
    const textarea = createTextarea('the end');

    expect(toggleTitleCase(textarea)).toEqual({ restored: false });
    expect(textarea.value).toBe('The End');

    expect(toggleTitleCase(textarea)).toEqual({ restored: true });
    expect(textarea.value).toBe('the end');
  });

  it('输入已是标题格式时保持原值', () => {
    const input = createInput('Hello World');

    expect(toggleTitleCase(input)).toEqual({ restored: false });
    expect(input.value).toBe('Hello World');

    expect(toggleTitleCase(input)).toEqual({ restored: true });
    expect(input.value).toBe('Hello World');
  });

  it('还原后可以再次转换', () => {
    const input = createInput('hello world');

    toggleTitleCase(input);
    expect(toggleTitleCase(input)).toEqual({ restored: true });
    expect(input.value).toBe('hello world');

    expect(toggleTitleCase(input)).toEqual({ restored: false });
    expect(input.value).toBe('Hello World');
  });

  it('不同输入框的快照互不影响', () => {
    const first = createInput('first text');
    const second = createInput('second text');

    toggleTitleCase(first);
    toggleTitleCase(second);

    expect(first.value).toBe('First Text');
    expect(second.value).toBe('Second Text');

    expect(toggleTitleCase(first)).toEqual({ restored: true });
    expect(first.value).toBe('first text');
    expect(second.value).toBe('Second Text');
  });
});
