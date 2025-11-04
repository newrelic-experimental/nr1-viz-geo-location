import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphQuery } from "../queries";
import { useProps } from "../context/VizPropsProvider";
import {
  HistoricalConfig,
  generateHistoricalTimeRanges,
  timeRangeToNrql,
  aggregateThresholdData
} from "../utils/historicalThresholds";
import { timeRangeToNrql as utilsTimeRangeToNrql } from "../utils";

const FETCH_INTERVAL_DEFAULT = 300; // fetch interval in s - 5 minutes

// Global deduplication state to prevent multiple instances from running the same query
const globalQueryState = {
  activeQueries: new Map(),
  completedQueries: new Map()
};

// Helper function to handle time ranges properly for probe query (moved outside component to prevent re-renders)
const buildProbeQueryWithTimeRange = (query: string, timeRange: any, defaultSince: string, ignorePicker: boolean) => {
  if (ignorePicker === true) {
    let q = `${query
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')} ${defaultSince ?? ""}`;
    return q;
  } else {
    // Generate the time range part of the NRQL query using the imported timeRangeToNrql from utils
    const timeRangePart = utilsTimeRangeToNrql(timeRange);
    // Construct the full NRQL query, remove line breaks
    let q = `${query
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')} ${
      timeRangePart === "" ? defaultSince || "" : timeRangePart
    }`;
    return q;
  }
};

