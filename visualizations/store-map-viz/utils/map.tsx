import { useProps } from "../context/VizPropsProvider";
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
  // get the alert and warning values from the viz's context (configuration options)
  const { alert, warning } = useProps();

  let colour = MARKER_COLOURS.safeColour; // Default to safe colour

  // Determine the color based on the sales property of the location
  if (alert !== null && location.value < alert) {
    colour = MARKER_COLOURS.alertColour; // Red
  } else if (
    warning !== null &&
    location.value >= alert &&
    location.value <= warning
  ) {
    colour = MARKER_COLOURS.warningColour; // Amber
  }

  // If both alert and warning are null, always use safeColour
  // If one of them is null, the logic above handles the color assignment

  return L.divIcon({
    html: `<div style="background-color: ${colour}; box-shadow:0 0 0 8px ${colour}11;"><span>${location.iconLabel===undefined? " " : location.iconLabel}</span></div>`,
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