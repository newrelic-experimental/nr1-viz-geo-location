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

const deriveStatus = (location) => {
  const {
    threshold_critical: critical,
    threshold_warning: warning,
    value,
  } = location;

  if (critical === undefined && warning === undefined) {
    location.status = "NONE";
    return;
  }

  const thresholdDirection =
    critical !== undefined && warning !== undefined && critical < warning
      ? "LESS"
      : "MORE";

  let status = "OK";

  if (thresholdDirection === "LESS") {
    if (critical !== undefined && value <= critical) {
      status = "CRITICAL";
    } else if (warning !== undefined && value >= critical && value <= warning) {
      status = "WARNING";
    }
  } else {
    if (critical !== undefined && value >= critical) {
      status = "CRITICAL";
    } else if (warning !== undefined && value < critical && value >= warning) {
      status = "WARNING";
    }
  }

  location.status = status;
};

const formatValues = (location) => {
  Object.keys(location).forEach((key) => {
    const isTooltip = key.includes("tooltip_");
    const isIconLabel = key === "icon_label" && !key.includes("_precision");

    if (isTooltip || isIconLabel) {
      const precisionKey = `${key}_precision`;
      const prefixKey = `${key}_prefix`;
      const suffixKey = `${key}_suffix`;

      if (location[precisionKey] !== undefined) {
        try {
          location[key] = location[key].toFixed(
            parseInt(location[precisionKey])
          );
          delete location[precisionKey];
        } catch (error) {
          console.warn(
            `Value for ${key} does not appear to be numeric, can't change precision`
          );
        }
      }

      if (location[prefixKey] !== undefined) {
        location[key] = `${location[prefixKey]}${location[key]}`;
        delete location[prefixKey];
      }

      if (location[suffixKey] !== undefined) {
        location[key] = `${location[key]}${location[suffixKey]}`;
        delete location[suffixKey];
      }
    }
  });
};

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
        const results = response?.data?.actor?.account?.sales?.results;
        if (results && Array.isArray(results)) {
          results.forEach((location) => {
            deriveStatus(location);
            formatValues(location);
          });
        }
        setLocations(response?.data?.actor?.account?.sales?.results);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error appropriately
      }
    };

    // Perform the immediate fetch to populate the initial data
    fetchData();

    // Then set an interval to continue fetching
    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    const intervalId = setInterval(fetchData, fetchIntervalms);
    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
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
    console.log("No locations in NRQL results to plot. Check the query.");
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
