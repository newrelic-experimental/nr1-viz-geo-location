# Tooltip Threshold Values Fix

## Issue Description
When historical thresholds were enabled, the tooltip threshold values were not updating to reflect the new historical threshold calculations. The tooltips continued to show the original threshold values from the first query, even though the marker colors were correctly changing based on the historical thresholds.

## Root Cause
The issue was in the `generateTooltipConfig` function in `utils/map.tsx`. This function determines what fields to display in tooltips by examining the first location in the data array:

```typescript
// PROBLEMATIC CODE (before fix)
if (showThresholdsInTooltips) {
  const firstLocation = locations[0]; // ← Only checked first location
  if (firstLocation.threshold_warning !== undefined && firstLocation.threshold_warning !== null) {
    config.push({ 
      label: "Warning Threshold", 
      queryField: "threshold_warning",
      // ...
    });
  }
}
```

### The Problem Flow:
1. **Initial Load**: First query runs, tooltip config is generated based on original threshold values
2. **Historical Query**: Historical thresholds are calculated and merged into location data
3. **Tooltip Config Issue**: Tooltip configuration was already determined and didn't update
4. **Result**: Tooltips showed stale threshold values while markers showed correct colors

## Solution
Modified the `generateTooltipConfig` function to always include threshold fields when `showThresholdsInTooltips` is enabled, regardless of the current data state:

```typescript
// FIXED CODE
if (showThresholdsInTooltips) {
  // Always add threshold fields when enabled - don't check first location's values
  // This ensures tooltips update correctly when historical thresholds are applied
  config.push({ 
    label: "Warning Threshold", 
    queryField: "threshold_warning",
    formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
  } as any);
  
  config.push({ 
    label: "Critical Threshold", 
    queryField: "threshold_critical",
    formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
  } as any);
  
  // Add historical value to tooltip if both threshold tooltips and historical values are enabled
  if (showHistoricalValuesInTooltips) {
    config.push({ 
      label: "Historical Value", 
      queryField: "historical_value",
      formatFn: (value: any) => typeof value === 'number' ? value.toFixed(2) : value
    } as any);
  }
}
```

## Key Changes
1. **Removed dependency on first location's threshold values** - No longer checks if the first location has threshold values before adding them to tooltip config
2. **Always include threshold fields when enabled** - Threshold fields are always added to tooltip configuration when `showThresholdsInTooltips` is true
3. **Dynamic updates** - Tooltips now properly reflect the current state of threshold data, including historical calculations
4. **Graceful handling of undefined values** - The `LocationPopup` component already handles undefined/null values properly

## Files Modified
- `visualizations/geo-location-viz/utils/map.tsx` - Fixed `generateTooltipConfig` function

## Testing
To verify the fix:
1. Enable historical thresholds in the visualization configuration
2. Enable "Show Thresholds in Tooltips" option
3. Observe that tooltip threshold values update when historical thresholds are applied
4. Verify that marker colors and tooltip values are consistent

## Impact
- **Positive**: Tooltips now correctly display updated threshold values when historical thresholds are used
- **No Breaking Changes**: The fix maintains backward compatibility and doesn't affect existing functionality
- **Performance**: No performance impact as the change only affects tooltip configuration logic

## Related Features
This fix works in conjunction with:
- Historical Threshold calculations (`utils/historicalThresholds.tsx`)
- Historical Threshold Provider (`context/HistoricalThresholdProvider.tsx`)
- Enhanced Dual Query hook (`hooks/useNerdGraphQuery.tsx`)
- Threshold data merging (`utils/dataFormatting.tsx`)
