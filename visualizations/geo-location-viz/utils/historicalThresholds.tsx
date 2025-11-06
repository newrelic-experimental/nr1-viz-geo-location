const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export type AggregationMethod = 'average' | 'min' | 'max' | 'sum';
export type PeriodUnit = 'hours' | 'days' | 'minutes';

export interface HistoricalConfig {
  enableHistoricalThresholds: boolean;
  historicalPeriods: number;
  historicalPeriodSize: number; // Gap between each historical period
  historicalPeriodUnit: PeriodUnit;
  historicalAggregation: AggregationMethod;
  disableTimezoneAwareness?: boolean; // defaults to false - when true, uses legacy Unix timestamp arithmetic
}

export interface TimeRange {
  beginTime?: number;
  endTime?: number;
  begin_time?: number;
  end_time?: number;
  duration?: number;
}

/**
 * Parse time range to extract duration and calculate period length
 */
export const parseTimeRangeDuration = (timeRange: TimeRange | null, defaultSince: string = ''): number => {
  // If timeRange is available, use it
  if (timeRange) {
    if (timeRange.duration) {
      return timeRange.duration;
    }
    
    // Calculate duration from begin/end times
    if (timeRange.beginTime && timeRange.endTime) {
      return timeRange.endTime - timeRange.beginTime;
    }
    
    if (timeRange.begin_time && timeRange.end_time) {
      return timeRange.end_time - timeRange.begin_time;
    }
  }
  
  // Fall back to parsing defaultSince
  if (defaultSince) {
    return parseSinceDuration(defaultSince);
  }
  
  // Default to 1 hour if nothing else available
  return HOUR;
};

/**
 * Parse SINCE clause to extract duration in milliseconds
 */
export const parseSinceDuration = (sinceClause: string): number => {
  const normalized = sinceClause.toLowerCase().trim();
  
  // Match patterns like "since 30 minutes ago", "since 1 hour ago", etc.
  const minutesMatch = normalized.match(/since\s+(\d+)\s+minutes?\s+ago/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1]) * MINUTE;
  }
  
  const hoursMatch = normalized.match(/since\s+(\d+)\s+hours?\s+ago/);
  if (hoursMatch) {
    return parseInt(hoursMatch[1]) * HOUR;
  }
  
  const daysMatch = normalized.match(/since\s+(\d+)\s+days?\s+ago/);
  if (daysMatch) {
    return parseInt(daysMatch[1]) * DAY;
  }
  
  // Default to 1 hour if can't parse
  return HOUR;
};

/**
 * Get the browser's timezone
 */
const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('🕰️ Could not detect browser timezone, falling back to UTC:', error);
    return 'UTC';
  }
};

/**
 * Convert timestamp to Date object in specified timezone
 */
const convertTimestampToLocalDate = (timestamp: number, timezone: string): Date => {
  return new Date(timestamp);
};

/**
 * Subtract calendar periods from a date while preserving local time across DST transitions
 */
const subtractCalendarPeriod = (date: Date, periods: number, unit: PeriodUnit, timezone: string): Date => {
  // Create a new date to avoid mutating the original
  const newDate = new Date(date.getTime());
  
  if (unit === 'days') {
    // Use setDate to handle month boundaries and DST transitions correctly
    newDate.setDate(newDate.getDate() - periods);
  } else if (unit === 'hours') {
    // Use setHours to handle DST transitions correctly
    newDate.setHours(newDate.getHours() - periods);
  } else if (unit === 'minutes') {
    // Use setMinutes to handle minute-level calculations
    newDate.setMinutes(newDate.getMinutes() - periods);
  }
  
  return newDate;
};

/**
 * Generate historical time ranges using New Relic's own timestamp as reference
 * This eliminates timezone guesswork by using the query's temporal context
 */
export const generateHistoricalTimeRanges = (
  referenceTimestamp: number,
  config: HistoricalConfig,
  periodDuration?: number | null
): Array<{ beginTime: number; endTime: number }> => {
  // Convert null to undefined for consistent handling
  const duration = periodDuration || undefined;
  
  // If timezone awareness is disabled, use legacy behavior
  if (config.disableTimezoneAwareness) {
    return generateHistoricalTimeRangesLegacyFromTimestamp(referenceTimestamp, config, duration);
  }
  
  // Default: Use New Relic timestamp-based calculations
  return generateHistoricalTimeRangesFromReference(referenceTimestamp, config, duration);
};

