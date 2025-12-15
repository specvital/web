package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"sync"
	"time"

	"github.com/cockroachdb/errors"

	"github.com/specvital/web/src/backend/modules/auth/domain"
)

const (
	DefaultStateTTL  = 10 * time.Minute
	StateTokenLength = 32
)

var (
	ErrStateNotFound = errors.New("oauth state not found")
	ErrStateExpired  = errors.New("oauth state expired")
)

type StateStore interface {
	Create(ctx context.Context) (string, error)
	Validate(ctx context.Context, state string) error
	Close() error
}

type stateEntry struct {
	expiresAt time.Time
}

type inMemoryStateStore struct {
	mu      sync.RWMutex
	states  map[string]stateEntry
	ttl     time.Duration
	stopCh  chan struct{}
	stopped sync.Once
}

func NewStateStore() StateStore {
	store := &inMemoryStateStore{
		states: make(map[string]stateEntry),
		ttl:    DefaultStateTTL,
		stopCh: make(chan struct{}),
	}
	go store.cleanup()
	return store
}

func NewStateStoreWithTTL(ttl time.Duration) StateStore {
	store := &inMemoryStateStore{
		states: make(map[string]stateEntry),
		ttl:    ttl,
		stopCh: make(chan struct{}),
	}
	go store.cleanup()
	return store
}

func (s *inMemoryStateStore) Create(_ context.Context) (string, error) {
	token, err := generateSecureToken(StateTokenLength)
	if err != nil {
		return "", errors.Wrap(err, "generate state token")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.states[token] = stateEntry{
		expiresAt: time.Now().Add(s.ttl),
	}

	return token, nil
}

func (s *inMemoryStateStore) Validate(_ context.Context, state string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry, exists := s.states[state]
	if !exists {
		return domain.ErrInvalidState
	}

	delete(s.states, state)

	if time.Now().After(entry.expiresAt) {
		return domain.ErrInvalidState
	}

	return nil
}

func (s *inMemoryStateStore) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for state, entry := range s.states {
				if now.After(entry.expiresAt) {
					delete(s.states, state)
				}
			}
			s.mu.Unlock()
		case <-s.stopCh:
			return
		}
	}
}

func (s *inMemoryStateStore) Close() error {
	s.stopped.Do(func() {
		close(s.stopCh)
	})
	return nil
}

func generateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}
