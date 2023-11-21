import React from "react";
import { AutoSizer } from "nr1";

import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import MapView from "./components/Map";

const App = ({ accountId }) => {
  if (!accountId) {
    return <EmptyState />;
  }

  return (
    <AutoSizer>
      {({ width, height }) => {
        return (
          <div
            style={{ fontSize: "2rem", paddingRight: ".25rem", height: "100%" }}
          >
            <MapView />
          </div>
        );
      }}
    </AutoSizer>
  );
};

export default App;
