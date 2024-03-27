import React, { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import { regionStatusColor } from "../utils/map";
import LocationPopup from "./LocationPopup";

const Region = ({ region, location, tooltipConfig, defaultHeader }) => {
  // memoize to avoid unnecessary recalculations
  const style = useMemo(
    () => ({
      color: regionStatusColor(location.status).borderColor,
      fillColor: regionStatusColor(location.status).color,
      opacity: 0.5,
    }),
    [location.status],
  );

  // determine the tooltip title, memoized to avoid unnecessary recalculations
  const getTooltipTitle = () => {
    if (location.tooltip_header === "NONE" || location.tooltip_header === "") {
      return null;
    }
    return location.tooltip_header ? location.tooltip_header : defaultHeader;
  };
  const tooltipTitle = useMemo(getTooltipTitle, [
    location.tooltip_header,
    defaultHeader,
  ]);

  // extracted onClick handler
  const handleRegionClick = () => {
    if (location.link) {
      window.open(location.link, "_blank");
    }
  };

  return (
    <GeoJSON key={location.status} data={region} style={style} onClick={handleRegionClick}>
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
