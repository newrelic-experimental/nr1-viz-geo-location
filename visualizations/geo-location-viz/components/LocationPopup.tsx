import React from "react";
import { Tooltip } from "react-leaflet";

type AttributesListProps = {
  location: any;
  config: any;
};

type LocationPopupProps = {
  location: any;
  config: any;
  isRegion?: boolean;
  title?: string;
  sticky?: boolean;
};

const AttributesList = ({ location, config }: AttributesListProps) => {
  const items = config.map((item, index) => {
    const value = location[item.queryField];
    const formattedValue =
      typeof item.formatFn === "function" ? item.formatFn(value) : value;

    return value ? (
      <React.Fragment key={index}>
        <div className="popup-label">{item.label}:</div>
        <div>{formattedValue}</div>
      </React.Fragment>
    ) : null;
  });

  return <div className="popup-grid">{items}</div>;
};

const LocationPopup = ({
  location,
  config,
  title,
  sticky,
  isRegion,
}: LocationPopupProps) => {
  let isPermanent = false;
  let isSticky = sticky;
  let offset = [0, 0];
  let direction = "auto";

  if (location.popup_visibility === "ALWAYS") {
    //best avoided for regions!
    isSticky = false;
    isPermanent = true;

    if (!isRegion) {
      //we only need to adjust the tool tip location if its always showing
      // we force it to the left for consistency and so as not to overlap the marker
      direction = "left";
      if (location.icon_radius) {
        offset = [0 - location.icon_radius, 0];
      } else if (location.icon_size) {
        offset = [0 - location.icon_size / 2, 0];
      } else if (location.icon_url || location.icon_svg) {
        offset = [-10, 0]; //default is 20px
      } else {
        offset = [-24, 0];
      }
    }
  }
  if (location.popup_visibility === "NEVER") {
    return null;
  }
  return (
    <Tooltip
      sticky={isSticky}
      permanent={isPermanent}
      offset={offset}
      direction={direction}
    >
      {title && <h4>{title}</h4>}
      <AttributesList location={location} config={config} />
    </Tooltip>
  );
};

export default LocationPopup;
