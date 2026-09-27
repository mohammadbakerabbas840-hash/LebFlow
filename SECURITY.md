# Security and deployment status

LebFlow is an independent administrative preparation application. It does not issue government documents, book official appointments, or certify identity. This repository is suitable for technical review; production launch requires the environment checks below. No test suite proves freedom from vulnerabilities or denial of service.

## CIA controls

| Property | Implemented controls | Operational requirements |
| --- | --- | --- |
| Confidentiality | Owner-scoped cases/files/family records, encrypted family identity fields, ID numbers and document blobs, HttpOnly sessions, CSRF, private/no-store API responses, uploads outside the public directory, no identity records in vector indexing or automatic assistant context | HTTPS, private backups, restricted storage permissions, protect APP_KEY, secrets manager, explicit data retention/deletion policy |
| Integrity | Server validation, one active case per account/service/applicant, transactional case updates, upload MIME/size checks, quarantine, local malware/OCR pipeline, MFA for administrators, single-use recovery codes, second-person editorial approval, version history, current-content fingerprints reject stale vectors | Verified scanner operation/signature updates, source review, human document review, independently test backup restoration |
| Availability | API/auth/AI rate limits, six concurrent AI slots and one per account, research budget limit, bounded provider timeouts, queued scanning, Qdrant outage fallback, SQLite WAL/busy timeout, proposed nginx body/connection limits | PostgreSQL + Redis for production, PHP-FPM workers, edge DDoS protection, monitoring, capacity tests, incident response |

The shared Redis cache is essential for rate limits and locks across application instances. These controls reduce abuse; an application cannot absorb a volumetric DDoS attack by itself. Never expose database, Redis, Qdrant, PHP-FPM or development-server ports publicly.

## Identity document processing

Registration requires English and Arabic names, date of birth, email, password and consent. ID number, ID photo and individual civil-status extract are optional. Parents register using their own account details; requesting a child's first documents does not require an existing identity upload.

Uploads are encrypted immediately and queued on `documents`. The worker decrypts into a private temporary directory, runs local ClamAV, then Tesseract for images, checks name/date/document type and ID number when relevant, and removes the temporary file in a `finally` block. Raw OCR text is not stored or sent to OpenAI. PDFs are malware-scanned but require review; this version does not render or OCR PDFs. OCR may misread Arabic, dates and transliterations. `consistent` never means authentic, and `identityVerified` remains false. Missing scanners leave the file quarantined, not approved. Crash recovery must remove old files from the private scan-temp directory. Encrypt the host disk because temporary plaintext exists during scanning.

Install ClamAV with current signatures and Tesseract with `ara`, `eng`, `fra` language data, then run:

```sh
cd LebFlow
php artisan documents:rescan --limit=100
php artisan documents:check --live
php artisan queue:work --queue=documents,default --timeout=65 --tries=2
```

Scanner binaries are configured with `CLAMAV_BINARY` and `TESSERACT_BINARY`; `CLAMAV_DATABASE` can select the virus-definition directory. Local Tesseract 5.5.3 and ClamAV 1.5.4 executables run, but Tesseract has no language data and ClamAV has no signatures. `documents:check --live` currently fails with `Missing OCR language: ara`. A requested OCR-data download did not execute because automatic approval review hit a usage limit; this was an approval-system failure, not a determination that the download was unsafe. Live antivirus/OCR integration remains unverified, and files stay quarantined.

Owners can replace/delete their uploads. Administrators can review documents only after malware clearance; a review cannot override quarantine or certify authenticity. Replacement creates a new encrypted file and a new scan state. Document retention/deletion procedures, reviewer access auditing and multilingual image accuracy still need operational review before public handling of real identity records. Use synthetic uploads for portfolio demos.

## Account and editorial security

Recovery responses do not reveal whether an email exists. Reset tokens and signed email-verification links expire. Password changes preserve the initiating browser's session while revoking older sessions; password recovery revokes existing sessions. MFA codes reject replay, and recovery codes are hashed, encrypted at rest and single-use. Users can revoke individual sessions. The email transport is currently local logging; outbound delivery has not been tested.

Administrators need both an explicit server-granted role and an MFA-authenticated session. Two separate administrators are needed to publish service requirements. Drafts retain prior content, enforce stable document IDs and reject stale versions; publishing increments the guide version, notifies affected cases and queues public knowledge indexing. Seeding preserves published versions above 1. No administrator is created automatically. Protect role-granting CLI access and establish reviewer procedures before launch.

## Vector retrieval and research

Qdrant stores embeddings for public English, Arabic and French guide sections, with service ID, section, locale and a SHA-256 fingerprint. Private accounts, questions and uploads are not indexed. Questions and up to six previous messages are sent to OpenAI; do not put sensitive information in them. Follow-up context is untrusted input and cannot supply system-role instructions. Chat is not persisted by the application unless the user explicitly reports an answer; reported excerpts are stored for administrator review. Retrieval reloads the current SQL guide and checks its fingerprint. Reindex after reviewed catalogue changes; stale vectors are ignored. Deleted sections may remain in Qdrant but cannot provide stale evidence. For a changed embedding model/dimension, use a new collection name, populate it, validate it, then switch configuration.

