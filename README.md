# codescan.dev

Frontend for [codescan.dev](https://codescan.dev) — a tool that scans public GitHub repositories and generates a letter grade based on code quality metrics.


## Demo

https://github.com/user-attachments/assets/db41df8e-881e-4303-9634-d3aba7c853e1

## Features

- Scan any public GitHub repository by URL
- Letter-grade security result
- Detailed breakdown: complexity, dead code, duplication, coupling, dependencies, architecture, security
- Shareable result cards with OG image generation
- Share to X / download card / copy link

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [@vercel/og](https://vercel.com/docs/functions/og-image-generation) for OG image generation
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

```bash
bun install
cp .env.example .env.local
# Edit .env.local with your values
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable   | Description                          | Example                     |
|------------|--------------------------------------|-----------------------------|
| `API_URL`  | Backend API endpoint for scan requests | `https://api.codescan.dev` |
| `SITE_URL` | Public URL of the frontend (for OG images) | `https://codescan.dev`  |

## License

[MIT](LICENSE)
