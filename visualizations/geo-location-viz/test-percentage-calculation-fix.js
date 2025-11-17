// Test script to verify the percentage calculation fix
// This can be run in the browser console to test the enhanced error handling

import { calculatePercentageDifference, processLocationsForPercentageHeatmap } from './utils/historicalThresholds';

// Test cases for the enhanced percentage calculation
const testCases = [
  {
    name: 'Valid calculation',
    current: 100,
    historical: 80,
    locationName: 'TestLocation1',
    expectedResult: 25 // (100-80)/80 * 100 = 25%
  },
  {
    name: 'Historical value undefined',
    current: 100,
    historical: undefined,
    locationName: 'TestLocation2',
    expectedResult: null
  },
  {
    name: 'Historical value null',
    current: 100,
    historical: null,
    locationName: 'TestLocation3',
    expectedResult: null
  },
  {
    name: 'Historical value zero',
    current: 100,
    historical: 0,
    locationName: 'TestLocation4',
    expectedResult: null
  },
  {
    name: 'Current value undefined',
    current: undefined,
    historical: 80,
    locationName: 'TestLocation5',
    expectedResult: null
  },
  {
    name: 'Current value null',
    current: null,
    historical: 80,
    locationName: 'TestLocation6',
    expectedResult: null
  },
  {
    name: 'Historical value NaN',
    current: 100,
    historical: 'not-a-number',
    locationName: 'TestLocation7',
    expectedResult: null
  }
];

console.log('🧪 Testing enhanced percentage calculation error handling...');

testCases.forEach((testCase, index) => {
  console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);
  
  const result = calculatePercentageDifference(
    testCase.current, 
    testCase.historical, 
    testCase.locationName
  );
  
  const passed = result === testCase.expectedResult || 
    (typeof testCase.expectedResult === 'number' && Math.abs(result - testCase.expectedResult) < 0.01);
  
  console.log(`Expected: ${testCase.expectedResult}, Got: ${result}, Passed: ${passed ? '✅' : '❌'}`);
});

// Test the processLocationsForPercentageHeatmap function with mixed data
console.log('\n🧪 Testing processLocationsForPercentageHeatmap with mixed data...');

const testLocations = [
  {
    name: 'Location1',
    value: 100,
    historical_value: 80
  },
  {
    name: 'Location2', 
    value: 50,
    historical_value: undefined // This should be excluded
  },
  {
    name: 'Location3',
    value: 75,
    historical_value: 100
  },
  {
    name: 'Location4',
    value: 200,
    historical_value: null // This should be excluded
  }
];

const result = processLocationsForPercentageHeatmap(testLocations, true);

console.log('Processed locations:', result.processedLocations);
console.log('Percentage range:', result.percentageRange);

// Count locations with valid percentages
const validPercentages = result.processedLocations.filter(loc => 
  loc.percentage_difference !== null && loc.percentage_difference !== undefined
);

console.log(`✅ Locations with valid percentages: ${validPercentages.length}`);
console.log(`❌ Locations excluded due to missing historical data: ${testLocations.length - validPercentages.length}`);

console.log('\n🎉 Test completed! Check console messages above for detailed error handling.');
