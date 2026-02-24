import React from "react";
import "../map/style/MapSkeleton.css";

const MapSkeleton = () => {
  return (
    <div className='map-loader-overlay'>
      <div className='loader-box'>
        <div className='bars'>
          <div className='bar bar1'></div>
          <div className='bar bar2'></div>
          <div className='bar bar3'></div>
        </div>
        <p>Please wait map is loading...</p>
      </div>
    </div>
  );
};

export default MapSkeleton;
