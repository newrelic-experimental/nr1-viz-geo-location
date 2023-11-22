import { useProps } from "../context/VizPropsProvider";

// Custom cluster icon function
export const createClusterCustomIcon = function (cluster) {
  return L.divIcon({
    html: `<div><span>${cluster.getChildCount()}</span></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(40, 40, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location) => {
  // get the alert and warning values from the viz's context (configuration options)
  const { alert, warning } = useProps();

  const alertColour = "rgba(255, 80, 71, 0.7)"; // Red color for alert
  const warningColour = "rgba(255, 150, 0, 0.7)"; // Amber color for warning
  const safeColour = "rgba(60, 179, 113, 0.7)"; // Green color for safe

  let colour = safeColour; // Default to safe colour

  // Determine the color based on the sales property of the location
  if (alert !== null && location.amount < alert) {
    colour = alertColour; // Red
  } else if (
    warning !== null &&
    location.amount >= alert &&
    location.amount <= warning
  ) {
    colour = warningColour; // Amber
  }

  // If both alert and warning are null, always use safeColour
  // If one of them is null, the logic above handles the color assignment

  return L.divIcon({
    html: `<div style="background-color: ${colour};"><span>${location.storeNumber}</span></div>`,
    className: "custom-marker-icon",
    iconSize: [40, 40],
  });
};
