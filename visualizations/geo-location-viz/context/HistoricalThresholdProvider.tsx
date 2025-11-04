import React, { createContext, useContext } from "react";
import { useHistoricalThresholdQuery } from "../hooks/useHistoricalThresholdQuery";
import { HistoricalConfig } from "../utils/historicalThresholds";
import { useProps } from "./VizPropsProvider";

interface HistoricalThresholdContextType {
  data: any[];
  error: any;
  loading: boolean;
}

const HistoricalThresholdContext = createContext(null);

export const HistoricalThresholdProvider = ({ children }) => {
  const { 
    thresholdQuery,
    thresholdMatchField = 'name',
    // Historical threshold configuration
    enableHistoricalThresholds = false,
    historicalPeriods = 7,
    historicalPeriodSize = 1,
    historicalPeriodUnit = 'days',
    historicalAggregation = 'average'
  } = useProps();

  // Create historical configuration object
  const historicalConfig: HistoricalConfig = {
    enableHistoricalThresholds,
    historicalPeriods,
    historicalPeriodSize,
    historicalPeriodUnit: historicalPeriodUnit as 'hours' | 'days',
    historicalAggregation: historicalAggregation as 'average' | 'min' | 'max' | 'sum'
  };

  // Single historical threshold query for the entire app
  const { 
    data: historicalThresholdData, 
    error: historicalError, 
    loading: historicalLoading 
  } = useHistoricalThresholdQuery(
    thresholdQuery || '', 
    historicalConfig,
    thresholdMatchField
  );

  const contextValue: HistoricalThresholdContextType = {
    data: historicalThresholdData,
    error: historicalError,
    loading: historicalLoading
  };

  return (
    <HistoricalThresholdContext.Provider value={contextValue}>
      {children}
    </HistoricalThresholdContext.Provider>
  );
};

// Custom hook to use the historical threshold context
export const useSharedHistoricalThresholds = (): HistoricalThresholdContextType => {
  const context = useContext(HistoricalThresholdContext);
  if (context === null) {
    throw new Error("useSharedHistoricalThresholds must be used within a HistoricalThresholdProvider");
  }
  return context;
};
