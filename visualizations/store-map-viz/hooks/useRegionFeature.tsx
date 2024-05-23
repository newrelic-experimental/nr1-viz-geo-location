import { useMemo } from "react";

import countries from "../geo/countries.geojson.json";
import geoUSStates from "../geo/us-states/us-states";
import allUKRegions from "../geo/uk-regions/all-uk-regions";

const useRegionFeature = (location) => {
  return useMemo(() => {
    let feature = null;

    if (location.geoISOCountry) {
      feature = countries.features.find((f) =>
        [f.properties.ISO_A3, f.properties.ISO_A2].includes(
          location.geoISOCountry,
        ),
      );
      if (feature) {
        feature.name = feature.properties.ADMIN;
      }
    } else if (location.geoUSState) {
      feature = geoUSStates.features.find((f) =>
        [
          f.properties.STATECODE,
          f.properties.STATE,
          f.properties.NAME,
        ].includes(location.geoUSState),
      );
      if (feature) {
        feature.name = feature.properties.NAME;
      }
    } else if (location.geoUKRegion) {
      feature = allUKRegions.find((r) => r.name === location.geoUKRegion);
    }

    return feature;
  }, [location.geoISOCountry, location.geoUSState, location.geoUKRegion]);
};

export { useRegionFeature };
