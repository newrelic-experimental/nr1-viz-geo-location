import { timeRangeToNrql } from "../utils";

const markerNRQL = (markersQuery, timeRange, defaultSince, ignorePicker) => {
  if (ignorePicker === true) {
    return markersQuery.replace(/(\r\n|\n|\r)/gm, " ") + defaultSince;
  } else {
    // Generate the time range part of the NRQL query
    const timeRangePart = timeRangeToNrql(timeRange);
    // Construct the full NRQL query, remove line breaks
    let query = `${markersQuery.replace(/(\r\n|\n|\r)/gm, " ")} ${
      timeRangePart === "" ? defaultSince : timeRangePart
    }`;
    return query;
  }
};

export const markerGQL = (
  markersQuery,
  timeRange,
  defaultSince,
  ignorePicker,
) => {
  return `nrql( query: "${markerNRQL(
    markersQuery,
    timeRange,
    defaultSince,
    ignorePicker,
  )}" ) { results }`;
};

export const nerdGraphMarkerQuery = (
  markersQuery,
  timeRange,
  defaultSince,
  ignorePicker,
) => {
  return `
  query($id: Int!) {
    actor {
      account(id: $id) {
        markers: ${markerGQL(
          markersQuery,
          timeRange,
          defaultSince,
          ignorePicker,
        )}
      }
    }
  }
`;
};
