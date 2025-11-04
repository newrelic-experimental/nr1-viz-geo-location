import React, { useEffect, useState, useRef } from "react";
import { Map, TileLayer } from "react-leaflet";

import Markers from "./Markers";
import Regions from "./Regions";
import LoadingState from "./LoadingState";
import { useMap } from "../context/MapContextProvider";
import { HistoricalThresholdProvider, useSharedHistoricalThresholds } from "../context/HistoricalThresholdProvider";
import { useProps } from "../context/VizPropsProvider";

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
  const mapProps = useMap();
  // Handle null values explicitly
  const zoom = mapProps.zoom !== null ? mapProps.zoom : DEFAULT_ZOOM;
  const center = mapProps.center !== null ? mapProps.center : DEFAULT_CENTER;
  const noWrap = mapProps.noWrap;

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
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <Map ref={mapRef} center={center} zoom={zoom} style={mapStyle}>
        <TileLayer
          key={noWrap}
          noWrap={noWrap}
          attribution='&copy; <a href="http://osm.org/copyright">Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <HistoricalThresholdProvider>
          <MapContent />
        </HistoricalThresholdProvider>
      </Map>
    </div>
  );
};

// Component to handle loading state and render markers/regions
const MapContent = () => {
  const { 
    markersQuery, 
    regionsQuery,
    enableHistoricalThresholds = false
  } = useProps();
  
  const { loading: historicalLoading } = useSharedHistoricalThresholds();
  
  // Track if we've had any successful data load to avoid showing loading on reloads
  const [hasHadInitialData, setHasHadInitialData] = React.useState(false);
  
  // Check if either markers or regions have data ready
  const markersDataReady = markersQuery ? true : false; // Will be updated by individual components
  const regionsDataReady = regionsQuery ? true : false; // Will be updated by individual components
  
  // Show loading state only if:
  // 1. Historical thresholds are enabled and still loading
  // 2. We have queries that would use the data
  // 3. We haven't had any initial data load yet (to prevent showing on reloads)
  const shouldShowLoading = enableHistoricalThresholds && 
                           historicalLoading && 
                           (markersQuery || regionsQuery) &&
                           !hasHadInitialData;

  // Track when we've had our first successful data load
  React.useEffect(() => {
    if (!historicalLoading && !hasHadInitialData) {
      setHasHadInitialData(true);
    }
  }, [historicalLoading, hasHadInitialData]);

  return (
    <>
      {shouldShowLoading && <LoadingState />}
      <Markers />
      <Regions />
    </>
  );
};

export default MapView;
