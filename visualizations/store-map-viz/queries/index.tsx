import { timeRangeToNrql } from "../utils";

const markerNRQL = (markersQuery,timeRange) => {

  if(markersQuery.match(/since|until/gi)) {
    return markersQuery.replace(/(\r\n|\n|\r)/gm," ");
  } else {
    // Generate the time range part of the NRQL query
    const timeRangePart = timeRangeToNrql(timeRange);

    // Construct the full NRQL query, remove line breaks
    let query = `${markersQuery.replace(/(\r\n|\n|\r)/gm," ")} ${timeRangePart}`;
    console.log("OVERFETCH!",Date.now(), query); //TODO: Mat to look at overfetch on window resize
    return query;
  }

};

export const markerGQL = (markersQuery,timeRange) => {
  return `nrql( query: "${markerNRQL(markersQuery, timeRange)}" ) { results }`;
};

export const nerdGraphMarkerQuery = (markersQuery,timeRange) => {

  return `
  query($id: Int!) {
    actor {
      account(id: $id) {
        sales: ${markerGQL(markersQuery,timeRange)}
      }
    }
  }
`;
}
