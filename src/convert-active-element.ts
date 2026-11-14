import { isTextControl, type TextControl } from './lib/text-control';
import { toggleTitleCase } from './lib/toggle';

export interface ConversionResult {
  status: 'success' | 'error';
  message: string;
}

function dispatchInputEvent(element: TextControl): void {
  try {
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (error) {
    console.warn('触发事件失败:', error);
  }
}

/**
 * 处理当前活动元素：首次转换、再次还原，并派发 input 事件同步受控组件。
 * 未聚焦输入框时保持原有行为，返回 success 以便背景脚本不报错。
 */
export function convertActiveElement(element: Element | null): ConversionResult {
  if (!element) {
    return { status: 'error', message: '没有找到活动元素' };
  }

  if (!isTextControl(element)) {
    console.warn('当前没有选中输入框');
    return { status: 'success', message: '转换完成' };
  }

  if (!element.value) {
    return { status: 'error', message: '输入框为空' };
  }

  const { restored, changed } = toggleTitleCase(element);
  // 值没有变化时派发 input 会误触页面的自动保存、校验等副作用
  if (changed) {
    dispatchInputEvent(element);
  }

  return { status: 'success', message: restored ? '已还原原文' : '转换完成' };
}
