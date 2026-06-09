// Package store persists scan results in PostgreSQL and implements scan.ResultStore.
package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/ludo-technologies/codescan/engine/scan"
)

// PgStore implements scan.ResultStore with PostgreSQL.
type PgStore struct {
	db *sql.DB
}

// NewPgStore creates a new PostgreSQL scan result store.
func NewPgStore(db *sql.DB) *PgStore {
	return &PgStore{db: db}
}

// Create inserts a new scan result record and returns the generated UUID.
func (s *PgStore) Create(ctx context.Context, req scan.Request) (string, error) {
	var id string
	tokenAuthenticated := strings.TrimSpace(req.GitHubToken) != ""
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO scan_results (owner, repo_name, ref, language, token_authenticated, requester_user_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, req.Owner, req.Repo, req.Ref, req.Language, tokenAuthenticated, req.RequesterUserID).Scan(&id)
	return id, err
}

// FindByID retrieves a scan result by its UUID.
func (s *PgStore) FindByID(ctx context.Context, id string) (*scan.Result, error) {
	row := s.db.QueryRowContext(ctx, selectScanResultColumns+`
		WHERE id = $1
	`, id)
	return scanScanResultRow(row)
}

// FindByRepo retrieves the most recent completed scan result within cache TTL.
func (s *PgStore) FindByRepo(ctx context.Context, owner, repo string, requesterUserID int64) (*scan.Result, error) {
	cutoff := time.Now().Add(-scan.CacheTTL)
	row := s.db.QueryRowContext(ctx, selectScanResultColumns+`
		WHERE owner = $1 AND repo_name = $2
		  AND status = $3
		  AND token_authenticated = false
		  AND requested_at > $4
		  AND (is_private = false OR requester_user_id = $5)
		  AND sast_findings IS NOT NULL
		  AND secrets_findings IS NOT NULL
		  AND deps_findings IS NOT NULL
		  AND scanner_versions IS NOT NULL
		ORDER BY requested_at DESC
		LIMIT 1
	`, owner, repo, scan.StatusCompleted, cutoff, requesterUserID)
	return scanScanResultRow(row)
}

// FindLatestPublicByRepo retrieves the most recent completed public scan result,
// ignoring the cache TTL. Unlike FindByRepo it never returns private or
// token-authenticated scans, so the result is safe to expose in a public badge.
func (s *PgStore) FindLatestPublicByRepo(ctx context.Context, owner, repo string) (*scan.Result, error) {
	row := s.db.QueryRowContext(ctx, selectScanResultColumns+`
		WHERE owner = $1 AND repo_name = $2
		  AND status = $3
		  AND token_authenticated = false
		  AND is_private = false
		  AND sast_findings IS NOT NULL
		  AND secrets_findings IS NOT NULL
		  AND deps_findings IS NOT NULL
		  AND scanner_versions IS NOT NULL
		ORDER BY requested_at DESC
		LIMIT 1
	`, owner, repo, scan.StatusCompleted)
	return scanScanResultRow(row)
}

