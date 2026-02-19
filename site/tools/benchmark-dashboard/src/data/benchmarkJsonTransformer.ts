/**
 * Transforms benchmark_result.json from Go benchmark suite format to TestSuite format.
 * The release artifact at https://github.com/envoyproxy/gateway/releases/download/vX.Y.Z/benchmark_result.json
 * uses this format.
 */

import { TestSuite, TestResult, TestConfiguration } from './types';

// Go benchmark suite JSON format (from test/benchmark/suite/model.go)
interface GoJSONSuiteResult {
  metadata: {
    testConfiguration: Record<string, string>;
  };
  results: GoJSONTestResult[];
}

interface GoJSONTestResult {
  testName: string;
  routes: number;
  routesPerHostname: number;
  phase: string;
  throughput: number;
  totalRequests: number;
  latency?: {
    min: number;
    mean: number;
    max: number;
    pstdev: number;
    percentiles: {
      p50: number;
      p75: number;
      p80: number;
      p90: number;
      p95: number;
      p99: number;
      p999: number;
    };
  };
  resources: {
    envoyGateway?: { memory?: { min: number; max: number; mean: number }; cpu?: { min: number; max: number; mean: number } };
    envoyProxy?: { memory?: { min: number; max: number; mean: number }; cpu?: { min: number; max: number; mean: number } };
  };
  poolOverflow: number;
  upstreamConnections?: number;
  upstreamConnection?: number; // Go struct field name
  counters?: Record<string, { value: number; perSecond: number }>;
}

/**
 * Converts Go benchmark JSON (latency in ms) to frontend format (latency in microseconds).
 */
function toMicroseconds(ms: number): number {
  return Math.round(ms * 1000);
}

/**
 * Transforms raw benchmark_result.json from a release into TestSuite format.
 */
export function transformBenchmarkJson(
  rawJson: GoJSONSuiteResult,
  version: string,
  releaseDate?: string
): TestSuite {
  const tc = rawJson.metadata?.testConfiguration || {};
  const testConfiguration: TestConfiguration = {
    rps: parseInt(tc.rps || '10000', 10),
    connections: parseInt(tc.connections || '100', 10),
    duration: parseInt(tc.duration || '30', 10),
    cpuLimit: tc.cpu || '1000m',
    memoryLimit: tc.memory || '2000Mi'
  };

  const results: TestResult[] = (rawJson.results || []).map((r: GoJSONTestResult) => {
    const upstreamConnections = r.upstreamConnections ?? r.upstreamConnection ?? 0;
    const latency = r.latency;

    return {
      testName: r.testName,
      routes: r.routes,
      routesPerHostname: r.routesPerHostname,
      phase: r.phase as 'scaling-up' | 'scaling-down',
      throughput: r.throughput,
      totalRequests: r.totalRequests,
      latency: latency
        ? {
            min: toMicroseconds(latency.min),
            mean: toMicroseconds(latency.mean),
            max: toMicroseconds(latency.max),
            pstdev: toMicroseconds(latency.pstdev),
            percentiles: {
              p50: toMicroseconds(latency.percentiles.p50),
              p75: toMicroseconds(latency.percentiles.p75),
              p80: toMicroseconds(latency.percentiles.p80),
              p90: toMicroseconds(latency.percentiles.p90),
              p95: toMicroseconds(latency.percentiles.p95),
              p99: toMicroseconds(latency.percentiles.p99),
              p999: toMicroseconds(latency.percentiles.p999)
            }
          }
        : {
            min: 0,
            mean: 0,
            max: 0,
            pstdev: 0,
            percentiles: { p50: 0, p75: 0, p80: 0, p90: 0, p95: 0, p99: 0, p999: 0 }
          },
      resources: {
        envoyGateway: {
          memory: r.resources?.envoyGateway?.memory || { min: 0, max: 0, mean: 0 },
          cpu: r.resources?.envoyGateway?.cpu || { min: 0, max: 0, mean: 0 }
        },
        envoyProxy: {
          memory: r.resources?.envoyProxy?.memory || { min: 0, max: 0, mean: 0 },
          cpu: r.resources?.envoyProxy?.cpu || { min: 0, max: 0, mean: 0 }
        }
      },
      poolOverflow: r.poolOverflow ?? 0,
      upstreamConnections,
      counters: r.counters
    };
  });

  return {
    metadata: {
      version,
      runId: `${version}-${Date.now()}`,
      date: releaseDate || new Date().toISOString(),
      environment: 'GitHub CI',
      description: `Benchmark results for version ${version}`,
      testConfiguration,
      downloadUrl: `https://github.com/envoyproxy/gateway/releases/download/v${version}/benchmark_result.json`
    },
    results
  };
}
