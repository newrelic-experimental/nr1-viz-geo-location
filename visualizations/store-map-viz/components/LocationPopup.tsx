import React from "react";
import { Tooltip } from "react-leaflet";

const LocationPopup = ({ location, config }) => {
  const items = config.map((item) => {
    return (
      <>
        <div className="popup-label">{item.label}:</div>
        <div>
          {typeof item.formatFn === "function"
            ? item.formatFn?.(location[item.queryField])
            : location[item.queryField]}
        </div>
      </>
    );
  });

  return (
    <Tooltip>
      <div className="popup-grid">{items}</div>
    </Tooltip>
  );
};

export default LocationPopup;