export const useHistoricalThresholdQuery = (
  thresholdQuery: string,
  config: HistoricalConfig,
  matchField: string = 'name'
) => {
  const { timeRange } = useContext(PlatformStateContext);
  const {
    accountId,
    fetchInterval,
    thresholdIgnorePicker = false,
    thresholdDefaultSince = "",
  } = useProps();
  
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Memoize config values to prevent unnecessary re-renders
  const configKey = useMemo(() => {
    if (!config.enableHistoricalThresholds) return 'disabled';
    return `${config.historicalPeriods}-${config.historicalPeriodSize}-${config.historicalPeriodUnit}-${config.historicalAggregation}-${config.disableTimezoneAwareness}`;
  }, [
    config.enableHistoricalThresholds,
    config.historicalPeriods,
    config.historicalPeriodSize,
    config.historicalPeriodUnit,
    config.historicalAggregation,
    config.disableTimezoneAwareness
  ]);

  // Memoize time range values to prevent unnecessary re-renders
  const timeRangeKey = useMemo(() => {
    if (!timeRange) return 'none';
    return `${timeRange.beginTime || ''}-${timeRange.endTime || ''}-${timeRange.duration || ''}`;
  }, [timeRange?.beginTime, timeRange?.endTime, timeRange?.duration]);

  // Query deduplication state - persists across renders without causing re-renders
  const queryStateRef = useRef({
    currentQueryKey: null,
    isQueryInProgress: false,
    lastCompletedQuery: null,
    lastCompletedTime: 0
  });

  // Generate unique query key for deduplication
  const currentQueryKey = useMemo(() => {
    return `${thresholdQuery}-${timeRangeKey}-${configKey}-${accountId}-${thresholdIgnorePicker}-${thresholdDefaultSince}`;
  }, [thresholdQuery, timeRangeKey, configKey, accountId, thresholdIgnorePicker, thresholdDefaultSince]);

  useEffect(() => {
    if (!config.enableHistoricalThresholds || !thresholdQuery || thresholdQuery.trim() === '') {
      setData([]);
      return;
    }

    // Query deduplication logic
    const now = Date.now();
    const DEDUPLICATION_WINDOW = 5000; // 5 seconds - increased to handle longer platform state transitions
    
    console.log('🔍 Historical threshold useEffect triggered');
    console.log('🔍 Current query key:', currentQueryKey);
    console.log('🔍 Local query state:', {
      isQueryInProgress: queryStateRef.current.isQueryInProgress,
      currentQueryKey: queryStateRef.current.currentQueryKey,
      lastCompletedQuery: queryStateRef.current.lastCompletedQuery,
      timeSinceLastCompletion: queryStateRef.current.lastCompletedTime ? now - queryStateRef.current.lastCompletedTime : 'N/A'
    });
    console.log('🔍 Global query state:', {
      activeQueries: Array.from(globalQueryState.activeQueries.keys()),
      completedQueries: Array.from(globalQueryState.completedQueries.keys())
    });

    // Global deduplication - check if same query is already in progress globally
    if (globalQueryState.activeQueries.has(currentQueryKey)) {
      console.log('🔄 Historical threshold query already in progress globally, skipping duplicate:', currentQueryKey);
      return;
    }

    // Global deduplication - check if same query was completed recently globally
    const globalCompletion = globalQueryState.completedQueries.get(currentQueryKey);
    if (globalCompletion && (now - globalCompletion) < DEDUPLICATION_WINDOW) {
      console.log('🔄 Historical threshold query completed recently globally, skipping duplicate:', currentQueryKey, 
        'Time since last:', now - globalCompletion, 'ms');
      return;
    }

    // Local deduplication - check if same query is already in progress locally
    if (queryStateRef.current.isQueryInProgress && queryStateRef.current.currentQueryKey === currentQueryKey) {
      console.log('🔄 Historical threshold query already in progress locally, skipping duplicate:', currentQueryKey);
      return;
    }

    // Local deduplication - check if same query was completed recently locally
    if (
      queryStateRef.current.lastCompletedQuery === currentQueryKey &&
      (now - queryStateRef.current.lastCompletedTime) < DEDUPLICATION_WINDOW
    ) {
      console.log('🔄 Historical threshold query completed recently locally, skipping duplicate:', currentQueryKey, 
        'Time since last:', now - queryStateRef.current.lastCompletedTime, 'ms');
      return;
    }

    const fetchHistoricalThresholds = async () => {
      // Mark query as in progress both locally and globally
      queryStateRef.current.isQueryInProgress = true;
      queryStateRef.current.currentQueryKey = currentQueryKey;
      globalQueryState.activeQueries.set(currentQueryKey, Date.now());
      
      console.log('🚀 Starting historical threshold query:', currentQueryKey);
      
      setLoading(true);
      setError(null);
      
      try {
        const variables = { id: parseInt(accountId, 10) };
        
        // First, run the threshold query as a "probe" to get reference timestamp
        // Use the same time range logic as main queries to respect date picker and default since
        console.log('🕰️ Running probe query to extract reference timestamp...');
        console.log('🕰️ Probe query settings - ignorePicker:', thresholdIgnorePicker, 'defaultSince:', thresholdDefaultSince);
        
        const probeQueryWithTimeRange = buildProbeQueryWithTimeRange(
          thresholdQuery,
          timeRange,
          thresholdDefaultSince,
          thresholdIgnorePicker
        );
        
        console.log('🕰️ Probe query with time range:', probeQueryWithTimeRange);
        
        const probeNrql = `
          query($id: Int!) {
            actor {
              account(id: $id) {
                result: nrql( query: "${probeQueryWithTimeRange}" ) { 
                  results 
                  metadata {
                    timeWindow {
                      begin
                      end
                    }
                  }
                }
              }
            }
          }
        `;
        
        const probeResponse = await NerdGraphQuery.query({ query: probeNrql, variables });
        const probeResults = probeResponse?.data?.actor?.account?.result?.results || [];
        const probeMetadata = probeResponse?.data?.actor?.account?.result?.metadata || {};
        
        console.log('🔍 Probe query results:', probeResults);
        console.log('🔍 Probe query metadata:', probeMetadata);
        
        // Extract reference timestamp and period duration from probe results
        let referenceTimestamp = null;
        let periodDuration = null;
        
        // Try the correct metadata structure first
        if (probeMetadata.timeWindow?.begin && probeMetadata.timeWindow?.end) {
          referenceTimestamp = probeMetadata.timeWindow.end; // Use end time as reference
          periodDuration = probeMetadata.timeWindow.end - probeMetadata.timeWindow.begin;
          console.log('🕰️ Using metadata timeWindow.end as reference:', new Date(referenceTimestamp));
          console.log('🕰️ Extracted period duration from timeWindow:', periodDuration / 60000, 'minutes');
        } else if (probeMetadata.timeWindow?.begin) {
          referenceTimestamp = probeMetadata.timeWindow.begin;
          console.log('🕰️ Using metadata timeWindow.begin as reference:', new Date(referenceTimestamp));
        } else if (probeResults.length > 0 && probeResults[0].timestamp) {
          referenceTimestamp = probeResults[0].timestamp;
          console.log('🕰️ Using first result timestamp as reference:', new Date(referenceTimestamp));
        } else if (timeRange?.endTime) {
          referenceTimestamp = timeRange.endTime;
          if (timeRange.beginTime) {
            periodDuration = timeRange.endTime - timeRange.beginTime;
            console.log('🕰️ Extracted period duration from timeRange:', periodDuration / 60000, 'minutes');
          }
          console.log('🕰️ Using timeRange endTime as reference:', new Date(referenceTimestamp));
        } else if (timeRange?.beginTime) {
          referenceTimestamp = timeRange.beginTime;
          console.log('🕰️ Using timeRange beginTime as reference:', new Date(referenceTimestamp));
        } else {
          // Fallback to current approach
          console.log('🕰️ No reference timestamp found, falling back to current time');
          referenceTimestamp = Date.now();
        }
        
        // Generate historical time ranges using the reference timestamp
        const historicalRanges = generateHistoricalTimeRanges(
          referenceTimestamp,
          config,
          periodDuration
        );
        
        // Create queries for each historical period
        const queryPromises = historicalRanges.map(async (range, index) => {
          try {
            // Create a custom time range string for this period
            const customTimeRange = timeRangeToNrql(range.beginTime, range.endTime);
            
            // Build the NRQL query with custom time range
            const queryWithTimeRange = `${thresholdQuery.replace(/(\r\n|\n|\r)/gm, " ")} ${customTimeRange}`;
            
            const nrql = `
              query($id: Int!) {
                actor {
                  account(id: $id) {
                    result: nrql( query: "${queryWithTimeRange.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}" ) { 
                      results 
                    }
                  }
                }
              }
            `;
            
            console.log(`Historical Query ${index + 1} NRQL:`, nrql);
            
            const response = await NerdGraphQuery.query({ query: nrql, variables });
            const results = response?.data?.actor?.account?.result?.results;
            
            console.log(`Historical Query ${index + 1} Raw Results:`, results);
            
            return results || [];
          } catch (periodError) {
            console.warn(`Error in historical period ${index + 1}:`, periodError);
            return []; // Return empty array for failed periods
          }
        });
        
        // Execute all queries in parallel
        const periodResults = await Promise.all(queryPromises);
        
        // Aggregate results across periods
        console.log("Historical threshold calculation - Aggregation method:", config.historicalAggregation);
        console.log("Historical threshold calculation - Match field:", matchField);
        console.log("Historical threshold calculation - Period results:", periodResults);
        
        const aggregatedData = aggregateThresholdData(
          periodResults,
          config.historicalAggregation,
          matchField
        );
        
        console.log("Historical threshold calculation - Final aggregated data:", aggregatedData);
        
        setData(aggregatedData);
        
      } catch (error) {
        console.error("❌ Error fetching historical threshold data:", error);
        setError(error);
        setData([]);
      } finally {
        // Mark query as completed both locally and globally
        const completionTime = Date.now();
        
        queryStateRef.current.isQueryInProgress = false;
        queryStateRef.current.lastCompletedQuery = currentQueryKey;
        queryStateRef.current.lastCompletedTime = completionTime;
        queryStateRef.current.currentQueryKey = null;
        
        // Update global state
        globalQueryState.activeQueries.delete(currentQueryKey);
        globalQueryState.completedQueries.set(currentQueryKey, completionTime);
        
        // Clean up old completed queries to prevent memory leaks
        const CLEANUP_WINDOW = 30000; // 30 seconds
        for (const [key, time] of globalQueryState.completedQueries.entries()) {
          if (completionTime - time > CLEANUP_WINDOW) {
            globalQueryState.completedQueries.delete(key);
          }
        }
        
        console.log('✅ Historical threshold query completed:', currentQueryKey);
        
        setLoading(false);
      }
    };

    fetchHistoricalThresholds();

    // Set up interval for auto-refresh using same logic as main queries
    if (fetchInterval < 1) {
      console.log(
        `Historical thresholds fetch interval less than 1 second is not allowed. Setting to default: ${FETCH_INTERVAL_DEFAULT}s.`,
      );
      return;
    }

    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    const intervalId = setInterval(fetchHistoricalThresholds, fetchIntervalms);

    return () => clearInterval(intervalId);
  }, [
    thresholdQuery,
    configKey,
    matchField,
    accountId,
    fetchInterval,
    timeRangeKey,
    thresholdIgnorePicker,
    thresholdDefaultSince
  ]);

  return { data, error, loading };
};
