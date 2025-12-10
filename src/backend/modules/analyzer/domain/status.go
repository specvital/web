package domain

type Status string

const (
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
	StatusPending   Status = "pending"
	StatusRunning   Status = "running"
)

func (s Status) IsTerminal() bool {
	return s == StatusCompleted || s == StatusFailed
}

func (s Status) IsPending() bool {
	return s == StatusPending || s == StatusRunning
}

func (s Status) String() string {
	return string(s)
}
