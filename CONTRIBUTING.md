# Contributing to codescan.dev

Thanks for your interest in contributing! Here's how to get started.

## Repository layout

This is a monorepo with two parts:

- **Web frontend** (repository root) — Next.js. Renders the report card, badges, and talks to the scan API.
- **Scan engine** ([`engine/`](engine)) — a Go module that runs Semgrep/Gitleaks/Trivy and serves `/api/scan`.

## Development Setup

The fastest way to run the full product (frontend + engine + Postgres) is Docker:

```bash
git clone https://github.com/ludo-technologies/codescan.git
cd codescan
BACKEND_API_KEY=dev-secret docker compose up --build
# open http://localhost:3000
```

### Frontend only

```bash
bun install
cp .env.example .env.local
# Set API_URL to a running engine and BACKEND_API_KEY to its key.
bun run dev
```

The frontend renders the UI on its own, but running an actual scan requires a reachable engine (`API_URL` + `BACKEND_API_KEY`). Bring one up with `docker compose up db engine`, or run the engine directly (below).

### Engine (Go)

```bash
cd engine
go build ./... && go test ./...
# Run standalone (needs Postgres + the scanner binaries on PATH):
DATABASE_URL=... BACKEND_API_KEY=dev-secret go run ./cmd/server
```

Semgrep, Gitleaks, and Trivy must be installed locally to run real scans; the `engine/Dockerfile` shows the exact versions.

## Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run linting and tests:
   ```bash
   # Frontend
   bun run lint
   bun run test
   # Engine (if you touched engine/)
   cd engine && go vet ./... && go test ./...
   ```
5. Commit your changes and push to your fork
6. Open a Pull Request against `main`

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Follow the existing code style (enforced by [Biome](https://biomejs.dev/))
- Add tests for new functionality
- Update documentation if needed

## Reporting Issues

Please use [GitHub Issues](https://github.com/ludo-technologies/codescan/issues) to report bugs or suggest features. Include steps to reproduce for bug reports.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
