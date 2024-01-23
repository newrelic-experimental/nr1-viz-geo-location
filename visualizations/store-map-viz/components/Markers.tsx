import React, { useState, useEffect, useContext } from "react";
import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphMarkerQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";
import { createClusterCustomIcon, createCustomIcon, generateTooltipConfig } from "../utils/map";
import LocationPopup from "./LocationPopup";
import { useProps } from "../context/VizPropsProvider";
import { DEFAULT_DISABLE_CLUSTER_ZOOM, MARKER_COLOURS } from "../constants";  

const deriveStatus = (location) => {
  if(location.threshold_critical === undefined && location.threshold_warning == undefined) {
    location.status="NONE";
  } else {
    let status = "OK";
    const critical = location.threshold_critical === undefined ? null : location.threshold_critical;
    const warning = location.threshold_warning === undefined ? null : location.threshold_warning;
  
    const thresholdDirection:string = (critical !== null && warning !== null && critical < warning) ? "LESS" : "MORE"; 
  
    // Determine the color based on the sales property of the location
    if(thresholdDirection === "LESS") { //less than
      if (critical !== null && location.value <= critical) {
        status = "CRITICAL"; 
      } else if (
        warning !== null &&
        location.value >= critical &&
        location.value <= warning
      ) {
        status = "WARNING";
      }
    } else { //more than
      if (critical !== null && location.value >= critical) {
        status = "CRITICAL"; // Red
      } else if (
        warning !== null &&
        location.value < critical &&
        location.value >= warning
      ) {
        status = "WARNING"; // Amber
      }
    }
    location.status = status;
  }

}

const formatValues = (location) =>{
  Object.keys(location).forEach((key)=>{
    if(key.includes("tooltip_") || key=="icon_label" && !key.includes("_precision")) {

      if(location[key+'_precision'] !== undefined) {
        try {
          location[key]=location[key].toFixed(parseInt(location[key+'_precision']));
          delete location[key+'_precision'];
        } catch (error) {
          console.warn(`Value for ${key} does not appear to be numeric, cant change precision`);
        }
      }

      if(location[key+'_prefix'] !== undefined) {
        location[key]=""+location[key+'_prefix']+location[key]
        delete location[key+'_prefix'];
      }

      if(location[key+'_suffix'] !== undefined) {
        location[key]=""+location[key]+location[key+'_suffix']
        delete location[key+'_suffix'];
      }

    }
  })
}

const Markers = () => {
  // const nerdletState = useContext(NerdletStateContext);
  const { accountId, markersQuery, disableClusterZoom, fetchInterval, ignorePicker, defaultSince } = useProps();
  const defSinceString = (defaultSince === undefined || defaultSince === null) ? "" : " "+defaultSince;

  // timeRange formatting happens in the query (nerdGraphMarkerQuery)
  const { timeRange } = useContext(PlatformStateContext);

  const [locations, setLocations] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const query = nerdGraphMarkerQuery(markersQuery,timeRange,defSinceString,ignorePicker);
      const variables = { id: parseInt(accountId) };

      try {
        const response = await NerdGraphQuery.query({ query, variables });
        const results=response?.data?.actor?.account?.sales?.results;
        if(results && Array.isArray(results)) {
          results.forEach(location=>{
            deriveStatus(location);
            formatValues(location);
          })
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
      polygonOptions = {{
        fillColor: MARKER_COLOURS.groupBorder,
        color: MARKER_COLOURS.groupBorder,
        weight: 3,
        opacity: 0.9,
        fillOpacity: 0.4
        }}
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
