# koishi-plugin-novelai-pptr

[![npm](https://img.shields.io/npm/v/koishi-plugin-novelai-pptr?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-novelai-pptr)

## 🎈 介绍

这是一个基于 [Koishi](https://koishi.chat/) 的插件，可以让你的机器人使用 [NovelAI](https://novelai.net/) 的图像生成功能，绘制出你想要的图像。🎨

你只需要输入一个简单的文本提示，就可以让机器人为你创造出各种有趣的图像，无论是风景、动物、人物、还是其他任何你能想到的东西。😍

你可以把这个插件当作一个有趣的娱乐工具，也可以用它来激发你的创意，或者给你的小说、游戏、漫画等提供灵感。🌟

## 📦 安装

前往 Koishi 插件市场添加该插件即可。

## 🎮 使用

- 建议为指令添加指令别名。
- 你需要填写你的 NovelAI 账号邮箱和密码，才能使用图像生成功能。
- 请自备科学上网工具，确保你能正常使用 [NovelAI](https://novelai.net/) 的图像生成功能。
- 全局同步，即所有群同步绘图进度，如需分群多开，可以多次添加本插件配置，并为相应的群聊设置单独的过滤器，参考链接：[维护多份配置](https://koishi.chat/zh-CN/manual/recipe/multiple.html#%E5%A4%9A%E5%AE%9E%E4%BE%8B)。
- 无限小图共享号购买推荐（店铺与本人无关）：[【25刀版本】NovelAI 共享号【无限制作小图】](https://item.taobao.com/item.htm?spm=a1z09.2.0.0.46f92e8dNv8id9&id=756695352688&_u=q20ehc81to6152)。

## 📝 指令说明

- `novelai`：查看插件的指令帮助信息。
- `novelai.randomPrompt`：随机获取一组提示词。
- `novelai.reload`：重载页面。
- `novelai.samplerList`：查看可选的采样器列表。
- `novelai.switchSampler <sampler:text>`：切换采样器，比如 `novelai.switchSampler DPM++ 2S Ancestral`。
- `novelai.sizeList`：查看可选的尺寸列表。
- `novelai.switchSize <size:text>`：切换尺寸，比如 `novelai.switchSize Portrait (832x1216)`。
- `novelai.draw <prompt:text>`：根据文本提示生成图像，并发送给你。你可以输入任何你想要的内容，比如 `novelai.draw 1girl,cat girl`。
  - `--undesired <content:string>` 或者 `-u <content:string>` 选项，用于排除画面中你不想要的内容，比如 `novelai.draw -u 'cat girl' 1girl` 可以排除女孩是猫娘的可能性。此处指令中的单引号参考资料：[使用引号](https://koishi.chat/zh-CN/manual/recipe/execution.html#%E4%BD%BF%E7%94%A8%E5%BC%95%E5%8F%B7)
    - 当希望传入带空格的参数时 (默认行为是只解析空格前面的部分)

## 🙏 致谢

* [Koishi](https://koishi.chat/) - 一个灵活且强大的机器人框架，让你可以轻松地创建自己的机器人。
* [NovelAI](https://novelai.net/) - 一个基于人工智能的小说创作平台，提供了强大的文本和图像生成功能。
* [puppeteer](https://github.com/puppeteer/puppeteer) - 一个 Node 库，可以让你通过 API 控制 Chrome 或 Chromium 浏览器。
* [puppeteer-finder](https://github.com/berstend/puppeteer-finder) - 一个 Node 库，可以帮助你找到系统中安装的 Chrome 或 Chromium 浏览器的路径。
* [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) - 一个 puppeteer 的插件，可以让你的浏览器更难被检测到。

## 📄 License

MIT License © 2023