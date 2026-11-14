import { convertActiveElement } from './convert-active-element';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action !== 'convertToTitleCase') {
    // 未处理的消息不占用通道，避免 Chrome 报 message port closed
    return false;
  }

  sendResponse(convertActiveElement(document.activeElement));
  // 保持消息通道开放，等待同步响应被投递
  return true;
});
