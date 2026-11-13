import type { TextControl } from './text-control';

/**
 * 使用原生 value setter 赋值。
 * 直接写 element.value 会绕过 React 等框架重写的 value tracker，导致受控组件状态不同步。
 */
export function setNativeValue(element: TextControl, value: string): void {
  const prototype = element.tagName === 'TEXTAREA'
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (!setter) {
    element.value = value;
    return;
  }

  setter.call(element, value);
}
