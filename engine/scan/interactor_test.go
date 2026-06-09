package scan

import (
	"context"
	"errors"
	"io"
	"testing"
)

type fakeGitHub struct {
	language    string
	isPrivate   bool
	infoErr     error
	downloadErr error
}

func (g *fakeGitHub) DownloadTarball(context.Context, string, string, string, string) (io.ReadCloser, error) {
	return nil, g.downloadErr
}

func (g *fakeGitHub) GetRepositoryInfo(context.Context, string, string, string) (string, bool, error) {
	return g.language, g.isPrivate, g.infoErr
}

type recordedRepositoryInfo struct {
	language        string
	isPrivate       bool
	requesterUserID int64
}

type recordingStore struct {
	findByRepoCalls int
	createReq       Request
	updateStatus    bool
	operations      []string
	repositoryInfos []recordedRepositoryInfo
}

func (s *recordingStore) Create(_ context.Context, req Request) (string, error) {
	s.createReq = req
	return "scan-1", nil
}

func (s *recordingStore) FindByID(_ context.Context, _ string) (*Result, error) {
	return nil, errors.New("not implemented")
}

func (s *recordingStore) FindByRepo(_ context.Context, _, _ string, _ int64) (*Result, error) {
	s.findByRepoCalls++
	return nil, errors.New("not found")
}

func (s *recordingStore) FindLatestPublicByRepo(_ context.Context, _, _ string) (*Result, error) {
	return nil, errors.New("not implemented")
}

func (s *recordingStore) UpdateRepositoryInfo(_ context.Context, _ string, language string, isPrivate bool, requesterUserID int64) error {
	s.operations = append(s.operations, "repository_info")
	s.repositoryInfos = append(s.repositoryInfos, recordedRepositoryInfo{
		language:        language,
		isPrivate:       isPrivate,
		requesterUserID: requesterUserID,
	})
	return nil
}

func (s *recordingStore) UpdateStatus(_ context.Context, _ string, status, _ string) error {
	s.updateStatus = true
	s.operations = append(s.operations, "status:"+status)
	return nil
}

func (s *recordingStore) UpdateResult(context.Context, string, *Result) error {
	s.operations = append(s.operations, "result")
	return nil
}

func operationIndex(operations []string, want string) int {
	for idx, got := range operations {
		if got == want {
			return idx
		}
	}
	return -1
}

func TestRequestScan_WithGitHubTokenSkipsRepoCache(t *testing.T) {
	store := &recordingStore{}
	pending := make(chan struct{}, 1)
	pending <- struct{}{}
	i := &Interactor{
		scanStore: store,
		pending:   pending,
	}

	_, _, err := i.RequestScan(context.Background(), Request{
		Owner:       "owner",
		Repo:        "repo",
		GitHubToken: "  ghp_test  ",
	})
	if !errors.Is(err, ErrQueueFull) {
		t.Fatalf("RequestScan() error = %v, want ErrQueueFull", err)
	}
	if store.findByRepoCalls != 0 {
		t.Fatalf("FindByRepo calls = %d, want 0 for token-authenticated scan", store.findByRepoCalls)
	}
	if store.createReq.GitHubToken != "ghp_test" {
		t.Fatalf("Create GitHubToken = %q, want trimmed token", store.createReq.GitHubToken)
	}
	if !store.updateStatus {
		t.Fatal("UpdateStatus should be called when queue is full")
	}
}

func TestRequestScan_WithoutGitHubTokenUsesRepoCache(t *testing.T) {
	store := &recordingStore{}
	pending := make(chan struct{}, 1)
	pending <- struct{}{}
	i := &Interactor{
		scanStore: store,
		pending:   pending,
	}

	_, _, err := i.RequestScan(context.Background(), Request{
		Owner: "owner",
		Repo:  "repo",
	})
	if !errors.Is(err, ErrQueueFull) {
		t.Fatalf("RequestScan() error = %v, want ErrQueueFull", err)
	}
	if store.findByRepoCalls != 1 {
		t.Fatalf("FindByRepo calls = %d, want 1 for unauthenticated scan", store.findByRepoCalls)
	}
}

