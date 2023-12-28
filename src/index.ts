import { Context, Schema, Logger, h, sleep } from 'koishi'

import fs from 'fs';
import find from 'puppeteer-finder';
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export const name = 'novelai-pptr'
export const logger = new Logger('NovelAI')
export const reusable = true
export const usage = `## 🎮 使用

- 换号或者登录授权令牌失效请在 Koishi 默认的本地目录删除文件"localStorageData.json"并重新登录。
- 建议为指令添加指令别名。
- 你需要填写你的 NovelAI 账号邮箱和密码，才能使用图像生成功能。
- 请自备科学上网工具，确保你能正常使用 [NovelAI](https://novelai.net/) 的图像生成功能。
- 全局同步，即所有群同步绘图进度，如需分群多开，可以多次添加本插件配置，并为相应的群聊设置单独的过滤器，参考链接：[维护多份配置](https://koishi.chat/zh-CN/manual/recipe/multiple.html#%E5%A4%9A%E5%AE%9E%E4%BE%8B)。
- 无限小图共享号购买推荐（店铺与本人无关）：[【25刀版本】NovelAI 共享号【无限制作小图】](https://item.taobao.com/item.htm?spm=a1z09.2.0.0.46f92e8dNv8id9&id=756695352688&_u=q20ehc81to6152)。

## 📝 指令说明

- \`novelai\`：查看插件的指令帮助信息。
- \`novelai.reload\`：重载页面。
- \`novelai.randomPrompt\`：随机获取一组提示词。
- \`novelai.samplerList\`：查看可选的采样器列表。
- \`novelai.switchSampler <sampler:text>\`：切换采样器，比如 \`novelai.switchSampler DPM++ 2S Ancestral\`。
- \`novelai.sizeList\`：查看可选的尺寸列表。
- \`novelai.switchSize <size:text>\`：切换尺寸，比如 \`novelai.switchSize Portrait (832x1216)\`。
- \`novelai.draw <prompt:text>\`：根据文本提示生成图像，并发送给你。你可以输入任何你想要的内容，比如 \`novelai.draw 1girl,cat girl\`。
  - \`--undesired <content:string>\` 或者 \`-u <content:string>\` 选项，用于排除画面中你不想要的内容，比如 \`novelai.draw -u 'cat girl' 1girl\` 可以排除女孩是猫娘的可能性。此处指令中的单引号参考资料：[使用引号](https://koishi.chat/zh-CN/manual/recipe/execution.html#%E4%BD%BF%E7%94%A8%E5%BC%95%E5%8F%B7)
    - 当希望传入带空格的参数时 (默认行为是只解析空格前面的部分)`

export interface Config {
  headless
  email
  password
  isSendSpecificContent
}

export const Config: Schema<Config> = Schema.object({
  headless: Schema.union(['true', 'false', 'new']).default('new').description('是否以无头模式运行浏览器。'),
  email: Schema.string().description('账号邮箱。'),
  password: Schema.string().role('secret').default('password').description('登录密码。'),
  isSendSpecificContent: Schema.boolean().default(true).description('是否发送详情信息（采样器、提示词、尺寸），若关闭，则仅发送图片。'),
})

const executablePath = find();
puppeteer.use(StealthPlugin())
var isDrawing: boolean = false
var samplerButton = 'Euler'

var currentSize: string = 'Portrait (832x1216)'
var currentSampler: string = 'Euler'
var sizeElement = 'Normal Portrait'

const samplers: string[] = [
  "Euler",
  "Euler Ancestral",
  "DPM++ 2S Ancestral",
  "DPM++ 2M",
  "DPM++ SDE",
  "DDIM"
];
const sizes: string[] = [
  "Portrait (832x1216)",
  "Landscape (1216x832)",
  "Square (1024x1024)"
];

