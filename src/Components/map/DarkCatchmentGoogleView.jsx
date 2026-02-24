import { useRef } from "react";
import { MapContent } from "../Data/Data";
import StoreMapView from "./StoreMapView";

const DarkCatchmentGoogleView = ({
  setGoogleMapInstance,
  placeMarkers,
  store,
  userLocation,
}) => {
  const mapRef = useRef(null);

  return (
    <StoreMapView
      center={userLocation}
      zoom={11}
      style={{ height: "82vh", width: "100%" }}
      options={MapContent}
      setGoogleMapInstance={setGoogleMapInstance}
      mapRef={mapRef}
      placeMarkers={placeMarkers}
      store={store}
    />
  );
};

export default DarkCatchmentGoogleView;
