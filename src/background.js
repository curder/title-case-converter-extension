const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

if (!browser && chrome) {
  // Chrome environment
  importScripts('browser-polyfill.js');
}

function requestConversion(tabId) {
  return browserAPI.tabs.sendMessage(tabId, {
    action: "convertToTitleCase"
  });
}

async function convertActiveTab() {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });

    if (!tabs || !tabs[0]) {
      console.error("未找到活动标签页");
      return;
    }

    const tabId = tabs[0].id;
    let response;

    try {
      response = await requestConversion(tabId);
    } catch (error) {
      // content script 未注入（例如扩展安装前已打开的页面），注入后重试一次
      if (typeof chrome === 'undefined' || !chrome.scripting) {
        throw error;
      }
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      response = await requestConversion(tabId);
    }

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
