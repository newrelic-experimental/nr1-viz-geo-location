# Historical Threshold Fallback Logic Fix

## Issue Description
When historical thresholds were enabled but the historical queries returned no data (empty arrays), the system was incorrectly falling back to the regular threshold query. This caused confusing behavior where:

1. Console logs showed "0 locations with historical data" (correct)
2. But tooltips displayed threshold values from the fallback regular threshold query
3. Users saw "Historical value: 1.5" even when no historical data was actually found

## Root Cause
The issue was in the `useEnhancedDualQuery` function in `hooks/useNerdGraphQuery.tsx`. The logic was:

```typescript
// PROBLEMATIC LOGIC (before fix)
if (historicalConfig?.enableHistoricalThresholds && historicalThresholdData.length > 0) {
  thresholdResults = historicalThresholdData;
} else if (thresholdQuery && thresholdQuery.trim() !== '') {
  // This fallback executed even when historical thresholds were enabled but returned no data
  const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
  thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results || [];
}
```

**The Problem**: When `historicalThresholdData.length === 0`, the code would fall back to executing the regular threshold query, even though historical thresholds were enabled.

## Solution
Modified the logic to prevent fallback to regular threshold queries when historical thresholds are enabled:

```typescript
// FIXED LOGIC
if (historicalConfig?.enableHistoricalThresholds) {
  // When historical thresholds are enabled, only use historical data if available
  // Do not fall back to regular threshold query - let main query fallback thresholds be used
  if (historicalThresholdData.length > 0) {
    thresholdResults = historicalThresholdData;
    console.log("Using historical threshold data:", historicalThresholdData.length, "locations");
  } else {
    console.log("Historical thresholds enabled but no historical data available - using main query fallback thresholds");
    thresholdResults = []; // No threshold merging - use main query's fallback thresholds
  }
} else if (thresholdQuery && thresholdQuery.trim() !== '') {
  // Only use regular threshold query when historical thresholds are disabled
  const thresholdResponse = await NerdGraphQuery.query({ query: thresholdNrql, variables });
  thresholdResults = thresholdResponse?.data?.actor?.account?.result?.results || [];
}
```

## Key Changes

1. **Clear Separation**: Historical threshold mode vs regular threshold mode are now clearly separated
2. **No Fallback When Historical Enabled**: When historical thresholds are enabled but return no data, the system uses the main query's fallback thresholds instead of executing a separate threshold query
3. **Better Logging**: Added console logs to clearly indicate which threshold source is being used
4. **Consistent Behavior**: The tooltip now correctly reflects the actual data source being used

## Behavior After Fix

### When Historical Thresholds Are Enabled:
- **Historical data available**: Uses historical threshold values in tooltips
- **No historical data**: Uses fallback thresholds from main query (no separate threshold query executed)
- **Console logs**: Clearly indicate "using main query fallback thresholds"

### When Historical Thresholds Are Disabled:
- **Regular threshold query**: Executes as before when a threshold query is provided
- **No changes**: Existing behavior preserved for non-historical mode

## Files Modified
- `visualizations/geo-location-viz/hooks/useNerdGraphQuery.tsx` - Fixed fallback logic in `useEnhancedDualQuery`

## Testing
To verify the fix:
1. Enable historical thresholds
2. Choose a small time frame that results in no historical data
3. Observe console logs show "using main query fallback thresholds"
4. Verify tooltip values match the main query's fallback thresholds (not stale historical values)
5. Confirm no separate threshold query is executed when historical mode is enabled

## Impact
- **Positive**: Eliminates confusing behavior where stale threshold values appeared in tooltips
- **Performance**: Reduces unnecessary threshold queries when historical thresholds are enabled but return no data
- **Clarity**: Console logging now accurately reflects the data source being used
- **No Breaking Changes**: Maintains backward compatibility for all existing configurations
