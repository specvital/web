package config

import "fmt"

const (
	DefaultPort = "8000"
)

var DefaultOrigin = fmt.Sprintf("http://localhost:%s", DefaultPort)
