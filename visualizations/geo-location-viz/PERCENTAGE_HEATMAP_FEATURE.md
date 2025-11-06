# Percentage-Based Heatmap Feature

## Overview

The percentage-based heatmap feature extends the existing geo-location visualization to display colors based on the percentage difference between current values and historical averages, rather than absolute values. This provides contextual visualization that shows whether locations are performing better or worse than their historical norms.

## Key Benefits

- **Contextual Visualization**: Shows relative performance compared to historical baselines
- **Anomaly Detection**: Quickly identify locations that deviate significantly from normal patterns
- **Trend Analysis**: Visualize improvements or degradations over time
- **Normalized Comparison**: Compare locations with different baseline values on the same scale

## How It Works

### 1. Data Flow
```
Current Values + Historical Values → Percentage Calculation → Color Mapping
```

1. **Historical Data Collection**: Uses existing historical threshold system to gather baseline data
2. **Percentage Calculation**: Computes `((current - historical) / historical) * 100` for each location
3. **Symmetric Range**: Creates color range centered on 0% (no change)
4. **Color Mapping**: Maps percentages to gradient colors using existing heatmap system

### 2. Color Interpretation

- **0% (Middle Color)**: Current value matches historical average
- **Negative % (Lower Colors)**: Current value is below historical average (often "better")
- **Positive % (Upper Colors)**: Current value is above historical average (often "worse")

**Example with Green-Yellow-Red gradient:**
- Green (-20%): Response time 20% faster than historical average
- Yellow (0%): Response time matches historical average  
- Red (+30%): Response time 30% slower than historical average

## Configuration

### Required Settings

```javascript
{
  // Historical thresholds must be enabled
  enableHistoricalThresholds: true,
  
  // Enable percentage-based heatmap
  enablePercentageHeatmap: true,
  
  // Heatmap must be enabled for markers/regions
  heatMapStepsMarkers: 10,  // For markers
  heatMapSteps: 10,         // For regions
  
  // Threshold query MUST include 'value' field
  thresholdQuery: `
    SELECT 
      average(duration) as value,  // Required for percentage calculation
      latest(city) as name
    FROM Transaction 
    FACET city
  `
}
```

### Optional Settings

```javascript
{
  // Optional: Fixed percentage range
  percentageHeatmapRange: 50,  // Creates -50% to +50% range
  
  // Historical data configuration
  historicalPeriods: 7,
  historicalPeriodSize: 1,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average',
  
  // Tooltip configuration
  showThresholdsInTooltips: true,
  showHistoricalValuesInTooltips: true,
  
  // Color configuration (same as regular heatmap)
  markerColors: "#00ff00,#ffff00,#ff0000",
  regionColors: "#00ff00,#ffff00,#ff0000"
}
```

## Range Configuration

### Auto-Range (Recommended)
- Leave `percentageHeatmapRange` empty or undefined
- System automatically calculates symmetric range from data
- Ensures 0% is always centered in the gradient
- Maximizes color distinction for actual data range

**Example**: If data spans -15% to +45%, system uses -45% to +45%

### Fixed Range
- Set `percentageHeatmapRange` to desired maximum percentage
- Creates symmetric range: -X% to +X%
- Values beyond range are clamped to gradient extremes
- Useful for consistent visualization across time periods

**Example**: `percentageHeatmapRange: 25` creates -25% to +25% range

## Tooltip Information

When percentage heatmap is enabled, tooltips display:

```
Name: New York
Current Value: 125.3        // Original current value
Historical Value: 98.7      // Aggregated historical baseline
% vs Historical: +27.0%     // Percentage difference
```

## Implementation Details

### Files Modified

1. **Configuration** (`nr1.json`):
   - Added `enablePercentageHeatmap` boolean option
   - Added `percentageHeatmapRange` number option

2. **Processing Logic** (`utils/historicalThresholds.tsx`):
   - `calculatePercentageDifference()`: Computes percentage differences
   - `processLocationsForPercentageHeatmap()`: Transforms location data

3. **Heatmap System** (`hooks/useHeatmap.tsx`):
   - Extended with percentage-based range functions
   - `setRangePercentage()` and `setRangeMarkersPercentage()`

4. **Components** (`components/Markers.tsx`, `components/Regions.tsx`):
   - Integrated percentage processing
   - Updated to use processed data for rendering

