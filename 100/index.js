require('dotenv').config();

const puppeteer = require('puppeteer');

const main = async () => {
	const browser = await puppeteer.launch({
		headless: false,
		slowMo: 200,
		executablePath:
			'C:\\Users\\weili\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe'
	});
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

	const jobLink = await getJobLink();
	if (jobLink == null) {
		return await browser.close();
	}
	await page.goto(jobLink);
	await page.click('.apply-btn');

	await page.click('.send-application').catch(() => {});

	const title = await page.title();
	console.log(title);
	
	await browser.close();
};

main().catch(console.error);
