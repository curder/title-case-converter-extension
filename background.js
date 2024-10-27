function convertActiveTab() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "convertToTitleCase"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          console.log("消息已发送到content script");
        }
      });
    }
  });
}

chrome.action.onClicked.addListener(convertActiveTab);

chrome.commands.onCommand.addListener(function(command) {
  console.log("收到命令:", command);
  if (command === "_execute_action") {
    convertActiveTab();
  }
});

console.log("background.js 已加载");
