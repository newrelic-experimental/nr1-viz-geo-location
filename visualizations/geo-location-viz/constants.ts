export const DEFAULT_ZOOM = 1; // default zoom level
export const DEFAULT_CENTER = [51.5074, 0.1278]; // default map center - London

export const COLORS = {
  NONE: {
    color: "#0c74df",
    borderColor: "#0c74df70",
    textColor: "#FFF",
  },
  CRITICAL: {
    color: "#DF2E23",
    borderColor: "#DF2E2370",
    textColor: "#fff",
  },
  WARNING: {
    color: "#FFD23D",
    borderColor: "#FFD23D70",
    textColor: "#293238",
  },
  OK: {
    color: "#05865B",
    borderColor: "#05865B70",
    textColor: "#FFF",
  },
  CLUSTER: {
    color: "#757575",
    borderColor: "#75757570",
    textColor: "#fff",
  },
  HEATMAP: {
    default: ["#420052", "#6C0485", "#8F18AC", "#FFBE35", "#FFA022"],
    steps: 50,
  },
};
