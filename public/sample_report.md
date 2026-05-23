# codescan Security Report

Repository: DaisukeYoda/japan-fiscal-simulator
Scan ID: ada05a55-5029-49c9-a6c6-1c588b95ae20
Status: completed
Requested at: 2026-05-22T13:05:31Z
Completed at: 2026-05-22T13:05:45Z

## Score

- Total score: 73/100
- Security grade: B (Good)

## Summary

- SAST: 0 errors, 1 warnings, 0 info
- Secrets: 0 critical
- Dependencies: 0 critical, 6 high, 8 medium, 2 low

## Scanner Versions

- Semgrep: 1.95.0
- Gitleaks: 8.21.2
- Trivy: Version: 0.70.0

## SAST Findings

### 1. WARNING - src/japan_fiscal_simulator/output/reports.py:117

- Rule: python.jinja2.security.audit.missing-autoescape-disabled.missing-autoescape-disabled
- Message: Detected a Jinja2 environment without autoescaping. Jinja2 does not autoescape by default. This is dangerous if you are rendering to a browser because this allows for cross-site scripting (XSS) attacks. If you are in a web context, enable autoescaping by setting 'autoescape=True.' You may also consider using 'jinja2.select_autoescape()' to only enable automatic escaping for certain file extensions.

## Secret Findings

No secret findings were reported.

## Dependency Findings

### 1. HIGH - cryptography 46.0.4

- CVE: CVE-2026-26007
- Title: cryptography: cryptography Subgroup Attack Due to Missing Subgroup Validation for SECT Curves
- Fixed version: 46.0.5

### 2. MEDIUM - cryptography 46.0.4

- CVE: CVE-2026-39892
- Title: cryptography: Cryptography: Buffer overflow via non-contiguous buffer in API
- Fixed version: 46.0.7

### 3. MEDIUM - idna 3.11

- CVE: CVE-2026-45409
- Title: Internationalized Domain Names in Applications (IDNA): Specially crafted inputs to idna.encode() can bypass CVE-2024-3651 fix
- Fixed version: 3.15

### 4. HIGH - pillow 12.1.0

- CVE: CVE-2026-25990
- Title: pillow: Pillow: Out-of-bounds Write via Specially Crafted PSD Image
- Fixed version: 12.1.1

### 5. HIGH - pillow 12.1.0

- CVE: CVE-2026-40192
- Title: Pillow: Pillow: Denial of Service via decompression bomb in FITS image processing
- Fixed version: 12.2.0

### 6. HIGH - pillow 12.1.0

- CVE: CVE-2026-42311
- Title: Pillow is a Python imaging library. From version 10.3.0 to before vers ...
- Fixed version: 12.2.0

### 7. MEDIUM - pillow 12.1.0

- CVE: CVE-2026-42308
- Title: Pillow: python: Pillow: Denial of Service via integer overflow in font processing
- Fixed version: 12.2.0

### 8. MEDIUM - pillow 12.1.0

- CVE: CVE-2026-42309
- Title: Pillow: Pillow: Denial of Service via specially crafted coordinate input
- Fixed version: 12.2.0

### 9. MEDIUM - pillow 12.1.0

- CVE: CVE-2026-42310
- Title: Pillow: Pillow: Denial of Service via malicious PDF processing
- Fixed version: 12.2.0

### 10. HIGH - pyjwt 2.11.0

- CVE: CVE-2026-32597
- Title: pyjwt: PyJWT accepts unknown `crit` header extensions (RFC 7515 §4.1.11 MUST violation)
- Fixed version: 2.12.0

### 11. MEDIUM - pytest 9.0.2

- CVE: CVE-2025-71176
- Title: pytest: pytest: Denial of Service or Privilege Escalation via insecure temporary directory handling
- Fixed version: 9.0.3

### 12. MEDIUM - python-dotenv 1.2.1

- CVE: CVE-2026-28684
- Title: python-dotenv: python-dotenv: Arbitrary file overwrite via symbolic link following
- Fixed version: 1.2.2

### 13. HIGH - python-multipart 0.0.22

- CVE: CVE-2026-42561
- Title: Python-Multipart is a streaming multipart parser for Python. Prior to ...
- Fixed version: 0.0.27

### 14. MEDIUM - python-multipart 0.0.22

- CVE: CVE-2026-40347
- Title: python-multipart: Python-Multipart: Denial of Service via crafted multipart/form-data requests
- Fixed version: 0.0.26
