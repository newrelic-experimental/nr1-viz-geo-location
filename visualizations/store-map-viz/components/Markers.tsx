import React, { useState, useEffect, useContext } from "react";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphSalesQuery } from "../queries";
import { FETCH_INTERVAL } from "../contstants";

const Markers = () => {
  // const nerdletState = useContext(NerdletStateContext);
  const accountId = 3495486; //nerdletState.visualizationProps.accountId;

  const { timeRange } = useContext(PlatformStateContext);
  // Function to format timeRange
  const formatTimeRange = (timeRange) => {
    // Return an object with all nulls if timeRange is not provided
    // this is when the user is in the config panel
    if (timeRange === undefined) {
      return { begin_time: null, duration: null, end_time: null };
    }
    // Create a new object with either the provided value or null for each property
    return {
      begin_time: timeRange.begin_time || null,
      duration: timeRange.duration || null,
      end_time: timeRange.end_time || null,
    };
  };

  // Use the function to set the timeRange
  const time = formatTimeRange(timeRange);

  const [locations, setLocations] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const query = nerdGraphSalesQuery(time);
      const variables = { id: parseInt(accountId) };

      try {
        const response = await NerdGraphQuery.query({ query, variables });
        const locations = response?.data?.actor?.account?.sales?.results;

        setLocations(locations);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Handle error appropriately
      }
    };

    // Perform the immediate fetch to populate the initial data
    // fetchData();

    // Then set an interval to continue fetching
    const intervalId = setInterval(fetchData, FETCH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [time]);

  return (
    <MarkerClusterGroup
      singleMarkerMode={true}
      spiderfyOnMaxZoom={7}
      disableClusteringAtZoom={10}
    >
      {locations.map((location) => (
        <Marker
          key={location.storeNumber}
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <div>StoreNo: {location.storeNumber}</div>
            <div>Sales: {location.sales}</div>
            <div>Amount: £{location.amount}</div>
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};

export default Markers;
