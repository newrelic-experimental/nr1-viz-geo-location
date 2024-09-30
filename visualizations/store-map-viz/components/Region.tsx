import React, { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import LocationPopup from "./LocationPopup";
import { useRegionFeature } from "../hooks/useRegionFeature";
import { useProps } from "../context/VizPropsProvider";
import { useCustomColors } from "../hooks/useCustomColors";

const Region = ({
  key,
  location,
  tooltipConfig,
  heatMapSteps,
  getGradientColor,
}: any) => {
  const regionFeature = useRegionFeature(location);
  const { regionColors } = useProps();
  const { customColors } = useCustomColors(regionColors, false);

  const gradientColor = getGradientColor(location.value);

  const style = useMemo(() => {
    if (location.custom_color) {
      return {
        color: location.custom_color,
        fillColor: location.custom_color,
        opacity: 0.5,
        fillOpacity: 0.7,
      };
    } else if (heatMapSteps && heatMapSteps !== 0) {
      return {
        color: gradientColor,
        fillColor: gradientColor,
        opacity: 0.5,
        fillOpacity: 0.7,
      };
    } else {
      return {
        color: customColors[location.status].borderColor,
        fillColor: customColors[location.status].color,
        opacity: 0.7,
      };
    }
  }, [
    location.value,
    heatMapSteps,
    customColors,
    gradientColor,
    location.status,
  ]);

  // determine the tooltip title, memoized to avoid unnecessary recalculations
  const getTooltipTitle = () => {
    if (location.tooltip_header === "NONE" || location.tooltip_header === "") {
      return null;
    }
    return location.tooltip_header
      ? location.tooltip_header
      : regionFeature?.name;
  };
  const tooltipTitle = useMemo(getTooltipTitle, [
    location.tooltip_header,
    regionFeature?.name,
  ]);

  // extracted onClick handler
  const handleRegionClick = () => {
    if (location.link) {
      window.open(location.link, "_blank");
    }
  };

  if (!regionFeature) {
    console.log("Region not found for data, will not render", location);
    return null;
  }

  return (
    <GeoJSON
      key={key + "-" + location.value + "-" + style.fillColor}
      data={regionFeature}
      style={style}
      onClick={handleRegionClick}
    >
      <LocationPopup
        location={location}
        config={tooltipConfig}
        sticky={true}
        title={tooltipTitle}
      />
    </GeoJSON>
  );
};

export default Region;
