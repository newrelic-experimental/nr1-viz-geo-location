import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphQuery } from "../queries";
import { deriveStatus, formatValues, mergeThresholdData } from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";
import { useHistoricalThresholdQuery } from "./useHistoricalThresholdQuery";
import { HistoricalConfig } from "../utils/historicalThresholds";

const FETCH_INTERVAL_DEFAULT = 300; // fetch interval in s - 5 minutes

// Global deduplication state for main queries
const globalMainQueryState = {
  activeQueries: new Map(),
  completedQueries: new Map()
};

export const useNerdGraphQuery = (query: string) => {
  const { timeRange } = useContext(PlatformStateContext);
  const {
    accountId,
    fetchInterval,
    ignorePicker = false,
    defaultSince = "",
  } = useProps();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdateStamp, setLastUpdateStamp] = useState(0);

  useEffect(() => {
    if (!query || query === null || query === undefined) {
      console.log("Query is required to fetch data.");
      setData([]);
      return;
    }

    const fetchData = async () => {
      const nrql = nerdGraphQuery(query, timeRange, defaultSince, ignorePicker);
      const variables = { id: parseInt(accountId, 10) };

      console.log("Query NRQL:", nrql);

      try {
        const response = await NerdGraphQuery.query({ query: nrql, variables });
        console.log("Query Response:", response);
        
        const results = response?.data?.actor?.account?.result?.results;
        if (results && Array.isArray(results)) {
          results.forEach((location) => {
            deriveStatus(location);
            formatValues(location);
          });
          setData(results);
          setLastUpdateStamp(Date.now());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error);
      }
    };

    fetchData();

    if (fetchInterval < 1) {
      console.log(
        `Fetch interval less than 1 second is not allowed. Setting to default: ${FETCH_INTERVAL_DEFAULT}s.`,
      );
      return;
    }

    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    const intervalId = setInterval(fetchData, fetchIntervalms);

    return () => clearInterval(intervalId);
  }, [query, accountId, timeRange, fetchInterval, ignorePicker, defaultSince]);

  return { data, error, lastUpdateStamp };
};

