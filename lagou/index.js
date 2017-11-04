require('dotenv').config();

const {escape} = require('querystring');
const puppeteer = require('puppeteer');

const main = async () => {
	const browser = await puppeteer.launch({
		headless: false,
		slowMo: 200,
		executablePath: "C:\\Users\\weili\\AppData\\Local\\Google\\Chrome SxS\\Application\\chrome.exe"
	});
	const page = await browser.newPage();
	await page.goto('https://passport.lagou.com/login/login.html');
	// 用户名
	await page.type('form.active > div:nth-child(1) > input:nth-child(1)', process.env.lagou_name);
	// 密码
	await page.type('form.active > div:nth-child(2) > input:nth-child(1)', process.env.lagou_pass);
	// 登录按钮
	await page.click('form.active > div:nth-child(5) > input:nth-child(1)');
	await page.waitForNavigation();
	// 直接跳转
	await page.goto(`https://www.lagou.com/jobs/list_${escape('web前端')}?px=new&city=${escape('天津')}#order`);

	const jobs = await page.$$eval('#s_position_list > ul > li', positionList => positionList.map(mapPosition));
	const jobSelector = getJobSelector(jobs);

	await page.click(jobSelector);
	await page.waitForNavigation();

	const title = await page.title();
	console.log(title);

	await browser.close();
};

/** @param {HTMLElement} position */
function mapPosition(position) {
	const dataset = position.dataset;
	const [salary1, salary2] = dataset.salary.split('-');

	return {
		title: dataset.positionname.toLowerCase(),
		company: dataset.company.toLowerCase(),
		salaryLo: parseInt(salary1),
		salaryHi: parseInt(salary2),
		index: parseInt(dataset.index)
	};
}

const blackList = ['大金科技'];
function getJobSelector(jobs) {
	const goodJobs = jobs.filter(function (job) {
		if (job.title.indexOf('java') > -1) {
			return false;
		}

		if (blackList.some(name => job.company.indexOf(name) > -1)) {
			return false;
		}

		if (job.salaryLo < 6) {
			return false;
		}

		if (job.salaryHi < 9) {
			return false;
		}

		return true;
	});

	if (goodJobs.length > 0) {
		const job = goodJobs[0];

		return `#s_position_list > ul > li:nth-child(${job.index + 1})`;
	}

	return null;
}

main().catch(console.error);
