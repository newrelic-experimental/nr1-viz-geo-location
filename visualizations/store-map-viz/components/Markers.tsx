import React, { useState, useEffect, useContext } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphMarkerQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";
import {
  createClusterCustomIcon,
  createCustomIcon,
  generateTooltipConfig,
} from "../utils/map";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";
import { DEFAULT_DISABLE_CLUSTER_ZOOM, MARKER_COLOURS } from "../constants";

import { deriveStatus, formatValues } from "../utils/dataFormatting";

const Markers = () => {
  // const nerdletState = useContext(NerdletStateContext);
  const {
    accountId,
    markersQuery,
    disableClusterZoom,
    fetchInterval,
    ignorePicker,
    defaultSince,
  } = useProps();
  const defSinceString =
    defaultSince === undefined || defaultSince === null
      ? ""
      : " " + defaultSince;

  if (markersQuery === null || markersQuery === undefined) {
    return null;
  }

  // timeRange formatting happens in the query (nerdGraphMarkerQuery)
  const { timeRange } = useContext(PlatformStateContext);

  const [locations, setLocations] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const query = nerdGraphMarkerQuery(
        markersQuery,
        timeRange,
        defSinceString,
        ignorePicker
      );
      const variables = { id: parseInt(accountId) };

      try {
        const response = await NerdGraphQuery.query({ query, variables });
        const results = response?.data?.actor?.account?.markers?.results;
        if (results && Array.isArray(results)) {
          results.forEach((location) => {
            deriveStatus(location);
            formatValues(location);
          });
        }
        setLocations(response?.data?.actor?.account?.markers?.results);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error appropriately
      }
    };

    // Perform the immediate fetch to populate the initial data
    fetchData();

    // Then set an interval to continue fetching
    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;

    if (fetchIntervalms >= 1000) {
      const intervalId = setInterval(fetchData, fetchIntervalms);
      // Clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    } else {
      return null;
    }
  }, [timeRange, fetchInterval]);

  // This is a hack to force a re-render when markers show up for the first time.
  // Without this, the createCustomIcon icon (/utils/map.tsx) does not render as expected.
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
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={
        disableClusterZoom === "default"
          ? DEFAULT_DISABLE_CLUSTER_ZOOM
          : disableClusterZoom
      }
      iconCreateFunction={createClusterCustomIcon}
      polygonOptions={{
        fillColor: MARKER_COLOURS.groupBorder,
        color: MARKER_COLOURS.groupBorder,
        weight: 3,
        opacity: 0.9,
        fillOpacity: 0.4,
      }}
    >
      {locations.map((location) => (
        <Marker
          key={location.storeNumber}
          position={[location.latitude, location.longitude]}
          icon={createCustomIcon(location)}
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