export const useEnhancedDualQuery = (
  markersQuery: string, 
  thresholdQuery?: string, 
  matchField = 'name',
  historicalConfig?: HistoricalConfig,
  historicalThresholdData: any[] = [],
  historicalLoading: boolean = false,
  historicalError: any = null
) => {
  const { timeRange } = useContext(PlatformStateContext);
  const {
    accountId,
    fetchInterval,
    ignorePicker = false,
    defaultSince = "",
    thresholdIgnorePicker = false,
    thresholdDefaultSince = "",
  } = useProps();
  
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdateStamp, setLastUpdateStamp] = useState(0);
  const [mainQueryData, setMainQueryData] = useState([]);
  const [mainQueryLoading, setMainQueryLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Historical threshold data is now passed as parameters from the shared provider

  // Memoize time range values to prevent unnecessary re-renders
  const timeRangeKey = useMemo(() => {
    if (!timeRange) return 'none';
    return `${timeRange.beginTime || ''}-${timeRange.endTime || ''}-${timeRange.duration || ''}`;
  }, [timeRange?.beginTime, timeRange?.endTime, timeRange?.duration]);

  // Query deduplication state for main query
  const queryStateRef = useRef({
    currentQueryKey: null,
    isQueryInProgress: false,
    lastCompletedQuery: null,
    lastCompletedTime: 0
  });

  // Generate unique query key for main query deduplication
  const mainQueryKey = useMemo(() => {
    return `main-${markersQuery}-${timeRangeKey}-${accountId}-${ignorePicker}-${defaultSince}`;
  }, [markersQuery, timeRangeKey, accountId, ignorePicker, defaultSince]);

  // Fetch main query data
  useEffect(() => {
    if (!markersQuery || markersQuery === null || markersQuery === undefined) {
      console.log("Markers query is required to fetch data.");
      setMainQueryData([]);
      setMainQueryLoading(false);
      return;
    }

    // Query deduplication logic for main query
    const now = Date.now();
    const DEDUPLICATION_WINDOW = 5000; // 5 seconds
    
    console.log('🔍 Main query useEffect triggered');
    console.log('🔍 Main query key:', mainQueryKey);
    console.log('🔍 Global main query state:', {
      activeQueries: Array.from(globalMainQueryState.activeQueries.keys()),
      completedQueries: Array.from(globalMainQueryState.completedQueries.keys())
    });

    // Global deduplication - check if same query is already in progress globally
    if (globalMainQueryState.activeQueries.has(mainQueryKey)) {
      console.log('🔄 Main query already in progress globally, skipping duplicate:', mainQueryKey);
      return;
    }

    // Global deduplication - check if same query was completed recently globally
    const globalCompletion = globalMainQueryState.completedQueries.get(mainQueryKey);
    if (globalCompletion && (now - globalCompletion) < DEDUPLICATION_WINDOW) {
      console.log('🔄 Main query completed recently globally, skipping duplicate:', mainQueryKey, 
        'Time since last:', now - globalCompletion, 'ms');
      return;
    }

    // Local deduplication - check if same query is already in progress locally
    if (queryStateRef.current.isQueryInProgress && queryStateRef.current.currentQueryKey === mainQueryKey) {
      console.log('🔄 Main query already in progress locally, skipping duplicate:', mainQueryKey);
      return;
    }

    // Local deduplication - check if same query was completed recently locally
    if (
      queryStateRef.current.lastCompletedQuery === mainQueryKey &&
      (now - queryStateRef.current.lastCompletedTime) < DEDUPLICATION_WINDOW
    ) {
      console.log('🔄 Main query completed recently locally, skipping duplicate:', mainQueryKey, 
        'Time since last:', now - queryStateRef.current.lastCompletedTime, 'ms');
      return;
    }

    const fetchMainData = async () => {
      // Mark query as in progress both locally and globally
      queryStateRef.current.isQueryInProgress = true;
      queryStateRef.current.currentQueryKey = mainQueryKey;
      globalMainQueryState.activeQueries.set(mainQueryKey, Date.now());
      
      console.log('🚀 Starting main query:', mainQueryKey);
      
      setMainQueryLoading(true);
      setDataReady(false);
      
      const variables = { id: parseInt(accountId, 10) };
      
      try {
        const markersNrql = nerdGraphQuery(markersQuery, timeRange, defaultSince, ignorePicker);
        console.log("Main Query NRQL:", markersNrql);
        
        const markersResponse = await NerdGraphQuery.query({ query: markersNrql, variables });
        console.log("Main Query Response:", markersResponse);
        
        const markersResults = markersResponse?.data?.actor?.account?.result?.results;
        setMainQueryData(markersResults || []);
        
      } catch (error) {
        console.error("Error fetching main query data:", error);
        setError(error);
        setMainQueryData([]);
      } finally {
        // Mark query as completed both locally and globally
        const completionTime = Date.now();
        
        queryStateRef.current.isQueryInProgress = false;
        queryStateRef.current.lastCompletedQuery = mainQueryKey;
        queryStateRef.current.lastCompletedTime = completionTime;
        queryStateRef.current.currentQueryKey = null;
        
        // Update global state
        globalMainQueryState.activeQueries.delete(mainQueryKey);
        globalMainQueryState.completedQueries.set(mainQueryKey, completionTime);
        
        // Clean up old completed queries to prevent memory leaks
        const CLEANUP_WINDOW = 30000; // 30 seconds
        for (const [key, time] of globalMainQueryState.completedQueries.entries()) {
          if (completionTime - time > CLEANUP_WINDOW) {
            globalMainQueryState.completedQueries.delete(key);
          }
        }
        
        console.log('✅ Main query completed:', mainQueryKey);
        
        setMainQueryLoading(false);
      }
    };

    fetchMainData();

    if (fetchInterval < 1) {
      console.log(
        `Fetch interval less than 1 second is not allowed. Setting to default: ${FETCH_INTERVAL_DEFAULT}s.`,
      );
      return;
    }

    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    const intervalId = setInterval(fetchMainData, fetchIntervalms);

    return () => clearInterval(intervalId);
  }, [
    markersQuery, 
    accountId, 
    timeRangeKey, 
    fetchInterval, 
    ignorePicker, 
    defaultSince
  ]);

  // Process and combine all data when everything is ready
  useEffect(() => {
    const processAllData = async () => {
      // Don't process if main query is still loading
      if (mainQueryLoading) {
        setDataReady(false);
        return;
      }
      
      // Don't process if we don't have main data yet
      if (!mainQueryData || mainQueryData.length === 0) {
        setDataReady(false);
        return;
      }
      
      // Only wait for historical thresholds on the initial load to prevent flickering
      // On subsequent reloads, show data immediately to avoid disappearing markers/regions
      if (historicalConfig?.enableHistoricalThresholds && historicalLoading && !hasInitialLoad) {
        setDataReady(false);
        return;
      }
      
      try {
        let processedData = [...mainQueryData];
        let thresholdResults: any[] = [];
        
        // Determine which threshold data to use
        if (historicalConfig?.enableHistoricalThresholds) {
          // When historical thresholds are enabled, only use historical data if available
          // Do not fall back to regular threshold query - let main query fallback thresholds be used
          if (historicalThresholdData.length > 0) {
            thresholdResults = historicalThresholdData;
            console.log("Using historical threshold data:", historicalThresholdData.length, "locations");
          } else {
            console.log("Historical thresholds enabled but no historical data available - using main query fallback thresholds");
            thresholdResults = []; // No threshold merging - use main query's fallback thresholds
          }
        } else if (thresholdQuery && thresholdQuery.trim() !== '') {
          // Only use regular threshold query when historical thresholds are disabled
          try {
            const variables = { id: parseInt(accountId, 10) };
            const thresholdNrql = nerdGraphQuery(thresholdQuery, timeRange, thresholdDefaultSince, thresholdIgnorePicker);
            console.log("Regular Threshold Query NRQL:", thresholdNrql);
            
            const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
            console.log("Regular Threshold Query Response:", thresholdResponse);
            
            thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results || [];
          } catch (thresholdError) {
            console.warn("Error fetching regular threshold data:", thresholdError);
          }
        }
        
        // Merge threshold data if available
        if (thresholdResults.length > 0) {
          processedData = mergeThresholdData(processedData, thresholdResults, matchField);
        }
        
        // Apply status derivation and formatting to final data
        if (processedData && Array.isArray(processedData)) {
          processedData.forEach((location: any) => {
            deriveStatus(location);
            formatValues(location);
          });
          
          setData(processedData);
          setLastUpdateStamp(Date.now());
          setDataReady(true);
          
          // Mark that we've completed the initial load
          if (!hasInitialLoad) {
            setHasInitialLoad(true);
          }
        }
        
      } catch (error) {
        console.error("Error processing combined data:", error);
        setError(error);
      }
    };

    processAllData();
  }, [
    mainQueryData,
    mainQueryLoading,
    historicalThresholdData,
    historicalLoading,
    thresholdQuery,
    matchField,
    accountId,
    timeRange,
    thresholdDefaultSince,
    thresholdIgnorePicker,
    historicalConfig?.enableHistoricalThresholds,
    historicalConfig?.historicalPeriods,
    historicalConfig?.historicalPeriodUnit,
    historicalConfig?.historicalAggregation
  ]);

  // Combine errors from both main query and historical query
  const combinedError = error || historicalError;
  
  // Overall loading state - true if either main query or historical thresholds are loading
  const isLoading = mainQueryLoading || (historicalConfig?.enableHistoricalThresholds && historicalLoading);

  return { 
    data, 
    error: combinedError, 
    lastUpdateStamp, 
    loading: isLoading,
    dataReady
  };
};

