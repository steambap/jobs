智联招聘的界面很乱，尤其是最近由乱入了些现代互联网风格的页面，让人感觉很糟糕，我也不常用。

智联上骗子公司和培训公司似乎比较多，所以只做自动更新简历，不要投递

智联是一个神奇的网站，有的地方登录要验证码，有的地方又不需要，页面加载也比别人慢一些。。。

代码上的话，就只有一点比较神奇，就是如果登录后的弹窗不关掉，页面上的 a 标签居然不可点。
```JavaScript
	await page.click('.Delivery_success_popdiv_title span.fr').catch(() => {});
	await page.click('.amendBtn');
	await page.waitForNavigation();
```
所以这里就点击那个 x，不管成不成功，继续点击修改简历，等待跳转。之前的登录和之后的点刷新的代码详见 index.js 文件