import { describe, expect, it } from 'vitest';
import { isTextControl } from '../src/lib/text-control';

function createInput(options: { type?: string; readOnly?: boolean; disabled?: boolean } = {}): HTMLInputElement {
  const input = document.createElement('input');
  if (options.type) {
    input.type = options.type;
  }
  input.readOnly = options.readOnly ?? false;
  input.disabled = options.disabled ?? false;
  return input;
}

describe('isTextControl', () => {
  it.each(['text', 'search'])('识别 type=%s 的输入框', (type) => {
    expect(isTextControl(createInput({ type }))).toBe(true);
  });

  it.each([
    'checkbox',
    'radio',
    'file',
    'number',
    'password',
    'email',
    'url',
    'tel',
    'submit',
    'hidden',
    'date',
    'range',
    'color',
  ])('排除 type=%s', (type) => {
    expect(isTextControl(createInput({ type }))).toBe(false);
  });

  it('排除只读或禁用的输入框', () => {
    expect(isTextControl(createInput({ readOnly: true }))).toBe(false);
    expect(isTextControl(createInput({ disabled: true }))).toBe(false);
  });

  it('识别 textarea', () => {
    expect(isTextControl(document.createElement('textarea'))).toBe(true);
  });

  it('排除只读或禁用的 textarea', () => {
    const readOnly = document.createElement('textarea');
    readOnly.readOnly = true;

    const disabled = document.createElement('textarea');
    disabled.disabled = true;

    expect(isTextControl(readOnly)).toBe(false);
    expect(isTextControl(disabled)).toBe(false);
  });

  it('排除非输入元素与 null', () => {
    expect(isTextControl(null)).toBe(false);
    expect(isTextControl(document.createElement('div'))).toBe(false);
    expect(isTextControl(document.createElement('button'))).toBe(false);
  });
});
