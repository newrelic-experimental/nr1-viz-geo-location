import { useState, useEffect, useContext } from "react";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphQuery } from "../queries";
import { deriveStatus, formatValues, mergeThresholdData } from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";

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

      try {
        const response = await NerdGraphQuery.query({ query: nrql, variables });
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

export const useDualQuery = (markersQuery: string, thresholdQuery?: string, matchField = 'name') => {
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
        const markersResponse = await NerdGraphQuery.query({ query: markersNrql, variables });
        const markersResults = markersResponse?.data?.actor?.account?.result?.results;
        
        let processedData = markersResults || [];
        
        // Fetch threshold data if threshold query is provided
        if (thresholdQuery && thresholdQuery.trim() !== '') {
          try {
            const thresholdNrql = nerdGraphQuery(thresholdQuery, timeRange, defaultSince, ignorePicker);
            const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
            const thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results;
            
            if (thresholdResults && Array.isArray(thresholdResults)) {
              // Merge threshold data with markers data
              processedData = mergeThresholdData(processedData, thresholdResults, matchField);
            }
          } catch (thresholdError) {
            console.warn("Error fetching threshold data, using fallback thresholds:", thresholdError);
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
        console.error("Error fetching markers data:", error);
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
  }, [markersQuery, thresholdQuery, matchField, accountId, timeRange, fetchInterval, ignorePicker, defaultSince]);

  return { data, error, lastUpdateStamp };
};
