import { convertActiveElement } from './convert-active-element';

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'convertToTitleCase') {
    sendResponse(convertActiveElement(document.activeElement));
  }

  // 保持消息通道开放；始终由上面的分支给出响应
  return true;
});
