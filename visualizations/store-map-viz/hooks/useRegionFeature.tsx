import { useMemo } from "react";

import countriesData from "../geo/countries.geojson.json";
import geoUSStates from "../geo/us-states/us-states";
import allUKRegions from "../geo/uk-regions/all-uk-regions";

interface Location {
  geoISOCountry?: string;
  geoUSState?: string;
  geoUKRegion?: string;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface GeoJSONFeature {
  name?: string;
  properties?: {
    ADMIN?: string;
    ISO_A3?: string;
    ISO_A2?: string;
    STATECODE?: string;
    STATE?: string;
    NAME?: string;
  };
  geometry?: {
    type: string;
    coordinates: number[][] | number[][][] | number[][][][];
  };
}

const countries: GeoJSONFeatureCollection =
  countriesData as GeoJSONFeatureCollection;

const useRegionFeature = (location: Location): GeoJSONFeature | null => {
  return useMemo(() => {
    let feature: GeoJSONFeature | undefined = undefined;

    if (location.geoISOCountry) {
      feature = countries.features.find((f: GeoJSONFeature) =>
        [f.properties?.ISO_A3, f.properties?.ISO_A2].includes(
          location.geoISOCountry
        )
      );
      if (feature) {
        feature.name = feature.properties?.ADMIN || "";
      }
    } else if (location.geoUSState) {
      feature = geoUSStates.features.find((f) =>
        [
          f.properties.STATECODE,
          f.properties.STATE,
          f.properties.NAME,
        ].includes(location.geoUSState)
      );
      if (feature) {
        feature.name = feature.properties?.NAME || "";
      }
    } else if (location.geoUKRegion) {
      feature = allUKRegions.find((r) => r.name === location.geoUKRegion);
    }

    return feature || null;
  }, [location.geoISOCountry, location.geoUSState, location.geoUKRegion]);
};

export { useRegionFeature };
