# Deploy

Default = **GitHub Pages, static** (ADR-0055): `.github/workflows/deploy-pages.yml` regenerates the artifacts
deterministically, builds the SPA (`copy-data.mjs` overlays `data/derived`, including `cutoff-surrogate.onnx`,
`scenario-ood.onnx` and `cg-learned.json`), and deploys `frontend/dist`. No backend at request time. Live at
**https://cutoffgrade.fasl-work.com**.

The VPS path (systemd + nginx, in `deploy/`) is **dormant**, activated only when `app/` is (an ADR-0002 trigger).
`ci.yml` keeps the base honest on every push: ruff + pytest + a pipeline smoke + `check_artifacts.py` (Contract 2) +
guards that fail on a tracked `.env`/venv/native-or-heavy binary/raw data/leaked machine path.

**Pages gotchas (applied up front):** enable Pages with `build_type=workflow`; the repo default branch is `main` (so
the `github-pages` environment allows it); the `examplelab → cglab` rename covers the `.yml` workflows + the `.sh`/`.ps1`
scripts; the custom domain is set via `gh api -X PUT repos/.../pages -f cname=cutoffgrade.fasl-work.com` (a `CNAME`
file alone does not set it for Actions deploys).
