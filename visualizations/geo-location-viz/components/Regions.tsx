import React, { useEffect } from "react";

import { generateTooltipConfig } from "../utils";
import { useProps } from "../context/VizPropsProvider";
import { useEnhancedDualQuery } from "../hooks/useNerdGraphQuery";
import { HistoricalConfig } from "../utils/historicalThresholds";
import { useHeatmap } from "../hooks/useHeatmap";

import Region from "./Region";

const Regions = () => {
  const { 
    regionsQuery, 
    thresholdQuery,
    thresholdMatchField = 'name',
    // Historical threshold configuration
    enableHistoricalThresholds = false,
    historicalPeriods = 7,
    historicalPeriodUnit = 'days',
    historicalAggregation = 'average',
    // Tooltip configuration
    showThresholdsInTooltips = false
  } = useProps();
  
  if (regionsQuery === null || regionsQuery === undefined) {
    return null;
  }

  // Create historical configuration object
  const historicalConfig: HistoricalConfig = {
    enableHistoricalThresholds,
    historicalPeriods,
    historicalPeriodUnit: historicalPeriodUnit as 'hours' | 'days',
    historicalAggregation: historicalAggregation as 'average' | 'min' | 'max' | 'sum'
  };

  // Always use enhanced dual query, but pass the configuration to control behavior
  const { data: regions, loading, dataReady } = useEnhancedDualQuery(
    regionsQuery, 
    thresholdQuery, 
    thresholdMatchField, 
    historicalConfig
  );

  const { setRange, heatMapSteps, getGradientColor } = useHeatmap();
  useEffect(() => {
    setRange(regions);
  }, [regions]);

  if (!regions || regions.length == 0) {
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
