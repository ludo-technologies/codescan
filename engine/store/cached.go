package store

import (
	"context"
	"sync"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// CachedStore wraps a scan.ResultStore and caches terminal-state results in memory.
// completed and failed are terminal states whose values never change, so no TTL is needed.
type CachedStore struct {
	store scan.ResultStore
	cache sync.Map // key: scan ID (string), value: *scan.Result
}

// NewCachedStore creates a new CachedStore wrapping the given store.
func NewCachedStore(store scan.ResultStore) *CachedStore {
	return &CachedStore{store: store}
}

// FindByID returns a cached result for terminal states, falling through to the DB otherwise.
func (c *CachedStore) FindByID(ctx context.Context, id string) (*scan.Result, error) {
	if v, ok := c.cache.Load(id); ok {
		return v.(*scan.Result), nil
	}

	result, err := c.store.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if result.Status == scan.StatusCompleted || result.Status == scan.StatusFailed {
		c.cache.Store(id, result)
	}

	return result, nil
}

// Create delegates to the underlying store.
func (c *CachedStore) Create(ctx context.Context, req scan.Request) (string, error) {
	return c.store.Create(ctx, req)
}

// FindByRepo delegates to the underlying store.
func (c *CachedStore) FindByRepo(ctx context.Context, owner, repo string, requesterUserID int64) (*scan.Result, error) {
	return c.store.FindByRepo(ctx, owner, repo, requesterUserID)
}

// FindLatestPublicByRepo delegates to the underlying store.
func (c *CachedStore) FindLatestPublicByRepo(ctx context.Context, owner, repo string) (*scan.Result, error) {
	return c.store.FindLatestPublicByRepo(ctx, owner, repo)
}

// UpdateRepositoryInfo delegates to the underlying store.
func (c *CachedStore) UpdateRepositoryInfo(ctx context.Context, id, language string, isPrivate bool, requesterUserID int64) error {
	return c.store.UpdateRepositoryInfo(ctx, id, language, isPrivate, requesterUserID)
}

// UpdateStatus delegates to the underlying store.
func (c *CachedStore) UpdateStatus(ctx context.Context, id, status, errorMsg string) error {
	return c.store.UpdateStatus(ctx, id, status, errorMsg)
}

// UpdateResult delegates to the underlying store and warms the cache with the
// terminal result so the next status poll is served from memory.
func (c *CachedStore) UpdateResult(ctx context.Context, id string, result *scan.Result) error {
	if err := c.store.UpdateResult(ctx, id, result); err != nil {
		return err
	}

	stored, err := c.store.FindByID(ctx, id)
	if err == nil && stored != nil {
		c.cache.Store(id, stored)
	}

	return nil
}
