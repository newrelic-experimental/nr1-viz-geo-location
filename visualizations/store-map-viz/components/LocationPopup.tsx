import React from "react";
import { Tooltip } from "react-leaflet";

const LocationPopup = ({ location, config, title, sticky }) => {
  const items = config.map((item) => {
    if(!location[item.queryField]) {
      return null;
    } else {
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
    }
  });

  return (
    <Tooltip sticky={sticky}>
      {title && title !== "" && <h4>{title}</h4>}
      <div className="popup-grid">{items}</div>
    </Tooltip>
  );
};

export default LocationPopup;