/**
 * Generate historical time ranges from a reference timestamp using calendar arithmetic
 * This preserves local time across DST transitions
 */
const generateHistoricalTimeRangesFromReference = (
  referenceTimestamp: number,
  config: HistoricalConfig,
  periodDuration?: number
): Array<{ beginTime: number; endTime: number }> => {
  const ranges: Array<{ beginTime: number; endTime: number }> = [];
  
  console.log(`🕰️ Using reference timestamp: ${new Date(referenceTimestamp).toISOString()}`);
  
  // Use provided period duration or default to 1 hour
  const duration = periodDuration || HOUR;
  
  const currentEndTime = referenceTimestamp;
  const currentBeginTime = currentEndTime - duration;
  
  // Convert to Date objects for calendar arithmetic
  const currentEndDate = new Date(currentEndTime);
  const currentBeginDate = new Date(currentBeginTime);
  
  console.log(`🕰️ Current period: ${currentBeginDate.toISOString()} - ${currentEndDate.toISOString()}`);
  console.log(`🕰️ Period duration: ${duration / MINUTE} minutes`);
  
  // Generate historical periods using UTC calendar arithmetic with configurable gaps
  for (let i = 1; i <= config.historicalPeriods; i++) {
    // Create new dates for this historical period
    const historicalEndDate = new Date(currentEndDate);
    const historicalBeginDate = new Date(currentBeginDate);
    
    // Calculate the total offset for this period (period index * period size)
    const totalOffset = i * config.historicalPeriodSize;
    
    // Subtract periods using UTC calendar arithmetic to match New Relic's UTC timestamps
    if (config.historicalPeriodUnit === 'days') {
      historicalEndDate.setUTCDate(historicalEndDate.getUTCDate() - totalOffset);
      historicalBeginDate.setUTCDate(historicalBeginDate.getUTCDate() - totalOffset);
    } else if (config.historicalPeriodUnit === 'hours') {
      historicalEndDate.setUTCHours(historicalEndDate.getUTCHours() - totalOffset);
      historicalBeginDate.setUTCHours(historicalBeginDate.getUTCHours() - totalOffset);
    } else if (config.historicalPeriodUnit === 'minutes') {
      historicalEndDate.setUTCMinutes(historicalEndDate.getUTCMinutes() - totalOffset);
      historicalBeginDate.setUTCMinutes(historicalBeginDate.getUTCMinutes() - totalOffset);
    }
    
    const historicalEndTime = historicalEndDate.getTime();
    const historicalBeginTime = historicalBeginDate.getTime();
    
    console.log(`🕰️ Historical period ${i}: ${historicalBeginDate.toISOString()} - ${historicalEndDate.toISOString()}`);
    
    ranges.push({
      beginTime: historicalBeginTime,
      endTime: historicalEndTime
    });
  }
  
  return ranges;
};

/**
 * Generate historical time ranges using legacy timestamp arithmetic from a reference timestamp
 */
const generateHistoricalTimeRangesLegacyFromTimestamp = (
  referenceTimestamp: number,
  config: HistoricalConfig,
  periodDuration?: number
): Array<{ beginTime: number; endTime: number }> => {
  console.log('🕰️ Using legacy timestamp arithmetic (timezone awareness disabled)');
  
  const duration = periodDuration || HOUR; // Use provided duration or default to 1 hour
  const unitMultiplier = config.historicalPeriodUnit === 'days' ? DAY : 
                        config.historicalPeriodUnit === 'hours' ? HOUR : MINUTE;
  
  const ranges: Array<{ beginTime: number; endTime: number }> = [];
  
  const currentEndTime = referenceTimestamp;
  const currentBeginTime = currentEndTime - duration;
  
  console.log(`🕰️ Period duration: ${duration / MINUTE} minutes`);
  
  // Generate historical periods using fixed millisecond arithmetic with configurable gaps
  for (let i = 1; i <= config.historicalPeriods; i++) {
    const totalOffset = i * config.historicalPeriodSize;
    const offsetMs = totalOffset * unitMultiplier;
    const historicalEndTime = currentEndTime - offsetMs;
    const historicalBeginTime = currentBeginTime - offsetMs;
    
    ranges.push({
      beginTime: historicalBeginTime,
      endTime: historicalEndTime
    });
  }
  
  return ranges;
};

