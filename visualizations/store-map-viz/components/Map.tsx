import React, { useEffect, useState } from "react";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import { NerdGraphQuery } from "nr1";

import { nerdGraphSalesQuery } from "../queries";

// fix for broken marker icons
// https://stackoverflow.com/questions/41590102/change-leaflet-marker-icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [38, 50],
  shadowSize: [50, 64],
  iconAnchor: [22, 50],
  shadowAnchor: [22, 64],
  popupAnchor: [-3, -50],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapView = ({ mapCenter }) => {
  // This state is used to resize the map when the side or bottom panels are open.
  const [mapStyle, setMapStyle] = useState({
    height: "94vh",
    width: "100%",
  });

  const [locations, setLocations] = useState([]);

  useEffect(async () => {
    const accountId = 3495486;
    const variables = {
      id: parseInt(accountId),
    };
    const response = await NerdGraphQuery.query({
      query: nerdGraphSalesQuery(),
      variables,
    });

    setLocations(response.data.actor.account.sales.results);
  }, []);

  console.log({ locations });

  return (
    <Map center={mapCenter} zoom={5} style={mapStyle}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {locations.map((location) => (
        <Marker
          key={location.Location}
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <div>Sales: {location.sales}</div>
            <div>Amount: £{location.amount}</div>
          </Popup>
        </Marker>
      ))}
    </Map>
  );
};

export default MapView;
