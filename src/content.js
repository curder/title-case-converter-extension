const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with'];

function convertToTitleCase(str) {
  // 先按句子分割
  return str.split(/([.!?]\s+)/).map(sentence => {
    return sentence.replace(/\w\S*/g, function (txt, index, fullStr) {
      // 句子的第一个词总是大写
      if (index === 0) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
      // 检查是否是需要小写的单词
      if (lowercaseWords.includes(txt.toLowerCase())) {
        return txt.toLowerCase();
      }
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }).join('');
}

// 记录每个输入框最近一次的转换快照，用于再次触发时还原原文
const conversionSnapshots = new WeakMap();

// 使用原生 setter 赋值，避免绕过 React 等框架的 value tracker 导致状态不同步
function setNativeValue(element, value) {
  const proto = element.tagName === "TEXTAREA"
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
  setter.call(element, value);
}

// 首次触发转换并记录快照；若当前值仍是上次转换结果，则还原为转换前的原文
function toggleTitleCase(element) {
  const currentValue = element.value;
  const snapshot = conversionSnapshots.get(element);

  if (snapshot && currentValue === snapshot.converted) {
    setNativeValue(element, snapshot.original);
    conversionSnapshots.delete(element);
    return { restored: true };
  }

  // 文本被手动修改过或首次触发：以当前值作为新的原文重新转换
  const converted = convertToTitleCase(currentValue);
  conversionSnapshots.set(element, { original: currentValue, converted });
  setNativeValue(element, converted);
  return { restored: false };
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("收到消息:", request);
  if (request.action === "convertToTitleCase") {
    console.log("开始转换");
    try {
      let activeElement = document.activeElement;
      console.log("当前活动元素:", activeElement);

      if (!activeElement) {
        throw new Error("没有找到活动元素");
      }

      let restored = false;
      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
        let originalValue = activeElement.value;
        console.log("原始值:", originalValue);

        if (!originalValue) {
          throw new Error("输入框为空");
        }

        restored = toggleTitleCase(activeElement).restored;
        console.log(restored ? "已还原原文" : "已转换为标题格式");

        // 触发 input 事件
        try {
          let event = new Event('input', { bubbles: true });
          activeElement.dispatchEvent(event);
          console.log("已更新输入框并触发事件");
        } catch (e) {
          console.warn("触发事件失败:", e);
        }
      } else {
        console.warn("当前没有选中输入框");
      }

      sendResponse({ status: "success", message: restored ? "已还原原文" : "转换完成" });
    } catch (error) {
      console.error("转换过程出错:", error);
      sendResponse({ status: "error", message: error.message });
    }
  }
  return true;  // 保持消息通道开放
});

console.log("content.js 已加载");
