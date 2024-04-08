import React, { useEffect } from "react";

import { generateTooltipConfig } from "../utils";
import { useProps } from "../context/VizPropsProvider";
import { useNerdGraphQuery } from "../hooks/useNerdGraphQuery";
import { useHeatmap } from "../hooks/useHeatmap";

import Region from "./Region";
import countries from "../geo/countries.geojson.json";
import geoUSStates from "../geo/us-states/us-states";
import allUKRegions from "../geo/uk-regions/all-uk-regions";

const Regions = () => {
  const { regionsQuery, customColors } = useProps();
  if (regionsQuery === null || regionsQuery === undefined) {
    return null;
  }

  const { data: regions } = useNerdGraphQuery(regionsQuery);

  const { setRange, heatMapSteps, getGradientColor } = useHeatmap();
  useEffect(() => {
    setRange(regions);
  }, [regions]);

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
              customColors={customColors}
              heatMapSteps={heatMapSteps}
              getGradientColor={getGradientColor}
            />
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
              customColors={customColors}
              heatMapSteps={heatMapSteps}
              getGradientColor={getGradientColor}
            />
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
                customColors={customColors}
                heatMapSteps={heatMapSteps}
                getGradientColor={getGradientColor}
              />
            );
          });
        } else {
          console.log(
            "UK Region not found for data, will not render",
            location
          );
        }
      }
    });

    return geoFeatureLocations;
  }
};

export default Regions;
