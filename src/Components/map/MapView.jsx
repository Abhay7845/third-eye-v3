import React, { useState, useMemo, useRef } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

// Define custom colors per marker type
const COLOR_BY_TYPE = {
  jewellery: "red",
  competitor: "blue",
  ourBrand: "green",
  retail: "orange",
};

const MapView = ({
  center,
  zoom,
  style,
  options,
  placeMarkers,
  setGoogleMapInstance,
}) => {
  const mapRef = useRef(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const memoCenter = useMemo(() => center, [center]);
  const memoStyle = useMemo(() => style, [style]);
  const memoOptions = useMemo(() => options, [options]);

  const markersArray = useMemo(() => {
    if (Array.isArray(placeMarkers)) {
      return placeMarkers.map((m) => ({
        position: m.geometry?.location || m.position,
        type: m.type || "",
        title: m.name || m.title || "",
      }));
    } else if (typeof placeMarkers === "object" && placeMarkers !== null) {
      return Object.entries(placeMarkers).flatMap(([type, markers]) =>
        (markers || []).map((m) => ({
          position: m.geometry?.location || m.position,
          type,
          title: m.name || m.title || "",
        }))
      );
    } else {
      return [];
    }
  }, [placeMarkers]);

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
      {markersArray.map((marker, idx) => {
        const fillColor = COLOR_BY_TYPE[marker.type];
        return (
          <Marker
            key={idx}
            position={marker.position}
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
              fillColor: fillColor,
              fillOpacity: 1,
              strokeColor: "#000",
              strokeWeight: 1,
              scale: 1,
              anchor: new window.google.maps.Point(10, 20),
            }}
            title={marker.title}
            animation={
              activeMarker === idx ? window.google.maps.Animation.BOUNCE : null
            }
            onMouseOver={() => setActiveMarker(idx)}
            onMouseOut={() => setActiveMarker(null)}
          />
        );
      })}
    </GoogleMap>
  );
};

export default React.memo(MapView);
