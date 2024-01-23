import { MARKER_COLOURS } from "../constants";
import { sentenceCase } from "text-case";

// Custom cluster icon function
export const createClusterCustomIcon = function (cluster) {
  const locations=cluster.getAllChildMarkers();
  const clusterStatusBreakdown= { NONE: 0, OK: 0, WARNING: 0, CRITICAL: 0} 
  locations.forEach(location=>{
    const status = location?.options?.children?.props?.location?.status;
    Object.keys(clusterStatusBreakdown).forEach(key=>{
      if(status === key ) { clusterStatusBreakdown[key]++;}
    })
  })

  let pie=`background: ${MARKER_COLOURS.groupBorder};`;
  if(clusterStatusBreakdown.OK + clusterStatusBreakdown.WARNING + clusterStatusBreakdown.CRITICAL != 0) {
    let critical = Math.floor((clusterStatusBreakdown.CRITICAL / locations.length) * 360);
    let warning = Math.floor((clusterStatusBreakdown.WARNING / locations.length) * 360);
    pie = `background: conic-gradient(${MARKER_COLOURS.criticalColourBorder} 0deg ${critical}deg, ${MARKER_COLOURS.warningColourBorder} ${critical}deg ${warning + critical}deg, ${MARKER_COLOURS.safeColourBorder} ${warning + critical}deg 360deg);`
  }
  

  //failed attempt at using border for the pie
  //let borderPie = `border-radius: 50%; border-image-slice: 1; border-image-source: conic-gradient( ${MARKER_COLOURS.criticalColour} 0deg ${critical}deg, ${MARKER_COLOURS.warningColour} ${critical}deg ${warning + critical}deg, ${MARKER_COLOURS.safeColour} ${warning + critical}deg 360deg);`

  return L.divIcon({
    html: `<div class="outerPie" style="${pie};"><div class="innerPie" style="color: ${MARKER_COLOURS.groupText}; background-color: ${MARKER_COLOURS.groupColour};"><span>${cluster.getChildCount()}</span></div></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(54, 54, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location) => {
  const colour = (location.status==="CRITICAL") ? MARKER_COLOURS.criticalColour : (location.status==="WARNING") ? MARKER_COLOURS.warningColour : (location.status==="OK") ? MARKER_COLOURS.safeColour : MARKER_COLOURS.noneColour; 
  const borderColour = (location.status==="CRITICAL") ? MARKER_COLOURS.criticalColourBorder : (location.status==="WARNING") ? MARKER_COLOURS.warningColourBorder : (location.status==="OK") ? MARKER_COLOURS.safeColourBorder : MARKER_COLOURS.noneBorder;
  const textColour = (location.status==="CRITICAL") ? MARKER_COLOURS.criticalColourText : (location.status==="WARNING") ? MARKER_COLOURS.warningColourText : (location.status==="OK") ?  MARKER_COLOURS.safeColourText : MARKER_COLOURS.noneText; 

  let markerLabel = " " 
  if(location.icon_label!==undefined) {
    markerLabel=location.icon_label;
  } else if(location.value !==undefined ) {
    markerLabel=location.value;
  }
  return L.divIcon({
    html: `<div style="color: ${textColour}; background-color: ${colour}; box-shadow:0 0 0 6px ${borderColour};"><span>${markerLabel}</span></div>`,
    className: "custom-marker-icon",
    iconSize: [42,42],
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