// UpdateRepositoryInfo persists repository metadata discovered before scanners run.
//
// token_authenticated is downgraded to the repo's privacy: a token used against
// a public repo grants no extra access, so the result is identical to an
// anonymous public scan and stays eligible for the public cache and README
// badge. It remains true only when the repo is actually private.
func (s *PgStore) UpdateRepositoryInfo(ctx context.Context, id, language string, isPrivate bool, requesterUserID int64) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE scan_results
		SET language = $2, is_private = $3, requester_user_id = $4,
		    token_authenticated = (token_authenticated AND $3)
		WHERE id = $1
	`, id, language, isPrivate, requesterUserID)
	return err
}

// UpdateStatus updates the status of a scan result.
func (s *PgStore) UpdateStatus(ctx context.Context, id, status, errorMsg string) error {
	var query string
	if status == scan.StatusFailed || status == scan.StatusCompleted {
		query = `UPDATE scan_results SET status = $2, error_message = $3, completed_at = NOW() WHERE id = $1`
	} else {
		query = `UPDATE scan_results SET status = $2, error_message = $3 WHERE id = $1`
	}
	_, err := s.db.ExecContext(ctx, query, id, status, errorMsg)
	return err
}

// UpdateResult updates the scan result with security findings and the total score.
func (s *PgStore) UpdateResult(ctx context.Context, id string, result *scan.Result) error {
	sastJSON, err := json.Marshal(result.SAST)
	if err != nil {
		return fmt.Errorf("marshal sast: %w", err)
	}
	secretsJSON, err := json.Marshal(result.Secrets)
	if err != nil {
		return fmt.Errorf("marshal secrets: %w", err)
	}
	depsJSON, err := json.Marshal(result.Dependencies)
	if err != nil {
		return fmt.Errorf("marshal deps: %w", err)
	}
	versionsJSON, err := json.Marshal(result.ScannerVersions)
	if err != nil {
		return fmt.Errorf("marshal versions: %w", err)
	}

	_, err = s.db.ExecContext(ctx, `
		UPDATE scan_results SET
			commit_sha = $2,
			language = $3,
			status = $4,
			total_score = $5,
			sast_findings = $6,
			secrets_findings = $7,
			deps_findings = $8,
			scanner_versions = $9,
			is_private = $10,
			requester_user_id = $11,
			completed_at = NOW()
		WHERE id = $1
	`,
		id,
		result.CommitSHA,
		result.Language,
		scan.StatusCompleted,
		result.TotalScore,
		sastJSON,
		secretsJSON,
		depsJSON,
		versionsJSON,
		result.IsPrivate,
		result.RequesterUserID,
	)
	return err
}

const selectScanResultColumns = `
	SELECT
		id, owner, repo_name, ref, commit_sha,
		COALESCE(language, ''),
		token_authenticated,
		COALESCE(is_private, false), COALESCE(requester_user_id, 0),
		status, error_message,
		total_score,
		sast_findings, secrets_findings, deps_findings, scanner_versions,
		requested_at, completed_at
	FROM scan_results
`

func scanScanResultRow(row *sql.Row) (*scan.Result, error) {
	var r scan.Result
	var ref, commitSHA, language, errorMsg sql.NullString
	var sastJSON, secretsJSON, depsJSON, versionsJSON sql.NullString
	var completedAt sql.NullTime

	err := row.Scan(
		&r.ID, &r.Owner, &r.Repo, &ref, &commitSHA,
		&language,
		&r.TokenAuthenticated,
		&r.IsPrivate, &r.RequesterUserID,
		&r.Status, &errorMsg,
		&r.TotalScore,
		&sastJSON, &secretsJSON, &depsJSON, &versionsJSON,
		&r.RequestedAt, &completedAt,
	)
	if err != nil {
		return nil, err
	}

	if ref.Valid {
		r.Ref = ref.String
	}
	if commitSHA.Valid {
		r.CommitSHA = commitSHA.String
	}
	if language.Valid {
		r.Language = language.String
	}
	if errorMsg.Valid {
		r.ErrorMessage = errorMsg.String
	}
	if completedAt.Valid {
		r.CompletedAt = &completedAt.Time
	}

	if sastJSON.Valid && sastJSON.String != "" && sastJSON.String != "null" {
		var v scan.SastFindings
		if err := json.Unmarshal([]byte(sastJSON.String), &v); err != nil {
			return nil, fmt.Errorf("unmarshal sast: %w", err)
		}
		r.SAST = &v
	}
	if secretsJSON.Valid && secretsJSON.String != "" && secretsJSON.String != "null" {
		var v scan.SecretsFindings
		if err := json.Unmarshal([]byte(secretsJSON.String), &v); err != nil {
			return nil, fmt.Errorf("unmarshal secrets: %w", err)
		}
		r.Secrets = &v
	}
	if depsJSON.Valid && depsJSON.String != "" && depsJSON.String != "null" {
		var v scan.DepsFindings
		if err := json.Unmarshal([]byte(depsJSON.String), &v); err != nil {
			return nil, fmt.Errorf("unmarshal deps: %w", err)
		}
		r.Dependencies = &v
	}
	if versionsJSON.Valid && versionsJSON.String != "" && versionsJSON.String != "null" {
		if err := json.Unmarshal([]byte(versionsJSON.String), &r.ScannerVersions); err != nil {
			return nil, fmt.Errorf("unmarshal versions: %w", err)
		}
	}

	return &r, nil
}
