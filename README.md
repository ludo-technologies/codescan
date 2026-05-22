# codescan.dev

Frontend for [codescan.dev](https://codescan.dev) — a security scanner for public GitHub repositories. It runs SAST, secret detection, and dependency CVE checks, then presents the findings with a shareable result card.

## Demo

https://github.com/user-attachments/assets/db41df8e-881e-4303-9634-d3aba7c853e1

## Features

- Scan any public GitHub repository by URL
- Static analysis (SAST) findings powered by Semgrep
- Hardcoded secret detection powered by Gitleaks
- Dependency vulnerability (CVE) detection powered by Trivy
- Severity breakdown with per-finding file, line, and rule details
- Shareable result cards with OG image generation and downloadable security reports

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [SWR](https://swr.vercel.app/) for scan status polling
- [@vercel/og](https://vercel.com/docs/functions/og-image-generation) for OG image generation
- [Biome](https://biomejs.dev/) for lint/format, [Vitest](https://vitest.dev/) for tests
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

```bash
bun install
cp .env.example .env.local
# Edit .env.local with your values
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
bun run dev      # start dev server
bun run build    # production build
bun run lint     # biome check
bun run test     # vitest run
```

## Environment Variables

| Variable   | Description                                  | Example                     |
|------------|----------------------------------------------|-----------------------------|
| `API_URL`  | Backend scanner API endpoint                 | `https://api.codescan.dev`  |
| `SITE_URL` | Public URL of the frontend (for OG images)   | `https://codescan.dev`      |

## License

[MIT](LICENSE)
