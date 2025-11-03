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

  // Historical threshold data is now passed as parameters from the shared provider

  // Fetch main query data
  useEffect(() => {
    if (!markersQuery || markersQuery === null || markersQuery === undefined) {
      console.log("Markers query is required to fetch data.");
      setMainQueryData([]);
      setMainQueryLoading(false);
      return;
    }

    const fetchMainData = async () => {
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
    timeRange, 
    fetchInterval, 
    ignorePicker, 
    defaultSince
  ]);

  // Process and combine all data when everything is ready
  useEffect(() => {
    const processAllData = async () => {
      // Don't process if main query is still loading
      if (mainQueryLoading) {
        return;
      }
      
      // Don't process if we don't have main data yet
      if (!mainQueryData || mainQueryData.length === 0) {
        return;
      }
      
      // If historical thresholds are enabled and still loading, show main data first
      if (historicalConfig?.enableHistoricalThresholds && historicalLoading) {
        let tempProcessedData = [...mainQueryData];
        tempProcessedData.forEach((location: any) => {
          deriveStatus(location);
          formatValues(location);
        });
        setData(tempProcessedData);
        setLastUpdateStamp(Date.now());
        return;
      }
      
      try {
        let processedData = [...mainQueryData];
        let thresholdResults: any[] = [];
        
        // Determine which threshold data to use
        if (historicalConfig?.enableHistoricalThresholds && historicalThresholdData.length > 0) {
          thresholdResults = historicalThresholdData;
        } else if (thresholdQuery && thresholdQuery.trim() !== '') {
          try {
            const variables = { id: parseInt(accountId, 10) };
            const thresholdNrql = nerdGraphQuery(thresholdQuery, timeRange, thresholdDefaultSince, thresholdIgnorePicker);
            console.log("Fallback Threshold Query NRQL:", thresholdNrql);
            
            const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
            console.log("Fallback Threshold Query Response:", thresholdResponse);
            
            thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results || [];
          } catch (thresholdError) {
            console.warn("Error fetching fallback threshold data:", thresholdError);
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
