# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o codescan-engine ./cmd/server

# Runtime stage
FROM python:3.12-slim

# Scanner versions - bump these to bust the Docker layer cache.
ARG SEMGREP_VERSION=1.95.0
ARG GITLEAKS_VERSION=8.21.2
ARG TRIVY_VERSION=0.70.0

# System packages: curl for healthcheck + downloads, ca-certs for TLS,
# tar for extracting release tarballs.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl ca-certificates tar \
    && rm -rf /var/lib/apt/lists/*

# Semgrep (SAST). setuptools is required because Semgrep's opentelemetry deps
# still import pkg_resources, which is no longer bundled with Python 3.12.
RUN pip install --no-cache-dir \
        "setuptools<81" \
        "semgrep==${SEMGREP_VERSION}"

# Gitleaks (secret detection) release binary.
RUN curl -sSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
    | tar -xz -C /usr/local/bin gitleaks \
    && chmod +x /usr/local/bin/gitleaks \
    && gitleaks version

# Trivy (dependency vulnerabilities) release binary.
RUN curl -sSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" \
    | tar -xz -C /usr/local/bin trivy \
    && chmod +x /usr/local/bin/trivy \
    && trivy --version

COPY --from=builder /app/codescan-engine /usr/local/bin/codescan-engine

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["codescan-engine"]
