package github

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGateway_TokenOverrideTakesPrecedence(t *testing.T) {
	var gotAuth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"language": "Go"})
	}))
	defer server.Close()

	gateway := New(WithToken("configured-token"))
	gateway.httpClient = server.Client()
	gateway.baseURL = server.URL

	language, isPrivate, err := gateway.GetRepositoryInfo(context.Background(), "owner", "repo", " request-token ")
	if err != nil {
		t.Fatalf("GetRepositoryInfo() error = %v", err)
	}
	if language != "Go" {
		t.Fatalf("language = %q, want Go", language)
	}
	if isPrivate {
		t.Fatalf("isPrivate = true, want false")
	}
	if gotAuth != "Bearer request-token" {
		t.Fatalf("Authorization = %q, want request token", gotAuth)
	}
}

func TestGateway_ConfiguredTokenUsedWhenNoOverride(t *testing.T) {
	var gotAuth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"language": "Go"})
	}))
	defer server.Close()

	gateway := New(WithToken(" configured-token "))
	gateway.httpClient = server.Client()
	gateway.baseURL = server.URL

	if _, _, err := gateway.GetRepositoryInfo(context.Background(), "owner", "repo", ""); err != nil {
		t.Fatalf("GetRepositoryInfo() error = %v", err)
	}
	if gotAuth != "Bearer configured-token" {
		t.Fatalf("Authorization = %q, want configured token", gotAuth)
	}
}

func TestGateway_AuthAndForbiddenErrors(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		headers    map[string]string
		wantErr    string
	}{
		{
			name:       "unauthorized token",
			statusCode: http.StatusUnauthorized,
			wantErr:    "authentication failed",
		},
		{
			name:       "forbidden token without rate limit",
			statusCode: http.StatusForbidden,
			wantErr:    "token lacks access",
		},
		{
			name:       "rate limited",
			statusCode: http.StatusForbidden,
			headers:    map[string]string{"X-RateLimit-Remaining": "0"},
			wantErr:    "rate limit exceeded",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				for k, v := range tt.headers {
					w.Header().Set(k, v)
				}
				w.WriteHeader(tt.statusCode)
			}))
			defer server.Close()

			gateway := New()
			gateway.httpClient = server.Client()
			gateway.baseURL = server.URL

			_, _, err := gateway.GetRepositoryInfo(context.Background(), "owner", "repo", "token")
			if err == nil {
				t.Fatal("GetRepositoryInfo() error = nil, want error")
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Fatalf("error = %q, want containing %q", err.Error(), tt.wantErr)
			}
		})
	}
}

func TestValidateRef_RejectsTraversalAndNull(t *testing.T) {
	for _, ref := range []string{"../etc", "a..b", "main\x00"} {
		if err := validateRef(ref); err == nil {
			t.Errorf("validateRef(%q) = nil, want error", ref)
		}
	}
	for _, ref := range []string{"", "main", "v1.2.3", "feature/x"} {
		if err := validateRef(ref); err != nil {
			t.Errorf("validateRef(%q) = %v, want nil", ref, err)
		}
	}
}
