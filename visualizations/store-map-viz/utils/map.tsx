import { MARKER_COLOURS } from "../constants";
import { sentenceCase } from "text-case";

// Custom cluster icon function
export const createClusterCustomIcon = function (cluster) {
  return L.divIcon({
    html: `<div style="background-color: ${MARKER_COLOURS.groupColor}; box-shadow:0 0 0 8px ${MARKER_COLOURS.groupBorder};"><span>${cluster.getChildCount()}</span></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(40, 40, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location) => {

  let colour = MARKER_COLOURS.safeColour; // Default to safe colour
  const critical = location.threshold_critical === undefined ? null : location.threshold_critical;
  const warning = location.threshold_warning === undefined ? null : location.threshold_warning;

  // determine if our threholds are more than or less than thresholds
  const thresholdDirection= (critical !== null && warning !== null && critical < warning) ? "LESS" : "MORE"; 

  // Determine the color based on the sales property of the location
  if(thresholdDirection === "LESS") { //less than
    if (critical !== null && location.value < critical) {
      colour = MARKER_COLOURS.criticalColour; // Red
    } else if (
      warning !== null &&
      location.value >= critical &&
      location.value <= warning
    ) {
      colour = MARKER_COLOURS.warningColour; // Amber
    }
  } else { //more than
    if (critical !== null && location.value >= critical) {
      colour = MARKER_COLOURS.criticalColour; // Red
    } else if (
      warning !== null &&
      location.value < critical &&
      location.value >= warning
    ) {
      colour = MARKER_COLOURS.warningColour; // Amber
    }
  }


  // If both alert and warning are null, always use safeColour
  // If one of them is null, the logic above handles the color assignment

  return L.divIcon({
    html: `<div style="background-color: ${colour}; box-shadow:0 0 0 8px ${colour}11;"><span>${location.icon_label===undefined? " " : location.icon_label}</span></div>`,
    className: "custom-marker-icon",
    iconSize: [40, 40],
  });
};


// Tool tip config generator
export const generateTooltipConfig = function (locations) {
  if(locations && locations.length > 0) {
    let config:{
      label:string; 
      queryField:string;
    }[] = [];
    Object.keys(locations[0]).forEach((key)=>{
      if(key.includes("tooltip_")) {
        config.push({
          label: sentenceCase(key.replace(/.*tooltip_/gm,"").replace(/_/gm," ")), //allows sorting by prefixing tooltip with letters that force sort
          queryField: key
        })
      }
    })

    if(locations[0].name) {
      config= [{label:"Name", queryField:"name"}, ...config]
    }

    return config;

  } else {
    return [
      {label: "Name", queryField:"name"},
      {label: "Value", queryField:"value"},
    ]
  }

};