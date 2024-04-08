import { useState, useEffect, useCallback } from "react";
import Gradient from "javascript-color-gradient";
import { COLORS } from "../constants";
import { useProps } from "../context/VizPropsProvider";

interface Region {
  value: number;
}

interface HeatmapHook {
  getGradientColor: (value: number) => string;
  heatMapSteps: number;
  setRange: (regions: Region[]) => void;
}

const useHeatmap = (): HeatmapHook => {
  const { heatMapSteps, regionColors } = useProps();
  const [gradientArray, setGradientArray] = useState<string[]>([]);
  const [minValue, setMinValue] = useState<number>(Infinity);
  const [maxValue, setMaxValue] = useState<number>(-Infinity);

  // Function to set the min and max values based on regions
  const setRange = useCallback((regions: Region[]) => {
    let min = Infinity;
    let max = -Infinity;
    regions.forEach((region) => {
      if (region.value < min) min = region.value;
      if (region.value > max) max = region.value;
    });
    setMinValue(min);
    setMaxValue(max);
  }, []);

  const getGradientColor = useCallback(
    (value: number) => {
      if (
        !gradientArray.length ||
        minValue === Infinity ||
        maxValue === -Infinity ||
        minValue === maxValue
      ) {
        return COLORS.NONE.color;
      }
      value = Math.max(minValue, Math.min(value, maxValue));
      let ratio = (value - minValue) / (maxValue - minValue);
      let index = Math.floor(ratio * (gradientArray.length - 1));
      return gradientArray[index];
    },
    [minValue, maxValue, gradientArray],
  );

  useEffect(() => {
    const steps =
      heatMapSteps && heatMapSteps !== ""
        ? parseInt(heatMapSteps, 10)
        : COLORS.HEATMAP.default.length;
    const colors =
      regionColors && regionColors.split(",").length > 1
        ? regionColors.split(",")
        : COLORS.HEATMAP.default;

    const gradient = new Gradient()
      .setColorGradient(...colors)
      .setMidpoint(steps)
      .getColors();
    setGradientArray(gradient);
  }, [heatMapSteps, regionColors, minValue, maxValue]);

  return { getGradientColor, heatMapSteps, setRange };
};

export { useHeatmap };
