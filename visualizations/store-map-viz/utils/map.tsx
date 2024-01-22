import { MARKER_COLOURS } from "../constants";
import { sentenceCase } from "text-case";

// Custom cluster icon function
export const createClusterCustomIcon = function (cluster) {
  const locations=cluster.getAllChildMarkers();
  const clusterStatusBreakdown= { OK: 0, WARNING: 0, CRITICAL: 0} 
  locations.forEach(location=>{
    const status = location?.options?.children?.props?.location?.status;
    Object.keys(clusterStatusBreakdown).forEach(key=>{
      if(status === key ) { clusterStatusBreakdown[key]++;}
    })
  })

  let critical = Math.floor((clusterStatusBreakdown.CRITICAL / locations.length) * 360);
  let warning = Math.floor((clusterStatusBreakdown.WARNING / locations.length) * 360);
  let pie = `background: conic-gradient(${MARKER_COLOURS.criticalColourBorder} 0deg ${critical}deg, ${MARKER_COLOURS.warningColourBorder} ${critical}deg ${warning + critical}deg, ${MARKER_COLOURS.safeColourBorder} ${warning + critical}deg 360deg);`

  //failed attempt at using border for the pie
  //let borderPie = `border-radius: 50%; border-image-slice: 1; border-image-source: conic-gradient( ${MARKER_COLOURS.criticalColour} 0deg ${critical}deg, ${MARKER_COLOURS.warningColour} ${critical}deg ${warning + critical}deg, ${MARKER_COLOURS.safeColour} ${warning + critical}deg 360deg);`

  return L.divIcon({
    html: `<div class="outerPie" style="${pie};"><div className="innerPie" style="line-height:34px; background-color: ${MARKER_COLOURS.groupColor}; width: 34px;height: 34px; top: 27px;left: 27px;"><span>${cluster.getChildCount()}</span></div></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(48, 48, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location) => {
  const colour = (location.status==="CRITICAL") ? MARKER_COLOURS.criticalColour : (location.status==="WARNING") ? MARKER_COLOURS.warningColour : MARKER_COLOURS.safeColour; // Default to safe colour
  const borderColour = (location.status==="CRITICAL") ? MARKER_COLOURS.criticalColourBorder : (location.status==="WARNING") ? MARKER_COLOURS.warningColourBorder : MARKER_COLOURS.safeColourBorder; // Default to safe colour
  const textColour = (location.status==="CRITICAL") ? MARKER_COLOURS.criticalColourText : (location.status==="WARNING") ? MARKER_COLOURS.warningColourText : MARKER_COLOURS.safeColourText; // Default to safe colour
  return L.divIcon({
    html: `<div style="color: ${textColour}; background-color: ${colour}; box-shadow:0 0 0 8px ${borderColour};"><span>${location.icon_label===undefined? " " : location.icon_label}</span></div>`,
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