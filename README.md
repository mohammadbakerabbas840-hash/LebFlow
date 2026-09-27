# LebFlow

LebFlow helps people prepare Lebanese administrative requests in Arabic, English and French. It combines a navy-and-white React/TypeScript interface, a Laravel API, private personal cases and a source-backed RAG assistant.

**Independent preparation platform:** LebFlow does not issue documents, certify identity, or book official government appointments. Appointment slots are demonstrations; case progress is self-reported. This is a locally tested release candidate, not a deployed public service. See [verification results](docs/VERIFICATION.md), [security and deployment requirements](SECURITY.md), and the [portfolio draft](docs/SHARING.md).

## What is implemented

- Eleven multilingual guides: passports, Lebanese IDs, individual civil-status extracts, police records, driving licences, university authentication, municipality procedures, professional documents, birth registration, family civil-status extracts and marriage certificate copies. Coverage varies; partial guides and uncertain fees are labelled.
- Requirements before request creation, source links and review dates, passport/ID/civil-status personalization, readiness checklists and six tracking stages.
- Parent/dependent profiles, separate applications for each applicant, case history, archives and repeat requests. Family identity fields are encrypted in the database.
- Preferred dates, simulated appointment selection/rescheduling/cancellation, printable checklists and tentative calendar exports. The sourced office directory currently contains one DGCS information office; it is not a complete branch finder.
- Registration with Arabic and English names, birth date, email, password and consent. **ID number, ID image and individual civil-status extract are optional.** Parents can start a child's first-document request without those attachments.
- Account settings, private upload replacement/deletion, encrypted document storage, scan quarantine and administrator review. OCR checks consistency and never certifies authenticity.
- Password recovery, signed email-verification links, optional authenticator MFA with single-use recovery codes, active-session revocation and opt-in email reminder jobs. Administrators must use MFA. Delivery still requires an outbound email provider.
- Editorial drafts in all three languages, a second administrator's approval, version history, case-change notifications and queued public-knowledge reindexing. Published editorial versions survive catalogue reseeding.
- Qdrant retrieval with current-content checks, cited answers, bounded follow-up context, optional official-source research and answer reporting for administrator review.

## Run through Laravel

The selected backend is **`LebFlow/`** inside this workspace. The separate `my-laravel-app/` is unused and excluded from publication.

```sh
npm install
cd LebFlow
composer install
# Fresh checkout only: copy .env.example to .env, then generate the key once.
php artisan key:generate
php artisan migrate
php artisan db:seed
cd ..
npm run build:laravel
npm run backend:dev
```

Open **http://localhost:8000** or **http://127.0.0.1:8000**. Use one hostname consistently for cookie authentication. Rebuild after frontend changes. On Windows PowerShell, use `npm.cmd` if script execution is restricted.

Do not regenerate an existing application's encryption key: existing encrypted data depends on it. SQLite is the development default. No sample account or administrator is created by seeding.

For connected frontend hot reload, run `npm run dev:api` in another terminal; it serves port 5176 and proxies Laravel. `npm run dev` runs the standalone frontend demonstration: demo profiles/files stay in memory and anonymous cases stay in localStorage. Connected mode uses Laravel and account-scoped storage.

If Vite's bundled config loader is blocked by workspace filesystem restrictions, Node 24 can build using:

```sh
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build --mode api --configLoader native
node scripts/publish-frontend.cjs
```

The launcher permits two 5 MiB uploads. Configure equivalent PHP/server request limits under another web server; each file remains limited to 5 MiB. ID uploads accept JPEG/PNG/WebP; civil-status extracts also accept PDF. No identity file is exposed through a public storage link.

## Background services and administration

```sh
cd LebFlow
php artisan queue:work --queue=documents,default --timeout=65 --tries=2
# Separate terminal/worker:
php artisan queue:work --queue=knowledge --timeout=300 --tries=3
# Separate terminal, or production scheduler:
php artisan schedule:work
```

Use a queue retry interval longer than 300 seconds; the proposed Redis deployment uses 360. Configure an SMTP provider before expecting verification, recovery or reminder emails. The development log mailer does not deliver email. Reminders require verified email and explicit opt-in, and are scheduled at 08:00 Beirut time.

For editorial access, create two separate accounts, enrol their authenticators, then grant each explicitly on the server:

```sh
php artisan account:administrator editor@example.test
php artisan account:administrator reviewer@example.test
```

