// Example configuration for using historical thresholds
// This would be used in the visualization configuration

const exampleConfig = {
  // Standard configuration
  accountId: 123456,
  markersQuery: `
    SELECT 
      average(duration) as value,
      latest(city) as name,
      latest(latitude) as latitude,
      latest(longitude) as longitude,
      50 as threshold_warning,
      100 as threshold_critical
    FROM Transaction 
    WHERE appName = 'MyApp'
    FACET city
  `,
  
  thresholdQuery: `
    SELECT 
      average(duration) * 1.2 as threshold_warning,
      average(duration) * 1.5 as threshold_critical,
      latest(city) as name
    FROM Transaction 
    WHERE appName = 'MyApp'
    FACET city
  `,
  
  thresholdMatchField: 'name',
  
  // NEW: Historical threshold configuration
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
};

// How it works:
// 1. Main query gets current data (e.g., last hour)
// 2. Threshold query runs 7 times for the same hour from previous 7 days
// 3. Results are averaged across those 7 days
// 4. Averaged thresholds are applied to current data

// Example scenarios:

// Scenario 1: Weekly baseline thresholds
const weeklyBaseline = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
};

// Scenario 2: Peak capacity thresholds (use max from last 5 days)
const peakCapacity = {
  enableHistoricalThresholds: true,
  historicalPeriods: 5,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'max'
};

// Scenario 3: Hourly pattern thresholds (last 24 hours)
const hourlyPattern = {
  enableHistoricalThresholds: true,
  historicalPeriods: 24,
  historicalPeriodUnit: 'hours',
  historicalAggregation: 'average'
};

// Scenario 4: Conservative thresholds (use minimum from last 3 days)
const conservative = {
  enableHistoricalThresholds: true,
  historicalPeriods: 3,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'min'
};

// Scenario 5: Cross-DST comparison with timezone awareness (DEFAULT BEHAVIOR)
// This ensures 3pm-4pm today compares with 3pm-4pm from previous days,
// even if there were clock changes between them
const crossDSTAware = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
  // disableTimezoneAwareness: false (default - timezone-aware calculations)
};

// Scenario 6: Legacy behavior (opt-out of timezone awareness)
// Use this only if you need the old Unix timestamp arithmetic behavior
const legacyBehavior = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average',
  disableTimezoneAwareness: true  // Disable timezone-aware calculations
};

export {
  exampleConfig,
  weeklyBaseline,
  peakCapacity,
  hourlyPattern,
  conservative,
  crossDSTAware,
  legacyBehavior
};
