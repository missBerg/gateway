/**
 * API for fetching benchmark data from GitHub releases.
 * Supports both direct fetch (when CORS allows) and proxy via Netlify function.
 */

import { TestSuite } from '../data/types';
import { transformBenchmarkJson } from '../data/benchmarkJsonTransformer';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/envoyproxy/gateway/releases';
const BENCHMARK_JSON_ASSET = 'benchmark_result.json';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  draft?: boolean;
  prerelease?: boolean;
  assets: { name: string; browser_download_url: string }[];
}

/**
 * Get list of versions that have benchmark_result.json in their release assets.
 */
export async function fetchReleasesWithBenchmark(perPage = 100): Promise<string[]> {
  const response = await fetch(
    `${GITHUB_RELEASES_API}?per_page=${perPage}`,
    { headers: { Accept: 'application/vnd.github+json' } }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.status}`);
  }
  const releases: GitHubRelease[] = await response.json();
  const versions: string[] = [];

  for (const release of releases) {
    // Skip draft and pre-releases (e.g. v1.7.0-rc.0)
    if (release.draft || release.prerelease) continue;

    const hasBenchmark = release.assets?.some(
      (a) => a.name === BENCHMARK_JSON_ASSET
    );
    if (hasBenchmark) {
      // Extract version from tag (e.g., v1.7.0 -> 1.7.0)
      const version = release.tag_name.replace(/^v/, '');
      versions.push(version);
    }
  }

  return versions;
}

/**
 * Build the download URL for benchmark_result.json for a given version.
 */
export function getBenchmarkJsonUrl(version: string): string {
  const tag = version.startsWith('v') ? version : `v${version}`;
  return `https://github.com/envoyproxy/gateway/releases/download/${tag}/${BENCHMARK_JSON_ASSET}`;
}

/**
 * Fetch benchmark data - tries proxy first (to avoid CORS), then direct URL.
 */
export async function fetchBenchmarkData(
  version: string,
  proxyBase?: string
): Promise<TestSuite> {
  const url = getBenchmarkJsonUrl(version);

  // Prefer proxy if provided (avoids CORS with GitHub)
  const fetchUrl = proxyBase
    ? `${proxyBase.replace(/\/$/, '')}/.netlify/functions/benchmark-proxy?url=${encodeURIComponent(url)}`
    : url;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch benchmark data for v${version}: ${response.status} ${response.statusText}`
    );
  }

  const rawJson = await response.json();
  const releaseDate = await getReleaseDate(version);
  return transformBenchmarkJson(rawJson, version.replace(/^v/, ''), releaseDate);
}

async function getReleaseDate(version: string): Promise<string | undefined> {
  try {
    const tag = version.startsWith('v') ? version : `v${version}`;
    const response = await fetch(
      `${GITHUB_RELEASES_API}/tags/${tag}`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (response.ok) {
      const release = await response.json();
      return release.published_at;
    }
  } catch {
    // Ignore - we'll use current date as fallback
  }
  return undefined;
}
