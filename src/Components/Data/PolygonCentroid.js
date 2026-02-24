import { toast } from "react-toastify";

export const PolygonCentroid = (path) => {
  let latSum = 0,
    lngSum = 0;
  path.forEach((point) => {
    latSum += point.lat;
    lngSum += point.lng;
  });
  return { lat: latSum / path.length, lng: lngSum / path.length };
};

export const colorSet = [
  { action: "P1 For Store Opening", color: "#0570a1ff" },
  { action: "P2 For Store Opening", color: "#119cb2ff" },
  { action: "P3 Store Opening", color: "#2dd3d3ff" },
  { action: "P4 Store Opening", color: "#a9f0f5ff" },
  { action: "Efficiency Intervention", color: "#008000" },
  { action: "Nearest Store Communication", color: "#FFC0CB" },
  { action: "Anti-Dormancy Drive", color: "#FFA500" },
  { action: "No Action", color: "#FF0000" },
];
export const StoreColorSet = [
  { action: "Efficiency Intervention", color: "#008000" },
  { action: "Nearest Store Communication", color: "#FFC0CB" },
  { action: "Anti-Dormancy Drive", color: "#FFA500" },
];

export const geocodeAddress = (postalCode) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      return reject(new Error("Google Maps script not loaded"));
    }
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      {
        componentRestrictions: {
          postalCode,
          country: "IN",
        },
      },
      (results, status) => {
        if (status === "OK" && results[0]) {
          const response = {
            formattedAddress: results[0].formatted_address,
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            fullResult: results[0],
          };
          resolve(response);
        } else {
          toast.error(`No address found for pincode: ${postalCode}`, {
            theme: "colored",
            autoClose: 2000,
          });
          resolve(null);
        }
      },
    );
  });
};

export const getColoredData = (data, colorSet) => {
  if (!data) return [];
  return data.map((item) => {
    const pin = Number(item.pincode);
    let color;
    if (pin === Number(colorSet.pincode)) {
      color = "red";
    } else if (colorSet.primaryPincode?.includes(pin)) {
      color = "blue";
    } else if (colorSet.secondaryPincode?.includes(pin)) {
      color = "grey";
    }
    return { ...item, ...(color && { color }) };
  });
};
