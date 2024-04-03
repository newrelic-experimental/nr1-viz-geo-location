import { MARKER_COLOURS } from "../constants";
import { sentenceCase } from "text-case";

export enum Status {
  CRITICAL = "CRITICAL",
  WARNING = "WARNING",
  OK = "OK",
  NONE = "NONE",
  CLUSTER = "CLUSTER",
}

type ColorAttributes = {
  color: string;
  borderColor: string;
  textColor?: string;
};

type CustomColors = {
  critical?: string;
  warning?: string;
  ok?: string;
  none?: string;
  cluster?: string;
};

// Utility function to get color attributes based on location status
export const getColorAttributes = (
  status: Status,
  customColors: CustomColors = {},
): ColorAttributes => {
  const defaultColors = {
    [Status.CRITICAL]: {
      color: MARKER_COLOURS.criticalColour,
      borderColor: MARKER_COLOURS.criticalColourBorder,
      textColor: MARKER_COLOURS.criticalColourText,
    },
    [Status.WARNING]: {
      color: MARKER_COLOURS.warningColour,
      borderColor: MARKER_COLOURS.warningColourBorder,
      textColor: MARKER_COLOURS.warningColourText,
    },
    [Status.OK]: {
      color: MARKER_COLOURS.safeColour,
      borderColor: MARKER_COLOURS.safeColourBorder,
      textColor: MARKER_COLOURS.safeColourText,
    },
    [Status.NONE]: {
      color: MARKER_COLOURS.noneColour,
      borderColor: MARKER_COLOURS.noneBorder,
      textColor: MARKER_COLOURS.noneText,
    },
    [Status.CLUSTER]: {
      color: MARKER_COLOURS.groupColour,
      borderColor: MARKER_COLOURS.groupBorder,
      textColor: MARKER_COLOURS.groupText,
    },
  };

  const overrideColor =
    customColors[status.toLowerCase() as keyof CustomColors];

  const colorAttributes = defaultColors[status];
  if (overrideColor) {
    colorAttributes.color = overrideColor;
    colorAttributes.borderColor = overrideColor + "99"; // Assuming the need to append "99" for transparency remains
  }

  return colorAttributes;
};

export const regionStatusColor = (
  status: Status,
  customColors: CustomColors = {},
): ColorAttributes => {
  const defaultColors: {
    [key in Exclude<Status, Status.CLUSTER>]: ColorAttributes;
  } = {
    [Status.CRITICAL]: {
      color: MARKER_COLOURS.criticalRegionColour,
      borderColor: MARKER_COLOURS.criticalRegionColourBorder,
    },
    [Status.WARNING]: {
      color: MARKER_COLOURS.warningRegionColour,
      borderColor: MARKER_COLOURS.warningRegionColourBorder,
    },
    [Status.OK]: {
      color: MARKER_COLOURS.safeRegionColour,
      borderColor: MARKER_COLOURS.safeRegionColourBorder,
    },
    [Status.NONE]: {
      color: MARKER_COLOURS.noneRegionColour,
      borderColor: MARKER_COLOURS.noneRegionColourBorder,
    },
  };

  const statusKey = status.toLowerCase();
  const overrideColor =
    customColors && customColors[statusKey] ? customColors[statusKey] : null;

  if (overrideColor) {
    return {
      color: overrideColor,
      borderColor: overrideColor,
    };
  }

  return defaultColors[status];
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
