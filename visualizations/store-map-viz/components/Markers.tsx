import React from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

// const marker = L.markerClusterGroup({
//   iconCreateFunction: function (cluster) {
//     return L.divIcon({ html: "<b>" + cluster.getChildCount() + "</b>" });
//   },
// });
// L.MarkerClusterGroup;

const Markers = ({ locations }) => {
  return (
    <MarkerClusterGroup
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={10}
    >
      {locations.map((location) => (
        <Marker
          key={location.storeNumber}
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <div>StoreNo: {location.storeNumber}</div>
            <div>Sales: {location.sales}</div>
            <div>Amount: £{location.amount}</div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};

export default Markers;
