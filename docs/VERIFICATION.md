# Verification record — 27 September 2026

Local environment: Windows, PHP 8.5.5, Laravel 13.33.0, SQLite, Node/React/TypeScript, Chrome, Qdrant 1.19.1 on loopback. No production host/domain has been configured.

| Check | Result |
| --- | --- |
| Laravel feature/unit suite | 72 tests, 767 assertions passed |
| Frontend logic/rendering | 13 tests passed |
| Frontend browser suite | 23 tests passed; English/Arabic/French at 375, 768 and 1440 pixels |
| Connected Laravel browser suite | 10 tests passed; expanded family/session test also rerun successfully |
| Unique automated tests | 118 passed |
| TypeScript + Vite API build | Passed; published into Laravel public directory |
| Prettier + Laravel Pint | Passed; Pint used full-tree mode because no Git index exists |
| npm audit | Zero known advisories after Vite upgrade to 6.4.3 |
| Composer audit | Zero advisories or abandoned packages reported |
| Publication pattern check | Passed; no Git index yet, so staged-file review remains required |
| Live vector indexing | Earlier live check: 108 public sections across eight services; three new guides await live reindexing |
| Live vector retrieval | Passport guide retrieved through embeddings/Qdrant in English, Arabic and French |
| Live official web research | Child-ID question returned two validated official citations |

The concurrency smoke test used three distinct accounts and 24 overlapping case-create requests against an isolated local Laravel database, with a persistent database cache. All requests succeeded, each account retained one case, and cross-account reads returned 404. The latest full run's p95 was 5,257 ms; another run measured 2,337 ms. These are single-process PHP development-server measurements affected by other local work, not production throughput, scalability or DDoS-resistance claims.

Regression coverage includes optional ID number/uploads, mandatory bilingual registration names, first-ID request creation without documents, malformed upload rejection, private encrypted files, quarantine, unavailable scanners, OCR text consistency and Arabic digits, stale/deleted vector rejection, embedding shape checks, private-data exclusion, invalid/uncited research output, domain-spoofing citations, rate limits, saturation responses, login/registration quota separation, API ownership/CSRF, all existing workflow screens, keyboard date shortcuts and reduced-motion preference. Provider calls in automated tests are mocked; live provider checks are listed separately.

New coverage includes encrypted family profiles, independent child cases, repeat requests after archival, upload replacement/deletion, TOTP replay rejection, single-use recovery codes, MFA login challenges, signed/expired/tampered email links, password-reset session revocation, current-session survival after password changes, owner-scoped session revocation, verified opt-in reminder deduplication, bounded assistant history, official editorial source validation, two-person publishing and preservation of published versions during reseeding. A browser regression exposed an outdated authentication-guard password after password change; that defect was fixed and the connected account test passed.

The selected development database was backed up consistently before applying the release migration. Migration and seeding succeeded with eleven guides and the sourced DGCS directory entry. The TypeScript/API build was republished into Laravel. The native Vite config loader was used to avoid parent-directory reads restricted by this workspace. Browser tests completed successfully, but sandboxed Windows process cleanup required stopping only the isolated test PHP server on port 8010 after results printed.

Remaining verification before public launch:

- Real image OCR and antivirus execution with current signatures; PDF OCR is not implemented. Tesseract 5.5.3 and ClamAV 1.5.4 executables run locally, but language data and virus signatures are missing. `documents:check --live` fails with `Missing OCR language: ara`; no live scan success or authenticity verification is claimed. The OCR-data download did not execute because automatic approval review could not complete after hitting a usage limit.
- Docker build/staging deployment: Docker is absent locally. Validate volume permissions, HTTPS/proxy headers, secure cookies, production CSP, workers, Redis/PostgreSQL behavior and container vulnerabilities.
- Production multi-worker concurrency/load/soak/failover tests, edge DDoS controls, monitoring and backup/restore drills. Target traffic and hosting capacity are not yet specified.
- Production email transport/delivery, operational testing of the implemented human-review/replacement workflow, retention/deletion policy and independent security assessment before handling real identity documents publicly.
- Reindex the three added guides into Qdrant and rerun live retrieval; their SQL/direct/keyword paths are available now. The earlier live AI/vector checks do not establish coverage of these additions.
- Manual factual/translation review and periodic official-source checks. Known-source citations and schema validation cannot establish that every generated statement is accurate.

GitHub CI definitions are included but have not run remotely. No GitHub push, LinkedIn post or public deployment was performed.

`release:check` currently fails production environment/debug/HTTPS/cookies, PostgreSQL, Redis cache/session/queue and outbound email checks, as expected for this development machine. Encryption key, built frontend, scanner executables and configured AI/vector flags pass; those configuration checks do not prove runtime readiness.