export async function apply(ctx: Context, config: Config) {
  const { email, password, isSendSpecificContent, headless } = config
  logger.info('正在初始化中.......')
  const { browser, page } = await run(headless, email, password)
  logger.info('初始化成功！')
  ctx.on('dispose', async () => {
    await browser.close();
  });

  ctx.command('novelai', 'novelai 指令帮助').action(async ({ session }) => {
    await session.execute(`novelai -h`);
  });
  ctx.command('novelai.samplerList', '采样器列表').action(async ({ session }) => {
    const samplerList: string[] = samplers.map((sampler, index) => `${index + 1}. ${sampler}`);

    session.send(samplerList.join("\n"));
  });
  ctx.command('novelai.sizeList', '尺寸列表').action(async ({ session }) => {
    const sizeList: string[] = sizes.map((sampler, index) => `${index + 1}. ${sampler}`);

    session.send(sizeList.join("\n"));
  });

  ctx.command('novelai.randomPrompt', '随机提示词').action(async ({ session }) => {
    if (isDrawing) {
      return '等一下啦~';
    }
    await session.send('嗯~');
    isDrawing = true

    await page.waitForSelector('textarea.sc-5db1afd3-45');

    const inputBox = await page.$('textarea.sc-5db1afd3-45');

    await inputBox.click();

    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');

    await page.keyboard.press('Backspace');

    await page.waitForSelector('button.sc-d72450af-0.sc-d72450af-4.sc-5ef2c1dc-36.ktCSKn.lbyRBz.jhAyYg');

    await page.click('button.sc-d72450af-0.sc-d72450af-4.sc-5ef2c1dc-36.ktCSKn.lbyRBz.jhAyYg');
    // await page.click('button.sc-d72450af-1.kXFbYD');

    const textareaContent = await page.$eval('textarea.sc-5db1afd3-45.krCEJi', (element) => element.value);
    await session.send(textareaContent);
    await page.waitForSelector('.sc-876067fe-0.sc-876067fe-22.flOuWA.sUrgW');

    await page.click('.sc-876067fe-0.sc-876067fe-22.flOuWA.sUrgW');

    const closeButton = await page.$('.sc-d72450af-1.sc-b8ec890b-10.kXFbYD.cuENRd.modal-close');
    await closeButton?.click();

    isDrawing = false
  });


  const samplers2: { [key: string]: string[] } = {
    "Euler": ["#react-select-5-option-0-0", "#react-select-4-option-0-0"],
    "Euler Ancestral": ["#react-select-5-option-0-1", "#react-select-4-option-0-1"],
    "DPM++ 2S Ancestral": ["#react-select-5-option-0-2", "#react-select-4-option-0-2"],
    "DPM++ 2M": ["#react-select-5-option-1-0", "#react-select-4-option-1-0"],
    "DPM++ SDE": ["#react-select-5-option-1-1", "#react-select-4-option-1-1"],
    "DDIM": ["#react-select-5-option-1-2", "#react-select-4-option-1-2"]
  };

  ctx.command('novelai.switchSampler <sampler:text>', '切换采样器')
    .action(async ({ session }, sampler) => {
      if (isDrawing) {
        return '等一下啦~';
      }
      if (!sampler) {
        await session.execute(`novelai.samplerList`)
        await session.send('请输入你想要切换的采样器全名或相应的数字ID：')
        sampler = await session.prompt()
        if (!sampler) return '输入超时。'
      }
      // 检测输入是否是数字ID
      const samplerFromID = getSamplerFromID(sampler);
      if (samplerFromID) {
        sampler = samplerFromID;
      }
      await session.send('嗯~');
      isDrawing = true;

      const [button] = await page.$x(`//button[contains(., '${samplerButton}')]`);
      if (button) {
        await button.click();
      }

      const samplerIds = samplers2[sampler];
      if (!samplerIds || samplerIds.length === 0) {
        await session.send('不支持的采样器');
        await session.execute(`novelai.samplerList`)
        isDrawing = false;
        return;
      }
      const element = await page.$x(`//div[contains(text(), "${sampler}")]`);

      if (element.length === 0) {
        await session.send('找不到采样器元素');
        isDrawing = false;
        return;
      }

      await element[0].click();

      await session.send('好啦~');
      samplerButton = sampler
      currentSampler = sampler
      isDrawing = false;
    });
  const sizes2: { [key: string]: string[] } = {
    "Portrait (832x1216)": ["#react-select-3-option-0-0"],
    "Landscape (1216x832)": ["#react-select-3-option-0-1"],
    "Square (1024x1024)": ["#react-select-3-option-0-2"]
  };

  ctx.command('novelai.switchSize <size:text>', '切换尺寸')
    .action(async ({ session }, size) => {
      if (isDrawing) {
        return '等一下啦~';
      }
      if (!size) {
        await session.execute(`novelai.sizeList`)
        await session.send('请输入你想要切换的尺寸全名或相应的数字ID：')
        size = await session.prompt()
        if (!size) return '输入超时。'
      }
      // 检测输入是否是数字ID
      const sizeFromID = getSizeFromID(size);
      if (sizeFromID) {
        size = sizeFromID;
      }

      await session.send('嗯~');
      isDrawing = true;
      await page.waitForSelector('.css-4t5j3y-singleValue');

      const sizeIds = sizes2[size];
      if (!sizeIds || sizeIds.length === 0) {
        await session.send('不支持的尺寸');
        await session.execute(`novelai.sizeList`)
        isDrawing = false;
        return;
      }
      const element = await page.$x(`//div[contains(text(), "${sizeElement}")]`);
      if (element.length === 0) {
        await session.send('找不到尺寸元素');
        isDrawing = false;
        return;
      }

      await element[0].click();

      const element2 = await page.$x(`//div[contains(text(), "${size}")]`);

      if (element2.length === 0) {
        await session.send('找不到尺寸元素');
        isDrawing = false;
        return;
      }

      await element2[0].click();

      currentSize = size;
      await session.send('好啦~');
      switch (size) {
        case 'Portrait (832x1216)':
          sizeElement = 'Normal Portrait';
          break;
        case 'Landscape (1216x832)':
          sizeElement = 'Normal Landscape';
          break;
        case 'Square (1024x1024)':
          sizeElement = 'Normal Square';
          break;
      }
      isDrawing = false;
    });

  ctx.command('novelai.draw <prompt:text>', '绘图')
    .option('undesired', '-u <content:string>')
    .action(async ({ session, options }, prompt) => {
      if (!prompt) {
        return '大笨蛋~';
      }
      if (isDrawing) {
        return '等一下啦~';
      }
      await session.send('嗯~');
      isDrawing = true
      await page.waitForSelector('textarea.sc-5db1afd3-45', { timeout: 60000 });

      const inputBox = await page.$('textarea.sc-5db1afd3-45');

      await inputBox.click();

      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');

      await page.keyboard.press('Backspace');
      await page.type('textarea.sc-5db1afd3-45.fnzOi', prompt, { delay: 0 });

      if (options.undesired) {
        const textareas = await page.$$('textarea.sc-5db1afd3-45');
        const textarea = textareas[1];

        await textarea.click({ clickCount: 3 }); // 选中全部文本
        await textarea.press('Backspace'); // 删除选中文本

        await textarea.type(`${options.undesired}`);
      } else {
        const textareas = await page.$$('textarea.sc-5db1afd3-45');
        const textarea = textareas[1];

        await textarea.click({ clickCount: 3 }); // 选中全部文本
        await textarea.press('Backspace'); // 删除选中文本
      }

      await page.waitForSelector('button.sc-d72450af-1.sc-5ef2c1dc-20.kXFbYD', { timeout: 60000 });
      await page.click('button.sc-d72450af-1.sc-5ef2c1dc-20.kXFbYD');

      await page.waitForFunction(() => {
        const button = document.querySelector('button.sc-d72450af-1.sc-5ef2c1dc-20.kXFbYD') as any;
        return button && !button.disabled; // 检查按钮是否存在且不被禁用
      }, { timeout: 120000 }); // 设置超时时间为 2 分钟（120000 毫秒）

      await page.waitForTimeout(2000); // 等待 2 秒钟

      const imageElement = await page.$('div.sc-5db1afd3-25.lgGyrb img');
      const imageSrc = await imageElement?.evaluate((elem: HTMLImageElement) => elem.src);

      if (imageSrc) {
        const imagePage = await browser.newPage();
        const viewSource = await imagePage.goto(imageSrc);
        // const imageBuffer = await imagePage.screenshot({ encoding: 'binary' });

        const imageBuffer = await viewSource.buffer();

        await session.send(h.image(imageBuffer, 'image/png'));
        if (isSendSpecificContent) {
          await session.send(`*Prompt: ${prompt}

*Sampler: ${currentSampler}

*Size: ${currentSize}`);
        }
        await imagePage.close(); // 关闭处理图像的页面
      }
      sleep(2000)
      isDrawing = false
    });

  ctx.command('novelai.reload', '重载页面').action(async ({ session }) => {
    isDrawing = true;
    await session.send('嗯~');
    await page.reload()

    await page.waitForSelector('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
    await page.click('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
    await session.send('好啦~');
    // 注销对话框事件监听器
    page.off('dialog');

    // 第二次注册对话框事件监听器
    await registerDialogListener(page);
    currentSampler = 'Euler'
    currentSize = 'Portrait (832x1216)'
    isDrawing = false;
  });
}


async function run(headless, email, password) {
  const browser = await puppeteer.launch({
    executablePath,
    timeout: 0,
    protocolTimeout: 300000,
    headless: headless === 'true' ? true : headless === 'false' ? false : 'new',
  });

  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);
  await page.setDefaultTimeout(0);

  await registerDialogListener(page);

  const filePath = 'localStorageData.json';

  const checkLocalStorage = async () => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  };

  const saveLocalStorage = async () => {
    const localStorage = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });

    const localStorageJSON = JSON.stringify(localStorage);
    await fs.promises.writeFile(filePath, localStorageJSON, 'utf8');
  };

  const loadLocalStorage = async () => {
    const localStorageJSON = await fs.promises.readFile(filePath, 'utf8');
    const localStorage = JSON.parse(localStorageJSON);

    await page.evaluateOnNewDocument(() => localStorage.clear());

    for (let key in localStorage) {
      await page.evaluateOnNewDocument((key, value) => {
        localStorage.setItem(key, value);
      }, key, localStorage[key]);
    }
  };

  const login = async () => {
    await page.goto('https://novelai.net/image');
    await page.waitForSelector('.sc-7c920e4a-7.dOivMA');

    await page.click('#username');
    await page.type('#username', email, { delay: 0 });

    await page.click('#password');
    await page.type('#password', password, { delay: 0 });

    await page.click('.sc-7c920e4a-11.bRqMMu');
    await page.waitForSelector('button[href="/image"]');
    await page.click('button[href="/image"]');
    await page.waitForSelector('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
    await page.click('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
  };

  const runPage = async () => {
    await page.goto('https://novelai.net/image');
    await page.waitForSelector('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
    await page.click('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
  };

  const isLocalStorageAvailable = await checkLocalStorage();

  if (isLocalStorageAvailable) {
    await loadLocalStorage();
    await runPage();
  } else {
    await login();
    await saveLocalStorage();
  }

  return { browser, page };
}


function getSamplerFromID(samplerID: string): string | undefined {
  const index = parseInt(samplerID);
  if (index >= 1 && index <= samplers.length) {
    return samplers[index - 1];
  }
  return undefined;
}

function getSizeFromID(sizeID: string): string | undefined {
  const index = parseInt(sizeID);
  if (index >= 1 && index <= sizes.length) {
    return sizes[index - 1];
  }
  return undefined;
}

async function registerDialogListener(page) {
  // 注册对话框事件监听器
  page.on('dialog', async (dialog) => {
    // console.log(`对话框消息: ${dialog.message()}`);

    // 点击确认按钮
    await dialog.accept();
  });
}