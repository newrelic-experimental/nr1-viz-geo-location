import React, { useEffect } from "react";

import { generateTooltipConfig } from "../utils";
import { useProps } from "../context/VizPropsProvider";
import { useEnhancedDualQuery } from "../hooks/useNerdGraphQuery";
import { HistoricalConfig } from "../utils/historicalThresholds";
import { useHeatmap } from "../hooks/useHeatmap";
import { useSharedHistoricalThresholds } from "../context/HistoricalThresholdProvider";

import Region from "./Region";

const Regions = () => {
  const { 
    regionsQuery, 
    thresholdQuery,
    thresholdMatchField = 'name',
    // Historical threshold configuration
    enableHistoricalThresholds = false,
    historicalPeriods = 7,
    historicalPeriodSize = 1,
    historicalPeriodUnit = 'days',
    historicalAggregation = 'average',
    // Tooltip configuration
    showThresholdsInTooltips = false
  } = useProps();
  
  if (regionsQuery === null || regionsQuery === undefined) {
    return null;
  }

  // Get shared historical threshold data
  const { data: historicalThresholdData, loading: historicalLoading, error: historicalError } = useSharedHistoricalThresholds();

  // Create historical configuration object
  const historicalConfig: HistoricalConfig = {
    enableHistoricalThresholds,
    historicalPeriods,
    historicalPeriodSize,
    historicalPeriodUnit: historicalPeriodUnit as 'hours' | 'days',
    historicalAggregation: historicalAggregation as 'average' | 'min' | 'max' | 'sum'
  };

  // Use enhanced dual query with shared historical threshold data
  const { data: regions, loading, dataReady } = useEnhancedDualQuery(
    regionsQuery, 
    thresholdQuery, 
    thresholdMatchField, 
    historicalConfig,
    historicalThresholdData,
    historicalLoading,
    historicalError
  );

  const { setRange, heatMapSteps, getGradientColor } = useHeatmap();
  useEffect(() => {
    setRange(regions);
  }, [regions]);

  // Only wait for dataReady on initial load to prevent flickering
  // On subsequent loads, show data as soon as regions are available
  if (!regions) {
    return null; //no regions to display
  }
  
  // If historical thresholds are enabled and we don't have any data yet, wait for dataReady
  // This prevents the initial flickering but allows subsequent reloads to show immediately
  if (enableHistoricalThresholds && regions.length === 0 && !dataReady) {
    return null;
  }
  
  if (regions.length == 0) {
    return null; //no regions to display
  } else {
    const tooltipConfig = generateTooltipConfig(regions, showThresholdsInTooltips);

    const regionElements = regions.map((location, index) => (
      <Region
        key={index}
        location={location}
        tooltipConfig={tooltipConfig}
        heatMapSteps={heatMapSteps}
        getGradientColor={getGradientColor}
      />
    ));

    return <>{regionElements}</>;
  }
};

export default Regions;
