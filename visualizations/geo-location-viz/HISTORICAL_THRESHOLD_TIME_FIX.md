# Historical Threshold Time Range Fix

## Problem
The probe query for historical time window analysis was not picking up the correct values when the date picker was changed or when falling back to the default since clause. It was always defaulting to 60 minutes (NRQL's default), ignoring both the date picker settings and the `thresholdDefaultSince` configuration.

## Root Cause
The `useHistoricalThresholdQuery` hook was constructing the probe query manually without using the same time range logic that the main queries use. Specifically:

1. The probe query was built using raw `thresholdQuery` without any time modifications
2. The `thresholdIgnorePicker` and `thresholdDefaultSince` props were extracted but never used
3. The probe query didn't respect the date picker's `timeRange` values

## Solution
Modified the `useHistoricalThresholdQuery.tsx` hook to:

### 1. Added Time Range Helper Function
```typescript
const buildProbeQueryWithTimeRange = (query: string, timeRange: any, defaultSince: string, ignorePicker: boolean) => {
  if (ignorePicker === true) {
    // Use default since clause when ignoring picker
    let q = `${query.replace(/(\r\n|\n|\r)/gm, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"')} ${defaultSince ?? ""}`;
    return q;
  } else {
    // Use date picker time range
    const timeRangePart = utilsTimeRangeToNrql(timeRange);
    let q = `${query.replace(/(\r\n|\n|\r)/gm, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"')} ${
      timeRangePart === "" ? defaultSince || "" : timeRangePart
    }`;
    return q;
  }
};
```

### 2. Updated Probe Query Construction
The probe query now uses the same time range logic as main queries:

```typescript
const probeQueryWithTimeRange = buildProbeQueryWithTimeRange(
  thresholdQuery,
  timeRange,
  thresholdDefaultSince,
  thresholdIgnorePicker
);
```

### 3. Added Debug Logging
Added console logging to help debug time range issues:
- Logs the `thresholdIgnorePicker` and `thresholdDefaultSince` settings
- Logs the final probe query with time range applied

## Behavior After Fix

### When `thresholdIgnorePicker` is `true`:
- The probe query will use the `thresholdDefaultSince` value
- Date picker changes are ignored
- Example: If `thresholdDefaultSince = "SINCE 2 hours ago"`, the probe query will use that exact time range

### When `thresholdIgnorePicker` is `false` (default):
- The probe query will respect the date picker's selected time range
- Falls back to `thresholdDefaultSince` if no date picker range is available
- Example: If user selects "Last 4 hours" in date picker, the probe query will use that 4-hour window

## Files Modified
- `visualizations/geo-location-viz/hooks/useHistoricalThresholdQuery.tsx`

## Testing
The fix ensures that:
1. Historical thresholds use the same time window as selected in the date picker
2. The reference timestamp and period duration are correctly extracted from the probe query
3. Historical time ranges are calculated relative to the correct time window
4. Default since clauses are respected when date picker is ignored

## Performance Optimization
Additionally optimized the hook to prevent multiple query dispatches on initial load:

### 4. Optimized Dependency Management
- Moved helper function outside component to prevent re-creation on every render
- Added `useMemo` to stabilize config and timeRange dependencies
- Reduced dependency array to use memoized keys instead of individual object properties

### 5. Query Deduplication System
Implemented a robust deduplication mechanism to prevent duplicate queries caused by New Relic One platform's multiple timeRange updates:

```typescript
// Query deduplication state - persists across renders without causing re-renders
const queryStateRef = useRef({
  currentQueryKey: null,
  isQueryInProgress: false,
  lastCompletedQuery: null,
  lastCompletedTime: 0
});

// Generate unique query key for deduplication
const currentQueryKey = useMemo(() => {
  return `${thresholdQuery}-${timeRangeKey}-${configKey}-${accountId}-${thresholdIgnorePicker}-${thresholdDefaultSince}`;
}, [thresholdQuery, timeRangeKey, configKey, accountId, thresholdIgnorePicker, thresholdDefaultSince]);
```

**Deduplication Logic:**
- **In-Progress Check**: Prevents starting a new query if the same query is already running
- **Recent Completion Check**: Skips queries that were completed within the last 2 seconds
- **Query Tracking**: Tracks query lifecycle with proper cleanup in finally blocks
- **Enhanced Logging**: Provides clear console messages showing when queries are skipped vs executed

**Benefits:**
- Eliminates duplicate queries during date picker transitions
- Prevents resource waste and improves performance
- Maintains data consistency while reducing server load
- Works regardless of what causes multiple renders (platform state updates, component re-renders, etc.)

## Impact
This fix resolves two issues:
1. **Time Range Issue**: Historical thresholds were always calculated based on a 60-minute window regardless of user selections, now they use the appropriate time context from date picker or default since clause
2. **Performance Issue**: Multiple query dispatches on initial load caused by unstable dependencies, now optimized to run queries only when necessary
</content>
