拉钩是一家专业的互联网招聘网站。从我接到过Boss直聘的电话来看，它们对竞争对手爬页面都没啥防备，所以自动投递脚本应该可行。

第一步肯定是下载 puppeteer， 运行 `yarn add puppeteer`，结果失败了，尽管我开了蓝灯。

我只好曲线救国，手动下载 Chrome Canary，然后根据[文档](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions)
的说法禁止自动下载 Chromium。如果你有好的 VPN 或者 SS 直接自动拉应该就可以吧。

搞定了下载之后，可以先 Hello World 试试：
```JavaScript
const puppeteer = require('puppeteer');

const main = async () => {
	const browser = await puppeteer.launch({
		headless: false,
		slowMo: 250,
		executablePath: "C:\\Users\\weili\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe"
	});
	const page = await browser.newPage();
	await page.goto('https://www.lagou.com/');

	page.on('console', msg => console.log('PAGE LOG:', ...msg.args));

	await page.evaluate(() => console.log(`url is ${location.href}`));

	await browser.close();
};

main().catch(console.error);
```

首先我有一个入口的 main 异步函数，调用并 catch，防止 node 抱怨 Promise 没有抓错。

puppeteer.launch 那里，headless 是是否以无头模式启动，当然选否，为了调试方便，slowMo 是动作间隔，executablePath 指向的是我下载的 Chrome Canary 的位置。

之后的代码就是打开新的选项卡，浏览拉钩首页，Console 当前连接，并退出，没啥可说的。

第二步计划是登录自己的账户，然后浏览职位列表。
为了在不泄露自己的用户名和密码的情况下和诸位分享代码，肯定要使用 dotenv 这样的配置工具，部署过 node 服务器的应该对它不陌生吧。

所以我在文件的第一行加上 `require('dotenv').config();`

之后当然是直接访问拉钩的登录页面，输入用户名和密码，点击登录。

```JavaScript
	await page.goto('https://passport.lagou.com/login/login.html');
	// 用户名
	await page.type('form.active > div:nth-child(1) > input:nth-child(1)', process.env.lagou_name);
	// 密码
	await page.type('form.active > div:nth-child(2) > input:nth-child(1)', process.env.lagou_pass);
	// 登录按钮
	await page.click('form.active > div:nth-child(5) > input:nth-child(1)');
	await page.waitForNavigation();
	// 直接跳转
	await page.goto('https://www.lagou.com/zhaopin/webqianduan/?labelWords=label');

	const title = await page.title();
	console.log(title);
```

点击了登录按钮之后，页面会跳转，所以用 `page.waitForNavigation()` 来等待登录的跳转。

登录跳转成功之后，肯定是要进对应的页面，但是这里不需要我们模拟点击那些 Node.js 或 web 前端，因为那些只是普通的 a 标签的链接而已。我只需要再次浏览到对应的页面即可。

进入职位列表之后，我一般会选择城市，并且按照更新时间排序，此时拉钩会刷新页面，链接是类似这样的：
https://www.lagou.com/jobs/list_web%E5%89%8D%E7%AB%AF?px=new&city=%E5%A4%A9%E6%B4%A5#order

看来得引用 querystring 才能让跳转参数化了，`const {escape} = require('querystring');`。然后链接改为：
```JavaScript
	await page.goto(`https://www.lagou.com/jobs/list_${escape('web前端')}?px=new&city=${escape('天津')}#order`);
```

