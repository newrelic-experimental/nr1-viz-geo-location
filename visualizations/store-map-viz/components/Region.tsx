import React from "react";
import { GeoJSON, } from "react-leaflet";
import {regionStatusColor } from "../utils/map";
import LocationPopup from "./LocationPopup";

const Region = ({ region, location, tooltipConfig, defaultHeader }) => {
  const style = () => ({ color: regionStatusColor(location.status).borderColor, fillColor: regionStatusColor(location.status).color, opacity: 0.5 });
  let tooltipTitle=defaultHeader;
  if(location.tooltip_header || location?.tooltip_header=="") {
    if(location.tooltip_header == "NONE" || location.tooltip_header=="") {
      tooltipTitle=null;
    } else {
      tooltipTitle=location.tooltip_header;
    }
  }
  return (
    <GeoJSON data={region} style={style}  
    onClick={() => {
      if (location.link) {
        window.open(location.link, "_blank");
      }
    }}>
      <LocationPopup location={location} config={tooltipConfig} sticky={true} title={tooltipTitle}/>
    </GeoJSON>
  );
};

export default Region;
