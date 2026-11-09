# BunkBuddy runbook

## Local verification

Use Node 24 and pnpm 11.25.0. From the repository root, run:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test --coverage
pnpm build
node scripts/check-js-budget.mjs
pnpm exec playwright install chromium
pnpm test:e2e
```

Run `pnpm dev` for the Vite preview. The existing root HTML and assets remain available to GitHub Pages.

## GitHub and preview setup

1. Enable squash merges and protect `main`. Require PRs, resolved conversations, linear history, and the `verify`, `e2e`, `lighthouse`, and `secrets-scan` checks. Block force pushes and deletions.
2. Enable secret scanning and push protection. For an organization-owned repo, configure the Gitleaks Action license if required.
3. Import the repo into Vercel using the repository root, Node 24, and `main` as the production branch. Use the checked-in build settings and enable Git integration for per-PR previews. Confirm the preview link appears on the M0 PR and serves the v2 placeholder.
4. Keep gateway secrets out of Vercel's web environment. M0 uses no credentials or backend services.

TODO(owner) Confirm the Vercel project and whether the existing GitHub Pages site should be kept or retired. The Supabase and gateway projects, domain, university regulations, and portal details are later inputs.

## Rollback ladder

| Failure                                          | Recovery                                                                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bad deploy                                       | Promote or redeploy the previous known-good deployment from the host dashboard. Then fix forward in Git.                                                                   |
| Bad change on main                               | Branch from main, run `git revert <squash-commit>`, and open a PR. Merge after CI passes.                                                                                  |
| Return to a release                              | Redeploy the known-good tag and open a PR to reconcile main.                                                                                                               |
| Bad migration (M2 onward)                        | Run the migration's documented rollback or restore the backup. Correct applied migrations with a new migration. Use expand-then-contract to keep the prior app compatible. |
| Bad portal data (M7 onward)                      | Run the owner-only snapshot restore script with the verified user and snapshot IDs.                                                                                        |
| Portal outage or unexpected behavior (M7 onward) | Set `PORTAL_SYNC_ENABLED=false` on the gateway. Cached and manual data remain available.                                                                                   |

## M0 owner rollback drill and release

1. In the preview project, deploy a trivial change and record the good and changed deployment IDs.
2. Promote or redeploy the previous build and verify that the trivial change disappeared.
3. Revert the trivial change on a branch, open a PR, and verify CI. Record the deployment IDs, revert PR, date and result here.
4. After the M0 PR is merged, required checks pass, and the drill succeeds, run **Prepare milestone release** on main with version `0.1.0`. Review and merge the release PR after CI, then rerun the workflow to publish the GitHub Release. Configure `RELEASE_PLEASE_TOKEN` with contents, pull request, and issue write access so release PRs trigger CI.

Drill status: pending owner execution.

## Lighthouse

CI checks accessibility, performance, LCP, layout shift, and a Lighthouse input-latency proxy, plus initial gzipped JavaScript size. Lighthouse no longer exposes a PWA category. Installation and offline behavior get browser checks in M6.
