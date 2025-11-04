import React, { useState, useEffect, useRef } from "react";
import { Marker, CircleMarker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useEnhancedDualQuery } from "../hooks/useNerdGraphQuery";
import { HistoricalConfig } from "../utils/historicalThresholds";
import { useCustomColors, Status } from "../hooks/useCustomColors";
import { useHeatmap } from "../hooks/useHeatmap";
import { useOpenDashboard } from "../hooks/useOpenDashboard";
import { useSharedHistoricalThresholds } from "../context/HistoricalThresholdProvider";

import {
  createClusterCustomIcon,
  createCustomIcon,
  generateTooltipConfig,
} from "../utils";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";

const Markers = () => {
  const { 
    markersQuery, 
    thresholdQuery,
    thresholdMatchField = 'name',
    disableClusterZoom, 
    markerColors, 
    markerAggregation,
    // Historical threshold configuration
    enableHistoricalThresholds = false,
    historicalPeriods = 7,
    historicalPeriodSize = 1,
    historicalPeriodUnit = 'days',
    historicalAggregation = 'average',
    // Tooltip configuration
    showThresholdsInTooltips = false,
    showHistoricalValuesInTooltips = false
  } = useProps();

  const openDashboard = useOpenDashboard();

  // Get shared historical threshold data
  const { data: historicalThresholdData, loading: historicalLoading, error: historicalError } = useSharedHistoricalThresholds();

  // Create historical configuration object
  const historicalConfig: HistoricalConfig = {
    enableHistoricalThresholds,
    historicalPeriods,
    historicalPeriodSize,
    historicalPeriodUnit: historicalPeriodUnit as 'hours' | 'days',
    historicalAggregation: historicalAggregation as 'average' | 'min' | 'max' | 'sum'
  };

  // Use enhanced dual query with shared historical threshold data
  const { data: locations, lastUpdateStamp, loading, dataReady } = useEnhancedDualQuery(
    markersQuery, 
    thresholdQuery, 
    thresholdMatchField, 
    historicalConfig,
    historicalThresholdData,
    historicalLoading,
    historicalError
  );

  const { customColors } = useCustomColors(markerColors);
  const customColorsRef = useRef(customColors);

  const { setRangeMarkers, heatMapStepsMarkers, getGradientColorMarkers } =
    useHeatmap();
  useEffect(() => {
    setRangeMarkers(locations);
  }, [locations]);

  useEffect(() => {
    customColorsRef.current = customColors;
    // Update the renderKey when customColors, markerAggregation, or disableClusterZoom changes
    setRenderKey(Math.random());
  }, [customColors, markerAggregation, lastUpdateStamp, disableClusterZoom, heatMapStepsMarkers]);

  // This is a hack to force a re-render when markers show up for the first time.
  const [renderKey, setRenderKey] = useState(Math.random());
  useEffect(() => {
    if (locations) {
      // Force a re-render by changing a state variable
      setRenderKey(Math.random());
    }
  }, [locations]);

  const tooltipConfig = generateTooltipConfig(locations, showThresholdsInTooltips, showHistoricalValuesInTooltips);
  
  // Only wait for dataReady on initial load to prevent flickering
  // On subsequent loads, show data as soon as locations are available
  if (locations === undefined) {
    return null;
  }
  
  // If historical thresholds are enabled and we don't have any data yet, wait for dataReady
  // This prevents the initial flickering but allows subsequent reloads to show immediately
  if (enableHistoricalThresholds && locations.length === 0 && !dataReady) {
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
      key={`${markerAggregation}-${lastUpdateStamp}-${disableClusterZoom}-${heatMapStepsMarkers}`}
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

        const popupTitle = location.tooltip_header || null;
        if (location?.icon_radius && !isNaN(location?.icon_radius)) {
          return (
            <CircleMarker
              key={`${idx}-${location.value}-${lastUpdateStamp}`}
              center={[location.latitude, location.longitude]}
              radius={location.icon_radius}
              color={iconColor}
              stroke={location.icon_radius < 8 ? false : true}
              fillOpacity={location.icon_radius < 8 ? 1 : 0.5}
              onClick={() => {
                if (location.dash_guid) {
                  openDashboard(location);
                } else if (location.link) {
                  window.open(location.link, "_blank");
                }
              }}
            >
              <LocationPopup
                location={location}
                title={popupTitle}
                config={tooltipConfig}
              />
            </CircleMarker>
          );
        } else {
          return (
            <Marker
              key={`${idx}-${location.value}-${lastUpdateStamp}`}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location, customColors, gradientColor)}
              onClick={() => {
                if (location.dash_guid) {
                  openDashboard(location);
                } else if (location.link) {
                  window.open(location.link, "_blank");
                }
              }}
            >
              <LocationPopup
                location={location}
                title={popupTitle}
                config={tooltipConfig}
              />
            </Marker>
          );
        }
      })}
    </MarkerClusterGroup>
  );
};

export default Markers;
