function convertActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    if (!tabs || !tabs[0]) {
      console.error("未找到活动标签页");
      return;
    }

    // 先确保 content script 已注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      });
    } catch (e) {
      console.log('Content script 已经存在，继续执行');
    }

    // 然后发送消息
    chrome.tabs.sendMessage(tabs[0].id, { action: "convertToTitleCase" }, function (response) {
      if (chrome.runtime.lastError) {
        console.error("发送消息失败:", chrome.runtime.lastError.message);
        return;
      }

      if (response && response.status === "error") {
        console.error("转换失败:", response.message);
      } else {
        console.log("转换成功:", response);
      }
    });
  });
}

chrome.action.onClicked.addListener(convertActiveTab);

chrome.commands.onCommand.addListener(function (command) {
  console.log("收到命令:", command);
  if (command === "_execute_action") {
    convertActiveTab();
  }
});

console.log("background.js 已加载");
