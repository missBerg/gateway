# Benchmark Report Data: Dynamic vs. GitHub Action

The Performance Benchmark Report Explorer supports two approaches for updating benchmark data when new releases are published.

## Option 1: GitHub Action (Recommended for GitHub Pages) ✅

**How it works:** When a release is published, the `update-benchmark-data` workflow runs, fetches `benchmark_result.json` from the release assets, and creates a PR to update the version files in `src/data/versions/`.

**Workflow:** `.github/workflows/update-benchmark-data.yaml`

**Pros:**
- Works with GitHub Pages (static hosting, no serverless functions)
- Works offline after page load
- No CORS/proxy concerns
- PR provides review before merging new data

**Cons:**
- Requires PR merge for each new version
- Slight delay between release and data availability

**Manual trigger:** Run the workflow manually with `workflow_dispatch` and provide a version (e.g. `1.7.0`) to add benchmark data for any release.

## Option 2: Dynamic Fetch (Netlify/Vercel)

**How it works:** The dashboard fetches `benchmark_result.json` directly from GitHub release URLs when users view the page. Requires a serverless proxy for CORS.

**Pros:**
- Zero manual updates - new releases appear automatically
- Works immediately when release workflow completes

**Cons:**
- Requires Netlify or similar (serverless functions) - does not work with GitHub Pages
- Slight delay on first load per version

**Setup:** Set `data-dynamic="true"` in the benchmark-dashboard shortcode. Deploy to Netlify so the proxy function at `netlify/functions/benchmark-proxy.ts` is available.

## Recommendation

Use **Option 1 (GitHub Action)** for GitHub Pages - the workflow creates a PR on each release; merge it to update the benchmark explorer.
