import React from "react";
import Region from "./Region";
import allGeoRegions from "../geo/all-geo-regions";

const Regions = () => {
  return allGeoRegions.map((region, index) => (
    <Region key={index} region={region} />
  ));
};

export default Regions;
