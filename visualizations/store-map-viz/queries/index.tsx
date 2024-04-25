import { timeRangeToNrql } from "../utils";

const nrqlQuery = (query, timeRange, defaultSince, ignorePicker) => {
  if (ignorePicker === true) {
    return (
      query.replace(/(\r\n|\n|\r)/gm, " ").replace(/\\/g, "\\\\") + defaultSince
    );
  } else {
    // Generate the time range part of the NRQL query
    const timeRangePart = timeRangeToNrql(timeRange);
    // Construct the full NRQL query, remove line breaks
    let q = `${query.replace(/(\r\n|\n|\r)/gm, " ").replace(/\\/g, "\\\\")} ${
      timeRangePart === "" ? defaultSince || "" : timeRangePart
    }`;
    return q;
  }
};

const gqlQuery = (query, timeRange, defaultSince, ignorePicker) => {
  return `nrql( query: "${nrqlQuery(
    query,
    timeRange,
    defaultSince,
    ignorePicker
  )}" ) { results }`;
};

export const nerdGraphQuery = (
  query,
  timeRange,
  defaultSince,
  ignorePicker
) => {
  return `
  query($id: Int!) {
    actor {
      account(id: $id) {
        result: ${gqlQuery(query, timeRange, defaultSince, ignorePicker)}
      }
    }
  }
`;
};
