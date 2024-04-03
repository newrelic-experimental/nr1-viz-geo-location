import React, { useState, useEffect } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useNerdGraphQuery } from "../hooks/useNerdGraphQuery";

import {
  createClusterCustomIcon,
  createCustomIcon,
  generateTooltipConfig,
} from "../utils";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";
import { DEFAULT_DISABLE_CLUSTER_ZOOM, MARKER_COLOURS } from "../constants";

const Markers = () => {
  const { markersQuery, disableClusterZoom, markerColors, markerAggregation } =
    useProps();

  const customColors =
    markerColors && markerColors !== "" ? markerColors.split(",") : [];

  const { data: locations } = useNerdGraphQuery(markersQuery);

  // This is a hack to force a re-render when markers show up for the first time.
  const [renderKey, setRenderKey] = useState(Math.random());
  useEffect(() => {
    if (locations) {
      // Force a re-render by changing a state variable
      setRenderKey(Math.random());
    }
  }, [locations]);

  const tooltipConfig = generateTooltipConfig(locations);
  if (locations === undefined) {
    return null;
  }

  return (
    <MarkerClusterGroup
      key={markerAggregation}
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={
        disableClusterZoom === "default"
          ? DEFAULT_DISABLE_CLUSTER_ZOOM
          : disableClusterZoom
      }
      iconCreateFunction={(c) => {
        return createClusterCustomIcon(c, customColors, markerAggregation);
      }}
      polygonOptions={{
        fillColor: customColors[0]
          ? customColors[0] + "70"
          : MARKER_COLOURS.groupBorder,
        color: customColors[0]
          ? customColors[0] + "70"
          : MARKER_COLOURS.groupBorder,
        weight: 3,
        opacity: 0.9,
        fillOpacity: 0.4,
      }}
    >
      {locations.map((location) => (
        <Marker
          key={location.storeNumber}
          position={[location.latitude, location.longitude]}
          icon={createCustomIcon(location, customColors)}
          onClick={() => {
            if (location.link) {
              window.open(location.link, "_blank");
            }
          }}
        >
          <LocationPopup location={location} config={tooltipConfig} />
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};

export default Markers;
