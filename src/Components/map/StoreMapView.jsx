import React, { useRef, useMemo } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const StoreMapView = ({
  center,
  zoom,
  style,
  options,
  placeMarkers,
  setGoogleMapInstance,
  store,
}) => {
  const mapRef = useRef(null);
  const memoCenter = useMemo(() => center, [center]);
  const memoStyle = useMemo(() => style, [style]);
  const memoOptions = useMemo(() => options, [options]);

  return (
    <GoogleMap
      center={memoCenter}
      zoom={zoom}
      mapContainerStyle={memoStyle}
      options={memoOptions}
      onLoad={(map) => {
        if (setGoogleMapInstance) setGoogleMapInstance(map);
        mapRef.current = map;
      }}>
      {placeMarkers.map((marker, idx) => (
        <Marker
          key={idx}
          position={marker}
          title={store}
          icon={{
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
            fillColor: "red",
            fillOpacity: 1,
            strokeColor: "#000",
            strokeWeight: 1,
            scale: 1.5,
            anchor: new window.google.maps.Point(10, 20),
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default StoreMapView;
