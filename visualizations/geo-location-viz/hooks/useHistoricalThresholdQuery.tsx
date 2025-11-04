import { useState, useEffect, useContext } from "react";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphQuery } from "../queries";
import { useProps } from "../context/VizPropsProvider";
import {
  HistoricalConfig,
  generateHistoricalTimeRanges,
  timeRangeToNrql,
  aggregateThresholdData
} from "../utils/historicalThresholds";

export const useHistoricalThresholdQuery = (
  thresholdQuery: string,
  config: HistoricalConfig,
  matchField: string = 'name'
) => {
  const { timeRange } = useContext(PlatformStateContext);
  const {
    accountId,
    thresholdIgnorePicker = false,
    thresholdDefaultSince = "",
  } = useProps();
  
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!config.enableHistoricalThresholds || !thresholdQuery || thresholdQuery.trim() === '') {
      setData([]);
      return;
    }

    const fetchHistoricalThresholds = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const variables = { id: parseInt(accountId, 10) };
        
        // First, run the threshold query as a "probe" to get reference timestamp
        console.log('🕰️ Running probe query to extract reference timestamp...');
        const probeNrql = `
          query($id: Int!) {
            actor {
              account(id: $id) {
                result: nrql( query: "${thresholdQuery.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}" ) { 
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
        setLoading(false);
      }
    };

    fetchHistoricalThresholds();
  }, [
    thresholdQuery,
    config.enableHistoricalThresholds,
    config.historicalPeriods,
    config.historicalPeriodSize,
    config.historicalPeriodUnit,
    config.historicalAggregation,
    config.disableTimezoneAwareness,
    matchField,
    accountId,
    timeRange,
    thresholdIgnorePicker,
    thresholdDefaultSince
  ]);

  return { data, error, loading };
};
