import { Context, Schema, Logger, h } from 'koishi'

import find from 'puppeteer-finder';
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

export const name = 'novelai-pptr'
export const logger = new Logger('NovelAI')
export const reusable = true
export const usage = ``

export interface Config {
  email
  password
}

export const Config: Schema<Config> = Schema.object({
  email: Schema.string().description('账号邮箱。'),
  password: Schema.string().role('secret').default('password').description('登录密码。'),
})

const executablePath = find();
puppeteer.use(StealthPlugin())
var isDrawing: boolean

export async function apply(ctx: Context, config: Config) {
  const { email, password } = config
  logger.info('正在初始化中.......')
  const { browser, page } = await run(ctx, email, password)
  logger.info('初始化成功！')
  ctx.on('dispose', async () => {
    await browser.close();
  });

  ctx.command('novelai', 'novelai 指令帮助').action(async ({ session }) => {
    await session.execute(`novelai -h`);
  });


  ctx.command('novelai.draw <prompt:text>', '绘图').action(async ({ session }, prompt) => {
    if (!prompt) {
      return '大笨蛋~';
    }
    if (isDrawing) {
      return '等一下啦~';
    }
    await session.send('嗯~');
    await page.waitForSelector('textarea.sc-5db1afd3-45.fnzOi');
    await page.$eval('textarea.sc-5db1afd3-45.fnzOi', (textarea) => {
      textarea.value = ''; // 清空文本区域内容
    });
    await page.type('textarea.sc-5db1afd3-45.fnzOi', prompt);

    await page.waitForSelector('button.sc-d72450af-1.sc-5ef2c1dc-20.kXFbYD');
    await page.click('button.sc-d72450af-1.sc-5ef2c1dc-20.kXFbYD');

    isDrawing = true
    await page.waitForFunction(() => {
      const button = document.querySelector('button.sc-d72450af-1.sc-5ef2c1dc-20.kXFbYD') as any;
      return button && !button.disabled; // 检查按钮是否存在且不被禁用
    });

    const imageElement = await page.$('div.sc-5db1afd3-25.lgGyrb img');
    const imageSrc = await imageElement?.evaluate((elem: HTMLImageElement) => elem.src);

    if (imageSrc) {
      const imagePage = await browser.newPage();
      await imagePage.goto(imageSrc);
      const imageBuffer = await imagePage.screenshot({ encoding: 'binary' });

      await session.send(h.image(imageBuffer, 'image/png'));
      await imagePage.close(); // 关闭处理图像的页面
    }

    isDrawing = false
  });
}


async function run(ctx, email, password) {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new'
    // headless: false
  });

  const page = await browser.newPage();

  await page.goto('https://novelai.net/image');

  await page.waitForSelector('.sc-7c920e4a-7.dOivMA');

  await page.click('#username');
  await page.type('#username', `${email}`);

  await page.click('#password');
  await page.type('#password', `${password}`);

  await page.click('.sc-7c920e4a-11.bRqMMu');

  await page.waitForSelector('button[href="/image"]');

  await page.click('button[href="/image"]');

  await page.waitForSelector('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');
  await page.click('button.sc-d72450af-0.sc-d72450af-4.ktCSKn.lbyRBz.button');

  return { browser, page }
}


