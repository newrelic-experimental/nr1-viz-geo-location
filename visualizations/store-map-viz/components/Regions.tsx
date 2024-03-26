import React, {useEffect, useContext, useState} from "react";
import Region from "./Region";
import countries from "../geo/countries.geojson.json"
import geoUSStates from "../geo/us-states/us-states"
import {PlatformStateContext, NerdGraphQuery} from "nr1";
import { nerdGraphMarkerQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";
import {deriveStatus, formatValues} from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";
import { generateTooltipConfig} from "../utils/map";
import allUKRegions from "../geo/uk-regions/all-uk-regions";





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

    if(fetchIntervalms >=1000) {
    const intervalId = setInterval(fetchData, fetchIntervalms);
      // Clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    } else {
      return null
    }

  }, [timeRange, fetchInterval]);


if (!regions || regions.length === 0) {
    return null; // No regions to display
  }

const generateGeoFeatureLocations = (regions, tooltipConfig) => {
  return regions.flatMap((location, index) => {
    let feature;

    if (location.geoISOCountry) {
      feature = countries.features.find(f => f.properties.ISO_A3 === location.geoISOCountry || f.properties.ISO_A2 === location.geoISOCountry);
    } else if (location.geoUSState) {
      feature = geoUSStates.features.find(f => f.properties.STATECODE === location.geoUSState || f.properties.STATE === location.geoUSState || f.properties.NAME === location.geoUSState);
    } else if (location.geoUKRegion) {
      const region = allUKRegions.find(f => f.name === location.geoUKRegion);
      if (region) {
        return region.features.map((f, featureIndex) => <Region key={`${index}-${featureIndex}`} region={f} location={location} tooltipConfig={tooltipConfig} defaultHeader={region.name} />);
      }
    }

    if (!feature) {
      console.log("Feature not found for data, will not render", location);
      return [];
    }

    return <Region key={index} region={feature} location={location} tooltipConfig={tooltipConfig} defaultHeader={feature.properties.ADMIN || feature.properties.NAME} />;
  });
  
  const tooltipConfig = generateTooltipConfig(regions);
  const geoFeatureLocations = generateGeoFeatureLocations(regions, tooltipConfig);

  return <>{geoFeatureLocations}</>;
};





};

export default Regions;
