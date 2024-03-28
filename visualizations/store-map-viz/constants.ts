export const DEFAULT_ZOOM = 1; // default zoom level
export const DEFAULT_CENTER = [51.5074, 0.1278]; // default map center - London
export const FETCH_INTERVAL_DEFAULT = 300; // fetch interval in ms - 5 minutes
export const MARKER_COLOURS = {
  noneColour: "#0c74df", //grey for group
  noneBorder: "#0c74df70",
  noneText: "#FFF",
  noneRegionColour: "#0c74df",
  noneRegionColourBorder: "#0c74df70",

  criticalColour: "#DF2E23", // Red color for alert
  criticalColourBorder: "#DF2E2370",
  criticalColourText: "#fff",
  criticalRegionColour: "#DF2E23",
  criticalRegionColourBorder: "#DF2E2370",

  warningColour: "#FFD23D", // Amber color for warning
  warningColourBorder: "#FFD23D70",
  warningColourText: "#293238",
  warningRegionColour: "#FFD23D",
  warningRegionColourBorder: "#FFD23D70",

  safeColour: "#05865B", // Green color for safe
  safeColourBorder: "#05865B70",
  safeColourText: "#FFF",
  safeRegionColour: "#05865B",
  safeRegionColourBorder: "#05865B70",

  groupColour: "#757575", //grey for group
  groupBorder: "#75757570", //border, including transparency
  groupText: "#fff",

  heatMapDefault: [ "#420052","#6C0485","#8F18AC","#FFBE35","#FFA022"],
  heatMapStepsDefault: 50
};
export const DEFAULT_DISABLE_CLUSTER_ZOOM = "7"; // default disbale cluserting level
