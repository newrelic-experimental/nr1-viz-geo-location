/**
 * Percentage-Based Heatmap Configuration Example
 * 
 * This example demonstrates how to configure the geo-location visualization
 * to use percentage-based heatmaps that show color coding based on the
 * percentage difference from historical averages.
 */

// Example configuration for percentage-based heatmap
const percentageHeatmapConfig = {
  // Enable historical thresholds (required for percentage heatmap)
  enableHistoricalThresholds: true,
  
  // Historical data configuration
  historicalPeriods: 7,           // Compare with last 7 periods
  historicalPeriodSize: 1,        // 1 day gaps between periods
  historicalPeriodUnit: 'days',   // Use daily periods
  historicalAggregation: 'average', // Average the historical values
  
  // Enable percentage-based heatmap
  enablePercentageHeatmap: true,
  
  // Optional: Set fixed percentage range (leave empty for auto-calculation)
  percentageHeatmapRange: 50,     // -50% to +50% range (optional)
  
  // Enable heatmap for markers and/or regions
  heatMapStepsMarkers: 10,        // 10 color steps for markers
  heatMapSteps: 10,               // 10 color steps for regions
  
  // Color configuration (same as regular heatmap)
  markerColors: "#00ff00,#ffff00,#ff0000",  // Green -> Yellow -> Red
  regionColors: "#00ff00,#ffff00,#ff0000",  // Green -> Yellow -> Red
  
  // Tooltip configuration
  showThresholdsInTooltips: true,
  showHistoricalValuesInTooltips: true,
  
  // Threshold query MUST include a 'value' field for historical comparison
  thresholdQuery: `
    SELECT 
      average(duration) * 1.2 as threshold_warning,
      average(duration) * 1.5 as threshold_critical,
      average(duration) as value,          // Required for percentage calculation
      latest(city) as name
    FROM Transaction 
    WHERE appName = 'MyApp'
    FACET city
  `
};

/**
 * How the Percentage Heatmap Works:
 * 
 * 1. Historical Data Collection:
 *    - Queries the last 7 days of data using the threshold query
 *    - Aggregates the 'value' field using the specified method (average)
 *    - Creates a historical baseline for each location
 * 
 * 2. Percentage Calculation:
 *    - Compares current values with historical averages
 *    - Calculates: ((current - historical) / historical) * 100
 *    - Example: Current=120, Historical=100 → +20%
 * 
 * 3. Color Mapping:
 *    - 0% difference = middle color (yellow in this example)
 *    - Negative percentages = better than historical (green)
 *    - Positive percentages = worse than historical (red)
 *    - Range is either auto-calculated or user-defined
 * 
 * 4. Tooltip Information:
 *    - Shows current value, historical value, and percentage difference
 *    - Example: "Current: 120ms, Historical: 100ms, +20%"
 */

/**
 * Color Interpretation Examples:
 * 
 * Green Colors (Negative %):
 * - Current response time is faster than historical average
 * - Current error rate is lower than historical average
 * - Performance is better than usual
 * 
 * Yellow Color (0% or near 0%):
 * - Current performance matches historical average
 * - No significant change from baseline
 * 
 * Red Colors (Positive %):
 * - Current response time is slower than historical average
 * - Current error rate is higher than historical average
 * - Performance is worse than usual
 */

/**
 * Range Configuration Options:
 * 
 * Auto-Range (recommended for most cases):
 * - Leave percentageHeatmapRange empty or undefined
 * - System calculates symmetric range from actual data
 * - Example: If data spans -15% to +45%, uses -45% to +45%
 * - Ensures 0% is always centered
 * 
 * Fixed Range (for consistent visualization):
 * - Set percentageHeatmapRange to desired value
 * - Example: percentageHeatmapRange: 25 creates -25% to +25% range
 * - Values beyond range are clamped to gradient extremes
 * - Useful for comparing across different time periods
 */

/**
 * Use Case Examples:
 * 
 * 1. Application Performance Monitoring:
 *    - Compare current response times with weekly averages
 *    - Identify locations performing better/worse than usual
 * 
 * 2. Infrastructure Monitoring:
 *    - Compare current CPU/memory usage with historical norms
 *    - Spot anomalies and capacity issues
 * 
 * 3. Business Metrics:
 *    - Compare current sales/traffic with historical averages
 *    - Identify trending locations and seasonal patterns
 * 
 * 4. Error Rate Analysis:
 *    - Compare current error rates with historical baselines
 *    - Quickly identify problematic regions
 */

/**
 * Configuration Tips:
 * 
 * 1. Choose appropriate historical periods:
 *    - Daily comparison: 7 days, 1 day gaps
 *    - Weekly comparison: 4 weeks, 7 day gaps
 *    - Hourly comparison: 24 hours, 1 hour gaps
 * 
 * 2. Select meaningful aggregation:
 *    - 'average' for typical performance metrics
 *    - 'max' for peak usage scenarios
 *    - 'min' for best-case comparisons
 * 
 * 3. Color scheme considerations:
 *    - Green-Yellow-Red: Intuitive for performance (good-neutral-bad)
 *    - Blue-White-Red: Good for temperature-like data
 *    - Custom colors: Match your organization's standards
 */

export default percentageHeatmapConfig;
