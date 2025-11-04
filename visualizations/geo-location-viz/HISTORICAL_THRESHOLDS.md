# Historical Thresholds Feature

This feature allows the threshold query to gather data from multiple periods in the past and use aggregated values as thresholds instead of static threshold overrides.

## Configuration Properties

These properties are now available in the visualization configuration UI:

### Required Properties
- `enableHistoricalThresholds` (boolean): Enable/disable historical threshold functionality
  - Default: `false`

### Optional Properties (when historical thresholds are enabled)
- `historicalPeriods` (number): Number of historical periods to query
  - Default: `7`
  - Example: `5` means query 5 historical periods

- `historicalPeriodSize` (number): Gap between each historical period
  - Default: `1`
  - Example: `7` means each period is 7 units apart (combined with `historicalPeriodUnit`)

- `historicalPeriodUnit` (string): Unit for the period gaps
  - Options: `'minutes'`, `'hours'` or `'days'`
  - Default: `'days'`
  - Example: `'days'` with `historicalPeriodSize: 7` means each period is 7 days apart

- `historicalAggregation` (string): How to combine results from multiple periods
  - Options: `'average'`, `'min'`, `'max'`, `'sum'`
  - Default: `'average'`

- `disableTimezoneAwareness` (boolean): Disable timezone-aware calculations
  - Default: `false` (timezone-aware calculations enabled)
  - When `false`: Uses calendar-based calculations that preserve local time across DST transitions
  - When `true`: Uses legacy Unix timestamp arithmetic (may cause issues during clock changes)

## How It Works

### Example Scenario: Same Day of Week Comparison
- Main query: Gets current data for "SINCE 1 hour ago" (Tuesday 10am-11am)
- Historical threshold configuration:
  - `enableHistoricalThresholds: true`
  - `historicalPeriods: 5`
  - `historicalPeriodSize: 7`
  - `historicalPeriodUnit: 'days'`
  - `historicalAggregation: 'average'`

### What Happens
1. The system detects the main query uses a 1-hour time window
2. It creates 5 threshold queries for the same 1-hour window from previous Tuesdays:
   - Period 1: 1 hour window from 7 days ago (last Tuesday 10am-11am)
   - Period 2: 1 hour window from 14 days ago (2 Tuesdays ago 10am-11am)
   - Period 3: 1 hour window from 21 days ago (3 Tuesdays ago 10am-11am)
   - Period 4: 1 hour window from 28 days ago (4 Tuesdays ago 10am-11am)
   - Period 5: 1 hour window from 35 days ago (5 Tuesdays ago 10am-11am)
3. All threshold queries execute in parallel
4. Results are aggregated using the specified method (average)
5. Final aggregated thresholds are applied to current data

## Configuration Examples

### Example 1: Same Day of Week Comparison (Weekly Pattern)
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 7,        // Compare with 7 historical periods
  historicalPeriodSize: 7,     // Each 7 days apart
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
}
```
*Compares today with the same day of week for the past 7 weeks*

### Example 2: Every Other Day Comparison
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 5,        // Compare with 5 historical periods
  historicalPeriodSize: 2,     // Each 2 days apart
  historicalPeriodUnit: 'days',
  historicalAggregation: 'max'
}
```
*Compares today with 2, 4, 6, 8, and 10 days ago*

### Example 3: Same Hour Each Day
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 10,       // Compare with 10 historical periods
  historicalPeriodSize: 24,    // Each 24 hours apart
  historicalPeriodUnit: 'hours',
  historicalAggregation: 'min'
}
```
*Compares this hour with the same hour for the past 10 days*

### Example 4: Monthly Comparison (Approximate)
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 6,        // Compare with 6 historical periods
  historicalPeriodSize: 30,    // Each 30 days apart
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
}
```
*Compares today with approximately the same day for the past 6 months*

### Example 5: Consecutive Days (Traditional Behavior)
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 7,        // Compare with 7 historical periods
  historicalPeriodSize: 1,     // Each 1 day apart (consecutive)
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average'
}
```
*Compares today with the past 7 consecutive days*

### Example 6: High-Frequency Minute-Level Comparison
```javascript
{
  enableHistoricalThresholds: true,
  historicalPeriods: 10,       // Compare with 10 historical periods
  historicalPeriodSize: 15,    // Each 15 minutes apart
  historicalPeriodUnit: 'minutes',
  historicalAggregation: 'max'
}
```
*Compares current minute with 15, 30, 45, 60, 75, 90, 105, 120, 135, and 150 minutes ago*

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
