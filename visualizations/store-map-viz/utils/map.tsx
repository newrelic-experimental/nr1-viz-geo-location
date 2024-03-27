import { MARKER_COLOURS } from "../constants";
import { sentenceCase } from "text-case";

// Utility function to get color attributes based on location status
const getColorAttributes = (status) => {
  const colors = {
    CRITICAL: {
      color: MARKER_COLOURS.criticalColour,
      borderColor: MARKER_COLOURS.criticalColourBorder,
      textColor: MARKER_COLOURS.criticalColourText,
    },
    WARNING: {
      color: MARKER_COLOURS.warningColour,
      borderColor: MARKER_COLOURS.warningColourBorder,
      textColor: MARKER_COLOURS.warningColourText,
    },
    OK: {
      color: MARKER_COLOURS.safeColour,
      borderColor: MARKER_COLOURS.safeColourBorder,
      textColor: MARKER_COLOURS.safeColourText,
    },
    NONE: {
      color: MARKER_COLOURS.noneColour,
      borderColor: MARKER_COLOURS.noneBorder,
      textColor: MARKER_COLOURS.noneText,
    },
  };

  return colors[status] || colors.NONE;
};

export const regionStatusColor = (status) => {
  const colors = {
    CRITICAL: {
      color: MARKER_COLOURS.criticalRegionColour,
      borderColor: MARKER_COLOURS.criticalRegionColourBorder,
    },
    WARNING: {
      color: MARKER_COLOURS.warningRegionColour,
      borderColor: MARKER_COLOURS.warningRegionColourBorder,
    },
    OK: {
      color: MARKER_COLOURS.safeRegionColour,
      borderColor: MARKER_COLOURS.safeRegionColourBorder,
    },
    NONE: {
      color: MARKER_COLOURS.noneRegionColour,
      borderColor: MARKER_COLOURS.noneRegionColourBorder,
    },
  };

  return colors[status] || colors.NONE;
};

// Custom cluster icon function
export const createClusterCustomIcon = (cluster) => {
  const locations = cluster.getAllChildMarkers();
  const clusterStatusBreakdown = { NONE: 0, OK: 0, WARNING: 0, CRITICAL: 0 };

  locations.forEach((location) => {
    const status = location?.options?.children?.props?.location?.status;
    if (status in clusterStatusBreakdown) {
      clusterStatusBreakdown[status]++;
    }
  });

  let pie = `background: ${MARKER_COLOURS.groupBorder};`;
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
      MARKER_COLOURS.criticalColourBorder
    } 0deg ${critical}deg, ${
      MARKER_COLOURS.warningColourBorder
    } ${critical}deg ${warning + critical}deg, ${
      MARKER_COLOURS.safeColourBorder
    } ${warning + critical}deg 360deg);`;
  }

  return L.divIcon({
    html: `<div class="outerPie" style="${pie};"><div class="innerPie" style="color: ${
      MARKER_COLOURS.groupText
    }; background-color: ${
      MARKER_COLOURS.groupColour
    };"><span>${cluster.getChildCount()}</span></div></div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(54, 54, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location) => {
  const status = location.status || "NONE";
  const { color, borderColor, textColor } = getColorAttributes(status);

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
