// Test script to verify historical values functionality
// This can be run in a browser console to test the aggregation logic

import { aggregateThresholdData } from './utils/historicalThresholds';

// Mock historical data from multiple periods
const mockHistoricalData = [
  // Period 1 (7 days ago)
  [
    { name: 'New York', threshold_warning: 50, threshold_critical: 75, value: 45 },
    { name: 'London', threshold_warning: 40, threshold_critical: 60, value: 38 },
    { name: 'Tokyo', threshold_warning: 55, threshold_critical: 80, value: 52 }
  ],
  // Period 2 (6 days ago)
  [
    { name: 'New York', threshold_warning: 48, threshold_critical: 72, value: 42 },
    { name: 'London', threshold_warning: 42, threshold_critical: 63, value: 40 },
    { name: 'Tokyo', threshold_warning: 53, threshold_critical: 78, value: 48 }
  ],
  // Period 3 (5 days ago)
  [
    { name: 'New York', threshold_warning: 52, threshold_critical: 78, value: 48 },
    { name: 'London', threshold_warning: 38, threshold_critical: 57, value: 35 },
    { name: 'Tokyo', threshold_warning: 57, threshold_critical: 85, value: 55 }
  ],
  // Period 4 (4 days ago)
  [
    { name: 'New York', threshold_warning: 49, threshold_critical: 74, value: 44 },
    { name: 'London', threshold_warning: 41, threshold_critical: 62, value: 39 },
    { name: 'Tokyo', threshold_warning: 54, threshold_critical: 81, value: 51 }
  ],
  // Period 5 (3 days ago)
  [
    { name: 'New York', threshold_warning: 51, threshold_critical: 77, value: 47 },
    { name: 'London', threshold_warning: 39, threshold_critical: 58, value: 36 },
    { name: 'Tokyo', threshold_warning: 56, threshold_critical: 84, value: 54 }
  ],
  // Period 6 (2 days ago)
  [
    { name: 'New York', threshold_warning: 47, threshold_critical: 71, value: 43 },
    { name: 'London', threshold_warning: 43, threshold_critical: 65, value: 41 },
    { name: 'Tokyo', threshold_warning: 52, threshold_critical: 77, value: 49 }
  ],
  // Period 7 (1 day ago)
  [
    { name: 'New York', threshold_warning: 50, threshold_critical: 75, value: 46 },
    { name: 'London', threshold_warning: 40, threshold_critical: 60, value: 37 },
    { name: 'Tokyo', threshold_warning: 55, threshold_critical: 82, value: 53 }
  ]
];

// Test aggregation with different methods
function testHistoricalValues() {
  console.log('🧪 Testing Historical Values Aggregation');
  console.log('==========================================');

  const aggregationMethods = ['average', 'min', 'max', 'sum'];

  aggregationMethods.forEach(method => {
    console.log(`\n📊 Testing ${method.toUpperCase()} aggregation:`);
    console.log('-------------------------------------------');

    const result = aggregateThresholdData(mockHistoricalData, method, 'name');
    
    result.forEach(location => {
      console.log(`\n🏙️  ${location.name}:`);
      console.log(`   Warning Threshold: ${location.threshold_warning?.toFixed(2) || 'N/A'}`);
      console.log(`   Critical Threshold: ${location.threshold_critical?.toFixed(2) || 'N/A'}`);
      console.log(`   Historical Value: ${location.historical_value?.toFixed(2) || 'N/A'} ⭐ NEW`);
    });
  });

  // Manual verification for average method
  console.log('\n🔍 Manual Verification (Average Method):');
  console.log('=========================================');
  
  // New York values: [45, 42, 48, 44, 47, 43, 46]
  const nyValues = [45, 42, 48, 44, 47, 43, 46];
  const nyAverage = nyValues.reduce((sum, val) => sum + val, 0) / nyValues.length;
  console.log(`New York manual average: ${nyAverage.toFixed(2)}`);
  
  // London values: [38, 40, 35, 39, 36, 41, 37]
  const londonValues = [38, 40, 35, 39, 36, 41, 37];
  const londonAverage = londonValues.reduce((sum, val) => sum + val, 0) / londonValues.length;
  console.log(`London manual average: ${londonAverage.toFixed(2)}`);
  
  // Tokyo values: [52, 48, 55, 51, 54, 49, 53]
  const tokyoValues = [52, 48, 55, 51, 54, 49, 53];
  const tokyoAverage = tokyoValues.reduce((sum, val) => sum + val, 0) / tokyoValues.length;
  console.log(`Tokyo manual average: ${tokyoAverage.toFixed(2)}`);
}

// Test tooltip configuration
function testTooltipConfig() {
  console.log('\n🏷️  Testing Tooltip Configuration');
  console.log('==================================');

  // Mock location data with historical values
  const mockLocations = [
    {
      name: 'New York',
      value: 55.2,
      threshold_warning: 49.57,
      threshold_critical: 74.71,
      historical_value: 45.0,
      tooltip_custom_field: 'Custom data'
    }
  ];

  // Import would be: import { generateTooltipConfig } from './utils/map';
  // For testing purposes, we'll simulate the function
  const generateTooltipConfig = (locations, showThresholdsInTooltips = false) => {
    const config = [
      { label: "Name", queryField: "name" },
      { label: "Value", queryField: "value" }
    ];

    if (showThresholdsInTooltips && locations.length > 0) {
      const firstLocation = locations[0];
      
      if (firstLocation.threshold_warning !== undefined) {
        config.push({ 
          label: "Warning Threshold", 
          queryField: "threshold_warning",
          formatFn: (value) => typeof value === 'number' ? value.toFixed(2) : value
        });
      }
      
      if (firstLocation.threshold_critical !== undefined) {
        config.push({ 
          label: "Critical Threshold", 
          queryField: "threshold_critical",
          formatFn: (value) => typeof value === 'number' ? value.toFixed(2) : value
        });
      }
      
      if (firstLocation.historical_value !== undefined) {
        config.push({ 
          label: "Historical Value", 
          queryField: "historical_value",
          formatFn: (value) => typeof value === 'number' ? value.toFixed(2) : value
        });
      }
    }

    return config;
  };

  const configWithoutThresholds = generateTooltipConfig(mockLocations, false);
  const configWithThresholds = generateTooltipConfig(mockLocations, true);

  console.log('\n📋 Tooltip config WITHOUT thresholds:');
  configWithoutThresholds.forEach(item => {
    console.log(`   - ${item.label}: ${item.queryField}`);
  });

  console.log('\n📋 Tooltip config WITH thresholds (includes historical values):');
  configWithThresholds.forEach(item => {
    console.log(`   - ${item.label}: ${item.queryField}${item.label === 'Historical Value' ? ' ⭐ NEW' : ''}`);
  });

  console.log('\n🎯 Expected tooltip display:');
  console.log('   Name: New York');
  console.log('   Value: 55.2');
  console.log('   Warning Threshold: 49.57');
  console.log('   Critical Threshold: 74.71');
  console.log('   Historical Value: 45.00 ⭐ NEW');
}

// Run tests
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🚀 Running Historical Values Tests in Browser');
  testHistoricalValues();
  testTooltipConfig();
} else {
  // Node.js environment
  console.log('🚀 Running Historical Values Tests in Node.js');
  console.log('Note: This is a simulation - actual imports would be needed for full testing');
  testHistoricalValues();
  testTooltipConfig();
}

export { testHistoricalValues, testTooltipConfig };
