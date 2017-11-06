package main

import (
	"io"
	"github.com/PuerkitoBio/goquery"
	"time"
)

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