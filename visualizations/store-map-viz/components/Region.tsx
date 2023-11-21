import React from "react";
import { GeoJSON, Tooltip } from "react-leaflet";

const Region = ({ region }) => {
  const style = () => ({ color: "white", fillColor: "green", opacity: 0.5 });

  const percentage = "100";

  return (
    <GeoJSON data={region} style={style}>
      {/* <Tooltip
        direction="center"
        offset={[0, 0]}
        opacity={0.8}
        permanent
        className="custom-tooltip"
      >
        {`${percentage}%`}
      </Tooltip> */}
    </GeoJSON>
  );
};

export default Region;
