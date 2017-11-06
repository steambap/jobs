package main

import "io"

type Site struct {
	url string
	resType string
}

type Result struct {
	title string
	email string
	content string
}

type Matcher interface {
	match(reader io.Reader) ([]*Result, error)
}

type DefaultMatcher struct {}

func (DefaultMatcher) match(reader io.Reader) ([]*Result, error) {
	return []*Result{}, nil
}