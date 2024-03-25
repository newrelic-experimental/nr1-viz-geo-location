import React from "react";
import { Tooltip } from "react-leaflet";

const LocationPopup = ({ location, config, title, sticky }) => {
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

  let titleHeader;
  if(title && title!="") {
    titleHeader=<h4>{title}</h4>
  }

  return (
    <Tooltip sticky={sticky}>
      {titleHeader}
      <div className="popup-grid">{items}</div>
    </Tooltip>
  );
};

export default LocationPopup;
