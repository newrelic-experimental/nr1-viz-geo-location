import React, { useEffect, useContext, useState } from "react";
import { PlatformStateContext, NerdGraphQuery } from "nr1";

import { nerdGraphMarkerQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT, MARKER_COLOURS } from "../constants";

import { generateTooltipConfig } from "../utils/map";
import { deriveStatus, formatValues } from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";

import Region from "./Region";
import countries from "../geo/countries.geojson.json";
import geoUSStates from "../geo/us-states/us-states";
import allUKRegions from "../geo/uk-regions/all-uk-regions";

import  Gradient  from "javascript-color-gradient";

const Regions = () => {
  const { accountId, regionsQuery, fetchInterval, ignorePicker, defaultSince, heatMapSteps, regionColors } = useProps();

  const [regions, setRegions] = useState([]);
  const [HMSteps, setHMSteps] = useState(0);
  const [HMColors,setHMColors] = useState([]);
  const [customColors,setCustomColors] = useState(null);



  const { timeRange } = useContext(PlatformStateContext);

  useEffect(() => {

    const defSinceString =
    defaultSince === undefined || defaultSince === null
      ? ""
      : " " + defaultSince;
    if (regionsQuery === null || regionsQuery === undefined) {
      return null;
    }

    setHMSteps(heatMapSteps && heatMapSteps!="" ? parseInt(heatMapSteps) : 0);
    setHMColors(regionColors && regionColors!="" ? regionColors.split(",") : MARKER_COLOURS.heatMapDefault);
    setCustomColors(regionColors && regionColors!="" ? regionColors.split(",") : null);
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
  }, [timeRange, fetchInterval, heatMapSteps,regionColors,regionsQuery]);

  if (!regions || regions.length == 0) {
    return null; //no regions to display
  } else {
    const tooltipConfig = generateTooltipConfig(regions);

    let geoFeatureLocations = [];

    // ---- heat map configuration  -------

    const gradientSteps=HMSteps;
    let getGradientColor=null;

    if(gradientSteps > 0) {
      let maxValue=-Infinity, minValue=Infinity;
      regions.forEach(location=>{
        maxValue = location.value > maxValue ? location.value : maxValue;
        minValue = location.value < minValue ? location.value : minValue;
      })

      if(HMColors.length > 1) {

        const gradientArray = new Gradient()
        .setColorGradient(...HMColors)
        .setMidpoint(gradientSteps)
        .getColors();

        getGradientColor = (value) => {
          let ratio = (value - minValue) / (maxValue-minValue);
          let element = Math.floor((gradientSteps-1)*ratio);
          return gradientArray[element];
        }
    }
    }


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
              heatMap={getGradientColor}
              heatMapSteps={gradientSteps}
              heatMapColors={HMColors}
              customColors={customColors}
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
              heatMap={getGradientColor}
              heatMapSteps={gradientSteps}
              heatMapColors={HMColors}
              customColors={customColors}
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
                heatMap={getGradientColor}
                heatMapSteps={gradientSteps}
                heatMapColors={HMColors}
                customColors={customColors}
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
