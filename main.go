package main

import (
	"log"
	"sync"
	"net/http"
	"fmt"
	"regexp"
)

const dayLimit = 1
var matchers = make(map[string]Matcher)
var sites = make([]Site, 0)
var emailRe = regexp.MustCompile(`[\w._]+@\w+\.\w+`)

func init() {
	matchers["default"] = DefaultMatcher{}
	matchers["cnode/json"] = CNodeJSON{}

	sites = append(sites, Site{url: "https://cnodejs.org/api/v1/topics?tab=job", resType:"cnode/json"})
}

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

func doMatch(matcher Matcher, url string, results chan<-*Result) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("HTTP response error code: %d", resp.StatusCode)
	}
	searchResults, err := matcher.match(resp.Body)
	if err != nil {
		return err
	}

	for _, result := range searchResults {
		results<-result
	}

	return nil
}

func display(results chan*Result) {
	for result := range results {
		s := []rune(result.content)
		shorten := string(s[0:140])
		log.Printf("标题：%s\n邮箱：%s\n正文：%s\n\n", result.title, result.email, shorten)
	}
}
