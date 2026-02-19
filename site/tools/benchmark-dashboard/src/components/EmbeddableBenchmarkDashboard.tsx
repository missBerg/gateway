import React, { useState, useEffect } from 'react';
import VersionSelector from './VersionSelector';
import SummaryCards from './SummaryCards';
import OverviewTab from './OverviewTab';
import LatencyTab from './LatencyTab';
import ResourcesTab from './ResourcesTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVersionData } from '@/hooks/useVersionData';
import { useDynamicVersionData } from '@/hooks/useDynamicVersionData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface EmbeddableDashboardConfig {
  apiBase?: string;
  initialVersion?: string;
  theme?: 'light' | 'dark';
  containerClassName?: string;
  /** When true, fetches benchmark data from GitHub releases instead of bundled data */
  dynamic?: boolean;
  features?: {
    header?: boolean;
    versionSelector?: boolean;
    summaryCards?: boolean;
    tabs?: string[]; // ['overview', 'latency', 'resources']
  };
}

export const EmbeddableBenchmarkDashboard: React.FC<EmbeddableDashboardConfig> = ({
  apiBase = 'https://envoy-gateway-benchmark-report.netlify.app/api',
  initialVersion,
  theme = 'light',
  containerClassName = '',
  dynamic = false,
  features = {
    header: false, // Let Hugo handle the header
    versionSelector: true,
    summaryCards: true,
    tabs: ['overview', 'latency', 'resources']
  }
}) => {
  // Use dynamic fetch from GitHub releases when dynamic=true, otherwise use bundled data
  const staticData = useVersionData();
  const dynamicData = useDynamicVersionData(
    typeof window !== 'undefined' ? window.location.origin : undefined
  );
  const versionData = dynamic ? dynamicData : staticData;

  // Merge isLoading and error from dynamic data when in dynamic mode
  const isLoading = dynamic && 'isLoading' in versionData && versionData.isLoading;
  const error = dynamic && 'error' in versionData ? versionData.error : null;

  // Apply theme class to container
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Add CSS to ensure proper z-index for dropdowns
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .benchmark-dashboard [data-radix-popper-content-wrapper] {
        z-index: 9999 !important;
      }
      .benchmark-dashboard .relative.z-50 {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={`benchmark-dashboard ${theme} ${containerClassName}`} data-theme={theme}>
      {/* Conditional header - only show if Hugo requests it */}
      {features.header && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Performance Benchmark Report Explorer</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">Detailed performance analysis</p>
        </div>
      )}

      {/* Error state when using dynamic mode */}
      {dynamic && error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load benchmark data</AlertTitle>
          <AlertDescription>
            <span className="block mb-2">{error}</span>
            {'refetch' in versionData && (
              <button
                type="button"
                onClick={() => versionData.refetch()}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Version selector */}
      {features.versionSelector && (
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full">
            <VersionSelector
              selectedVersion={versionData.selectedVersion}
              availableVersions={versionData.availableVersions}
              onVersionChange={versionData.setSelectedVersion}
              metadata={versionData.metadata}
            />
          </div>
        </div>
      )}

      {/* Loading state when using dynamic mode */}
      {dynamic && isLoading && (
        <div className="flex items-center justify-center py-12 mb-6">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-300">
            Loading benchmark data for v{versionData.selectedVersion}...
          </span>
        </div>
      )}

      {/* Summary cards - hide when loading in dynamic mode */}
      {features.summaryCards && versionData.performanceSummary && !(dynamic && isLoading) && (
        <div className="mb-8">
          <SummaryCards
            performanceSummary={versionData.performanceSummary}
            benchmarkResults={versionData.benchmarkResults}
          />
        </div>
      )}

      {/* Tabs - hide when loading in dynamic mode */}
      {features.tabs && features.tabs.length > 0 && !(dynamic && isLoading) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <Tabs defaultValue={features.tabs[0]} className="w-full">
            <TabsList className={`grid w-full ${features.tabs.length === 1 ? 'grid-cols-1' : features.tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-auto p-0 rounded-none`}>
              {features.tabs?.includes('overview') && (
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base py-4 px-6 rounded-t-lg border-b-2 border-transparent transition-all duration-200 font-medium"
                >
                  Overview
                </TabsTrigger>
              )}
              {features.tabs?.includes('latency') && (
                <TabsTrigger
                  value="latency"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base py-4 px-6 rounded-t-lg border-b-2 border-transparent transition-all duration-200 font-medium"
                >
                  Request RTT Analysis
                </TabsTrigger>
              )}
              {features.tabs?.includes('resources') && (
                <TabsTrigger
                  value="resources"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-purple-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base py-4 px-6 rounded-t-lg border-b-2 border-transparent transition-all duration-200 font-medium"
                >
                  Resource Usage
                </TabsTrigger>
              )}
            </TabsList>

            <div className="p-6">
              {features.tabs?.includes('overview') && (
                <TabsContent value="overview">
                  <OverviewTab
                    performanceMatrix={versionData.performanceMatrix}
                    benchmarkResults={versionData.benchmarkResults}
                    testConfiguration={versionData.testConfiguration}
                    performanceSummary={versionData.performanceSummary}
                    latencyPercentileComparison={versionData.latencyPercentileComparison}
                  />
                </TabsContent>
              )}

              {features.tabs?.includes('latency') && (
                <TabsContent value="latency">
                  <LatencyTab
                    latencyPercentileComparison={versionData.latencyPercentileComparison}
                    benchmarkResults={versionData.benchmarkResults}
                  />
                </TabsContent>
              )}

              {features.tabs?.includes('resources') && (
                <TabsContent value="resources">
                  <ResourcesTab
                    resourceTrends={versionData.resourceTrends}
                    benchmarkResults={versionData.benchmarkResults}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
};
