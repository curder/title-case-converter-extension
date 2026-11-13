export type TextControl = HTMLInputElement | HTMLTextAreaElement;

export function isTextControl(element: Element | null): element is TextControl {
  return element !== null && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA');
}
