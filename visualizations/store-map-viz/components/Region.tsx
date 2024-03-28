import React, { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import { regionStatusColor } from "../utils/map";
import LocationPopup from "./LocationPopup";

const Region = ({ key, region, location, tooltipConfig, defaultHeader, heatMap, heatMapSteps, customColors }) => {

  const style = useMemo(
    () => {

      if(location.custom_color) {
        return ({
          color: location.custom_color,
          fillColor: location.custom_color,
          opacity: 0.5,
          fillOpacity: 0.7
        });
      } 
      else if(heatMap != null) {
        return ({
        color: heatMap(location.value),
        fillColor: heatMap(location.value),
        opacity: 0.5,
        fillOpacity: 0.7
      });
    } else {
      return ({
        color: regionStatusColor(location.status,customColors).borderColor,
        fillColor: regionStatusColor(location.status,customColors).color,
        opacity: 0.7,
      });
    }
  
  },
    [location.value,heatMapSteps,customColors],
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
    <GeoJSON key={key+"-"+location.value+"-"+style.fillColor} data={region} style={style} onClick={handleRegionClick}>
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
