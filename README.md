# Title Case Converter Chrome Extension

一个简单的 Chrome 扩展，用于将输入框中的文本转换为标题格式（Title Case）。

## 功能特点

- 自动将选中输入框中的文本转换为标题格式
- 支持所有网页的文本输入框和文本区域
- 可以通过工具栏图标或自定义快捷键触发
- 智能处理常见的小写单词（如 a, an, the 等）
- 正确处理句子边界和标点符号

## 使用方法

1. 点击输入框，使其获得焦点
2. 点击浏览器工具栏中的扩展图标

## 快捷键设置

1. 访问 `chrome://extensions/shortcuts`
2. 找到 "Title Case Converter"
3. 点击输入框设置您想要的快捷键组合

## 标题格式规则

- 句子的第一个单词首字母大写
- 主要单词首字母大写
- 以下单词保持小写（除非在句首）：
  - 冠词：a, an, the
  - 连词：and, but, or, for, nor
  - 介词：on, at, to, from, by, in, of, with

## 技术实现

- 使用 Chrome Extension Manifest V3
- 包含 background script 和 content script
- 使用事件监听处理用户交互
- 实现错误处理和状态反馈

## 安装方法

1. 下载或克隆此仓库
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此项目的文件夹

## 注意事项

- 仅支持可编辑的文本输入框和文本区域
- 需要页面具有输入焦点才能进行转换
- 转换后会自动触发输入事件，确保与其他脚本兼容

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！