Replace these examples with the intended accounts. Administrators sign in with MFA; authors cannot approve their own revisions. `account:administrator EMAIL --revoke` removes the role. No role is granted automatically.

Source data lives in `src/data/serviceContent.ts` and `src/data/civilServices.ts`. For reviewed file-based edits, run `npm run catalog:export`, then `php artisan db:seed` in the backend. Seeding updates version-1 guides and preserves published versions above 1. Use the editor/reviewer workflow for those guides. Reindex public knowledge after changes.

The release migration is forward-only to preserve family case history. Take and test a coordinated database/file backup before upgrading; rollback requires restoring that backup.

## RAG assistant

Sign in and open **Ask LebFlow**. Up to six previous messages are supplied as untrusted follow-up context; chat stays in browser memory. Questions and that context go to the configured AI provider. Do not enter private identity information. Reporting an answer explicitly stores the reported question/answer excerpt for administrator review; this is separate from the public vector index.

Retrieval follows `question embedding → Qdrant → current SQL guide/fingerprint validation → structured answer and citations`. Selecting a service reads its current guide directly. Keyword retrieval is available during vector outages. Stale or deleted guide sections cannot supply evidence. Only public service fields are indexed; accounts, family records, cases and identity uploads are excluded.

Set `OPENAI_API_KEY` and `OPENAI_MODEL` only in backend configuration. The model must support Responses API structured outputs. Set `RAG_VECTOR_ENABLED=true` and optionally `RAG_RESEARCH_ENABLED=true`. The latter searches an allowlist of government sources and may take up to 75 seconds. Research does not automatically publish new requirements. Evidence membership and structured-output validation cannot guarantee factual accuracy; unsupported questions may be declined.

```sh
cd LebFlow
php artisan knowledge:index
php artisan knowledge:check
php artisan ai:check
# Optional live checks use paid provider requests:
php artisan ai:check --live
php artisan ai:check --research
```

Indexing and vector checks also use paid provider requests. The last confirmed live index contains 108 sections from the original eight guides. The three new guides are in SQL and available through direct/keyword retrieval; their live vector reindex remains pending. Qdrant is bound to loopback locally and must remain private in production. See [SECURITY.md](SECURITY.md) for model/collection migration and provider limitations.

## API and architecture

The API prefix is `/api/v1`. Obtain `/sanctum/csrf-cookie` before mutations. Public endpoints expose service guides, simulated appointment options and the sourced directory. Authenticated endpoints cover profiles/preferences, family members, cases/history/archives, identity uploads, security/sessions, notifications and assistant feedback. Administrator routes require MFA. Validation returns 422, owner-scoped missing resources return 404, quarantined downloads return 423, and rate limiting returns 429.

```text
React/TypeScript
  components/  shared layout, accounts, services, cases, appointments
  pages/       explore, cases, appointments, reminders, account
  features/    auth, preparation wizards, case and appointment flows
  services/    API and demo adapters
  hooks/       resource loading, mutations, cases and local demo storage
  data/        multilingual service content and preparation rules
  i18n/        shared English, Arabic and French text
          |
Laravel API — sessions, validation, ownership, editorial review
          |
SQL + encrypted private files — queues — private Qdrant
          |
AI provider / reviewed official public sources
```

Hash routes support direct links and browser history, including applicant-specific case links. Arabic uses RTL; reduced-motion preferences, keyboard controls, loading/retry/empty states and responsive layouts are included.

## Verification and launch status

```sh
npm test
npm run test:browser
npm run test:backend-browser
npm run format:check
node scripts/publication-check.cjs
cd LebFlow
php artisan test --compact
php artisan documents:check --live
php artisan release:check
```

Connected Playwright tests use an isolated SQLite database and synthetic uploads on port 8010. Provider responses are mocked in automated browser tests. Development port 8000 is left alone. Browser coverage is Chrome, including English/Arabic/French at 375, 768 and 1440 pixels; it is not universal browser certification.

Tesseract and ClamAV executables are available locally, but OCR language data and antivirus signatures are still missing. Live scanner verification therefore fails and uploads remain quarantined. Hosting/domain/HTTPS, outbound email, Docker staging, production capacity testing, backup restoration and an independent security review remain launch requirements. No GitHub push, LinkedIn post or public deployment has been performed.

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for actual test results and limitations and [docs/requirements-research.md](docs/requirements-research.md) for the earlier source review. Source review dates are per-guide and are not automatically refreshed by builds. Unknown current fees remain unknown.
