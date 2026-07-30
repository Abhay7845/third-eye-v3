import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../custom/Sidebar";
import { Select } from "antd";
import DarkCatchmentGoogleView from "../map/DarkCatchmentGoogleView";
import { toast } from "react-toastify";
import Loader from "../custom/Loader";
import { axiosInstance } from "../../HostManger/API/Authorization";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import { useSelector, useDispatch } from "react-redux";
import { clearNewStoreInputs } from "../../redux/reducer/NewStore";
import { clearNewCityInputs } from "../../redux/reducer/NewCity";
import { colorSet } from "../Data/PolygonCentroid";
import { channel_list } from "../Data/Data";
// import { channel_list } from "../Data/Data";

const DarkCatchmentAnl = ({ toggle_open, toggle }) => {
  const userLog = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const [cityName, setCityName] = useState(null);
  const [channelval, setChannelval] = useState(userLog?.channel);
  const [channelList, setChannelList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const polygonRefs = useRef([]);
  const [polygonLabels, setPolygonLabels] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    dispatch(clearNewStoreInputs());
    dispatch(clearNewCityInputs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        setUserLocation({
          lat: 12.841069307534518,
          lng: 77.67311083062808,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 2000,
        maximumAge: 0,
      },
    );
  }, []);

  const GetChannelList = () => {
    return axiosInstance
      .get(`/api/fetch/channel/list`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const filteredBrands = response?.data?.value
            ?.map((b) => b.trim())
            .filter((brand) =>
              channel_list.some(
                (ch) => ch.toUpperCase() === brand.toUpperCase(),
              ),
            );
          const channelList = filteredBrands?.map((item) => {
            return {
              value: item?.toUpperCase(),
              label: item?.toUpperCase(),
            };
          });
          setChannelList(channelList);
        }
      })
      .catch(() => {});
  };

  const GetCityList = () => {
    return axiosInstance
      .get("/api/fetch/distinct/city")
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          function toTitleCase(str) {
            return String(str || "")
              .trim()
              .toLowerCase()
              .replace(/\b\w+/g, (w) => w[0].toUpperCase() + w.slice(1));
          }
          const cityData = response?.data?.value
            ?.filter((city) => city && String(city).trim() !== "")
            .map((city) => {
              const normalized = String(city).trim();
              return {
                label: toTitleCase(normalized),
                value: normalized.toLowerCase().replace(/\s+/g, " "),
              };
            });

          setCityList(cityData.sort((a, b) => a.label.localeCompare(b.label)));
        } else {
          setCityList([]);
        }
      })
      .catch(() => {});
  };

  // Single effect: show loader until BOTH channel list and city list respond
  useEffect(() => {
    if (!channelval) return;
    setLoading(true);
    Promise.allSettled([GetChannelList(), GetCityList()]).finally(() =>
      setLoading(false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelval]);

  // -----------------------------AREA HILIGHTING-----------------------------------------------------------

  const clearPolygons = () => {
    polygonRefs.current.forEach((p) => p.setMap(null));
    polygonRefs.current = [];
    polygonLabels.forEach((l) => l.setMap(null));
    setPolygonLabels([]);
  };

  const SearchPincodeArea = async (city, groupedDormancy) => {
    clearPolygons();
    try {
      const response = await axiosInstance.get(
        `/ThirdEye/get/city/pincodes/db?city=${city}`,
      );

      if (response.data.code === "1000") {
        const data = response.data.value;
        const overallBounds = new window.google.maps.LatLngBounds();

        // 🔍 Create maps for pincode => color and pincode => details
        const pincodeColorMap = {};
        const pincodeInfoMap = {};

        groupedDormancy.forEach((group) => {
          group.data.forEach((item) => {
            pincodeColorMap[item.pincode] = group.color;
            pincodeInfoMap[item.pincode] = item;
          });
        });
        //  Draw polygons
        data.forEach((dataItem) => {
          const { geometryJson, pincode } = dataItem;
          const areaBorder = "blue";
          const fillColor = pincodeColorMap[pincode] || "grey";
          const pinInfo = pincodeInfoMap[pincode];
          const action_level = pinInfo?.action;

          const drawPolygons = (coordinates) => {
            coordinates.forEach((poly) => {
              const isMultiPolygon = Array.isArray(poly[0][0]);
              const pathsArray = isMultiPolygon ? poly : [poly];

              pathsArray.forEach((ring) => {
                const path = ring.map(([lng, lat]) => {
                  const latLng = { lat, lng };
                  overallBounds.extend(latLng);
                  return latLng;
                });

                if (path.length === 0) return;

                const polygon = new window.google.maps.Polygon({
                  paths: path,
                  strokeColor: areaBorder,
                  fillColor: fillColor,
                  fillOpacity: 0.5,
                  strokeOpacity: 1,
                  strokeWeight: 1,
                  zIndex: 1,
                });

                polygon.setMap(googleMapInstance);
                polygonRefs.current.push(polygon);

                window.google.maps.event.addListener(
                  polygon,
                  "mouseover",
                  (e) => {
                    polygon.setOptions({
                      strokeColor: "#FF0000",
                      strokeWeight: 2,
                      zIndex: 2,
                      fillOpacity: 0.5,
                    });
                  },
                );

                // Create a reusable InfoWindow instance
                const infoWindow = new window.google.maps.InfoWindow();

                // Add listener to polygon click
                window.google.maps.event.addListener(polygon, "click", (e) => {
                  // Highlight the selected polygon
                  polygon.setOptions({
                    strokeColor: "#FF0000",
                    strokeWeight: 2,
                    zIndex: 2,
                    fillOpacity: 0.5,
                  });

                  // Prepare data for InfoWindow
                  const pinDormancy = pinInfo?.pinDormancy
                    ? (pinInfo.pinDormancy * 100).toFixed(1) + "%"
                    : "N/A";
                  const cityDormancy = pinInfo?.cityDormancy
                    ? (pinInfo.cityDormancy * 100).toFixed(1) + "%"
                    : "N/A";
                  const storePresence = pinInfo?.storePresence || "N/A";
                  const encircleBaseCust = pinInfo?.encircleBaseCust || "N/A";
                  const channelBaseCust = pinInfo?.channelBaseCust || "N/A";
                  const penetration = pinInfo?.penetration || "N/A";
                  const encircleSegment = pinInfo?.encircleSegment || "N/A";
                  const penetrationSegment =
                    pinInfo?.penetrationSegment || "N/A";
                  const decision = pinInfo?.decision || "N/A";

                  // Determine direction based on click position vs map center
                  const mapCenter = googleMapInstance.getCenter();
                  const clickLng = e.latLng.lng();
                  const centerLng = mapCenter.lng();

                  const offsetX = clickLng < centerLng ? -180 : 150;

                  // Apply the corrected offset
                  infoWindow.setOptions({
                    pixelOffset: new window.google.maps.Size(offsetX, -20),
                  });

                  // Set InfoWindow content
                  infoWindow.setContent(
                    `<div class="map_catchment_box" 
        style="font-size:12px; border:1px solid #ccc; border-radius:6px; padding:4px; max-width:280px;">
      <div style="font-size:12px; margin-bottom:3px; border-bottom:1px solid #ddd; padding-bottom:2px;">
        Catchment Level Action: <strong>${action_level || "No Found"}</strong>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <tbody>
          <tr>
            <td colspan="2" style="padding:3px 0; text-align:center; color:blue; font-weight:bold;">
              ${pincode}
            </td>
          </tr>

          <tr>
            <td style="padding:2px 3px;">Dormancy (%):</td>
            <td style="padding:2px 3px;">${pinDormancy}</td>
          </tr>
          <tr>
            <td style="padding:2px 3px;">City Dormancy Rate:</td>
            <td style="padding:2px 3px;">${cityDormancy}</td>
          </tr>
          <tr>
            <td style="padding:2px 3px;">Store Presence:</td>
            <td style="padding:2px 3px;"><strong>${storePresence}</strong></td>
          </tr>
           <tr>
            <td style="padding:2px 3px;">Encircle Base Cust:</td>
            <td style="padding:2px 3px;">${encircleBaseCust}</td>
          </tr> 
          <tr>
            <td style="padding:2px 3px;">Channel Base Cust:</td>
            <td style="padding:2px 3px;">${channelBaseCust}</td>
          </tr>
           <tr>
            <td style="padding:2px 3px;">Penetration:</td>
            <td style="padding:2px 3px;">${penetration}</td>
          </tr>
           <tr>
            <td style="padding:2px 3px;">Encircle Segment:</td>
            <td style="padding:2px 3px;">${encircleSegment}</td>
          </tr>
           <tr>
            <td style="padding:2px 3px;">Penetration Segment:</td>
            <td style="padding:2px 3px;">${penetrationSegment}</td>
          </tr>
           <tr>
            <td style="padding:2px 3px;">Decision:</td>
            <td style="padding:2px 3px;"><strong>${decision?.toUpperCase()}</strong></td>
          </tr>
        </tbody>
      </table>
  </div>`,
                  );

                  // Position and open InfoWindow
                  infoWindow.setPosition(e.latLng);
                  infoWindow.open(googleMapInstance);

                  // Optional: Hide default close button
                  setTimeout(() => {
                    const closeBtn = document.querySelector(
                      ".gm-ui-hover-effect",
                    );
                    if (closeBtn) closeBtn.style.display = "none";
                  }, 0);
                });

                window.google.maps.event.addListener(
                  polygon,
                  "mouseout",
                  () => {
                    polygon.setOptions({
                      strokeColor: areaBorder,
                      strokeWeight: 1,
                      zIndex: 1,
                      fillOpacity: 0.5,
                    });
                    infoWindow.close();
                  },
                );
              });
            });
          };
          drawPolygons(geometryJson.coordinates);
        });
        googleMapInstance.fitBounds(overallBounds);

        window.google.maps.event.addListenerOnce(
          googleMapInstance,
          "bounds_changed",
          () => {
            const currentZoom = googleMapInstance.getZoom();
            if (currentZoom) {
              googleMapInstance.setZoom(
                data.length > 100 ? currentZoom + 1 : currentZoom + 0.6,
              );
            }
          },
        );
      } else {
        toast.warn(response.data.value, {
          theme: "colored",
          autoClose: 2000,
        });
      }
    } catch (err) {
      toast.error(err.message, { theme: "colored", autoClose: 2000 });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const GetCirtyDormancyData = (chl, city) => {
    setLoading(true);
    axiosInstance
      .get(`/api/dark/catch/analysis?channel=${chl}&city=${city}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const colorMap = Object.fromEntries(
            colorSet.map((item) => [item.action.trim(), item.color]),
          );
          const groupedData = response.data.value.reduce((acc, item) => {
            const action = item.action?.trim();
            const color = colorMap[action];
            if (!acc[action]) {
              acc[action] = {
                action,
                color: color,
                data: [],
              };
            }
            acc[action].data.push(item);
            return acc;
          }, {});
          SearchPincodeArea(cityName, Object.values(groupedData));
        } else {
          toast.warn("Data Not Found", {
            theme: "colored",
            autoClose: 2000,
          });
          setLoading(false);
        }
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (channelval && cityName) {
      GetCirtyDormancyData(channelval.toUpperCase(), cityName.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName, channelval]);

  return (
    <React.Fragment>
      {loading && <Loader />}
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      <div
        className={`main_container ${slideOut ? "slide_animation_back" : ""}`}>
        <ThirdEyeHeader chl={channelval} />
        <div
          style={{
            border: "1.5px solid #233044",
            marginTop: "5px",
            marginRight: "5px",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px",
            }}>
            <div style={{ width: "75%" }}>
              <div style={{ border: "1px solid #233044" }}>
                <div
                  style={{
                    borderBottom: "1px solid #233044",
                    color: "grey",
                    fontSize: "13px",
                    padding: "1%",
                  }}>
                  <strong>{cityName ? cityName.toUpperCase() : ""}</strong> City
                  Catchment Analysis For <strong>{channelval}</strong> Channel
                </div>
                <DarkCatchmentGoogleView
                  setGoogleMapInstance={setGoogleMapInstance}
                  placeMarkers={[]}
                  userLocation={userLocation}
                />
              </div>
            </div>
            <div style={{ width: "24.5%", border: "1px solid #233044" }}>
              <div
                style={{
                  padding: "1%",
                }}>
                <div
                  style={{
                    border: "1px solid #233044",
                    padding: "2%",
                    height: "30%",
                  }}>
                  <div
                    style={{
                      fontSize: "14px",
                      marginBottom: "5px",
                    }}>
                    Channel
                  </div>
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    placeholder='Select Channel'
                    id='select_channel'
                    value={channelval}
                    options={channelList}
                    onChange={(value) => {
                      setChannelval(value);
                      setCityName(null);
                    }}
                    disabled={userLog?.role === "ADMIN" ? true : false}
                  />
                  <div
                    style={{
                      fontSize: "14px",
                      marginTop: "10px",
                      marginBottom: "5px",
                    }}>
                    City
                  </div>
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    placeholder='Select City'
                    id='select_id'
                    value={cityName}
                    options={cityList}
                    onChange={(value) => setCityName(value)}
                  />
                </div>
                <div
                  style={{
                    padding: "5px",
                    border: "1px solid #233044",
                    marginTop: "5px",
                  }}>
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "16px",
                      marginBottom: "10px",
                    }}>
                    Catchment Level Action
                  </div>
                  {colorSet.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}>
                      <div
                        style={{
                          width: "15px",
                          height: "15px",
                          backgroundColor: item.color,
                          marginRight: "10px",
                          border: "1px solid #ccc",
                        }}
                      />
                      <span style={{ fontSize: "14px" }}>{item.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default DarkCatchmentAnl;
