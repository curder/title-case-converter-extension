const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with'];

function convertToTitleCase(str) {
  return str.replace(/\w\S*/g, function(txt, index, fullStr) {
    if (index > 0 && lowercaseWords.includes(txt.toLowerCase()) && 
        !/[.!?]\s+$/.test(fullStr.substring(0, index))) {
      return txt.toLowerCase();
    }
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("收到消息:", request);
  if (request.action === "convertToTitleCase") {
    console.log("开始转换");
    let activeElement = document.activeElement;
    console.log("当前活动元素:", activeElement);
    if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
      let originalValue = activeElement.value;
      console.log("原始值:", originalValue);
      let convertedValue = convertToTitleCase(originalValue);
      console.log("转换后的值:", convertedValue);
      activeElement.value = convertedValue;
      
      // 触发 input 事件,以确保其他脚本能够捕获到值的变化
      let event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
      console.log("已更新输入框并触发事件");
    } else {
      console.log("当前没有选中输入框");
    }
  }
  sendResponse({status: "完成"});
  return true;  // 保持消息通道开放
});

console.log("content.js 已加载");
