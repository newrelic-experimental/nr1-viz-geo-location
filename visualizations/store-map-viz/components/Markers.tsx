import React, { useState, useEffect, useContext } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { NerdGraphQuery, PlatformStateContext, NerdletStateContext } from "nr1";

import { nerdGraphSalesQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";
import { createClusterCustomIcon, createCustomIcon, generateTooltipConfig } from "../utils/map";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";
import { DEFAULT_DISABLE_CLUSTER_ZOOM } from "../constants";  

const Markers = () => {
  // const nerdletState = useContext(NerdletStateContext);
  const { accountId, markersQuery, disableClusterZoom, fetchInterval } = useProps();

  // timeRange formatting happens in the query (nerdGraphSalesQuery)
  const { timeRange } = useContext(PlatformStateContext);

  const [locations, setLocations] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const query = nerdGraphSalesQuery(markersQuery,timeRange);
      const variables = { id: parseInt(accountId) };

      try {
        const response = await NerdGraphQuery.query({ query, variables });
        setLocations(response?.data?.actor?.account?.sales?.results);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error appropriately
      }
    };

    // Perform the immediate fetch to populate the initial data
    fetchData();

    // Then set an interval to continue fetching
    const fetchIntervalms = ( fetchInterval === null || fetchInterval === undefined || fetchInterval === "" ) ? FETCH_INTERVAL_DEFAULT * 1000 : fetchInterval * 1000;
    if(fetchIntervalms > 0) {
      const intervalId = setInterval(fetchData, fetchIntervalms );
      return () => clearInterval(intervalId);
    }
    
  }, [timeRange]);


  const tooltipConfig=generateTooltipConfig(locations)
  if(locations === undefined) {
    console.log("No locations in NRQL results to plot. Check the query.");
    return null;
  }
  return (
    <MarkerClusterGroup
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={disableClusterZoom === "default" ? DEFAULT_DISABLE_CLUSTER_ZOOM : disableClusterZoom }
      iconCreateFunction={createClusterCustomIcon}
    >
      {locations.map((location) => (
        <Marker
          key={location.storeNumber}
          position={[location.latitude, location.longitude]}
          icon={createCustomIcon(location)}
          onClick= {()=>{if(location.link) {window.open(location.link, '_blank');}}}
        >
          <LocationPopup location={location} config={tooltipConfig} />
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};

export default Markers;
