# Historical Values in Tooltips Feature

## Overview

This feature extends the existing historical threshold functionality to also display aggregated historical values in marker and region tooltips. When enabled, users can see not only the historical thresholds but also the historical baseline value itself, providing better context for understanding current performance relative to historical data.

## How It Works

### Data Flow
1. **Historical Query Execution**: The threshold query runs multiple times for historical periods
2. **Value Aggregation**: The `value` field from historical query results is aggregated using the configured method (average, min, max, sum)
3. **Tooltip Display**: The aggregated historical value appears in tooltips alongside current values and historical thresholds

### Key Components Modified

#### 1. `utils/historicalThresholds.tsx`
- **Function**: `aggregateItemGroup()`
- **Change**: Added aggregation logic for the `value` field
- **New Field**: Creates `historical_value` field containing aggregated historical values
- **Logging**: Added console logging for debugging historical value calculations

#### 2. `utils/map.tsx`
- **Function**: `generateTooltipConfig()`
- **Change**: Added logic to include `historical_value` in tooltip configuration
- **Condition**: Only shows when `showThresholdsInTooltips` is enabled and `historical_value` exists
- **Formatting**: Applies number formatting (2 decimal places) to historical values

#### 3. `examples/historical-thresholds-example.js`
- **Updated**: Example threshold query to include `value` field
- **Documentation**: Added comprehensive comments explaining the new feature
- **Configuration**: Shows how to enable tooltip display of historical values

## Configuration

### Required Settings
```javascript
{
  // Enable historical threshold calculations
  enableHistoricalThresholds: true,
  
  // Configure historical periods and aggregation
  historicalPeriods: 7,
  historicalPeriodSize: 1,
  historicalPeriodUnit: 'days',
  historicalAggregation: 'average',
  
  // Enable tooltip display for thresholds
  showThresholdsInTooltips: true,
  
  // Enable tooltip display for historical values (NEW)
  showHistoricalValuesInTooltips: true,
  
  // Threshold query MUST include a 'value' field for historical aggregation
  thresholdQuery: `
    SELECT 
      average(duration) * 1.2 as threshold_warning,
      average(duration) * 1.5 as threshold_critical,
      average(duration) as value,  // <-- This is required for historical values
      latest(city) as name
    FROM Transaction 
    WHERE appName = 'MyApp'
    FACET city
  `
}
```

### Important Requirements
1. **Value Field**: The threshold query must include a `value` field
2. **Threshold Tooltips**: `showThresholdsInTooltips` must be `true`
3. **Historical Values**: `showHistoricalValuesInTooltips` must be `true`
4. **Historical Thresholds**: `enableHistoricalThresholds` must be `true`

## Tooltip Display

When all conditions are met, tooltips will show:

```
Name: Location Name
Value: 45.2                    // Current value
Warning Threshold: 42.8        // Historical threshold (aggregated)
Critical Threshold: 58.5       // Historical threshold (aggregated)
Historical Value: 38.9         // Historical value (aggregated) - NEW
```

## Aggregation Methods

The historical value uses the same aggregation method as the thresholds:

- **Average**: Mean of all historical values
- **Min**: Minimum historical value
- **Max**: Maximum historical value  
- **Sum**: Sum of all historical values

## Use Cases

### Performance Comparison
- Compare current response times with historical averages
- See if current performance is above/below historical norms
- Understand seasonal or cyclical patterns

### Capacity Planning
- View historical resource utilization alongside current usage
- Identify trends and growth patterns
- Plan for future capacity needs

### Anomaly Detection
- Quickly identify when current values deviate significantly from historical patterns
- Provide context for threshold breaches
- Support root cause analysis

## Technical Details

### Data Structure
```javascript
// After aggregation, location objects contain:
{
  name: "Location Name",
  value: 45.2,                    // Current value
  threshold_warning: 42.8,        // Aggregated historical threshold
  threshold_critical: 58.5,       // Aggregated historical threshold
  historical_value: 38.9          // Aggregated historical value (NEW)
}
```

### Console Logging
The feature includes detailed console logging for debugging:
```
Historical value calculation - Values for aggregation: [35.2, 41.8, 39.5, 42.1, 36.7, 38.9, 37.2]
Historical value calculation - Aggregated historical value (average): 38.9
```

## Backward Compatibility

This feature is fully backward compatible:
- Existing configurations continue to work unchanged
- Historical values only appear when explicitly configured
- No breaking changes to existing APIs or data structures

## Error Handling

The feature gracefully handles various scenarios:
- Missing `value` field in threshold query results
- Non-numeric values (filtered out during aggregation)
- Empty or null historical data
- Mixed data types (automatic string-to-number conversion)

## Testing

To test the feature:
1. Configure historical thresholds with a threshold query containing a `value` field
2. Enable `showThresholdsInTooltips: true`
3. Enable `showHistoricalValuesInTooltips: true`
4. Hover over markers or regions to see tooltips
5. Verify that "Historical Value" appears in the tooltip
6. Check browser console for aggregation logging

## Troubleshooting

If historical values don't appear in tooltips:

1. **Check Console Logs**: Look for "Historical value calculation" messages in browser console
2. **Verify Configuration**: Ensure all required settings are enabled:
   - `enableHistoricalThresholds: true`
   - `showThresholdsInTooltips: true` 
   - `showHistoricalValuesInTooltips: true`
3. **Check Threshold Query**: Ensure the threshold query includes a `value` field
4. **Verify Data Flow**: Check that `historical_value` field exists in location data
5. **Console Debug**: Add `console.log(locations)` in Markers/Regions components to inspect data

### Debug Commands
```javascript
// In browser console, inspect tooltip configuration:
console.log('Tooltip Config:', tooltipConfig);

// Check if historical values exist in location data:
console.log('Location Data:', locations);
locations.forEach(loc => console.log(`${loc.name}: historical_value =`, loc.historical_value));
```

## Future Enhancements

Potential future improvements:
- Custom formatting options for historical values
- Additional aggregation methods (median, percentiles)
- Historical value trends or sparklines in tooltips
- Conditional display based on data availability
- Historical value comparison indicators (e.g., arrows showing if current is above/below historical)
