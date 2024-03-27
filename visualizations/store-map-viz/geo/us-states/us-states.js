import stateGeoJSON from "./gz_2010_us_040_00_20m.json";
import stateCodes from "./us-state-codes.json";

//add the state code to the data
stateGeoJSON.features.forEach((feature) => {
  let stateCode = stateCodes.find((state) => {
    return state.id === feature.properties.STATE;
  });
  if (stateCode) {
    feature.properties.STATECODE = stateCode.code;
  }
});
export default stateGeoJSON;
