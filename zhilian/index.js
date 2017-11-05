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
	await page.goto('http://ts.zhaopin.com/jump/index_new.html?sid=121113803&site=pzzhubiaoti1');
	await page.click('.li2');
	// 用户名
	await page.type(
		'#loginname',
		process.env.zhilian_name
	);
	// 密码
	await page.type(
		'#password',
		process.env.zhilian_pass
	);
	// 登录按钮
	await page.click('#loginform > table:nth-child(5) > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(1) > label:nth-child(1) > input:nth-child(1)');
	await page.waitForNavigation();

	await page.click('.Delivery_success_popdiv_title span.fr').catch(() => {});
	await page.click('.amendBtn');
	await page.waitForNavigation();

	await page.click('.leftRowA > li:nth-child(2) > a:nth-child(2)');

	const title = await page.title();
	console.log(title);

	await browser.close();
};

main().catch(console.error);
