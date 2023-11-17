import React, { useState } from "react";
import { AutoSizer, NrqlQuery, Spinner, LineChart } from "nr1";

import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";

import MapView from "./components/Map";

const App = ({ nrqlQueries, stroke, fill, nerdletState, platformState }) => {
  console.log({ nrqlQueries, stroke, fill, nerdletState, platformState });

  const nrqlQueryPropsAvailable =
    nrqlQueries &&
    nrqlQueries[0] &&
    nrqlQueries[0].accountId &&
    nrqlQueries[0].query;

  if (!nrqlQueryPropsAvailable) {
    return <EmptyState />;
  }

  // center for the map
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);

  return (
    <AutoSizer>
      {({ width, height }) => {
        const query = `${nrqlQueries[0].query} ${
          nerdletState.selectedVariables &&
          nerdletState.selectedVariables.StoreNumber
            ? ` WHERE costCenterCd = ${nerdletState.selectedVariables.StoreNumber}`
            : ``
        }`;
        console.log(`Query: ${query}`);

        return (
          <div
            style={{ fontSize: "2rem", paddingRight: ".25rem", height: "100%" }}
          >
            {/* <NrqlQuery
              query={query}
              accountId={parseInt(nrqlQueries[0].accountId)}
              pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
            >
              {({ data, loading, error }) => {
                if (loading) {
                  return <Spinner />;
                }

                if (error) {
                  return <ErrorState />;
                }

                return <LineChart fullWidth fullHeight data={data} />;
              }}
            </NrqlQuery> */}
            <MapView mapCenter={mapCenter} setMapCenter={setMapCenter} />
          </div>
        );
      }}
    </AutoSizer>
  );
};

export default App;
