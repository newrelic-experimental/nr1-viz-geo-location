import { MARKER_COLOURS } from "../constants";
import { Status, getColorAttributes } from "./map";

interface ClusterStatusCounts {
  NONE: number;
  OK: number;
  WARNING: number;
  CRITICAL: number;
}

function aggregateStatusCounts(locations: any[]): ClusterStatusCounts {
  const statusCounts: ClusterStatusCounts = {
    NONE: 0,
    OK: 0,
    WARNING: 0,
    CRITICAL: 0,
  };

  locations.forEach((location) => {
    const status = location?.options?.children?.props?.location?.status;
    if (status in statusCounts) {
      statusCounts[status]++;
    }
  });

  return statusCounts;
}

function generatePieStyle(
  clusterStatusBreakdown: ClusterStatusCounts,
  totalLocations: number,
  customColors: any,
): string {
  let pieStyle = `background: ${getColorAttributes(Status.CLUSTER, customColors).borderColor};`;
  const totalStatus =
    clusterStatusBreakdown.OK +
    clusterStatusBreakdown.WARNING +
    clusterStatusBreakdown.CRITICAL;

  if (totalStatus > 0) {
    const criticalDegree = Math.floor(
      (clusterStatusBreakdown.CRITICAL / totalLocations) * 360,
    );
    const warningDegree = Math.floor(
      (clusterStatusBreakdown.WARNING / totalLocations) * 360,
    );

    pieStyle = `background: conic-gradient(${
      getColorAttributes(Status.CRITICAL, customColors).borderColor
    } 0deg ${criticalDegree}deg, ${
      getColorAttributes(Status.WARNING, customColors).borderColor
    } ${criticalDegree}deg ${warningDegree + criticalDegree}deg, ${
      getColorAttributes(Status.OK, customColors).borderColor
    } ${warningDegree + criticalDegree}deg 360deg);`;
  }

  return pieStyle;
}

function calculateAggregatedLabel(cluster, aggregationMode) {
  const childCount = cluster.getChildCount();

  if (
    !aggregationMode ||
    aggregationMode === "" ||
    aggregationMode === "count" ||
    childCount === 0
  ) {
    return childCount.toString();
  }

  let total = 0;
  let minValue = Infinity;
  let maxValue = -Infinity;
  let suffix = "",
    prefix = "",
    precision = 0;

  cluster.getAllChildMarkers().forEach((child) => {
    const {
      value,
      cluster_label_prefix,
      cluster_label_suffix,
      cluster_label_precision,
    } = child.options.children.props.location;

    total += value;
    minValue = Math.min(minValue, value);
    maxValue = Math.max(maxValue, value);

    // all markers have the same suffix, prefix, and precision
    prefix = cluster_label_prefix || prefix;
    suffix = cluster_label_suffix || suffix;
    precision = cluster_label_precision || precision;
  });

  let aggregatedValue;
  switch (aggregationMode) {
    case "average":
      aggregatedValue = total / childCount;
      break;
    case "min":
      aggregatedValue = minValue;
      break;
    case "max":
      aggregatedValue = maxValue;
      break;
    default: // "sum"
      aggregatedValue = total;
      break;
  }

  return `${prefix}${aggregatedValue.toFixed(precision)}${suffix}`;
}

// Custom cluster icon function
export const createClusterCustomIcon = (
  cluster,
  customColors,
  aggregationMode,
) => {
  const locations = cluster.getAllChildMarkers();
  const clusterStatusBreakdown = aggregateStatusCounts(locations);

  let pieStyle = generatePieStyle(
    clusterStatusBreakdown,
    locations.length,
    customColors,
  );

  let clusterLabel = calculateAggregatedLabel(cluster, aggregationMode);

  return L.divIcon({
    html: `<div class="outerPie" style="${pieStyle};">
      <div class="innerPie" style="color: ${MARKER_COLOURS.groupText} ; background-color: ${getColorAttributes(Status.CLUSTER, customColors).color};">
        <span>
          ${clusterLabel}
        </span>
      </div>
    </div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(54, 54, true),
  });
};

// Function to generate a custom icon based on the location property
export const createCustomIcon = (location, customColors) => {
  const status = location.status || "NONE";
  const { color, borderColor, textColor } = getColorAttributes(
    status,
    customColors,
  );

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
