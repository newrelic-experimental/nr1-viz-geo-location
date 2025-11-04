# Flickering Fix Implementation Summary

## Problem Description
The geo-location visualization was experiencing flickering where markers and regions would change colors after initial render. This occurred because:

1. Main queries (markers and regions) would complete and render first
2. Historical threshold queries would load separately and complete later
3. When historical thresholds finished loading, they would be applied to already-rendered markers/regions
4. This caused a visual "flicker" as colors changed from the initial state to the final state with thresholds applied

## Root Cause Analysis
The issue was in the data loading coordination:
- `HistoricalThresholdProvider` loaded historical data independently
- `useEnhancedDualQuery` had logic to show "temporary" data while historical thresholds were still loading
- Markers and Regions components rendered as soon as main data was available, without waiting for all required data

## Solution Implementation

### 1. Enhanced Loading State Management (`useEnhancedDualQuery`)
**File**: `hooks/useNerdGraphQuery.tsx`

**Changes**:
- Removed the temporary data rendering logic that caused flickering
- Added `hasInitialLoad` state to track when the first successful data load has completed
- Modified the data processing flow to only wait for all data on the initial load
- On subsequent reloads, data is processed immediately to prevent disappearing markers/regions

**Key Logic**:
```typescript
// Only wait for historical thresholds on the initial load to prevent flickering
// On subsequent reloads, show data immediately to avoid disappearing markers/regions
if (historicalConfig?.enableHistoricalThresholds && historicalLoading && !hasInitialLoad) {
  setDataReady(false);
  return;
}

// Mark that we've completed the initial load
if (!hasInitialLoad) {
  setHasInitialLoad(true);
}
```

### 2. Refined Conditional Rendering in Components
**Files**: `components/Markers.tsx`, `components/Regions.tsx`

**Changes**:
- Refined the rendering logic to only wait for `dataReady` when necessary
- On initial load with historical thresholds enabled, wait for all data to prevent flickering
- On subsequent loads, show data immediately as soon as it's available
- This prevents both the initial flickering and the disappearing markers/regions on reloads

**Key Logic**:
```typescript
// Only wait for dataReady on initial load to prevent flickering
// On subsequent loads, show data as soon as locations are available
if (locations === undefined) {
  return null;
}

// If historical thresholds are enabled and we don't have any data yet, wait for dataReady
// This prevents the initial flickering but allows subsequent reloads to show immediately
if (enableHistoricalThresholds && locations.length === 0 && !dataReady) {
  return null;
}
```

### 3. Loading State Indicator
**Files**: `components/LoadingState.tsx` (new), `components/Map.tsx`

**Changes**:
- Created a new `LoadingState` component with a spinner and loading message
- Added `MapContent` component to coordinate loading state display
- Shows loading indicator when historical thresholds are enabled and still loading
- Provides visual feedback to users during the data loading process

### 4. Improved User Experience
**Benefits**:
- **No more flickering**: Markers and regions only render once with their final colors
- **Loading feedback**: Users see a loading indicator instead of incomplete data
- **Coordinated data loading**: All data sources are synchronized before rendering
- **Consistent behavior**: Works whether historical thresholds are enabled or disabled

## Technical Details

### Data Flow Before Fix:
1. Main queries start loading
2. Historical thresholds start loading (if enabled)
3. Main queries complete → **Render markers/regions with temporary colors**
4. Historical thresholds complete → **Re-render with final colors** ← FLICKER

### Data Flow After Fix:
1. Main queries start loading
2. Historical thresholds start loading (if enabled)
3. Show loading indicator while any data is still loading
4. Wait for ALL data to be ready
5. **Render markers/regions once with final colors** ← NO FLICKER

### Configuration Impact
- **Historical thresholds disabled**: Works as before, no loading coordination needed
- **Historical thresholds enabled**: Waits for historical data before rendering
- **No queries configured**: Handles gracefully with no unnecessary loading states

### 5. Auto-Refresh for Historical Thresholds
**File**: `hooks/useHistoricalThresholdQuery.tsx`

**Changes**:
- Added `fetchInterval` parameter from props to enable auto-refresh functionality
- Implemented interval-based refetching logic similar to main queries
- Historical thresholds now recalculate at the same interval as markers and regions
- Ensures threshold data stays current with the configured refresh rate

**Key Logic**:
```typescript
// Set up interval for auto-refresh if fetchInterval is configured
if (fetchInterval && fetchInterval >= 1) {
  const fetchIntervalms = fetchInterval * 1000;
  const intervalId = setInterval(fetchHistoricalThresholds, fetchIntervalms);
  return () => clearInterval(intervalId);
}
```

## Files Modified
1. `hooks/useNerdGraphQuery.tsx` - Enhanced data loading coordination
2. `components/Markers.tsx` - Added refined dataReady check
3. `components/Regions.tsx` - Added refined dataReady check  
4. `components/Map.tsx` - Added loading state management
5. `components/LoadingState.tsx` - New loading indicator component
6. `hooks/useHistoricalThresholdQuery.tsx` - Added auto-refresh functionality

## Testing Recommendations
1. Test with historical thresholds enabled and disabled
2. Verify no flickering occurs during initial data loading
3. Confirm loading indicator appears only during initial load, not reloads
4. Test auto-refresh functionality with various fetch intervals
5. Verify historical thresholds are recalculated during auto-refresh
6. Test with various query configurations (markers only, regions only, both)
7. Verify error handling still works correctly
8. Confirm markers/regions don't disappear during data reloads
