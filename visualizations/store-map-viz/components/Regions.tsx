import React, { useEffect, useContext, useState } from "react";
import { PlatformStateContext, NerdGraphQuery } from "nr1";

import { nerdGraphMarkerQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";

import { generateTooltipConfig } from "../utils/map";
import { deriveStatus, formatValues } from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";

import Region from "./Region";
import countries from "../geo/countries.geojson.json";
import geoUSStates from "../geo/us-states/us-states";
import allUKRegions from "../geo/uk-regions/all-uk-regions";

const Regions = () => {
  const { accountId, regionsQuery, fetchInterval, ignorePicker, defaultSince } =
    useProps();

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
        ignorePicker,
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

    if (fetchIntervalms >= 1000) {
      const intervalId = setInterval(fetchData, fetchIntervalms);
      // Clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    } else {
      return null;
    }
  }, [timeRange, fetchInterval]);

  if (!regions || regions.length == 0) {
    return null; //no regions to display
  } else {
    const tooltipConfig = generateTooltipConfig(regions);

    let geoFeatureLocations = [];

    regions.forEach((location, index) => {
      // World Countries
      if (location.geoISOCountry && location.geoISOCountry != "") {
        let feature = countries.features.find((f) => {
          return (
            f.properties.ISO_A3 == location.geoISOCountry ||
            f.properties.ISO_A2 == location.geoISOCountry
          );
        });
        if (feature) {
          geoFeatureLocations.push(
            <Region
              key={index}
              region={feature}
              location={location}
              tooltipConfig={tooltipConfig}
              defaultHeader={feature.properties.ADMIN}
            />,
          );
        } else {
          console.log("Country not found for data, will not render", location);
        }
      }

      // US States (example)
      else if (location.geoUSState && location.geoUSState != "") {
        let feature = geoUSStates.features.find((f) => {
          return (
            f.properties.STATECODE == location.geoUSState ||
            f.properties.STATE == location.geoUSState ||
            f.properties.NAME == location.geoUSState
          );
        });
        if (feature) {
          geoFeatureLocations.push(
            <Region
              key={index}
              region={feature}
              location={location}
              tooltipConfig={tooltipConfig}
              defaultHeader={feature.properties.NAME}
            />,
          );
        } else {
          console.log("US State not found for data, will not render", location);
        }
      }

      // UK Regions (example)
      else if (location.geoUKRegion && location.geoUKRegion != "") {
        let region = allUKRegions.find((f) => {
          return f.name == location.geoUKRegion;
        });
        if (region) {
          region.features.forEach((f) => {
            geoFeatureLocations.push(
              <Region
                key={index}
                region={f}
                location={location}
                tooltipConfig={tooltipConfig}
                defaultHeader={region.name}
              />,
            );
          });
        } else {
          console.log(
            "UK Region not found for data, will not render",
            location,
          );
        }
      }
    });

    return geoFeatureLocations;
  }
};

export default Regions;
