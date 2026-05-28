<div align="center">

# codescan.dev

### Scan any GitHub repo for security issues.

Risky code, exposed keys, outdated packages — one shareable grade.

**[Start a scan](https://codescan.dev)** · [Example report](https://codescan.dev/examples) · [Methodology](https://codescan.dev/methodology)

</div>

---

## Demo

https://github.com/user-attachments/assets/db41df8e-881e-4303-9634-d3aba7c853e1

## What it checks

| Category | Description | Powered by |
|---|---|---|
| **Static Analysis (SAST)** | Finds patterns that can lead to security bugs, including unsafe input handling and other common mistakes | [Semgrep](https://semgrep.dev/) |
| **Secret Detection** | Checks whether API keys, tokens, private keys, or credentials were accidentally committed | [Gitleaks](https://gitleaks.io/) |
| **Dependency Vulnerabilities** | Looks for packages with known security problems so you can update the risky ones first | [Trivy](https://trivy.dev/) |

## How it works

1. **Paste a GitHub URL** — Drop the URL of any public repository into the scan box, or sign in with GitHub to scan your private repos.
2. **Run the checks** — codescan.dev looks for risky code, exposed keys, and packages that should be updated.
3. **Read the report card** — See a letter grade, a severity breakdown, and per-finding file, line, and rule details you can share.

No installation. No GitHub app. Public repos need no sign-up.

## Who it's for

- **Maintainers** — Get a quick security baseline before publishing a release or accepting a large pull request.
- **Developers evaluating dependencies** — Check a third-party repository for exposed credentials and risky packages before adopting it.
- **Engineering teams** — Share a letter-grade report card alongside a PR or audit instead of pasting raw tool output.

## FAQ

<details>
<summary><strong>Is codescan.dev free?</strong></summary>
<br>
Yes. Public repository scans are free and require no sign-up. Sign in with GitHub to scan private repositories — also free.
</details>

<details>
<summary><strong>Which repositories can I scan?</strong></summary>
<br>
Any public GitHub repository — just paste the repo URL (<code>https://github.com/owner/name</code>) into the scan box. Sign in with GitHub to scan private repositories you have access to.
</details>

<details>
<summary><strong>What does the letter grade mean?</strong></summary>
<br>
The grade summarizes how many issues were found and how serious they are, so you can compare repositories at a glance.
</details>

<details>
<summary><strong>Do you store my code?</strong></summary>
<br>
No. codescan.dev clones the repository to run the scanners and only persists the resulting findings needed to render the report card.
</details>

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
