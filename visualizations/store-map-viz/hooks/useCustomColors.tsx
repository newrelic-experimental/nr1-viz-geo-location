import { useState, useEffect } from "react";
import { COLORS } from "../constants";

export enum Status {
  CRITICAL = "CRITICAL",
  WARNING = "WARNING",
  OK = "OK",
  NONE = "NONE",
  CLUSTER = "CLUSTER",
}

type CustomColors = {
  critical?: string;
  warning?: string;
  ok?: string;
  none?: string;
  cluster?: string;
};

type ColorSet = {
  color: string;
  borderColor: string;
  textColor: string;
};

type ColorsInput = {
  [key in Status]: ColorSet;
};

const useCustomColors = (
  markerColors: string,
  defaultColors: ColorsInput = COLORS,
): { customColors: ColorsInput } => {
  const [customColors, setCustomColors] = useState<ColorsInput>(defaultColors);

  useEffect(() => {
    if (!markerColors) {
      setCustomColors(defaultColors);
      return;
    }
    const colorsArray = markerColors.split(",");

    const keys: Status[] = [
      Status.CLUSTER,
      Status.NONE,
      Status.OK,
      Status.WARNING,
      Status.CRITICAL,
    ];

    let colorsObject: ColorsInput = { ...defaultColors };

    for (let i = 0; i < colorsArray.length && i < keys.length; i++) {
      const statusKey = keys[i];
      const newColor = colorsArray[i];

      colorsObject[statusKey] = {
        ...colorsObject[statusKey],
        color: newColor,
        borderColor: newColor + "99",
      };
    }
    setCustomColors(colorsObject);
  }, [markerColors, defaultColors]);

  return { customColors };
};

export { useCustomColors };
