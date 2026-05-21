# Contributing to codescan.dev

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/ludo-technologies/codescan.git
cd codescan
bun install
cp .env.example .env.local
# Edit .env.local with your values
bun run dev
```

## Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run linting and tests:
   ```bash
   bun run lint
   bun run test
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
