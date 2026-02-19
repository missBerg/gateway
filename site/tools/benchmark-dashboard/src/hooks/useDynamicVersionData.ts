/**
 * Dynamic version data hook - fetches benchmark data from GitHub releases.
 * Use when data-dynamic="true" to pull data from release artifacts instead of bundled data.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  fetchReleasesWithBenchmark,
  fetchBenchmarkData
} from '../api/benchmarkApi';
import { TestSuite, TestResult, TestConfiguration } from '../data/types';

interface UseDynamicVersionDataReturn {
  selectedVersion: string;
  setSelectedVersion: (version: string) => void;
  availableVersions: string[];
  benchmarkResults: TestResult[];
  testConfiguration: TestConfiguration;
  performanceSummary: any;
  latencyPercentileComparison: any[];
  resourceTrends: any[];
  performanceMatrix: any[];
  metadata: any;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULT_CONFIG: TestConfiguration = {
  rps: 10000,
  connections: 100,
  duration: 30,
  cpuLimit: '1000m',
  memoryLimit: '2000Mi'
};

const EMPTY_RETURN = {
  benchmarkResults: [],
  testConfiguration: DEFAULT_CONFIG,
  performanceSummary: {
    totalTests: 0,
    scaleUpTests: 0,
    scaleDownTests: 0,
    maxRoutes: 0,
    minRoutes: 0,
    avgThroughput: 0,
    avgLatency: 0
  },
  latencyPercentileComparison: [],
  resourceTrends: [],
  performanceMatrix: [],
  metadata: null
};

export const useDynamicVersionData = (
  proxyBase?: string
): UseDynamicVersionDataReturn => {
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, TestSuite>>(new Map());

  const loadVersions = useCallback(async () => {
    try {
      const versions = await fetchReleasesWithBenchmark();
      setAvailableVersions(versions);
      if (versions.length > 0 && !selectedVersion) {
        setSelectedVersion(versions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
      setAvailableVersions([]);
    }
  }, [selectedVersion]);

  const loadBenchmarkData = useCallback(
    async (version: string) => {
      if (cache.has(version)) {
        setTestSuite(cache.get(version)!);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const suite = await fetchBenchmarkData(version, proxyBase);
        setCache((prev) => new Map(prev).set(version, suite));
        setTestSuite(suite);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load benchmark data');
        setTestSuite(null);
      } finally {
        setIsLoading(false);
      }
    },
    [proxyBase, cache]
  );

  const refetch = useCallback(() => {
    setCache(new Map());
    setTestSuite(null);
    loadVersions();
    if (selectedVersion) {
      loadBenchmarkData(selectedVersion);
    }
  }, [loadVersions, loadBenchmarkData, selectedVersion]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  useEffect(() => {
    if (selectedVersion) {
      loadBenchmarkData(selectedVersion);
    } else {
      setTestSuite(null);
      setIsLoading(false);
    }
  }, [selectedVersion, loadBenchmarkData]);

  const versionData = useMemo(() => {
    if (!testSuite) return EMPTY_RETURN;
    const results = testSuite.results;

    return {
      benchmarkResults: results,
      testConfiguration: testSuite.metadata.testConfiguration,
      performanceSummary: {
        totalTests: results.length,
        scaleUpTests: results.filter((r) => r.phase === 'scaling-up').length,
        scaleDownTests: results.filter((r) => r.phase === 'scaling-down').length,
        maxRoutes: results.length > 0 ? Math.max(...results.map((r) => r.routes)) : 0,
        minRoutes: results.length > 0 ? Math.min(...results.map((r) => r.routes)) : 0,
        avgThroughput:
          results.length > 0
            ? results.reduce((sum, r) => sum + r.throughput, 0) / results.length
            : 0,
        avgLatency:
          results.length > 0
            ? results.reduce((sum, r) => sum + r.latency.mean, 0) / results.length
            : 0
      },
      latencyPercentileComparison: results.map((result) => ({
        routes: result.routes,
        phase: result.phase,
        p50: result.latency.percentiles.p50 / 1000,
        p75: result.latency.percentiles.p75 / 1000,
        p90: result.latency.percentiles.p90 / 1000,
        p95: result.latency.percentiles.p95 / 1000,
        p99: result.latency.percentiles.p99 / 1000,
        p999: result.latency.percentiles.p999 / 1000
      })),
      resourceTrends: results.map((result) => ({
        routes: result.routes,
        phase: result.phase,
        envoyGatewayMemory: result.resources.envoyGateway.memory.mean,
        envoyGatewayCpu: result.resources.envoyGateway.cpu.mean,
        envoyProxyMemory: result.resources.envoyProxy.memory.mean,
        envoyProxyCpu: result.resources.envoyProxy.cpu.mean
      })),
      performanceMatrix: results.map((result) => ({
        testName: result.testName,
        routes: result.routes,
        phase: result.phase,
        throughput: result.throughput,
        meanLatency: result.latency.mean / 1000,
        p95Latency: result.latency.percentiles.p95 / 1000,
        totalMemory:
          result.resources.envoyGateway.memory.mean +
          result.resources.envoyProxy.memory.mean,
        totalCpu:
          result.resources.envoyGateway.cpu.mean +
          result.resources.envoyProxy.cpu.mean
      })),
      metadata: testSuite.metadata
    };
  }, [testSuite]);

  return {
    selectedVersion,
    setSelectedVersion,
    availableVersions,
    isLoading,
    error,
    refetch,
    ...versionData
  };
};
