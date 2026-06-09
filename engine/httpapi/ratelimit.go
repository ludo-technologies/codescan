package httpapi

import (
	"sync"
	"time"
)

const (
	scanWindowSize    = 1 * time.Minute
	scanMaxRequests   = 3
	scanCleanupPeriod = 10 * time.Minute
)

type requestWindow struct {
	count     int
	windowEnd time.Time
}

// Limiter provides in-memory rate limiting for scan requests by IP.
type Limiter struct {
	mu       sync.RWMutex
	requests map[string]*requestWindow
	stopCh   chan struct{}
}

// NewLimiter creates a new scan rate limiter.
func NewLimiter() *Limiter {
	l := &Limiter{
		requests: make(map[string]*requestWindow),
		stopCh:   make(chan struct{}),
	}
	go l.cleanup()
	return l
}

// Allow checks if the IP can make a scan request.
func (l *Limiter) Allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	window, exists := l.requests[ip]

	if !exists || now.After(window.windowEnd) {
		l.requests[ip] = &requestWindow{
			count:     1,
			windowEnd: now.Add(scanWindowSize),
		}
		return true
	}

	if window.count >= scanMaxRequests {
		return false
	}

	window.count++
	return true
}

// cleanup removes expired windows periodically.
func (l *Limiter) cleanup() {
	ticker := time.NewTicker(scanCleanupPeriod)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			l.mu.Lock()
			now := time.Now()
			for ip, window := range l.requests {
				if now.After(window.windowEnd) {
					delete(l.requests, ip)
				}
			}
			l.mu.Unlock()
		case <-l.stopCh:
			return
		}
	}
}

// Stop stops the cleanup goroutine.
func (l *Limiter) Stop() {
	close(l.stopCh)
}
