import React from "react";
import { Popup } from "react-leaflet";
import { formatCurrency } from "../utils";
import { MARKER_TOOLTIP } from "../constants";  

const LocationPopup = ({ location, config }) => {

  const items = config.map(item=>{
      return <>
        <div className="popup-label">{item.label}:</div>
        <div>{(typeof item.formatFn) === "function" ? item.formatFn?.(location[item.queryField]): location[item.queryField]}</div>
      </>
  })

  return (
    <Popup>
      <div className="popup-grid">
       {items}
      </div>
    </Popup>
  );
};

export default LocationPopup;
