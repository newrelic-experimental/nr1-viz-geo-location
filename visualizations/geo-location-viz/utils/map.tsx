import { sentenceCase } from "text-case";

// Tool tip config generator
export const generateTooltipConfig = (locations, showThresholdsInTooltips = false) => {
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
  }

  return config.length > 0 ? config : defaultConfig;
};
