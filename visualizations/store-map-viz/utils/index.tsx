const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const timeRangeToNrql = function (timeRange) {
  // Check if timeRange is undefined or null
  if (typeof timeRange === "undefined" || timeRange === null) {
    return ""; // "SINCE 30 minutes ago"; could also be returned here
  }

  // Handle scenarios where both begin and end times are available
  if (timeRange.beginTime && timeRange.endTime) {
    return `SINCE ${timeRange.beginTime} UNTIL ${timeRange.endTime}`;
  } else if (timeRange.begin_time && timeRange.end_time) {
    return `SINCE ${timeRange.begin_time} UNTIL ${timeRange.end_time}`;
  }

  // Handle duration based scenarios
  if (timeRange.duration) {
    if (timeRange.duration <= HOUR) {
      return `SINCE ${timeRange.duration / MINUTE} MINUTES AGO`;
    } else if (timeRange.duration <= DAY) {
      return `SINCE ${timeRange.duration / HOUR} HOURS AGO`;
    } else {
      return `SINCE ${timeRange.duration / DAY} DAYS AGO`;
    }
  }

  // Default case if none of the above conditions are met
  return ""; // "SINCE 30 minutes ago"; could also be returned here
};
