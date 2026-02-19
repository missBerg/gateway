# Benchmark Explorer

A web-based dashboard for visualizing and comparing performance benchmarks across different versions of your project.

## What is it?

The Benchmark Explorer is an interactive dashboard that helps you:

- **📊 Visualize Performance Data** - View benchmark results in charts and graphs
- **🔍 Compare Versions** - See how performance changes between different releases
- **📈 Track Trends** - Monitor performance improvements or regressions over time
- **🎯 Identify Issues** - Spot performance bottlenecks and areas for optimization

## Key Features

- Interactive charts showing latency, throughput, and resource usage
- Version comparison to track performance changes
- Responsive design that works on desktop and mobile
- Light and dark theme support
- Easy integration with Hugo static sites

## How to Use

### 1. Build the Dashboard

```bash
npm install
npm run build
```

### 2. Add to Hugo Site

Include the CSS and JavaScript files in your Hugo template:

```html
<link rel="stylesheet" href="/css/benchmark-dashboard.css">
<script src="/js/benchmark-dashboard-shadow.js" defer></script>
```

### 3. Add the Dashboard to a Page

```html
<div data-react-component="benchmark-dashboard"
     data-theme="light">
</div>
```

## Configuration

You can customize the dashboard behavior with these options:

| Option | Description | Default |
|--------|-------------|---------|
| `data-theme` | Color theme (`light` or `dark`) | `light` |
| `data-version` | Which version to show initially | First available version |
| `data-dynamic` | Fetch data from GitHub releases (`true`) or use bundled data (`false`) | `true` |
| `data-tabs` | Which tabs to display | `overview,latency,resources` |
| `data-show-header` | Show the dashboard title | `false` |

### Dynamic Mode (Recommended)

When `data-dynamic="true"`, the dashboard fetches benchmark data directly from GitHub release artifacts at:
`https://github.com/envoyproxy/gateway/releases/download/vX.Y.Z/benchmark_result.json`

This eliminates the need to manually update version data when new releases are published. A Netlify serverless function (`netlify/functions/benchmark-proxy.ts`) proxies the request to avoid CORS restrictions.

## Example

```html
<div data-react-component="benchmark-dashboard"
     data-theme="dark"
     data-version="v2.1.0"
     data-tabs="overview,latency"
     data-show-header="true">
</div>
```

## Development

To work on the dashboard locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Data Format

**Dynamic mode** (default): Data is fetched from GitHub releases. No manual updates needed.

**Static mode** (`data-dynamic="false"`): Data is bundled from `src/data/versions/*.ts`. Use when:
- Running without Netlify (no proxy for CORS)
- You need offline support
- You want to customize or curate the version list

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Internet Explorer is not supported.
