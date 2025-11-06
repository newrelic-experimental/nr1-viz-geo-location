import { sentenceCase } from "text-case";

// Tool tip config generator
export const generateTooltipConfig = (locations, showThresholdsInTooltips = false, showHistoricalValuesInTooltips = false, enablePercentageHeatmap = false) => {
  const defaultConfig = [
    { label: "Name", queryField: "name" },
    { label: "Value", queryField: "value" },
  ];

  if (!locations || locations.length === 0) {
    return defaultConfig;
  }

  const config = Object.keys(locations[0])
    .filter((key) => key.includes("tooltip_"))
    .filter((key) => key != "tooltip_header")
    .map((key) => ({
      label: sentenceCase(key.replace(/.*tooltip_/gm, "").replace(/_/gm, " ")),
      queryField: key,
    }));

  if (locations[0].name) {
    config.unshift({ label: "Name", queryField: "name" });
  }

  // Add threshold values to tooltip only if the configuration option is enabled
  if (showThresholdsInTooltips) {
    const firstLocation = locations[0];
    if (firstLocation.threshold_warning !== undefined && firstLocation.threshold_warning !== null) {
      config.push({ 
        label: "Warning Threshold", 
        queryField: "threshold_warning",
        formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
      } as any);
    }
    
    if (firstLocation.threshold_critical !== undefined && firstLocation.threshold_critical !== null) {
      config.push({ 
        label: "Critical Threshold", 
        queryField: "threshold_critical",
        formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
      } as any);
    }
    
    // Add historical value to tooltip if both threshold tooltips and historical values are enabled
    if (showHistoricalValuesInTooltips && firstLocation.historical_value !== undefined && firstLocation.historical_value !== null) {
      config.push({ 
        label: "Historical Value", 
        queryField: "historical_value",
        formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
      } as any);
    }
  }

  // Add percentage difference and original value when percentage heatmap is enabled
  if (enablePercentageHeatmap) {
    const firstLocation = locations[0];
    
    // Show original value (before percentage transformation)
    if (firstLocation.original_value !== undefined && firstLocation.original_value !== null) {
      config.push({ 
        label: "Current Value", 
        queryField: "original_value",
        formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
      } as any);
    }
    
    // Show percentage difference
    if (firstLocation.percentage_difference !== undefined && firstLocation.percentage_difference !== null) {
      config.push({ 
        label: "% vs Historical", 
        queryField: "percentage_difference",
        formatFn: (value: any) => {
          if (typeof value === 'number') {
            const sign = value >= 0 ? '+' : '';
            return `${sign}${value.toFixed(1)}%`;
          }
          return value;
        }
      } as any);
    }
  }

  return config.length > 0 ? config : defaultConfig;
};
