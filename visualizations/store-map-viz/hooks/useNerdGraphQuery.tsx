import { useState, useEffect, useContext } from "react";
import { NerdGraphQuery, PlatformStateContext } from "nr1";

import { nerdGraphQuery } from "../queries";
import { FETCH_INTERVAL_DEFAULT } from "../constants";
import { deriveStatus, formatValues } from "../utils/dataFormatting";
import { useProps } from "../context/VizPropsProvider";

export const useNerdGraphQuery = (query: string) => {
  const { timeRange } = useContext(PlatformStateContext);
  const {
    accountId,
    fetchInterval = FETCH_INTERVAL_DEFAULT,
    ignorePicker = false,
    defaultSince = "",
  } = useProps();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || query === null || query === undefined) {
      console.log("Query is required to fetch data.");
      return;
    }

    const fetchData = async () => {
      const nrql = nerdGraphQuery(query, timeRange, defaultSince, ignorePicker);
      const variables = { id: parseInt(accountId, 10) };

      try {
        const response = await NerdGraphQuery.query({ query: nrql, variables });
        const results = response?.data?.actor?.account?.markers?.results;
        if (results && Array.isArray(results)) {
          results.forEach((location) => {
            deriveStatus(location);
            formatValues(location);
          });
          setData(results);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error);
      }
    };

    fetchData();
    const fetchIntervalms = (fetchInterval || FETCH_INTERVAL_DEFAULT) * 1000;
    const intervalId = setInterval(fetchData, fetchIntervalms * 1000);

    return () => clearInterval(intervalId);
  }, [query, accountId, timeRange, fetchInterval, ignorePicker, defaultSince]);

  return { data, error };
};
