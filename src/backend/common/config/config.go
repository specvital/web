package config

import "fmt"

const (
	DefaultPort = "3000"
)

var DefaultOrigin = fmt.Sprintf("http://localhost:%s", DefaultPort)
