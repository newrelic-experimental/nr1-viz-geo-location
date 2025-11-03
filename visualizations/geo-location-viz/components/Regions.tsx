import React, { useEffect } from "react";

import { generateTooltipConfig } from "../utils";
import { useProps } from "../context/VizPropsProvider";
import { useDualQuery } from "../hooks/useNerdGraphQuery";
import { useHeatmap } from "../hooks/useHeatmap";

import Region from "./Region";

const Regions = () => {
  const { 
    regionsQuery, 
    thresholdQuery,
    thresholdMatchField = 'name'
  } = useProps();
  
  if (regionsQuery === null || regionsQuery === undefined) {
    return null;
  }

  const { data: regions } = useDualQuery(
    regionsQuery, 
    thresholdQuery, 
    thresholdMatchField
  );

  const { setRange, heatMapSteps, getGradientColor } = useHeatmap();
  useEffect(() => {
    setRange(regions);
  }, [regions]);

  if (!regions || regions.length == 0) {
    return null; //no regions to display
  } else {
    const tooltipConfig = generateTooltipConfig(regions);

    const regionElements = regions.map((location, index) => (
      <Region
        key={index}
        location={location}
        tooltipConfig={tooltipConfig}
        heatMapSteps={heatMapSteps}
        getGradientColor={getGradientColor}
      />
    ));

    return <>{regionElements}</>;
  }
};

export default Regions;
