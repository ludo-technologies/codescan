package store

import (
	"database/sql"
	"fmt"
)

// Migrate creates the scan_results table and its indexes. It is idempotent: safe
// to run on a fresh database and a no-op on one that already has the table.
func Migrate(db *sql.DB) error {
	const schema = `
	CREATE TABLE IF NOT EXISTS scan_results (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		owner TEXT NOT NULL,
		repo_name TEXT NOT NULL,
		ref TEXT DEFAULT '',
		commit_sha TEXT DEFAULT '',
		language TEXT DEFAULT '',
		token_authenticated BOOLEAN NOT NULL DEFAULT false,
		status TEXT NOT NULL DEFAULT 'pending',
		error_message TEXT DEFAULT '',
		total_score INT DEFAULT 0,
		sast_findings JSONB,
		secrets_findings JSONB,
		deps_findings JSONB,
		scanner_versions JSONB,
		is_private BOOLEAN NOT NULL DEFAULT false,
		requester_user_id BIGINT NOT NULL DEFAULT 0,
		requested_at TIMESTAMPTZ DEFAULT NOW(),
		completed_at TIMESTAMPTZ
	);

	-- Idempotent column adds so an older scan_results table is upgraded in place
	-- without discarding rows.
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS language TEXT DEFAULT '';
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS total_score INT DEFAULT 0;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS sast_findings JSONB;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS secrets_findings JSONB;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS deps_findings JSONB;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS scanner_versions JSONB;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS token_authenticated BOOLEAN;
	UPDATE scan_results SET token_authenticated = true WHERE token_authenticated IS NULL;
	ALTER TABLE scan_results ALTER COLUMN token_authenticated SET DEFAULT false;
	ALTER TABLE scan_results ALTER COLUMN token_authenticated SET NOT NULL;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
	ALTER TABLE scan_results ADD COLUMN IF NOT EXISTS requester_user_id BIGINT NOT NULL DEFAULT 0;

	CREATE INDEX IF NOT EXISTS idx_scan_results_repo ON scan_results(owner, repo_name);
	CREATE INDEX IF NOT EXISTS idx_scan_results_status ON scan_results(owner, repo_name, status, requested_at DESC);
	`

	if _, err := db.Exec(schema); err != nil {
		return fmt.Errorf("failed to run scan migrations: %w", err)
	}
	return nil
}
