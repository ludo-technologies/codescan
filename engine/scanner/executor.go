// Package scanner runs the external security scanners (Semgrep, Gitleaks, Trivy)
// against a local directory and adapts their output into the scan domain types.
package scanner

import (
	"context"
	"os/exec"
	"path/filepath"
	"strings"
)

// CommandExecutor abstracts process execution so runners can be tested without
// invoking real binaries.
type CommandExecutor interface {
	CommandContext(ctx context.Context, name string, arg ...string) *exec.Cmd
}

// realCommandExecutor implements CommandExecutor using os/exec.
type realCommandExecutor struct{}

func (r *realCommandExecutor) CommandContext(ctx context.Context, name string, arg ...string) *exec.Cmd {
	return exec.CommandContext(ctx, name, arg...)
}

// stripTmpPrefix removes the tmpDir prefix from a path, returning a relative path.
// Falls back to the original path if it is not under tmpDir.
func stripTmpPrefix(path, tmpDir string) string {
	if tmpDir == "" {
		return path
	}
	rel, err := filepath.Rel(tmpDir, path)
	if err != nil {
		return path
	}
	if strings.HasPrefix(rel, "..") {
		return path
	}
	return rel
}

// truncate returns at most the first 500 chars of s, for safe inclusion in error messages.
func truncate(s string) string {
	const maxLen = 500
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
