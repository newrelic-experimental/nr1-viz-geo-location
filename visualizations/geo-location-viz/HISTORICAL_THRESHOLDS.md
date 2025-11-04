# Historical Thresholds Feature

This feature allows the threshold query to gather data from multiple periods in the past and use aggregated values as thresholds instead of static threshold overrides.

## Configuration Properties

These properties are now available in the visualization configuration UI:

### Required Properties
- `enableHistoricalThresholds` (boolean): Enable/disable historical threshold functionality
  - Default: `false`

### Optional Properties (when historical thresholds are enabled)
- `historicalPeriods` (number): Number of previous periods to query
  - Default: `7`
  - Example: `7` means query the previous 7 periods

- `historicalPeriodUnit` (string): Unit for historical periods
  - Options: `'hours'` or `'days'`
  - Default: `'days'`
  - Example: `'days'` with `historicalPeriods: 7` means query the same time window for the previous 7 days

- `historicalAggregation` (string): How to combine results from multiple periods
  - Options: `'average'`, `'min'`, `'max'`, `'sum'`
  - Default: `'average'`

- `disableTimezoneAwareness` (boolean): Disable timezone-aware calculations
  - Default: `false` (timezone-aware calculations enabled)
  - When `false`: Uses calendar-based calculations that preserve local time across DST transitions
  - When `true`: Uses legacy Unix timestamp arithmetic (may cause issues during clock changes)

## How It Works

### Example Scenario
- Main query: Gets current data for "SINCE 1 hour ago"
- Historical threshold configuration:
  - `enableHistoricalThresholds: true`
  - `historicalPeriods: 7`
  - `historicalPeriodUnit: 'days'`
  - `historicalAggregation: 'average'`

### What Happens
1. The system detects the main query uses a 1-hour time window
2. It creates 7 threshold queries for the same 1-hour window from previous days:
   - Day 1: 1 hour window from 1 day ago
   - Day 2: 1 hour window from 2 days ago
   - Day 3: 1 hour window from 3 days ago
   - etc.
3. All threshold queries execute in parallel
4. Results are aggregated using the specified method (average)
5. Final aggregated thresholds are applied to current data

## Configuration Examples

### Example 1: Weekly Average Thresholds
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
}
```

### Example 2: Daily Maximum Thresholds (Last 5 Days)
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 5,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'max'
}
```

### Example 3: Hourly Minimum Thresholds (Last 24 Hours)
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 24,
  historicalPeriodUnit: 'hours',
  historicalAggregation: 'min'
}
```

## Backward Compatibility

- When `enableHistoricalThresholds` is `false` (default), the system uses the original threshold query behavior
- All existing configurations continue to work without changes
- The new feature is completely opt-in

## Error Handling

- If historical threshold queries fail, the system falls back to the regular threshold query
- If the regular threshold query also fails, the system uses thresholds from the main query
- Individual historical period failures don't stop the overall process

## Performance Considerations

- Historical threshold queries execute in parallel for better performance
- Failed individual period queries are handled gracefully
- Consider the number of historical periods vs. query performance trade-offs
- More periods = more accurate historical baseline but more queries

## Logging

The system provides detailed console logging for debugging:
- `🕰️` Historical threshold configuration and time ranges
- `🔍` Individual historical query NRQL
- `✅` Query results and counts
- `📊` Aggregation results
- `🎯` Final threshold data applied

## Timezone Awareness and DST Handling

### The Problem
When comparing time periods across daylight saving time (DST) transitions, simple Unix timestamp arithmetic can lead to incorrect comparisons. For example:
- You want to compare "3pm-4pm today" with "3pm-4pm from 7 days ago"
- If there was a clock change between these periods, you might actually compare with "2pm-3pm" or "4pm-5pm"

### The Solution (Default Behavior)
By default, the system now uses **timezone-aware calculations** that:
- Detect the browser's timezone automatically
- Use calendar-based arithmetic instead of fixed millisecond offsets
- Preserve the same local time across all historical periods
- Handle DST transitions automatically

### Example: Spring Forward Transition
```
Current period: March 15, 2024 15:00-16:00 (3pm-4pm)
Historical period: March 8, 2024 15:00-16:00 (3pm-4pm)
```
Even though March 10th had a "spring forward" transition, both periods represent the same local time.

### Example: Fall Back Transition  
```
Current period: November 15, 2024 15:00-16:00 (3pm-4pm)
Historical period: November 8, 2024 15:00-16:00 (3pm-4pm)
```
Even though November 3rd had a "fall back" transition, both periods represent the same local time.

### Legacy Behavior (Opt-out)
If you need the old behavior for any reason, set `disableTimezoneAwareness: true`:
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 7,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average',
  disableTimezoneAwareness: true  // Use legacy timestamp arithmetic
}
```

### Timezone Detection
- Automatically uses the browser's timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Falls back to UTC if timezone detection fails
- Works correctly regardless of the user's location

## Use Cases

1. **Dynamic Baselines**: Use historical averages as dynamic thresholds instead of static values
2. **Seasonal Adjustments**: Account for daily/weekly patterns in your thresholds
3. **Anomaly Detection**: Compare current values against historical norms
4. **Capacity Planning**: Use historical maximums to set warning thresholds
5. **Cross-DST Comparisons**: Accurately compare periods that span clock changes
