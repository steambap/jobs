拉钩是一家专业的互联网招聘网站。从我接到过Boss直聘的电话来看，它们对竞争对手爬页面都没啥防备，所以自动投递应该可行。

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
		executablePath: "C:\\Users\\Admin\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe"
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
这里 page.type 方法是输入文字。而 `process.env.lagou_name` 自然是从 .env 的配置里面来的。

点击了登录按钮之后，页面会跳转，所以用 `page.waitForNavigation()` 来等待登录的跳转。

登录跳转成功之后，肯定是要进对应的页面，但是这里不需要我们模拟点击那些 Node.js 或 web 前端，因为那些只是普通的 a 标签的链接而已。我只需要再次浏览到对应的页面即可。

进入职位列表之后，我一般会选择城市，并且按照更新时间排序，此时拉钩会刷新页面，链接是类似这样的：
https://www.lagou.com/jobs/list_web%E5%89%8D%E7%AB%AF?px=new&city=%E5%A4%A9%E6%B4%A5#order

看来得引用 querystring 才能让跳转参数化了，`const {escape} = require('querystring');`。然后链接改为：
```JavaScript
	await page.goto(`https://www.lagou.com/jobs/list_${escape('web前端')}?px=new&city=${escape('天津')}#order`);
```

第三步肯定是自动投递。我们可以到处看一看，心中有个底，决定好了要投哪几家再行动。但是那样的程序还不好一下写出，当下简单粗暴的方法是：

获取职位列表的第1页的15个职位，对职位进行一定过滤，选择剩下的职位的第1个进行投递。投递完之后拉钩会自动过滤掉你投递过的，如此反复即可。

所以：
```JavaScript
  const jobs = await page.$$eval('#s_position_list > ul > li', positionList =>
		positionList.map(function mapPosition(position) {
			const dataset = position.dataset;
			const [salary1, salary2] = dataset.salary.split('-');

			return {
				title: dataset.positionname.toLowerCase(),
				company: dataset.company.toLowerCase(),
				salaryLo: parseInt(salary1),
				salaryHi: parseInt(salary2),
				id: parseInt(dataset.positionid)
			};
		})
	);
```

page.$ 是在页面执行 document.querySelector， page.$$ 是在页面执行 document.querySelectorAll，这2个 api 还对应一个 eval 就是可以有一个回调来过滤数据啦。换句话说，page.$$eval 就是执行 document.querySelectorAll，并对执行结果进行处理。

拉钩的前端用的 jQuery 时代把数据写在 DOM 的 dataset 属性上的套路，所以获取 DOM 列表之后，直接拿出对应数据：

- positionname：工作名称。投前端需要过滤 Java web。
- company：公司名。可以用来过滤不友好和正在谈的目标。
- salary：薪水。这个数据需要稍微处理一下，方便之后过滤。
- positionid：这个是投简历页面的链接的一部分。

因此：
```JavaScript
function getJobLink(jobs) {
	const goodJobs = jobs.filter(function(job) {
		if (job.title.indexOf('java') > -1) {
			return false;
		}
		// 其它过滤条件

		return true;
	});

	if (goodJobs.length > 0) {
		const job = goodJobs[0];

		return `https://www.lagou.com/jobs/${job.id}.html`;
	}

	return null;
}
```
这里你可以有自己的薪水，公司黑名单等过滤条件。我们过滤完之后，拿剩下的第一工作，拼成投递页面的链接。

```JavaScript
	const jobLink = getJobLink(jobs);
	//console.log(jobLink);

	await page.goto(jobLink);
	await page.click('.fr.btn_apply');
```
获取一个可以投递的链接，跳转到该链接上，并且点击投递。。。

这时会有至少两种情况，一种是拉钩ok了，你可以点击“我知道了”。另一种是拉钩说我写的经验年限不够，是否确认。我是要投现代前端和Node的，就连创始人也就8年经验，所以我当然要忽略那些要5-10年经验的智障要求。

```JavaScript
	await page.click('#delayConfirmDeliver').catch(() => {});
	await page.click('#knowed').catch(() => {});
	await page.waitForNavigation();
```

这里的意思是，点击“确认投递”，如果没有该按钮，不要挂掉。点击“我知道了”，如果没有，不要挂掉。最后等待页面刷新。

此时已经可以自动投递了，只需要润色一下，让它可以不断自动投递到拉钩的投递上限即可。