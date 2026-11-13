export {};

declare global {
  /** content script 与 background 之间传递的消息 */
  interface ConvertRequest {
    action?: string;
  }

  interface ConvertResponse {
    status?: 'success' | 'error';
    message?: string;
  }

  interface WebExtensionTabsAPI {
    query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Array<{ id?: number }>>;
    sendMessage(tabId: number, message: ConvertRequest): Promise<ConvertResponse | undefined>;
  }

  interface WebExtensionRuntimeAPI {
    onMessage: {
      addListener(
        listener: (
          request: ConvertRequest,
          sender: unknown,
          sendResponse: (response: ConvertResponse) => void,
        ) => boolean | void,
      ): void;
    };
  }

  interface WebExtensionActionAPI {
    onClicked: { addListener(listener: () => void): void };
  }

  interface WebExtensionCommandsAPI {
    onCommand: { addListener(listener: (command: string) => void): void };
  }

  interface WebExtensionScriptingAPI {
    executeScript(injection: { target: { tabId: number }; files: string[] }): Promise<unknown>;
  }

  /** 仅声明项目实际用到的 WebExtension API，避免引入完整 @types/chrome */
  interface WebExtensionAPI {
    tabs: WebExtensionTabsAPI;
    runtime: WebExtensionRuntimeAPI;
    action: WebExtensionActionAPI;
    commands: WebExtensionCommandsAPI;
    scripting?: WebExtensionScriptingAPI;
  }

  // Chrome 下由 browser-polyfill.js 注入 browser；Firefox 原生提供
  const browser: WebExtensionAPI | undefined;
  const chrome: WebExtensionAPI;
}
