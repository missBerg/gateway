# Benchmark Report Data: Dynamic vs. GitHub Action

The Performance Benchmark Report Explorer supports two approaches for updating benchmark data when new releases are published.

## Option 1: Dynamic Fetch (Recommended) ✅

**How it works:** The dashboard fetches `benchmark_result.json` directly from GitHub release URLs when users view the page.

**URL pattern:** `https://github.com/envoyproxy/gateway/releases/download/vX.Y.Z/benchmark_result.json`

**Pros:**
- Zero manual updates - new releases appear automatically
- No PR/review cycle for data updates
- Single source of truth (release artifacts)
- Works immediately when release workflow completes

**Cons:**
- Requires Netlify function for CORS (included in this repo)
- Slight delay on first load per version (data is cached in session)
- Requires network access to view

**Setup:** Set `data-dynamic="true"` in the benchmark-dashboard shortcode (default).

## Option 2: GitHub Action to Update Bundled Data

**How it works:** A workflow runs on release or schedule, fetches `benchmark_result.json`, and creates a PR to update the version files in `src/data/versions/`.

**Pros:**
- Works offline after page load
- No CORS/proxy concerns
- Full control over which versions to include

**Cons:**
- Requires PR review and merge for each new version
- More complex automation to maintain
- Data can become stale between releases

**Example workflow** (add to `.github/workflows/update-benchmark-data.yaml`):

```yaml
name: Update Benchmark Data

on:
  release:
    types: [published]
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Fetch benchmark data
        run: |
          VERSION="${GITHUB_REF#refs/tags/v}"
          curl -sL "https://github.com/envoyproxy/gateway/releases/download/v${VERSION}/benchmark_result.json" -o /tmp/benchmark.json
          # Run conversion script to generate vX.Y.Z.ts

      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          branch: update-benchmark-${{ github.ref_name }}
          commit-message: "chore: add benchmark data for ${{ github.ref_name }}"
          title: "Add benchmark data for ${{ github.ref_name }}"
```

You would also need a script to transform the JSON into the TypeScript format used by `src/data/versions/`.

## Recommendation

Use **Option 1 (Dynamic)** - it's simpler and keeps the dashboard always up-to-date with minimal maintenance.
