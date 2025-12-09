package infra

import (
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

const (
	defaultDialTimeout  = 10 * time.Second
	defaultReadTimeout  = 5 * time.Second
	defaultWriteTimeout = 5 * time.Second
)

type RedisConfig struct {
	Addr         string
	Password     string
	DB           int
	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

func (c RedisConfig) toRedisOpt() asynq.RedisClientOpt {
	opt := asynq.RedisClientOpt{
		Addr:         c.Addr,
		Password:     c.Password,
		DB:           c.DB,
		DialTimeout:  c.DialTimeout,
		ReadTimeout:  c.ReadTimeout,
		WriteTimeout: c.WriteTimeout,
	}

	if opt.DialTimeout == 0 {
		opt.DialTimeout = defaultDialTimeout
	}
	if opt.ReadTimeout == 0 {
		opt.ReadTimeout = defaultReadTimeout
	}
	if opt.WriteTimeout == 0 {
		opt.WriteTimeout = defaultWriteTimeout
	}

	return opt
}

func NewAsynqClient(cfg RedisConfig) (*asynq.Client, error) {
	redisOpt := cfg.toRedisOpt()
	client := asynq.NewClient(redisOpt)

	inspector := asynq.NewInspector(redisOpt)
	_, err := inspector.Servers()
	inspector.Close()

	if err != nil {
		client.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return client, nil
}
