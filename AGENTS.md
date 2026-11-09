# BunkBuddy contribution instructions

- Read the full BunkBuddy v2 build spec before writing code. Treat it as the source of truth and call out any disagreement in the PR description.
- Work one milestone at a time, with one small PR per task. CI must pass before merge.
- For each `TODO(owner)`, use a clearly named configuration placeholder and list it in the PR.
- Keep secrets, credentials, real HARs and raw portal HTML out of Git. Keep passwords, tokens, cookies and sync request bodies out of logs.
- Never attempt to solve or bypass CAPTCHA or OTP.
- Keep all business formulas in fully tested, pure TypeScript in `packages/core`.
- Prefer established libraries. Document changes to the specified stack in `docs/adr/`.
- Before merging, pass lint, typecheck and tests, satisfy the milestone acceptance criteria, update the changelog, and document rollback in the PR description.