5. **Tooltips** (`utils/map.tsx`):
   - Extended `generateTooltipConfig()` to show percentage data
   - Displays current value, historical value, and percentage difference

### Data Structure

After processing, location objects contain:
```javascript
{
  name: "Location Name",
  value: 15.7,                    // Percentage difference (for heatmap)
  original_value: 125.3,          // Original current value
  historical_value: 108.4,        // Aggregated historical value
  percentage_difference: 15.7,    // Calculated percentage
  // ... other fields
}
```

## Use Cases

### 1. Application Performance Monitoring
```javascript
thresholdQuery: `
  SELECT 
    average(duration) as value,
    latest(city) as name
  FROM Transaction 
  WHERE appName = 'MyApp'
  FACET city
`
```
- **Green**: Locations with faster response times than usual
- **Red**: Locations with slower response times than usual

### 2. Infrastructure Monitoring
```javascript
thresholdQuery: `
  SELECT 
    average(cpuPercent) as value,
    latest(hostname) as name
  FROM SystemSample 
  FACET hostname
`
```
- **Green**: Servers with lower CPU usage than historical average
- **Red**: Servers with higher CPU usage than historical average

### 3. Error Rate Analysis
```javascript
thresholdQuery: `
  SELECT 
    percentage(count(*), WHERE error IS true) as value,
    latest(region) as name
  FROM Transaction 
  FACET region
`
```
- **Green**: Regions with lower error rates than usual
- **Red**: Regions with higher error rates than usual

### 4. Business Metrics
```javascript
thresholdQuery: `
  SELECT 
    count(*) as value,
    latest(store_location) as name
  FROM PageView 
  WHERE actionName = 'purchase'
  FACET store_location
`
```
- **Green**: Stores with higher sales than historical average
- **Red**: Stores with lower sales than historical average

## Best Practices

### 1. Historical Period Selection
- **Daily patterns**: Use 7 days with 1-day gaps
- **Weekly patterns**: Use 4 weeks with 7-day gaps  
- **Hourly patterns**: Use 24 hours with 1-hour gaps
- **Seasonal patterns**: Use 12 months with 1-month gaps

### 2. Aggregation Method
- **Average**: Most common, good for typical performance metrics
- **Max**: For peak usage scenarios or worst-case analysis
- **Min**: For best-case scenarios or minimum thresholds
- **Sum**: For cumulative metrics like transaction counts

### 3. Color Scheme Selection
- **Performance metrics**: Green (good) → Yellow (neutral) → Red (bad)
- **Temperature data**: Blue (cold) → White (neutral) → Red (hot)
- **Business metrics**: Blue (low) → White (baseline) → Green (high)

### 4. Range Configuration
- **Start with auto-range** to understand your data distribution
- **Use fixed range** for consistent visualization across time periods
- **Consider sensitivity**: Smaller ranges show more detail for small changes

## Troubleshooting

### Common Issues

1. **No percentage colors showing**:
   - Verify `enableHistoricalThresholds: true`
   - Verify `enablePercentageHeatmap: true`
   - Ensure heatmap steps > 0
   - Check that threshold query includes `value` field

2. **Missing historical data**:
   - Check console for "Historical value calculation" messages
   - Verify threshold query returns data for historical periods
   - Ensure `value` field contains numeric data

3. **Percentage calculations seem wrong**:
   - Check console for "Percentage calculation" messages
   - Verify historical values are not zero or null
   - Check aggregation method is appropriate for your data

### Debug Commands

```javascript
// In browser console, check processed data:
console.log('Processed locations:', locations);

// Check percentage calculations:
locations.forEach(loc => {
  console.log(`${loc.name}: ${loc.original_value} vs ${loc.historical_value} = ${loc.percentage_difference}%`);
});
```

## Backward Compatibility

- Feature is fully backward compatible
- Existing configurations work unchanged
- Percentage heatmap only activates when explicitly enabled
- No breaking changes to existing APIs

## Performance Considerations

- Percentage processing adds minimal overhead
- Uses existing historical threshold infrastructure
- Calculations are performed client-side
- No additional server queries required

## Future Enhancements

Potential improvements:
- Additional aggregation methods (median, percentiles)
- Custom percentage calculation formulas
- Multiple historical comparison periods
- Percentage-based alerting thresholds
- Export percentage data for analysis
