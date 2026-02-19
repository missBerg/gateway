/**
 * Netlify serverless function to proxy benchmark_result.json from GitHub releases.
 * Avoids CORS issues when the dashboard fetches from GitHub from the browser.
 */

export const handler = async (event: { queryStringParameters?: { url?: string } }) => {
  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing url parameter' })
    };
  }

  // Only allow fetching from envoyproxy/gateway releases
  if (
    !url.startsWith('https://github.com/envoyproxy/gateway/releases/download/') ||
    !url.includes('benchmark_result.json')
  ) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'URL not allowed' })
    };
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EnvoyGateway-Benchmark-Dashboard/1.0' }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: `Upstream returned ${response.status}`,
          status: response.status
        })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error('Benchmark proxy error:', err);
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to fetch benchmark data',
        message: err instanceof Error ? err.message : 'Unknown error'
      })
    };
  }
};