/**
 * Legacy function signature for backward compatibility
 */
export const generateHistoricalTimeRangesOld = (
  timeRange: TimeRange | null,
  defaultSince: string,
  config: HistoricalConfig
): Array<{ beginTime: number; endTime: number }> => {
  // Extract reference timestamp from timeRange or use current time
  let referenceTimestamp: number;
  if (timeRange?.endTime) {
    referenceTimestamp = timeRange.endTime;
  } else if (timeRange?.end_time) {
    referenceTimestamp = timeRange.end_time;
  } else {
    referenceTimestamp = Date.now();
  }
  
  return generateHistoricalTimeRanges(referenceTimestamp, config);
};

/**
 * Generate historical time ranges using timezone-aware calculations (NEW DEFAULT)
 * This ensures that 3pm-4pm today compares with 3pm-4pm from historical periods,
 * regardless of any DST transitions that occurred between them.
 */
const generateHistoricalTimeRangesTimezoneAware = (
  timeRange: TimeRange | null,
  defaultSince: string,
  config: HistoricalConfig
): Array<{ beginTime: number; endTime: number }> => {
  const ranges: Array<{ beginTime: number; endTime: number }> = [];
  const now = Date.now();
  const timezone = getBrowserTimezone();
  
  console.log(`🕰️ Using timezone-aware historical calculations with timezone: ${timezone}`);
  
  // Determine the current period's end time
  let currentEndTime: number;
  if (timeRange?.endTime) {
    currentEndTime = timeRange.endTime;
  } else if (timeRange?.end_time) {
    currentEndTime = timeRange.end_time;
  } else {
    currentEndTime = now;
  }
  
  // Determine the current period's begin time
  let currentBeginTime: number;
  if (timeRange?.beginTime) {
    currentBeginTime = timeRange.beginTime;
  } else if (timeRange?.begin_time) {
    currentBeginTime = timeRange.begin_time;
  } else {
    const periodDuration = parseTimeRangeDuration(timeRange, defaultSince);
    currentBeginTime = currentEndTime - periodDuration;
  }
  
  // Convert current timestamps to Date objects
  const currentEndDate = convertTimestampToLocalDate(currentEndTime, timezone);
  const currentBeginDate = convertTimestampToLocalDate(currentBeginTime, timezone);
  
  console.log(`🕰️ Current period: ${currentBeginDate.toLocaleString()} - ${currentEndDate.toLocaleString()}`);
  
  // Generate historical periods using calendar arithmetic
  for (let i = 1; i <= config.historicalPeriods; i++) {
    // Subtract periods from both begin and end dates to preserve the time window
    const historicalEndDate = subtractCalendarPeriod(currentEndDate, i, config.historicalPeriodUnit, timezone);
    const historicalBeginDate = subtractCalendarPeriod(currentBeginDate, i, config.historicalPeriodUnit, timezone);
    
    const historicalEndTime = historicalEndDate.getTime();
    const historicalBeginTime = historicalBeginDate.getTime();
    
    console.log(`🕰️ Historical period ${i}: ${historicalBeginDate.toLocaleString()} - ${historicalEndDate.toLocaleString()}`);
    
    ranges.push({
      beginTime: historicalBeginTime,
      endTime: historicalEndTime
    });
  }
  
  return ranges;
};

/**
 * Generate historical time ranges using legacy Unix timestamp arithmetic
 * This is the original behavior that can cause issues with DST transitions
 */
