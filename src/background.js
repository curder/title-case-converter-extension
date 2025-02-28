const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

if (!browser && chrome) {
  // Chrome environment
  importScripts('browser-polyfill.js');
}

async function convertActiveTab() {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });

    if (!tabs || !tabs[0]) {
      console.error("未找到活动标签页");
      return;
    }

    // Chrome 特有的脚本注入逻辑
    if (typeof chrome !== 'undefined' && chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
      } catch (e) {
        console.log('Content script 已经存在，继续执行');
      }
    }

    // 发送消息
    const response = await browserAPI.tabs.sendMessage(tabs[0].id, {
      action: "convertToTitleCase"
    });

    if (response && response.status === "error") {
      console.error("转换失败:", response.message);
    } else {
      console.log("转换成功:", response);
    }
  } catch (error) {
    console.error("操作失败:", error);
  }
}

browserAPI.action.onClicked.addListener(convertActiveTab);

browserAPI.commands.onCommand.addListener(function (command) {
  console.log("收到命令:", command);
  if (command === "_execute_action") {
    convertActiveTab();
  }
});

console.log("background.js 已加载");
