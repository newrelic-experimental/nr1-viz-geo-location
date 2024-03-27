import React, { useEffect, useState, useRef } from "react";
import { Map, TileLayer } from "react-leaflet";

import Markers from "./Markers";
import Regions from "./Regions";
import { useStoreMap } from "../context/StoreMapContext";

// there are some issues with the default zoom and center from the context
// so just in case we'll set them here
import { DEFAULT_ZOOM, DEFAULT_CENTER } from "../constants";

// fix for broken marker icons
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

const MapView = () => {
  // get the zoom and center from the context (StoreMapContext.tsx)
  const storeMap = useStoreMap();
  // Handle null values explicitly
  const zoom = storeMap.zoom !== null ? storeMap.zoom : DEFAULT_ZOOM;
  const center = storeMap.center !== null ? storeMap.center : DEFAULT_CENTER;

  // use ref for the map to refresh it in Viz's config mode
  const mapRef = useRef(null);

  // This state is used to resize the map when the side or bottom panels are open.
  const [mapStyle, setMapStyle] = useState({
    height: "94vh",
    width: "100%",
  });

  // This effect is used in the config mode of the Viz (before it's added to a dashboard)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.leafletElement.setZoom(zoom);
      mapRef.current.leafletElement.panTo(center);
    }
  }, [zoom, center]);

  //map ratser tiles: https://wiki.openstreetmap.org/wiki/Raster_tile_providers
  return (
    <Map ref={mapRef} center={center} zoom={zoom} style={mapStyle}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <Markers />
      {/* uncomment to turn on Map GeoJson features */}
      <Regions />
    </Map>
  );
};

export default MapView;