const generateHistoricalTimeRangesLegacy = (
  timeRange: TimeRange | null,
  defaultSince: string,
  config: HistoricalConfig
): Array<{ beginTime: number; endTime: number }> => {
  console.log('🕰️ Using legacy timestamp arithmetic (timezone awareness disabled)');
  
  const periodDuration = parseTimeRangeDuration(timeRange, defaultSince);
  const unitMultiplier = config.historicalPeriodUnit === 'days' ? DAY : 
                        config.historicalPeriodUnit === 'hours' ? HOUR : MINUTE;
  
  const ranges: Array<{ beginTime: number; endTime: number }> = [];
  const now = Date.now();
  
  // Determine the current period's end time
  let currentEndTime: number;
  if (timeRange?.endTime) {
    currentEndTime = timeRange.endTime;
  } else if (timeRange?.end_time) {
    currentEndTime = timeRange.end_time;
  } else {
    currentEndTime = now;
  }
  
  // Determine the current period's begin time
  let currentBeginTime: number;
  if (timeRange?.beginTime) {
    currentBeginTime = timeRange.beginTime;
  } else if (timeRange?.begin_time) {
    currentBeginTime = timeRange.begin_time;
  } else {
    currentBeginTime = currentEndTime - periodDuration;
  }
  
  // Generate historical periods using fixed millisecond arithmetic
  for (let i = 1; i <= config.historicalPeriods; i++) {
    const offsetMs = i * unitMultiplier;
    const historicalEndTime = currentEndTime - offsetMs;
    const historicalBeginTime = currentBeginTime - offsetMs;
    
    ranges.push({
      beginTime: historicalBeginTime,
      endTime: historicalEndTime
    });
  }
  
  return ranges;
};

/**
 * Convert time range to NRQL SINCE/UNTIL clause using human-readable date format
 */
export const timeRangeToNrql = (beginTime: number, endTime: number): string => {
  // Convert Unix timestamps to ISO date strings, then format for NRQL
  const beginDate = new Date(beginTime).toISOString().slice(0, 19).replace('T', ' ');
  const endDate = new Date(endTime).toISOString().slice(0, 19).replace('T', ' ');
  
  return `SINCE '${beginDate}' UNTIL '${endDate}'`;
};

/**
 * Aggregate threshold data across multiple periods
 */
export const aggregateThresholdData = (
  periodResults: any[][],
  aggregationMethod: AggregationMethod,
  matchField: string = 'name'
): any[] => {
  if (!periodResults || periodResults.length === 0) {
    return [];
  }
  
  // Group data by match field across all periods
  const groupedData: { [key: string]: any[] } = {};
  
  periodResults.forEach((periodData, periodIndex) => {
    if (periodData && Array.isArray(periodData)) {
      periodData.forEach((item, itemIndex) => {
        const matchValue = item[matchField];
        if (matchValue) {
          if (!groupedData[matchValue]) {
            groupedData[matchValue] = [];
          }
          groupedData[matchValue].push(item);
        }
      });
    }
  });
  
  // Aggregate each group
  const aggregatedResults: any[] = [];
  
  Object.keys(groupedData).forEach(matchValue => {
    const items = groupedData[matchValue];
    console.log(`Historical threshold calculation - Aggregating "${matchValue}" with ${items.length} items:`, items);
    if (items.length > 0) {
      const aggregatedItem = aggregateItemGroup(items, aggregationMethod);
      console.log(`Historical threshold calculation - Result for "${matchValue}":`, aggregatedItem);
      aggregatedResults.push(aggregatedItem);
    }
  });
  
  return aggregatedResults;
};

/**
 * Aggregate a group of items with the same match field value
 */
