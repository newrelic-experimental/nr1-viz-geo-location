import React, { useState } from "react";
import { AutoSizer, NrqlQuery, Spinner, LineChart } from "nr1";

import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";

import MapView from "./components/Map";

const App = ({ queries, nerdletState, platformState }) => {
  const nrqlQueryPropsAvailable = queries && queries[0] && queries[0].accountId;
  // nrqlQueries[0].query;

  if (!nrqlQueryPropsAvailable) {
    return <EmptyState />;
  }

  return (
    <AutoSizer>
      {({ width, height }) => {
        const query = `${queries[0].query} ${
          nerdletState.selectedVariables &&
          nerdletState.selectedVariables.StoreNumber
            ? ` WHERE costCenterCd = ${nerdletState.selectedVariables.StoreNumber}`
            : ``
        }`;

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
            <MapView />
          </div>
        );
      }}
    </AutoSizer>
  );
};

export default App;
