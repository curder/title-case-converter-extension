import { setNativeValue } from './native-value';
import type { TextControl } from './text-control';
import { toTitleCase } from './title-case';

interface ConversionSnapshot {
  original: string;
  converted: string;
}

export interface ToggleResult {
  restored: boolean;
  /** 值是否实际发生变化；未变化时调用方不应派发 input 事件 */
  changed: boolean;
}

// 记录每个输入框最近一次的转换快照，用于再次触发时还原原文
const snapshots = new WeakMap<TextControl, ConversionSnapshot>();

/**
 * 首次触发：转换并记录快照。
 * 再次触发且值仍是上次转换结果：还原为原文。
 * 值被手动修改过：以当前值作为新的原文重新转换。
 */
export function toggleTitleCase(element: TextControl): ToggleResult {
  const currentValue = element.value;
  const snapshot = snapshots.get(element);

  if (snapshot && currentValue === snapshot.converted) {
    snapshots.delete(element);
    if (snapshot.original !== currentValue) {
      setNativeValue(element, snapshot.original);
    }
    return { restored: true, changed: snapshot.original !== currentValue };
  }

  const converted = toTitleCase(currentValue);
  snapshots.set(element, { original: currentValue, converted });
  if (converted !== currentValue) {
    setNativeValue(element, converted);
  }
  return { restored: false, changed: converted !== currentValue };
}