```sh
node scripts/export-service-catalog.cjs
cd LebFlow
php artisan db:seed --class=ServiceSeeder
php artisan knowledge:index
php artisan knowledge:check
php artisan ai:check --live
php artisan ai:check --research
```

`knowledge:index`, `knowledge:check`, `ai:check --live` and `--research` use paid provider requests. Configure `RAG_VECTOR_ENABLED=true` and `RAG_RESEARCH_ENABLED=true` explicitly. Research searches an allowlist of Lebanese government domains through OpenAI and returns validated clickable citation annotations. It is limited to two requests per account per minute. Research output is not automatically approved or written into the catalogue. Neither embeddings nor citations guarantee that an answer is semantically correct. Keep uncertain fees unknown, show source dates and recheck before visiting.

For local Windows development, obtain Qdrant from its [official releases](https://github.com/qdrant/qdrant/releases), extract `qdrant.exe` into ignored `.runtime/qdrant/`, then run `scripts/start-qdrant.ps1`. The runtime binds only to loopback and is not for public exposure.

## Proposed production environment — not yet deployed

`Dockerfile` and `compose.yaml` describe nginx, PHP-FPM, document/default and knowledge workers, a scheduler, PostgreSQL, Redis, private Qdrant and a ClamAV signature updater. Knowledge jobs use a 300-second timeout and the Redis queue uses a 360-second retry interval. The document worker needs sufficient memory for ClamAV signatures; the proposed limit is 3 GiB. Docker is unavailable on this workstation: these definitions still require a real build, staging deployment and operational verification. They are not proof of production readiness.

1. Choose a host/domain and memory/CPU budget. Copy `deploy/.env.example` to `deploy/.env`, generate unique APP_KEY/database/Redis/Qdrant credentials and set the existing OpenAI model/key. Never commit this file. Do not reuse a development APP_KEY for new production data or rotate a key without an encrypted-data migration/backup plan.
2. Build with `docker compose --env-file deploy/.env build`. Run migrations/seeding explicitly with `docker compose --env-file deploy/.env run --rm app php artisan migrate --force` and the corresponding `db:seed --force` command. Start with `docker compose --env-file deploy/.env up -d` and populate the vector index. The release migration is forward-only; take a coordinated backup and test restoration before upgrading.
3. Put a trusted HTTPS reverse proxy in front of loopback port 8080. It must overwrite `X-Forwarded-Proto`; configure the exact domain in APP_URL and SANCTUM_STATEFUL_DOMAINS. Secure cookies deliberately require HTTPS. Configure CSP/TLS/edge rate limits on that proxy too. Set nginx's real-IP trust to the exact proxy network and overwrite forwarded client-IP headers at that proxy; never trust client-supplied headers or all networks. Otherwise all proxied clients can share a single IP rate-limit bucket. Validate both fair limits and spoof rejection on staging. Never publish port 8080 directly to the Internet.
4. Verify scanner signatures, image OCR in all three languages, quarantine/download behavior, permissions of mounted volumes, queue retries, provider failures and production CSP. Run workers as the unprivileged account; bound their memory/CPU. Monitor failed jobs, queue age, 5xx/429 rates, latency, storage, scanner freshness and upstream costs without logging documents or questions.
5. Run capacity tests on staging with the expected user count; verify database uniqueness under multiple PHP workers, fair rate limiting, graceful saturation and recovery. The local PHP development server is single-process and cannot establish production capacity.
6. Back up PostgreSQL and encrypted document storage together; protect APP_KEY separately. Qdrant can be rebuilt from the catalogue. Test restore in an isolated environment before launch; define recovery-time/data-loss targets, retention and deletion procedures.
7. Configure SMTP and verify delivery, recovery/verification links, reminder opt-in and background jobs. Set up two intended administrator accounts with MFA for editorial review, and test the document-review process. Complete privacy/consent/retention review, dependency/container scans and an independent penetration test before a public service handling real documents.

Run `php artisan release:check` in the deployed environment. It checks configuration without printing secrets; it does not prove TLS reachability, email delivery, scanner accuracy or capacity. The local development environment correctly fails the production checks.

## Publication

Run `node scripts/publication-check.cjs` before and after staging. It checks common secret patterns and tracked private files but cannot detect all secrets. Review the staged diff manually. `.env`, databases, private uploads, logs, test artifacts and local runtimes must remain excluded. The unused `my-laravel-app` is not the backend and should not be published. Use synthetic accounts/screenshots only. Nothing has been pushed to GitHub or posted to LinkedIn automatically.

Report a suspected vulnerability privately to the project maintainer; do not attach identity records or secrets to a public issue. A maintainer contact must be added when a repository is published.

Reference guidance: [OWASP file uploads](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [Qdrant security](https://qdrant.tech/documentation/security/), [OpenAI embeddings](https://developers.openai.com/api/docs/guides/embeddings), [official-source web search](https://developers.openai.com/api/docs/guides/tools-web-search).
