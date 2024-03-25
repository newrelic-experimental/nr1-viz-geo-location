import React, {useEffect, useContext, useState} from "react";
import Region from "./Region";
// import allUKRegions from "../geo/uk-regions/all-uk-regions";
import countries from "../geo/countries.geojson.json"
import {PlatformStateContext, NerdGraphQuery} from "nr1";
import { nerdGraphMarkerQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";
import {deriveStatus, formatValues} from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";
import { generateTooltipConfig} from "../utils/map";


const Regions = () => {
  
  const {
    accountId,
    regionsQuery,
    fetchInterval,
    ignorePicker,
    defaultSince
  } = useProps();

  const [regions, setRegions] = useState([]);

  const defSinceString =
  defaultSince === undefined || defaultSince === null
    ? ""
    : " " + defaultSince;
  if (regionsQuery === null || regionsQuery === undefined) {
      return null;
  }
  

  const { timeRange } = useContext(PlatformStateContext);

  useEffect(() => {
    const fetchData = async () => {
      const query = nerdGraphMarkerQuery(
        regionsQuery,
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
        setRegions(response?.data?.actor?.account?.markers?.results);
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

  if(!regions || regions.length == 0) {
    return null; //no regions to display
  } else {
    const tooltipConfig=generateTooltipConfig(regions)

    let geoFeatureLocations = regions.map((location,index)=>{
      
      let feature;
      if(location.iso_a3 && location.isa_a3!="") {
        feature=countries.features.find((f)=>{ return f.properties.ISO_A3 == location.iso_a3;});
      } else {
        if(location.iso_a2 && location.isa_a2!="") {
          feature=countries.features.find((f)=>{return f.properties.ISO_A2 == location.iso_a2;})
        }
      }
      if(feature) {
        return  <Region key={index} region={feature} location={location} tooltipConfig={tooltipConfig}/>;
      } else {
        console.log("Region could not be found in geo region map",location)
        return null;
      }
    })

    return geoFeatureLocations;
  }



};

export default Regions;
