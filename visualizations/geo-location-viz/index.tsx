import React, { useState } from "react";
import { PlatformStateContext, NerdletStateContext } from "nr1";

import App from "./App";
import { MapProvider } from "./context/MapContextProvider";
import { VizPropsProvider } from "./context/VizPropsProvider";

const Hours12 = "43200000";

// props contain properties from config
const StoreMapVizVisualization = (props) => {
  // this is for local testing only
  const [platformState, setPlatformState] = useState({
    timeRange: { begin_time: null, duration: null, end_time: null },
  });
  const [switchState, setSwitchState] = useState(true);

  // this is for local testing only
  const switchPlatformState = () => {
    setPlatformState({
      timeRange: {
        begin_time: null,
        end_time: null,
        duration: switchState ? "21600000" : Hours12,
      },
    });
    setSwitchState(!switchState);
  };

  const { zoom, centerLatLng, noWrap } = props;
  const theCenter = centerLatLng ? `[${centerLatLng}]` : null;

  return (
    <div style={{ height: "100%" }}>
      {/* Uncomment for local testing */}
      {/* <button onClick={switchPlatformState}>Switch state</button> */}
      <PlatformStateContext.Consumer>
        {(platformContextState) => (
          <NerdletStateContext.Consumer>
            {(nerdletContextState) => (
              <MapProvider zoom={zoom} center={theCenter} noWrap={noWrap}>
                <VizPropsProvider {...props}>
                  <App
                    platformState={platformContextState}
                    // platformState // Uncomment for local testing
                    nerdletState={nerdletContextState}
                    // props from config
                    {...props}
                  />
                </VizPropsProvider>
              </MapProvider>
            )}
          </NerdletStateContext.Consumer>
        )}
      </PlatformStateContext.Consumer>
    </div>
  );
};

export default StoreMapVizVisualization;
