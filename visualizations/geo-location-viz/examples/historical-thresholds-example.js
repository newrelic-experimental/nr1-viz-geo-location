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
      average(duration) as value,
      latest(city) as name
    FROM Transaction 
    WHERE appName = 'MyApp'
    FACET city
  `,
  
  thresholdMatchField: 'name',
  
  // NEW: Historical threshold configuration
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodSize: 1,  // Each 1 day apart (consecutive days)
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average',
  
  // NEW: Tooltip configuration
  showThresholdsInTooltips: true,        // Shows thresholds in tooltips
  showHistoricalValuesInTooltips: true   // Shows historical values in tooltips (requires both historical thresholds and threshold tooltips to be enabled)
};

// How it works:
// 1. Main query gets current data (e.g., last hour)
// 2. Threshold query runs 7 times for the same hour from previous periods
// 3. Results are averaged across those periods using the specified aggregation method
// 4. Averaged thresholds AND historical values are applied to current data
// 5. When showThresholdsInTooltips is enabled, tooltips display:
//    - Current value
//    - Historical threshold_warning (aggregated)
//    - Historical threshold_critical (aggregated)
//    - Historical value (aggregated) - NEW FEATURE
//
// IMPORTANT: For historical values to appear in tooltips, the threshold query 
// must include a 'value' field that will be aggregated across historical periods.

// Example scenarios:

// Scenario 1: Same day of week comparison (weekly pattern)
const sameDayOfWeek = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,        // Compare with 7 historical periods
  historicalPeriodSize: 7,     // Each 7 days apart (same day of week)
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
};

// Scenario 2: Consecutive days baseline (traditional behavior)
const consecutiveDays = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,        // Compare with 7 historical periods
  historicalPeriodSize: 1,     // Each 1 day apart (consecutive)
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
};

// Scenario 3: Every other day comparison
const everyOtherDay = {
  enableHistoricalThresholds: true,
  historicalPeriods: 5,        // Compare with 5 historical periods
  historicalPeriodSize: 2,     // Each 2 days apart
  historicalPeriodUnit: 'days',
  historicalAggregation: 'max'
};

// Scenario 4: Same hour each day
const sameHourDaily = {
  enableHistoricalThresholds: true,
  historicalPeriods: 10,       // Compare with 10 historical periods
  historicalPeriodSize: 24,    // Each 24 hours apart
  historicalPeriodUnit: 'hours',
  historicalAggregation: 'average'
};

// Scenario 5: Monthly comparison (approximate)
const monthlyPattern = {
  enableHistoricalThresholds: true,
  historicalPeriods: 6,        // Compare with 6 historical periods
  historicalPeriodSize: 30,    // Each 30 days apart
  historicalPeriodUnit: 'days',
  historicalAggregation: 'min'
};

// Scenario 6: Cross-DST comparison with timezone awareness (DEFAULT BEHAVIOR)
// This ensures 3pm-4pm today compares with 3pm-4pm from previous days,
// even if there were clock changes between them
const crossDSTAware = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodSize: 1,     // Each 1 day apart (consecutive)
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
  // disableTimezoneAwareness: false (default - timezone-aware calculations)
};

// Scenario 7: Legacy behavior (opt-out of timezone awareness)
// Use this only if you need the old Unix timestamp arithmetic behavior
const legacyBehavior = {
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodSize: 1,     // Each 1 day apart (consecutive)
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average',
  disableTimezoneAwareness: true  // Disable timezone-aware calculations
};

export {
  exampleConfig,
  sameDayOfWeek,
  consecutiveDays,
  everyOtherDay,
  sameHourDaily,
  monthlyPattern,
  crossDSTAware,
  legacyBehavior
};
