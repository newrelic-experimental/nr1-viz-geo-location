import { useState, useEffect, useCallback } from "react";
import Gradient from "javascript-color-gradient";
import { COLORS } from "../constants";
import { useProps } from "../context/VizPropsProvider";

interface Region {
  value: number;
}

interface HeatmapHook {
  getGradientColor: (value: number) => string;
  getGradientColorMarkers: (value: number) => string;
  heatMapSteps: number;
  heatMapStepsMarkers: number;
  setRange: (regions: Region[]) => void;
  setRangeMarkers: (regions: Region[]) => void;
  setRangePercentage: (percentageRange: { min: number, max: number }) => void;
  setRangeMarkersPercentage: (percentageRange: { min: number, max: number }) => void;
}

const useHeatmap = (): HeatmapHook => {
  const { heatMapSteps, heatMapStepsMarkers, regionColors, markerColors } =
    useProps();

  //regions
  const [gradientArray, setGradientArray] = useState<string[]>([]);
  const [minValue, setMinValue] = useState<number>(Infinity);
  const [maxValue, setMaxValue] = useState<number>(-Infinity);

  //markers
  const [gradientArrayMarkers, setGradientArrayMarkers] = useState<string[]>(
    [],
  );
  const [minValueMarkers, setMinValueMarkers] = useState<number>(Infinity);
  const [maxValueMarkers, setMaxValueMarkers] = useState<number>(-Infinity);

  // Function to set the min and max values based on regions
  const setRangeMinMax = useCallback(
    (regions: Region[], setterMin: (value: number) => void, setterMax: (value: number) => void) => {
      let min = Infinity;
      let max = -Infinity;
      regions.forEach((region) => {
        if (region.value < min) min = region.value;
        if (region.value > max) max = region.value;
      });
      setterMin(min);
      setterMax(max);
    },
    [],
  );

  // Function to set symmetric percentage-based ranges
  const setRangePercentageInternal = useCallback(
    (percentageRange: { min: number, max: number }, setterMin: (value: number) => void, setterMax: (value: number) => void) => {
      setterMin(percentageRange.min);
      setterMax(percentageRange.max);
    },
    [],
  );

  //for regions
  const setRange = useCallback((regions: Region[]) => {
    setRangeMinMax(regions, setMinValue, setMaxValue);
  }, [setRangeMinMax]);

  // for markers
  const setRangeMarkers = useCallback((regions: Region[]) => {
    setRangeMinMax(regions, setMinValueMarkers, setMaxValueMarkers);
  }, [setRangeMinMax]);

  // for regions percentage
  const setRangePercentage = useCallback((percentageRange: { min: number, max: number }) => {
    setRangePercentageInternal(percentageRange, setMinValue, setMaxValue);
  }, [setRangePercentageInternal]);

  // for markers percentage
  const setRangeMarkersPercentage = useCallback((percentageRange: { min: number, max: number }) => {
    setRangePercentageInternal(percentageRange, setMinValueMarkers, setMaxValueMarkers);
  }, [setRangePercentageInternal]);

  const getGradientColorForRange = (value: number, gradArray: string[], min: number, max: number): string => {
    if (
      !gradArray.length ||
      min === Infinity ||
      max === -Infinity ||
      min === max
    ) {
      return COLORS.NONE.color;
    }
    value = Math.max(min, Math.min(value, max));
    let ratio = (value - min) / (max - min);
    let index = Math.floor(ratio * (gradArray.length - 1));
    return gradArray[index];
  };

  // for regions
  const getGradientColor = useCallback(
    (value: number) => {
      return getGradientColorForRange(value, gradientArray, minValue, maxValue);
    },
    [minValue, maxValue, gradientArray],
  );

  //for markers
  const getGradientColorMarkers = useCallback(
    (value: number) => {
      return getGradientColorForRange(
        value,
        gradientArrayMarkers,
        minValueMarkers,
        maxValueMarkers,
      );
    },
    [minValueMarkers, maxValueMarkers, gradientArrayMarkers],
  );

  const generateGradient = (hmSteps: any, colorPallete: any, setGrad: (gradient: string[]) => void) => {
    let steps = hmSteps && hmSteps !== "" ? parseInt(hmSteps, 10) : 0;
    steps = isNaN(steps) ? 0 : steps;
    if (steps != 0) {
      const colors =
        colorPallete && colorPallete.split(",").length > 1
          ? colorPallete.split(",")
          : COLORS.HEATMAP.default;

      const gradient = new Gradient()
        .setColorGradient(...colors)
        .setMidpoint(steps < colors.length ? colors.length : steps) // we always have as many points as colors
        .getColors();
      setGrad(gradient);
    }
  };

  useEffect(() => {
    generateGradient(heatMapSteps, regionColors, setGradientArray);
  }, [heatMapSteps, regionColors, minValue, maxValue]);

  useEffect(() => {
    generateGradient(
      heatMapStepsMarkers,
      markerColors,
      setGradientArrayMarkers,
    );
  }, [heatMapStepsMarkers, markerColors, minValueMarkers, maxValueMarkers]);

  return {
    getGradientColor,
    getGradientColorMarkers,
    heatMapSteps,
    heatMapStepsMarkers,
    setRange,
    setRangeMarkers,
    setRangePercentage,
    setRangeMarkersPercentage,
  };
};

export { useHeatmap };
