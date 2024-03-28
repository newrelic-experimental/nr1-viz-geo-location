import { MARKER_COLOURS } from "../constants";
import { sentenceCase } from "text-case";

// Utility function to get color attributes based on location status
export const getColorAttributes = (status,customColors) => {
  const overrideColors = customColors ? customColors : [];
  const colors = {
    CRITICAL: {
      color: overrideColors[4] ? overrideColors[4] : MARKER_COLOURS.criticalColour,
      borderColor: overrideColors[4] ? overrideColors[4]+"70" : MARKER_COLOURS.criticalColourBorder,
      textColor: MARKER_COLOURS.criticalColourText,
    },
    WARNING: {
      color: overrideColors[3] ? overrideColors[3] : MARKER_COLOURS.warningColour,
      borderColor: overrideColors[3] ? overrideColors[3]+"70" : MARKER_COLOURS.warningColourBorder,
      textColor: MARKER_COLOURS.warningColourText,
    },
    OK: {
      color:overrideColors[2] ? overrideColors[2] :  MARKER_COLOURS.safeColour,
      borderColor: overrideColors[2] ? overrideColors[2]+"70" : MARKER_COLOURS.safeColourBorder,
      textColor: MARKER_COLOURS.safeColourText,
    },
    NONE: {
      color: overrideColors[1] ? overrideColors[1] : MARKER_COLOURS.noneColour,
      borderColor: overrideColors[1] ? overrideColors[1]+"70" : MARKER_COLOURS.noneBorder,
      textColor: MARKER_COLOURS.noneText,
    },
    CLUSTER: {
      color: overrideColors[0] ? overrideColors[0] : MARKER_COLOURS.groupColour,
      borderColor: overrideColors[0] ? overrideColors[0]+"70" : MARKER_COLOURS.groupBorder,
      textColor: MARKER_COLOURS.groupText,
    },
  };

  return colors[status] || colors.NONE;
};

export const regionStatusColor = (status,customColors) => {

  const overrideColors = (customColors ? customColors : []);
  const colors = {
    CRITICAL: {
      color: overrideColors[3] ? overrideColors[3] : MARKER_COLOURS.criticalRegionColour,
      borderColor: overrideColors[3] ? overrideColors[3] : MARKER_COLOURS.criticalRegionColourBorder,
    },
    WARNING: {
      color: overrideColors[2] ? overrideColors[2] : MARKER_COLOURS.warningRegionColour,
      borderColor: overrideColors[2] ? overrideColors[2] : MARKER_COLOURS.warningRegionColourBorder,
    },
    OK: {
      color: overrideColors[1] ? overrideColors[1] :  MARKER_COLOURS.safeRegionColour,
      borderColor: overrideColors[1] ? overrideColors[1] : MARKER_COLOURS.safeRegionColourBorder,
    },
    NONE: {
      color: overrideColors[0] ? overrideColors[0] : MARKER_COLOURS.noneRegionColour,
      borderColor: overrideColors[0] ? overrideColors[0] :  MARKER_COLOURS.noneRegionColourBorder,
    },
  };

  return colors[status] || colors.NONE;
};

// Custom cluster icon function
export const createClusterCustomIcon = (cluster,customColors) => {
  const locations = cluster.getAllChildMarkers();
  const clusterStatusBreakdown = { NONE: 0, OK: 0, WARNING: 0, CRITICAL: 0 };

  locations.forEach((location) => {
    const status = location?.options?.children?.props?.location?.status;
    if (status in clusterStatusBreakdown) {
      clusterStatusBreakdown[status]++;
    }
  });

  let pie = `background: ${getColorAttributes("CLUSTER",customColors).borderColor};`;
  const totalStatus =
    clusterStatusBreakdown.OK +
    clusterStatusBreakdown.WARNING +
    clusterStatusBreakdown.CRITICAL;

  if (totalStatus !== 0) {
    let critical = Math.floor(
      (clusterStatusBreakdown.CRITICAL / locations.length) * 360,
    );
    let warning = Math.floor(
      (clusterStatusBreakdown.WARNING / locations.length) * 360,
    );
    pie = `background: conic-gradient(${
      getColorAttributes("CRITICAL",customColors).borderColor
    } 0deg ${critical}deg, ${
      getColorAttributes("WARNING",customColors).borderColor
    } ${critical}deg ${warning + critical}deg, ${
      getColorAttributes("OK",customColors).borderColor
    } ${warning + critical}deg 360deg);`;
  }

  return L.divIcon({
    html: `<div class="outerPie" style="${pie};"><div class="innerPie" style="color: ${
      MARKER_COLOURS.groupText
    }; background-color: ${
      getColorAttributes("CLUSTER",customColors).color
    };"><span>${cluster.getChildCount()}</span></div></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(54, 54, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location,customColors) => {
  const status = location.status || "NONE";
  const { color, borderColor, textColor } = getColorAttributes(status,customColors);

  let markerLabel = " ";
  if (location.icon_label !== undefined) {
    markerLabel = location.icon_label;
  } else if (location.value !== undefined) {
    markerLabel = location.value;
  }

  return L.divIcon({
    html: `<div style="color: ${textColor}; background-color: ${color}; box-shadow:0 0 0 6px ${borderColor};"><span>${markerLabel}</span></div>`,
    className: "custom-marker-icon",
    iconSize: [42, 42],
  });
};

// Tool tip config generator
export const generateTooltipConfig = (locations) => {
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

  return config.length > 0 ? config : defaultConfig;
};
