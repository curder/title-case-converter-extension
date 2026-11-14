// Chrome 由 service-worker.js 先加载 browser-polyfill.js，Firefox 自带 browser 命名空间
const browserAPI: WebExtensionAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * 获取可用的 scripting API。
 * Chrome 的 polyfill 未暴露 scripting，需要回退到原生 chrome 命名空间；
 * Firefox 原生提供 browser.scripting。
 */
function getScriptingAPI(): WebExtensionScriptingAPI | undefined {
  if (browserAPI.scripting) {
    return browserAPI.scripting;
  }
  return typeof chrome !== 'undefined' ? chrome.scripting : undefined;
}

function requestConversion(tabId: number): Promise<ConvertResponse | undefined> {
  return browserAPI.tabs.sendMessage(tabId, { action: 'convertToTitleCase' });
}

async function injectContentScript(tabId: number): Promise<void> {
  const scripting = getScriptingAPI();
  if (!scripting) {
    throw new Error('当前环境不支持 scripting API');
  }

  await scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  });
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
    } catch {
      // content script 尚未注入（首次触发、安装前已打开或页面已刷新），注入后重试一次
      await injectContentScript(tabId);
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
