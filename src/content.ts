import { convertActiveElement } from './convert-active-element';

interface ContentScriptGlobal {
  __titleCaseConverterLoaded?: boolean;
}

// 同一扩展的 content script 共享隔离世界；按需注入可能重复执行，避免注册多个监听器
const contentGlobal = globalThis as typeof globalThis & ContentScriptGlobal;

if (!contentGlobal.__titleCaseConverterLoaded) {
  contentGlobal.__titleCaseConverterLoaded = true;

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action !== 'convertToTitleCase') {
      // 未处理的消息不占用通道，避免 Chrome 报 message port closed
      return false;
    }

    sendResponse(convertActiveElement(document.activeElement));
    // 保持消息通道开放，等待同步响应被投递
    return true;
  });
}