export const useDualQuery = (markersQuery: string, thresholdQuery?: string, matchField = 'name') => {
  const { timeRange } = useContext(PlatformStateContext);
  const {
    accountId,
    fetchInterval,
    ignorePicker = false,
    defaultSince = "",
    thresholdIgnorePicker = false,
    thresholdDefaultSince = "",
  } = useProps();
  
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdateStamp, setLastUpdateStamp] = useState(0);

  useEffect(() => {
    if (!markersQuery || markersQuery === null || markersQuery === undefined) {
      console.log("Markers query is required to fetch data.");
      setData([]);
      return;
    }

    const fetchData = async () => {
      const variables = { id: parseInt(accountId, 10) };
      
      try {
        // Fetch markers data
        const markersNrql = nerdGraphQuery(markersQuery, timeRange, defaultSince, ignorePicker);
        console.log("Main Query NRQL:", markersNrql);
        
        const markersResponse = await NerdGraphQuery.query({ query: markersNrql, variables });
        console.log("Main Query Response:", markersResponse);
        
        const markersResults = markersResponse?.data?.actor?.account?.result?.results;
        let processedData = markersResults || [];
        
        // Fetch threshold data if threshold query is provided
        if (thresholdQuery && thresholdQuery.trim() !== '') {
          try {
            const thresholdNrql = nerdGraphQuery(thresholdQuery, timeRange, thresholdDefaultSince, thresholdIgnorePicker);
            console.log("Threshold Query NRQL:", thresholdNrql);
            
            const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
            console.log("Threshold Query Response:", thresholdResponse);
            
            const thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results;
            
            if (thresholdResults && Array.isArray(thresholdResults)) {
              // Merge threshold data with markers data
              processedData = mergeThresholdData(processedData, thresholdResults, matchField);
            }
          } catch (thresholdError) {
            console.warn("Error fetching threshold data:", thresholdError);
            // Continue with markers data only
          }
        }
        
        // Apply status derivation and formatting to final data
        if (processedData && Array.isArray(processedData)) {
          processedData.forEach((location: any) => {
            deriveStatus(location);
            formatValues(location);
          });
          setData(processedData);
          setLastUpdateStamp(Date.now());
        }
        
      } catch (error) {
        console.error("Error fetching dual query data:", error);
        setError(error);
      }
    };

    fetchData();

    if (fetchInterval < 1) {
      console.log(
        `Fetch interval less than 1 second is not allowed. Setting to default: ${FETCH_INTERVAL_DEFAULT}s.`,
      );
      return;
    }

    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    const intervalId = setInterval(fetchData, fetchIntervalms);

    return () => clearInterval(intervalId);
  }, [markersQuery, thresholdQuery, matchField, accountId, timeRange, fetchInterval, ignorePicker, defaultSince, thresholdIgnorePicker, thresholdDefaultSince]);

  return { data, error, lastUpdateStamp };
};
