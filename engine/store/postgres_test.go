package store

import (
	"context"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"

	"github.com/ludo-technologies/codescan/engine/scan"
)

func TestFindByRepoRequiresNewScannerResultColumns(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	requestedAt := time.Now()
	completedAt := requestedAt.Add(time.Minute)
	rows := sqlmock.NewRows([]string{
		"id", "owner", "repo_name", "ref", "commit_sha",
		"language",
		"token_authenticated",
		"is_private", "requester_user_id",
		"status", "error_message",
		"total_score",
		"sast_findings", "secrets_findings", "deps_findings", "scanner_versions",
		"requested_at", "completed_at",
	}).AddRow(
		"scan-1", "owner", "repo", "main", "abc123",
		scan.LanguagePython,
		false,
		false, int64(0),
		scan.StatusCompleted, "",
		100,
		`{"error_count":0,"warning_count":0,"info_count":0,"findings":[]}`,
		`{"critical_count":0,"findings":[]}`,
		`{"critical_count":0,"high_count":0,"medium_count":0,"low_count":0,"findings":[]}`,
		`{"semgrep":"1.0.0","gitleaks":"1.0.0","trivy":"1.0.0"}`,
		requestedAt, completedAt,
	)

	mock.ExpectQuery(regexp.QuoteMeta(`
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
	`)).
		WithArgs("owner", "repo", scan.StatusCompleted, sqlmock.AnyArg(), int64(0)).
		WillReturnRows(rows)

	st := NewPgStore(db)
	got, err := st.FindByRepo(context.Background(), "owner", "repo", 0)
	if err != nil {
		t.Fatalf("FindByRepo() error = %v", err)
	}

	if got.ID != "scan-1" {
		t.Fatalf("FindByRepo() ID = %q, want scan-1", got.ID)
	}
	if got.TokenAuthenticated {
		t.Fatalf("FindByRepo() TokenAuthenticated = true, want false")
	}
	if got.IsPrivate {
		t.Fatalf("FindByRepo() IsPrivate = true, want false")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unfulfilled expectations: %v", err)
	}
}

func TestCreateStoresTokenAuthenticatedFlag(t *testing.T) {
	tests := []struct {
		name      string
		token     string
		wantToken bool
	}{
		{name: "without token", token: "", wantToken: false},
		{name: "with token", token: " ghp_test ", wantToken: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create sqlmock: %v", err)
			}
			defer db.Close()

			mock.ExpectQuery(regexp.QuoteMeta(`
		INSERT INTO scan_results (owner, repo_name, ref, language, token_authenticated, requester_user_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`)).
				WithArgs("owner", "repo", "main", scan.LanguagePython, tt.wantToken, int64(42)).
				WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow("scan-1"))

			st := NewPgStore(db)
			got, err := st.Create(context.Background(), scan.Request{
				Owner:           "owner",
				Repo:            "repo",
				Ref:             "main",
				Language:        scan.LanguagePython,
				GitHubToken:     tt.token,
				RequesterUserID: 42,
			})
			if err != nil {
				t.Fatalf("Create() error = %v", err)
			}
			if got != "scan-1" {
				t.Fatalf("Create() ID = %q, want scan-1", got)
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatalf("unfulfilled expectations: %v", err)
			}
		})
	}
}

func TestUpdateRepositoryInfoPersistsPrivacyAndRequester(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	mock.ExpectExec(regexp.QuoteMeta(`
		UPDATE scan_results
		SET language = $2, is_private = $3, requester_user_id = $4
		WHERE id = $1
	`)).
		WithArgs("scan-1", scan.LanguagePython, true, int64(42)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	st := NewPgStore(db)
	if err := st.UpdateRepositoryInfo(context.Background(), "scan-1", scan.LanguagePython, true, 42); err != nil {
		t.Fatalf("UpdateRepositoryInfo() error = %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unfulfilled expectations: %v", err)
	}
}
