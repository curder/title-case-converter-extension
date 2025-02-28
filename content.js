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

      if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
        let originalValue = activeElement.value;
        console.log("原始值:", originalValue);

        if (!originalValue) {
          throw new Error("输入框为空");
        }

        let convertedValue = convertToTitleCase(originalValue);
        console.log("转换后的值:", convertedValue);
        activeElement.value = convertedValue;

        // 触发 input 事件
        try {
          let event = new Event('input', { bubbles: true });
          activeElement.dispatchEvent(event);
          console.log("已更新输入框并触发事件");
        } catch (e) {
          console.error("触发事件失败:", e);
        }
      } else {
        console.log("当前没有选中输入框");
      }

      sendResponse({ status: "success", message: "转换完成" });
    } catch (error) {
      console.error("转换过程出错:", error);
      sendResponse({ status: "error", message: error.message });
    }
  }
  return true;  // 保持消息通道开放
});

console.log("content.js 已加载");
