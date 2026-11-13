// Chrome 由 service-worker.js 先加载 browser-polyfill.js，Firefox 自带 browser 命名空间
const browserAPI: WebExtensionAPI = typeof browser !== 'undefined' ? browser : chrome;

function requestConversion(tabId: number): Promise<ConvertResponse | undefined> {
  return browserAPI.tabs.sendMessage(tabId, { action: 'convertToTitleCase' });
}

async function convertActiveTab(): Promise<void> {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;

    if (tabId === undefined) {
      console.error('未找到活动标签页');
      return;
    }

    let response: ConvertResponse | undefined;

    try {
      response = await requestConversion(tabId);
    } catch (error) {
      // content script 未注入（例如扩展安装前已打开的页面），注入后重试一次
      if (typeof chrome === 'undefined' || !chrome.scripting) {
        throw error;
      }
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      response = await requestConversion(tabId);
    }

    if (response?.status === 'error') {
      console.error('转换失败:', response.message);
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
}

browserAPI.action.onClicked.addListener(() => {
  void convertActiveTab();
});

browserAPI.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    void convertActiveTab();
  }
});

// 导出供单元测试直接调用，运行时仍由上面的监听器触发
export { convertActiveTab };
