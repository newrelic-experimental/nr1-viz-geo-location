import React, { useState, useEffect, useRef } from "react";
import { Marker, CircleMarker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useNerdGraphQuery } from "../hooks/useNerdGraphQuery";
import { useCustomColors, Status } from "../hooks/useCustomColors";
import { useHeatmap } from "../hooks/useHeatmap";

import {
  createClusterCustomIcon,
  createCustomIcon,
  generateTooltipConfig,
} from "../utils";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";

const Markers = () => {
  const { markersQuery, disableClusterZoom, markerColors, markerAggregation } =
    useProps();

  const { data: locations, lastUpdateStamp } = useNerdGraphQuery(markersQuery);

  const { customColors } = useCustomColors(markerColors);
  const customColorsRef = useRef(customColors);

  const { setRangeMarkers, heatMapStepsMarkers, getGradientColorMarkers } =
    useHeatmap();
  useEffect(() => {
    setRangeMarkers(locations);
  }, [locations]);

  useEffect(() => {
    customColorsRef.current = customColors;
    // Update the renderKey when customColors or markerAggregation changes
    setRenderKey(Math.random());
  }, [customColors, markerAggregation, lastUpdateStamp]);

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

  let disableClusteringAtZoom =
    heatMapStepsMarkers && heatMapStepsMarkers != 0 ? 1 : disableClusterZoom;

  return (
    <MarkerClusterGroup
      key={`${markerAggregation}-${lastUpdateStamp}`}
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={disableClusteringAtZoom}
      iconCreateFunction={(cluster) => {
        return createClusterCustomIcon(
          cluster,
          customColorsRef.current,
          markerAggregation,
        );
      }}
      polygonOptions={getPoligonOptions()}
    >
      {locations.map((location, idx) => {
        if (isNaN(location?.latitude) || isNaN(location?.longitude)) {
          return null;
        }

        const gradientColor =
          heatMapStepsMarkers && heatMapStepsMarkers != 0
            ? getGradientColorMarkers(location.value)
            : null;

        const iconColor =
          gradientColor != null
            ? gradientColor
            : customColors[location.status].color;

        if (location?.icon_radius && !isNaN(location?.icon_radius)) {
          return (
            <CircleMarker
              key={`${idx}-${location.value}-${lastUpdateStamp}`}
              center={[location.latitude, location.longitude]}
              radius={location.icon_radius}
              color={iconColor}
              stroke={location.icon_radius < 8 ? false : true}
              fillOpacity={location.icon_radius < 8 ? 1 : 0.5}
            >
              <LocationPopup location={location} config={tooltipConfig} />
            </CircleMarker>
          );
        } else {
          return (
            <Marker
              key={`${idx}-${location.value}-${lastUpdateStamp}`}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location, customColors, gradientColor)}
              onClick={() => {
                if (location.link) {
                  window.open(location.link, "_blank");
                }
              }}
            >
              <LocationPopup location={location} config={tooltipConfig} />
            </Marker>
          );
        }
      })}
    </MarkerClusterGroup>
  );
};

export default Markers;
