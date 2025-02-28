function convertActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) {
      console.error("未找到活动标签页");
      return;
    }

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
