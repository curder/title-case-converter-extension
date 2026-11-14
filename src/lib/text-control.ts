export type TextControl = HTMLInputElement | HTMLTextAreaElement;

// 仅这些 input type 承载可编辑的纯文本；其它类型（checkbox、file、number 等）转换后会破坏原值语义
const TEXT_INPUT_TYPES = new Set(['text', 'search']);

function isEditable(element: HTMLInputElement | HTMLTextAreaElement): boolean {
  return !element.disabled && !element.readOnly;
}

export function isTextControl(element: Element | null): element is TextControl {
  if (element === null) {
    return false;
  }

  if (element.tagName === 'TEXTAREA') {
    return isEditable(element as HTMLTextAreaElement);
  }

  if (element.tagName !== 'INPUT') {
    return false;
  }

  const input = element as HTMLInputElement;
  return TEXT_INPUT_TYPES.has(input.type) && isEditable(input);
}