func TestRunScanPersistsPrivateMetadataBeforeDownloadFailure(t *testing.T) {
	store := &recordingStore{}
	gh := &fakeGitHub{
		language:    LanguagePython,
		isPrivate:   true,
		downloadErr: errors.New("download failed"),
	}
	interactor := NewInteractor(gh, nil, nil, nil, store)
	interactor.pending <- struct{}{}

	interactor.runScan("scan-1", Request{
		Owner:           "owner",
		Repo:            "repo",
		RequesterUserID: 42,
	})

	if len(store.repositoryInfos) != 1 {
		t.Fatalf("UpdateRepositoryInfo calls = %d, want 1", len(store.repositoryInfos))
	}
	got := store.repositoryInfos[0]
	if got.language != LanguagePython || !got.isPrivate || got.requesterUserID != 42 {
		t.Fatalf("UpdateRepositoryInfo args = %+v", got)
	}

	metadataIdx := operationIndex(store.operations, "repository_info")
	failedIdx := operationIndex(store.operations, "status:"+StatusFailed)
	if metadataIdx == -1 || failedIdx == -1 {
		t.Fatalf("operations = %v, want repository_info and failed status", store.operations)
	}
	if metadataIdx > failedIdx {
		t.Fatalf("repository metadata persisted after failed status: operations = %v", store.operations)
	}
}

func TestCalculateTotalScore_AllNil(t *testing.T) {
	got := calculateTotalScore(nil, nil, nil)
	if got != BaseScore {
		t.Fatalf("nil findings should yield %d, got %d", BaseScore, got)
	}
}

func TestCalculateTotalScore_PerfectScore(t *testing.T) {
	got := calculateTotalScore(
		&SastFindings{},
		&SecretsFindings{},
		&DepsFindings{},
	)
	if got != BaseScore {
		t.Fatalf("empty findings should yield %d, got %d", BaseScore, got)
	}
}

func TestCalculateTotalScore_SastInfoNoPenalty(t *testing.T) {
	got := calculateTotalScore(
		&SastFindings{InfoCount: 100},
		nil, nil,
	)
	if got != BaseScore {
		t.Fatalf("INFO findings must not penalize; got %d", got)
	}
}

func TestCalculateTotalScore_SastErrorAndWarning(t *testing.T) {
	got := calculateTotalScore(
		&SastFindings{ErrorCount: 3, WarningCount: 5},
		nil, nil,
	)
	want := BaseScore - (3*PenaltySastError + 5*PenaltySastWarning)
	if got != want {
		t.Fatalf("expected %d, got %d", want, got)
	}
}

func TestCalculateTotalScore_SecretsCritical(t *testing.T) {
	got := calculateTotalScore(
		nil,
		&SecretsFindings{CriticalCount: 2},
		nil,
	)
	want := BaseScore - 2*PenaltySecretCritical
	if got != want {
		t.Fatalf("expected %d, got %d", want, got)
	}
}

func TestCalculateTotalScore_DepsMixedSeverity(t *testing.T) {
	got := calculateTotalScore(
		nil, nil,
		&DepsFindings{
			CriticalCount: 1,
			HighCount:     2,
			MediumCount:   3,
			LowCount:      4,
		},
	)
	want := BaseScore -
		(1*PenaltyDepCritical +
			2*PenaltyDepHigh +
			3*PenaltyDepMedium +
			4*PenaltyDepLow)
	if got != want {
		t.Fatalf("expected %d, got %d", want, got)
	}
}

func TestCalculateTotalScore_FloorAtZero(t *testing.T) {
	// Massive penalty must clamp to 0, not go negative.
	got := calculateTotalScore(
		nil,
		&SecretsFindings{CriticalCount: 100},
		nil,
	)
	if got != MinScore {
		t.Fatalf("score must clamp at %d, got %d", MinScore, got)
	}
}

func TestCalculateTotalScore_CombinedAcrossCategories(t *testing.T) {
	got := calculateTotalScore(
		&SastFindings{ErrorCount: 1, WarningCount: 1, InfoCount: 99},
		&SecretsFindings{CriticalCount: 1},
		&DepsFindings{HighCount: 1, MediumCount: 2, LowCount: 0},
	)
	want := BaseScore -
		(PenaltySastError +
			PenaltySastWarning +
			PenaltySecretCritical +
			PenaltyDepHigh +
			2*PenaltyDepMedium)
	if got != want {
		t.Fatalf("expected %d, got %d", want, got)
	}
}
