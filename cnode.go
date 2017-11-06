package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"time"
)

type CNodeTopic struct {
	Title    string    `json:"title"`
	CreateAt time.Time `json:"create_at"`
	Content  string    `json:"content"`
}

type CNodeResp struct {
	Success bool         `json:"success"`
	Data    []CNodeTopic `json:"data"`
}

type CNodeJSON struct{}

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
		if time.Since(topic.CreateAt).Nanoseconds()-time.Hour.Nanoseconds()*24*dayLimit > 0 {
			continue
		}

		ret = append(ret, &Result{title: topic.Title, email: emailRe.FindString(topic.Content), content: topic.Content})
	}

	return ret, nil
}
