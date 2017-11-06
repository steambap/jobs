很多时候，我也会在社区里面看一些机会，但是天天都是那几个动作：

打开社区a,b,c，点击招聘板块，看看最新的帖子。

为什么不让看帖自动化呢？

我只会 JS 和 Go，Go 语言更适合这个工作，况且我出差用的小米笔记本都有2核4线程，不利用一下真是太傻了。

首先是 main 函数

```Go
func main() {
	results := make(chan *Result)

	var wg sync.WaitGroup
	wg.Add(len(sites))

	for _, site := range sites {
		matcher, ok := matchers[site.resType]
		if !ok {
			matcher = matchers["default"]
		}

		go func(matcher Matcher, url string) {
			err := doMatch(matcher, url, results)
			if err != nil {
				log.Println(err)
			}
			wg.Done()
		}(matcher, site.url)
	}

	go func() {
		wg.Wait()

		close(results)
	}()

	display(results)
}
```

如果你不会 Go 的话，这里 go 关键字，chan 关键字还有 sync.WaitGroup 大约就是会帮助你创建新的线程，同步结果。

我这里有一个 results 的 channel 同步结果，wg 指示搜索帖子的线程的结束。
然后我遍历了我要访问的社区链接，并且对社区返回的结果做解析。还有一个线程负责同步所有结果，最后在命令行输出结果。

针对不同的网站要有不同的解析方案。所以这就有了 matcher 接口，定义如下：
```Go
type Matcher interface {
	match(reader io.Reader) ([]*Result, error)
}
```

matcher 接收的参数是 io.Reader，大约就相当于 JS 里面可以传任意参数吧，或者说就是最灵活的写法之一了。

对于 cnode 社区这样有提供 restful 接口的，自然是要解析 json 了。

```Go
type CNodeTopic struct {
	Title string `json:"title"`
	CreateAt time.Time `json:"create_at"`
	Content string `json:"content"`
}

type CNodeResp struct {
	Success bool `json:"success"`
	Data []CNodeTopic `json:"data"`
}

type CNodeJSON struct {}
```

cnode 的每一个话题有好几个属性，我就只挑我要的了。

然后是解析：
```Go
func (CNodeJSON) match(reader io.Reader) ([]*Result, error) {
	resp, err := ioutil.ReadAll(reader)
	if err != nil {
		return nil, err
	}
	cnodeResp := CNodeResp{}
	if err = json.Unmarshal(resp, &cnodeResp); err != nil {
		return nil, err
	}

	if !cnodeResp.Success || cnodeResp.Data == nil {
		return nil, fmt.Errorf("no response")
	}

	ret := make([]*Result, 0)

	for _, topic := range cnodeResp.Data {
		if time.Since(topic.CreateAt).Nanoseconds() - time.Hour.Nanoseconds() * 24 * dayLimit > 0 {
			continue
		}

		ret = append(ret, &Result{title: topic.Title, email: emailRe.FindString(topic.Content), content:topic.Content})
	}

	return ret, nil
}
```

各种日常解析，出错就 return。如果一切都正常，那么自然是要判断发帖时间。是新帖子就加入到结果当中，没啥可说的。

但是大多数网站可没有 cnode 那么方便了，必须解析 html。

所以我就拿我 studygolang.com 举个栗子。
首先必须引用 goquery，它是一个类似 jQuery 或者说是更像 Node 里面的 cheerio 的工具，不用这个的话就要自己递归搜索 html 节点了。。。
`go get "github.com/PuerkitoBio/goquery"`

然后是解析：
```Go
type StudyGolangHTML struct {}

func (StudyGolangHTML) match(reader io.Reader) ([]*Result, error) {
	doc, err := goquery.NewDocumentFromReader(reader)
	if err != nil {
		return nil, err
	}

	ret := make([]*Result, 0)

	doc.Find(".topic").Each(func(i int, selection *goquery.Selection) {
		abbr := selection.Find("abbr")
		timeStr, _ := abbr.Attr("title")
		t, err := time.Parse("2006-01-02 15:04:05", timeStr)
		if err != nil {
			return
		}
		if time.Since(t).Nanoseconds() - time.Hour.Nanoseconds() * 24 * dayLimit > 0 {
			return
		}

		link := selection.Find(".title a")

		ret = append(ret, &Result{title: link.Text(), email: "", content:link.AttrOr("href", "")})
	})

	return ret, nil
}
```
studygolang.com 的每一个主题的节点都可以用 .topic 选中，时间在 abbr 标签中，而标题和链接都在 .title a 下。

如果你有自己想要搜索的网站，比如 rust-china，kotlin-china 什么的，一般都还是 json 或者 html 的解析，应该不会很难适配。