import React, { useState, useEffect, useRef } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useNerdGraphQuery } from "../hooks/useNerdGraphQuery";
import { useCustomColors, Status } from "../hooks/useCustomColors";

import {
  createClusterCustomIcon,
  createCustomIcon,
  generateTooltipConfig,
} from "../utils";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";
import { DEFAULT_DISABLE_CLUSTER_ZOOM } from "../constants";

const Markers = () => {
  const { markersQuery, disableClusterZoom, markerColors, markerAggregation } =
    useProps();

  const { data: locations } = useNerdGraphQuery(markersQuery);

  const { customColors } = useCustomColors(markerColors);
  const customColorsRef = useRef(customColors);

  useEffect(() => {
    customColorsRef.current = customColors;
    // Update the renderKey when customColors or markerAggregation changes
    setRenderKey(Math.random());
  }, [customColors, markerAggregation]);

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

  const getPoligonOptions = () => ({
    fillColor: customColors[Status.CLUSTER].borderColor,
    color: customColors[Status.CLUSTER].color,
    weight: 3,
    opacity: 0.9,
    fillOpacity: 0.4,
  });

  return (
    <MarkerClusterGroup
      key={`${markerAggregation}`}
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={
        disableClusterZoom === "default"
          ? DEFAULT_DISABLE_CLUSTER_ZOOM
          : disableClusterZoom
      }
      iconCreateFunction={(cluster) => {
        return createClusterCustomIcon(
          cluster,
          customColorsRef.current,
          markerAggregation
        );
      }}
      polygonOptions={getPoligonOptions()}
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
