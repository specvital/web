package domain

import (
	"encoding/base64"
	"encoding/json"
	"time"
)

type CursorData struct {
	Time time.Time `json:"t"`
	ID   string    `json:"i"`
}

func EncodeCursor(updatedAt time.Time, historyID string) (string, error) {
	data := CursorData{Time: updatedAt, ID: historyID}
	b, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func DecodeCursor(s string) (*CursorData, error) {
	b, err := base64.URLEncoding.DecodeString(s)
	if err != nil {
		return nil, ErrInvalidCursor
	}
	var data CursorData
	if err := json.Unmarshal(b, &data); err != nil {
		return nil, ErrInvalidCursor
	}
	return &data, nil
}
