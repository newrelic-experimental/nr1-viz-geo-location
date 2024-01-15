import { timeRangeToNrql } from "../utils";
import { useProps } from "../context/VizPropsProvider";

const salesQuery = (markersQuery,timeRange) => {
  // Generate the time range part of the NRQL query
  const timeRangePart = timeRangeToNrql(timeRange);

  // Construct the full NRQL query, remove line breaks
  let query = `${markersQuery.replace(/(\r\n|\n|\r)/gm," ")} ${timeRangePart}`;
  return query;
};

export const salesNrql = (timeRange) => {
  return `nrql( query: "${salesQuery(timeRange)}" ) { results }`;
};

export const nerdGraphSalesQuery = (markersQuery,timeRange) => {

  return `
  query($id: Int!) {
    actor {
      account(id: $id) {
        sales: ${salesNrql(markersQuery,timeRange)}
      }
    }
  }
`;
}
