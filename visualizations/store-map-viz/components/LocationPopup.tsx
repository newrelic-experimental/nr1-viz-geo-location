import React from "react";
import { Popup } from "react-leaflet";
import { formatCurrency } from "../utils";

const LocationPopup = ({ location }) => {
  return (
    <Popup>
      <div className="popup-grid">
        <div className="popup-label">Name:</div>
        <div>{location.costCenterName}</div>

        <div className="popup-label">StoreNo:</div>
        <div>{location.storeNumber}</div>

        <div className="popup-label">Sales:</div>
        <div>{location.sales}</div>

        <div className="popup-label">Amount:</div>
        <div>{formatCurrency(location.amount)}</div>
      </div>
    </Popup>
  );
};

export default LocationPopup;
