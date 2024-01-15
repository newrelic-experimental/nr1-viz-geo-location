import { formatCurrency } from "./utils";

export const DEFAULT_ZOOM = 1; // default zoom level
export const DEFAULT_CENTER = "[51.5074, 0.1278]"; // default map center - London
export const FETCH_INTERVAL = 300000; // fetch interval in ms - 5 minutes
export const MARKER_COLOURS = {
    alertColour : "#B22222", // Red color for alert
    warningColour: "#DAA520", // Amber color for warning
    safeColour : "#228B22", // Green color for safe
    groupColor: "#999", //grey for group
    groupBorder: "#9999994d" //border, including transparency
}