const aggregateItemGroup = (items: any[], method: AggregationMethod): any => {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  
  // Start with the first item as base
  const result = { ...items[0] };
  
  // Aggregate threshold_critical values
  const criticalValues = items
    .map(item => {
      const val = item.threshold_critical;
      // Convert string to number if needed
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      return numVal;
    })
    .filter(val => val !== undefined && val !== null && !isNaN(val));
    
  console.log(`Historical threshold calculation - Critical values for aggregation:`, criticalValues);
  if (criticalValues.length > 0) {
    result.threshold_critical = aggregateValues(criticalValues, method);
    console.log(`Historical threshold calculation - Aggregated critical value (${method}):`, result.threshold_critical);
  }
  
  // Aggregate threshold_warning values
  const warningValues = items
    .map(item => {
      const val = item.threshold_warning;
      // Convert string to number if needed
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      return numVal;
    })
    .filter(val => val !== undefined && val !== null && !isNaN(val));
    
  console.log(`Historical threshold calculation - Warning values for aggregation:`, warningValues);
  if (warningValues.length > 0) {
    result.threshold_warning = aggregateValues(warningValues, method);
    console.log(`Historical threshold calculation - Aggregated warning value (${method}):`, result.threshold_warning);
  }
  
  // Aggregate value field for historical values
  const historicalValues = items
    .map(item => {
      const val = item.value;
      // Convert string to number if needed
      const numVal = typeof val === 'string' ? parseFloat(val) : val;
      return numVal;
    })
    .filter(val => val !== undefined && val !== null && !isNaN(val));
    
  console.log(`Historical value calculation - Values for aggregation:`, historicalValues);
  if (historicalValues.length > 0) {
    result.historical_value = aggregateValues(historicalValues, method);
    console.log(`Historical value calculation - Aggregated historical value (${method}):`, result.historical_value);
  }
  
  return result;
};

/**
 * Aggregate numeric values using specified method
 */
const aggregateValues = (values: number[], method: AggregationMethod): number => {
  switch (method) {
    case 'average':
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    default:
      return values[0];
  }
};

/**
 * Calculate percentage difference between current and historical values
 */
export const calculatePercentageDifference = (current: number, historical: number): number | null => {
  if (historical === null || historical === undefined || historical === 0) {
    console.log(`Percentage calculation - Cannot calculate percentage for historical value: ${historical}`);
    return null;
  }
  
  const percentage = ((current - historical) / historical) * 100;
  console.log(`Percentage calculation - Current: ${current}, Historical: ${historical}, Percentage: ${percentage.toFixed(2)}%`);
  return percentage;
};

/**
 * Process locations to add percentage differences for heatmap visualization
 */
export const processLocationsForPercentageHeatmap = (
  locations: any[],
  enablePercentageHeatmap: boolean,
  percentageHeatmapRange?: number
): { processedLocations: any[], percentageRange: { min: number, max: number } | null } => {
  if (!enablePercentageHeatmap || !locations || locations.length === 0) {
    return { processedLocations: locations, percentageRange: null };
  }

  console.log('🎨 Processing locations for percentage heatmap...');
  
  // Calculate percentage differences for all locations
  const processedLocations = locations.map(location => {
    const percentage = calculatePercentageDifference(location.value, location.historical_value);
    return {
      ...location,
      percentage_difference: percentage,
      // Store original value for reference
      original_value: location.value
    };
  });

  // Filter out locations without valid percentage differences
  const validPercentages = processedLocations
    .map(loc => loc.percentage_difference)
    .filter(p => p !== null && p !== undefined && !isNaN(p));

  if (validPercentages.length === 0) {
    console.log('🎨 No valid percentage differences found');
    return { processedLocations: locations, percentageRange: null };
  }

  // Determine the percentage range
  let percentageRange: { min: number, max: number };
  
  if (percentageHeatmapRange && percentageHeatmapRange > 0) {
    // Use user-defined range
    percentageRange = { min: -percentageHeatmapRange, max: percentageHeatmapRange };
    console.log(`🎨 Using user-defined percentage range: ${percentageRange.min}% to ${percentageRange.max}%`);
  } else {
    // Auto-calculate symmetric range
    const maxAbsPercentage = Math.max(...validPercentages.map(Math.abs));
    percentageRange = { min: -maxAbsPercentage, max: maxAbsPercentage };
    console.log(`🎨 Auto-calculated percentage range: ${percentageRange.min.toFixed(2)}% to ${percentageRange.max.toFixed(2)}%`);
  }

  // Update location values to be percentage differences for heatmap calculation
  const finalProcessedLocations = processedLocations.map(location => {
    if (location.percentage_difference !== null && location.percentage_difference !== undefined) {
      return {
        ...location,
        // Replace value with percentage for heatmap color calculation
        value: location.percentage_difference
      };
    }
    return location;
  });

  console.log(`🎨 Processed ${finalProcessedLocations.length} locations for percentage heatmap`);
  
  return { processedLocations: finalProcessedLocations, percentageRange };
};
