import { useState, useEffect, useContext } from "react";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphQuery } from "../queries";
import { deriveStatus, formatValues, mergeThresholdData } from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";
import { useHistoricalThresholdQuery } from "./useHistoricalThresholdQuery";
import { HistoricalConfig } from "../utils/historicalThresholds";

const FETCH_INTERVAL_DEFAULT = 300; // fetch interval in s - 5 minutes

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

      console.log("🔍 Single Query NRQL:", nrql);
      console.log("🔍 Single Query Variables:", variables);

      try {
        const response = await NerdGraphQuery.query({ query: nrql, variables });
        console.log("✅ Single Query Response:", response);
        
        const results = response?.data?.actor?.account?.result?.results;
        if (results && Array.isArray(results)) {
          console.log(`📊 Single Query Results Count: ${results.length}`);
          results.forEach((location) => {
            deriveStatus(location);
            formatValues(location);
          });
          setData(results);
          setLastUpdateStamp(Date.now());
        }
      } catch (error) {
        console.error("❌ Error fetching single query data:", error);
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
  historicalConfig?: HistoricalConfig
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

  // Use historical threshold query if enabled
  const { 
    data: historicalThresholdData, 
    error: historicalError, 
    loading: historicalLoading 
  } = useHistoricalThresholdQuery(
    thresholdQuery || '', 
    historicalConfig || {
      enableHistoricalThresholds: false,
      historicalPeriods: 7,
      historicalPeriodUnit: 'days',
      historicalAggregation: 'average'
    },
    matchField
  );

  useEffect(() => {
    if (!markersQuery || markersQuery === null || markersQuery === undefined) {
      console.log("Markers query is required to fetch data.");
      setData([]);
      return;
    }

    const fetchData = async () => {
      const variables = { id: parseInt(accountId, 10) };
      console.log("🔄 Starting Enhanced Dual Query Fetch");
      console.log("🔄 Variables:", variables);
      console.log("🔄 Historical Config:", historicalConfig);
      
      try {
        // Fetch markers data
        const markersNrql = nerdGraphQuery(markersQuery, timeRange, defaultSince, ignorePicker);
        console.log("🔍 Main Query NRQL:", markersNrql);
        
        const markersResponse = await NerdGraphQuery.query({ query: markersNrql, variables });
        console.log("✅ Main Query Response:", markersResponse);
        
        const markersResults = markersResponse?.data?.actor?.account?.result?.results;
        console.log(`📊 Main Query Results Count: ${markersResults?.length || 0}`);
        
        let processedData = markersResults || [];
        
        // Determine which threshold data to use
        let thresholdResults: any[] = [];
        
        if (historicalConfig?.enableHistoricalThresholds && historicalThresholdData.length > 0) {
          // Use historical threshold data
          console.log("🕰️ Using historical threshold data");
          thresholdResults = historicalThresholdData;
        } else if (thresholdQuery && thresholdQuery.trim() !== '') {
          // Fall back to regular threshold query
          console.log("🎯 Falling back to regular threshold query");
          try {
            const thresholdNrql = nerdGraphQuery(thresholdQuery, timeRange, thresholdDefaultSince, thresholdIgnorePicker);
            console.log("🔍 Fallback Threshold Query NRQL:", thresholdNrql);
            
            const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
            console.log("✅ Fallback Threshold Query Response:", thresholdResponse);
            
            thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results || [];
            console.log(`📊 Fallback Threshold Query Results Count: ${thresholdResults.length}`);
          } catch (thresholdError) {
            console.warn("❌ Error fetching fallback threshold data:", thresholdError);
          }
        }
        
        // Merge threshold data if available
        if (thresholdResults.length > 0) {
          console.log("🔗 Merging threshold data with main data");
          console.log("🔗 Sample threshold data:", thresholdResults.slice(0, 2));
          
          processedData = mergeThresholdData(processedData, thresholdResults, matchField);
          console.log("✅ Data merge completed");
        } else {
          console.log("ℹ️ No threshold data available - using main query thresholds only");
        }
        
        // Apply status derivation and formatting to final data
        if (processedData && Array.isArray(processedData)) {
          console.log("🎨 Applying status derivation and formatting");
          processedData.forEach((location: any) => {
            deriveStatus(location);
            formatValues(location);
          });
          console.log(`✅ Final processed data count: ${processedData.length}`);
          setData(processedData);
          setLastUpdateStamp(Date.now());
        }
        
      } catch (error) {
        console.error("❌ Error fetching enhanced dual query data:", error);
        setError(error);
      }
    };

    // Only fetch when not loading historical data (to avoid race conditions)
    if (!historicalLoading) {
      fetchData();
    }

    if (fetchInterval < 1) {
      console.log(
        `Fetch interval less than 1 second is not allowed. Setting to default: ${FETCH_INTERVAL_DEFAULT}s.`,
      );
      return;
    }

    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    let intervalId: any;
    
    if (!historicalLoading) {
      intervalId = setInterval(fetchData, fetchIntervalms);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    markersQuery, 
    thresholdQuery, 
    matchField, 
    accountId, 
    timeRange, 
    fetchInterval, 
    ignorePicker, 
    defaultSince, 
    thresholdIgnorePicker, 
    thresholdDefaultSince,
    historicalConfig?.enableHistoricalThresholds,
    historicalConfig?.historicalPeriods,
    historicalConfig?.historicalPeriodUnit,
    historicalConfig?.historicalAggregation,
    historicalThresholdData,
    historicalLoading
  ]);

  // Combine errors from both main query and historical query
  const combinedError = error || historicalError;

  return { data, error: combinedError, lastUpdateStamp, historicalLoading };
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
      console.log("🔄 Starting Dual Query Fetch");
      console.log("🔄 Variables:", variables);
      
      try {
        // Fetch markers data
        const markersNrql = nerdGraphQuery(markersQuery, timeRange, defaultSince, ignorePicker);
        console.log("🔍 Main Query NRQL:", markersNrql);
        
        const markersResponse = await NerdGraphQuery.query({ query: markersNrql, variables });
        console.log("✅ Main Query Response:", markersResponse);
        
        const markersResults = markersResponse?.data?.actor?.account?.result?.results;
        console.log(`📊 Main Query Results Count: ${markersResults?.length || 0}`);
        
        let processedData = markersResults || [];
        
        // Fetch threshold data if threshold query is provided
        if (thresholdQuery && thresholdQuery.trim() !== '') {
          console.log("🎯 Threshold Query Provided - Fetching threshold data");
          try {
            const thresholdNrql = nerdGraphQuery(thresholdQuery, timeRange, thresholdDefaultSince, thresholdIgnorePicker);
            console.log("🔍 Threshold Query NRQL:", thresholdNrql);
            console.log("🔍 Threshold Query Settings:", {
              thresholdIgnorePicker,
              thresholdDefaultSince,
              matchField
            });
            
            const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
            console.log("✅ Threshold Query Response:", thresholdResponse);
            
            const thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results;
            console.log(`📊 Threshold Query Results Count: ${thresholdResults?.length || 0}`);
            
            if (thresholdResults && Array.isArray(thresholdResults)) {
              console.log("🔗 Merging threshold data with main data");
              console.log("🔗 Sample threshold data:", thresholdResults.slice(0, 2));
              
              // Merge threshold data with markers data
              processedData = mergeThresholdData(processedData, thresholdResults, matchField);
              console.log("✅ Data merge completed");
            } else {
              console.log("⚠️ No threshold results to merge");
            }
          } catch (thresholdError) {
            console.warn("❌ Error fetching threshold data, using fallback thresholds:", thresholdError);
            // Continue with markers data only
          }
        } else {
          console.log("ℹ️ No threshold query provided - using main query thresholds only");
        }
        
        // Apply status derivation and formatting to final data
        if (processedData && Array.isArray(processedData)) {
          console.log("🎨 Applying status derivation and formatting");
          processedData.forEach((location: any) => {
            deriveStatus(location);
            formatValues(location);
          });
          console.log(`✅ Final processed data count: ${processedData.length}`);
          setData(processedData);
          setLastUpdateStamp(Date.now());
        }
        
      } catch (error) {
        console.error("❌ Error fetching dual query data:", error);
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
