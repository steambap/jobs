100offer自称是“让最好的人才遇见更好的机会”的一个招聘网站。

这个网站和别的长的不太一样，你点城市或者下一页是，它的页面会有 Ajax 请求，返回结果只有一个字段：html，然后它会把这段 html 用 jQuery 插入到 DOM 树中，真是神奇。

所以前面登陆和跳转页面自然没啥说的：
```JavaScript
const page = await browser.newPage();
	await page.goto('https://cn.100offer.com/signin');
	// 用户名
	await page.type(
		'#talent_email',
		process.env.o100_name
	);
	// 密码
	await page.type(
		'#talent_password',
		process.env.o100_pass
	);
	// 登录按钮
	await page.click('#new_talent > div:nth-child(6) > input:nth-child(1)');
	await page.waitForNavigation();
	// 直接跳转
	await page.goto('https://cn.100offer.com/job_positions');
	// 帝都
	await page.click('.locations.filters > div:nth-child(3)');
	// 不要求学历
	await page.click('.degree.filters > div:nth-child(7)');
```

现在的情况很微妙，因为100offer不能按照职位关键字来过滤，所以页面上有很多不相干的 Java 职位。

所以重点来了：
```JavaScript
async function getJobLink() {
	const jobs = await page.$$eval('.position-list > .position-item a.h3-font', links =>
		links.map(function mapLinks(link) {
			return {
				name: link.text.toLowerCase(),
				url: link.href
			};
		})
	);

	const goodJobs = jobs.filter(function (job) {
		if (job.name.indexOf('Node') > 0) {
			return true;
		}
		if (job.name.indexOf('前端') > 0) {
			return true;
		}

		return false;
	});

	if (goodJobs.length > 0) {
		return goodJobs[0].url;
	}
	// 翻页
	const nextEl = await page.$('a.next');
	if (nextEl == null) {
		return null;
	}

	await nextEl.click();

	return await getJobLink();
}
```

这个 getJobLink 是个递归函数，递归搜索职位。

首先，在页面中抓取所有职位的名称和链接。对职位名称过滤，比如我只要 Node 和 前端。

如果没有找到，这时就需要翻页了。先查有没有下一页这个元素`const nextEl = await page.$('a.next');` 如果不可以点下一页，那自然查找失败。如果有，当然是点击下一页，然后递归搜索。

之后的点击投递，忽略警告和拉钩类似，我就不再贴出来。
