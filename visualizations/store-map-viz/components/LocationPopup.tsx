import React from "react";
import { Tooltip } from "react-leaflet";

type AttributesListProps = {
  location: any;
  config: any;
};

type LocationPopupProps = {
  location: any;
  config: any;
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
}: LocationPopupProps) => (
  <Tooltip sticky={sticky}>
    {title && <h4>{title}</h4>}
    <AttributesList location={location} config={config} />
  </Tooltip>
);

export default LocationPopup;
