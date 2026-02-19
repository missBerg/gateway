# Benchmark Report Data

The Performance Benchmark Report Explorer uses bundled data that is updated automatically when releases are published.

## How It Works

When a release is published, the `update-benchmark-data` GitHub Action workflow:

1. Fetches `benchmark_result.json` from the release assets
2. Converts it to the TypeScript format used by the dashboard
3. Creates a PR with the new version file and index updates

**Workflow:** `.github/workflows/update-benchmark-data.yaml`

## Manual Update

To add benchmark data for a release manually, run:

```bash
node tools/scripts/update-benchmark-data.mjs <version>
# Example: node tools/scripts/update-benchmark-data.mjs 1.7.0
```

Or trigger the workflow manually from the Actions tab with `workflow_dispatch` and provide the version.
