import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../custom/Sidebar";
import { Select } from "antd";
import html2canvas from "html2canvas";
import { Modal } from "@mui/material";
import DarkCatchmentGoogleView from "../map/DarkCatchmentGoogleView";
import { toast } from "react-toastify";
import Loader from "../custom/Loader";
import StoreSummary from "../custom/StoreSummary";
import CustomersShares from "../custom/CustomersShares";
import { axiosInstance } from "../../HostManger/API/Authorization";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import { useSelector, useDispatch } from "react-redux";
import { clearNewStoreInputs } from "../../redux/reducer/NewStore";
import { clearNewCityInputs } from "../../redux/reducer/NewCity";
import GraphAccordion from "../accordion/GraphAccordion";
import { PolygonCentroid, StoreColorSet } from "../Data/PolygonCentroid";
import StoreAnlTabel from "../../Mainpages/StoreAnlTabel";
import StoreTypeDetails from "../custom/StoreTypeDetails";
import { channel_list } from "../Data/Data";
import NewStoreCatchmentPdf from "../pdf/NewStoreCatchmentPdf";
import { FilePopStyle } from "./NewStoreProjection";
import CatchmentLevelAction from "../custom/CatchmentLevelAction";
// import { channel_list } from "../Data/Data";

const StoreCatchmentAnalysis = ({ toggle_open, toggle }) => {
  const userLog = useSelector((state) => state?.user?.user);
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const [showTable, setShowTable] = useState(true);
  const [channelval, setChannelval] = useState(userLog?.channel);
  const [channelList, setChannelList] = useState([]);
  const [store, setStore] = useState(null);
  const [storeList, setStoreList] = useState([]);
  const [momStoreTrend, setMomStoreTrend] = useState([]);
  const [pincodeSummary, setPincodeSummary] = useState([]);
  const [storeSummary, setStoreSummary] = useState(null);
  const [custStrPerc, setCustStrPerc] = useState([]);
  const [storeTypeData, setStoreTypeData] = useState(null);
  // -----------------------------------------MAP RELATED STATES ---------------------------------
  const [mapCenter, setMapCenter] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const polygonRefs = useRef([]);
  const map_img = useRef(null);

  const [polygonLabels, setPolygonLabels] = useState([]);
  const [storeAnlMapImg, setStoreAnlMapImg] = useState(null);

  useEffect(() => {
    dispatch(clearNewStoreInputs());
    dispatch(clearNewCityInputs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const population_list = pincodeSummary.map((item) => item.population);

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

  const GetStoreList = (chl) => {
    return axiosInstance
      .get(`/api/fetch/dark/store/codes?channel=${chl}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const storeList = response?.data?.value
            .filter(
              (item) =>
                item &&
                item.trim() !== "" &&
                item.trim() !== "/" &&
                item.trim() !== "-",
            )
            .map((item) => {
              const cleanItem = item.replace(/\(.*?\)/g, "").trim();
              if (cleanItem.includes("-")) {
                const parts = cleanItem.split("-").map((p) => p.trim());
                return {
                  value: parts[0],
                  label: `${parts[0]}-${parts[1]}`,
                };
              } else {
                return {
                  value: cleanItem,
                  label: cleanItem,
                };
              }
            });
          setStoreList(storeList);
        } else {
          toast.error("Similar Store Not Available", {
            theme: "colored",
            autoClose: 2000,
            position: "bottom-right",
          });
          setStoreList([]);
        }
      })
      .catch(() => {});
  };

  // Single effect: show loader until BOTH channel list and store list respond
  useEffect(() => {
    if (!channelval) return;
    setLoading(true);
    Promise.allSettled([GetChannelList(), GetStoreList(channelval)]).finally(
      () => setLoading(false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelval]);

  const GetMomTrendData = async (chl, str) => {
    try {
      const response = await axiosInstance.get(
        `/api/fetch/mom/trend/store?channel=${chl}&storecode=${str}`,
      );
      if (response.data.code === "1000") {
        const mom_data = response?.data?.value.map((item) => ({
          customers: item?.customers,
          month: item?.month,
          revenueByCustomer: parseFloat(item?.revenueByCustomer),
        }));
        return mom_data;
      } else {
        return [];
      }
    } catch (err) {
      return [];
    }
  };

  const GetStoreType = async (str) => {
    try {
      const response = await axiosInstance.get(
        `/api/get/store/type/details?storecode=${str}`,
      );
      if (response.data.code === "1000") {
        return response.data.value;
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  };

  const GetStoreSummary = async (chl, adjcentPin) => {
    try {
      const response = await axiosInstance.get(
        `/api/fetch/catch/analysis/str/summary?channel=${chl}&pincodes=${adjcentPin}`,
      );
      if (response?.data?.code === "1000") {
        const data = response?.data?.value;
        const store_data = {
          encircleBase: Number(parseFloat(data.encircleBase).toFixed(2)),
          channelBase: Number(parseFloat(data.channelBase).toFixed(2)),
          encircleBaseCagr: Number(
            parseFloat(data.encircleBaseCagr * 100).toFixed(2),
          ),
          channelBaseCagr: Number(
            parseFloat(data.channelBaseCagr * 100).toFixed(2),
          ),
          arpc: Number(parseFloat(data.arpc).toFixed(2)),
          dormantBase: Number(parseFloat(data.dormantBase).toFixed(2)),
          dormancyRate: Number(parseFloat(data.dormancyRate * 100).toFixed(2)),
          fillRate: Number(parseFloat(data.fillRate).toFixed(2)),
        };
        return store_data;
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      return [];
    }
  };

  const GetCityDormancyData = async (chl, city) => {
    try {
      const res = await axiosInstance.get(
        `/api/dark/catch/analysis?channel=${chl}&city=${city}`,
      );
      if (res.data.code === "1000") {
        const colorMap = Object.fromEntries(
          StoreColorSet.map((item) => [item.action.trim(), item.color]),
        );
        const grouped_by_catchment = res.data.value.reduce((acc, item) => {
          const action = item.action?.trim();
          const color = colorMap[action] || "#000";
          if (!acc[action]) {
            acc[action] = {
              action,
              color,
              data: [],
            };
          }
          acc[action].data.push(item);
          return acc;
        }, {});
        return Object.values(grouped_by_catchment);
      } else {
        toast.error("No data found for this Store!", {
          theme: "colored",
          autoClose: 2000,
        });
        return [];
      }
    } catch (err) {
      toast.error("Something went wrong!", {
        theme: "colored",
        autoClose: 2000,
      });
      return [];
    }
  };

  const GetCityName = async (t_pin) => {
    try {
      const res = await axiosInstance.get(
        `/api/projection/fetch/city/by/pin?pincodes=${t_pin}`,
      );
      if (res.data.code === "1000") {
        return res.data.value.toString() || null;
      } else {
        toast.warn("City not found for given pincode", {
          theme: "colored",
          autoClose: 2000,
        });
        return null;
      }
    } catch (err) {
      toast.error("Something went wrong!", {
        theme: "colored",
        autoClose: 2000,
      });
      return null;
    }
  };

  const GetPincodeSummary = async (chl, adjcentPin) => {
    try {
      const response = await axiosInstance.get(
        `/api/fetch/catch/analysis/pincode/summary?channel=${chl}&pincodes=${adjcentPin}`,
      );
      if (response?.data?.code === "1000") {
        const pin_summary = response?.data?.value?.map((item) => ({
          arpc: Number(parseFloat(item.arpc).toFixed(2)),
          channelBase: Number(parseFloat(item.channelBase).toFixed(2)),
          channelBaseCagr: Number(parseFloat(item.channelBaseCagr).toFixed(2)),
          dormancyRate: Number(parseFloat(item.dormancyRate * 100).toFixed(2)),
          dormantBase: Number(parseFloat(item.dormantBase).toFixed(2)),
          encircleBase: Number(parseFloat(item.encircleBase).toFixed(2)),
          encircleBaseCagr: Number(
            parseFloat(item.encircleBaseCagr).toFixed(2),
          ),
          fillRate: Number(parseFloat(item.fillRate).toFixed(2)),
          pincode: item.pincode,
        }));
        return pin_summary;
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      return [];
    }
  };

  const GetCustStrPerc = async (str, pri_pins, sec_pins) => {
    try {
      const response = await axiosInstance.get(
        `/api/fetch/share/perc/cust/store?storecode=${str}&primaryPins=${pri_pins}&secondryPins=${sec_pins}`,
      );
      if (response?.data?.code === "1000") {
        const result = response?.data?.value?.map((item) => ({
          ...item,
          percentShareType: item.percentShareType
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
        }));
        return result;
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      return [];
    }
  };

  const GetPopulation = async (adjcentPin) => {
    try {
      const response = await axiosInstance.get(
        `/api/fetch/population/data?pincodes=${adjcentPin}`,
      );
      if (response?.data?.code === "1000") {
        return response?.data?.value;
      } else {
        return [];
      }
    } catch (err) {
      setLoading(false);
      return [];
    }
  };

  const clearPolygons = () => {
    polygonRefs.current.forEach((p) => p.setMap(null));
    polygonRefs.current = [];
    polygonLabels.forEach((l) => l.setMap(null));
    setPolygonLabels([]);
  };

  const handleScreenshot = (map_img, mapInstance) => {
    return new Promise((resolve) => {
      if (!map_img?.current) {
        resolve(null);
        return;
      }

      if (!mapInstance) {
        resolve(null);
        return;
      }

      window.google.maps.event.addListenerOnce(
        mapInstance,
        "idle",
        async () => {
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const mapElement = map_img.current;

            if (!mapElement) {
              resolve(null);
              return;
            }

            const canvas = await html2canvas(mapElement, {
              useCORS: true,
              allowTaint: false,
              logging: false,
              backgroundColor: "#ffffff",

              // High quality
              scale: Math.max(2, window.devicePixelRatio || 1),

              // Don't clone unnecessarily
              removeContainer: false,
            });

            const imgData = canvas.toDataURL("image/png", 1.0);
            setStoreAnlMapImg(imgData);
            resolve(imgData);
          } catch (error) {
            resolve(null);
          }
        },
      );
    });
  };

  const GetAdjusentPin = async (data) => {
    try {
      setLoading(true);

      // Clear previous store results
      setPincodeSummary([]);
      setStoreSummary(null);
      setCustStrPerc([]);
      setMomStoreTrend([]);
      setStoreTypeData(null);

      // --------------------------------------------------
      // STEP 1: Get adjacent pincodes
      // --------------------------------------------------
      const res = await axiosInstance.get(
        `/ThirdEye/get/adjacent/pincodes/db?pincode=${data?.pincode}`,
      );

      if (res?.data?.code !== "1000") {
        toast.info("Data not found.", {
          theme: "colored",
          autoClose: 2000,
          position: "bottom-right",
        });

        setLoading(false);
        return;
      }

      const {
        pincode,
        primaryPincode = [],
        secondaryPincode = [],
      } = res?.data?.value || {};

      const AdjacentPins = [
        pincode,
        ...primaryPincode,
        ...secondaryPincode,
      ].filter(Boolean);

      // --------------------------------------------------
      // STEP 2: Get city & dormancy data
      // --------------------------------------------------
      const cityName = await GetCityName(AdjacentPins);

      const str_details = await GetStoreType(store);
      setStoreTypeData(str_details);

      const mom_trend_details = await GetMomTrendData(channelval, store);
      setMomStoreTrend(mom_trend_details);

      const grouped_cachment = await GetCityDormancyData(channelval, cityName);

      if (!grouped_cachment || grouped_cachment.length === 0) {
        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // STEP 3: Get summaries
      // --------------------------------------------------
      const pincode_summary = await GetPincodeSummary(channelval, AdjacentPins);

      const store_summary = await GetStoreSummary(channelval, AdjacentPins);

      setStoreSummary(store_summary);

      const get_cust_str_perc = await GetCustStrPerc(
        store,
        primaryPincode,
        secondaryPincode,
      );

      setCustStrPerc(get_cust_str_perc);

      const get_pin_population = await GetPopulation(AdjacentPins);

      // --------------------------------------------------
      // STEP 4: Get polygon data
      // --------------------------------------------------
      const polygonRes = await axiosInstance.get(
        `/ThirdEye/get/pincode/cords/db?pincodes=${AdjacentPins}`,
      );

      const MapCoordinates = polygonRes?.data;

      // --------------------------------------------------
      // STEP 5: Merge summary + coordinates
      // --------------------------------------------------
      function getMergeSummary(resp1 = [], resp2 = [], resp3 = []) {
        const normalize = (val) =>
          val !== null && val !== undefined ? String(val) : "";

        return resp1
          .filter((r1) => {
            const pincode1 = normalize(r1.pincode);

            return (
              resp2.some((r2) => normalize(r2.pincode) === pincode1) &&
              resp3.some((r3) => normalize(r3.pincode) === pincode1)
            );
          })
          .map((r1) => {
            const pincode1 = normalize(r1.pincode);

            const r2 =
              resp2.find((r2) => normalize(r2.pincode) === pincode1) || {};

            const r3 =
              resp3.find((r3) => normalize(r3.pincode) === pincode1) || {};

            return {
              ...r1,
              ...r2,
              ...r3,
              pincode: pincode1,
            };
          });
      }

      const mergedData = getMergeSummary(
        MapCoordinates?.value || [],
        pincode_summary || [],
        get_pin_population || [],
      );

      setPincodeSummary(mergedData);

      // --------------------------------------------------
      // STEP 6: Create Google Maps bounds
      // --------------------------------------------------
      const overallBounds = new window.google.maps.LatLngBounds();

      // --------------------------------------------------
      // STEP 7: Create pincode information map
      // --------------------------------------------------
      const pincodeInfoMap = {};

      grouped_cachment.forEach((group) => {
        group?.data?.forEach((item) => {
          pincodeInfoMap[item.pincode] = {
            color: group.color,
            action: group.action,
          };
        });
      });

      // --------------------------------------------------
      // STEP 8: InfoWindow
      // --------------------------------------------------
      const infoWindow = new window.google.maps.InfoWindow();

      let activePolygon = null;

      // --------------------------------------------------
      // STEP 9: Draw polygons
      // --------------------------------------------------
      if (mergedData.length > 0) {
        mergedData.forEach((item) => {
          const {
            pincode,
            channelBase,
            channelBaseCagr,
            encircleBaseCagr,
            encircleBase,
            dormancyRate,
            dormantBase,
            arpc,
            fillRate,
            geometryJson,
          } = item;

          const pinInfo = pincodeInfoMap[pincode] || {};

          const fillColor = pinInfo.color || "#808080";

          const action_level = pinInfo.action || "No Action";

          const drawPolygons = (coordinates) => {
            if (!coordinates?.length) return;

            coordinates.forEach((poly) => {
              if (!poly?.length) return;

              const isMultiPolygon =
                Array.isArray(poly[0]) && Array.isArray(poly[0][0]);

              const pathsArray = isMultiPolygon ? poly : [poly];

              pathsArray.forEach((ring) => {
                if (!ring?.length) return;

                const path = ring.map(([lng, lat]) => {
                  const latLng = {
                    lat: Number(lat),
                    lng: Number(lng),
                  };

                  overallBounds.extend(latLng);

                  return latLng;
                });

                if (!path.length) return;

                // ------------------------------------------
                // Polygon
                // ------------------------------------------
                const polygon = new window.google.maps.Polygon({
                  paths: path,
                  strokeColor: "blue",
                  fillColor: fillColor,
                  fillOpacity: 0.35,
                  strokeOpacity: 1,
                  strokeWeight: 1.5,
                  zIndex: 1,
                });

                polygon.setMap(googleMapInstance);

                polygonRefs.current.push(polygon);

                // ------------------------------------------
                // Mouse over
                // ------------------------------------------
                polygon.addListener("mouseover", () => {
                  if (polygon !== activePolygon) {
                    polygon.setOptions({
                      strokeColor: "red",
                      strokeWeight: 2,
                      zIndex: 2,
                      fillOpacity: 0.55,
                    });
                  }
                });

                // ------------------------------------------
                // Mouse out
                // ------------------------------------------
                polygon.addListener("mouseout", () => {
                  polygon.setOptions({
                    strokeColor: "blue",
                    strokeWeight: 1.5,
                    zIndex: 1,
                    fillOpacity: 0.4,
                  });

                  infoWindow.close();
                });

                // ------------------------------------------
                // Centroid marker
                // ------------------------------------------
                const centroid = PolygonCentroid(path);

                const label = new window.google.maps.Marker({
                  position: centroid,
                  map: googleMapInstance,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 0,
                  },
                });

                setPolygonLabels((prev) => [...prev, label]);

                // ------------------------------------------
                // Click
                // ------------------------------------------
                polygon.addListener("click", (e) => {
                  activePolygon = polygon;

                  polygon.setOptions({
                    strokeColor: "red",
                    strokeWeight: 2,
                    zIndex: 2,
                    fillOpacity: 0.5,
                  });

                  const mapCenter = googleMapInstance.getCenter();

                  const clickLng = e.latLng.lng();

                  const centerLng = mapCenter.lng();

                  const offsetX = clickLng < centerLng ? -180 : 150;

                  infoWindow.setOptions({
                    pixelOffset: new window.google.maps.Size(offsetX, -20),
                  });

                  infoWindow.setContent(`
                    <div
                      class="map_catchment_box"
                      style="
                        font-size:12px;
                        border:1px solid #ccc;
                        border-radius:6px;
                        padding:4px;
                        max-width:300px;
                        background:#fff;
                      "
                    >

                      <div
                        style="
                          font-size:12px;
                          margin-bottom:3px;
                          border-bottom:1px solid #ddd;
                          padding-bottom:2px;
                        "
                      >
                        Catchment Level Action:
                        <span style="color:${fillColor};">
                          ${action_level}
                        </span>
                      </div>

                      <table
                        style="
                          width:100%;
                          border-collapse:collapse;
                          font-size:12px;
                        "
                      >
                        <tbody>

                          <tr>
                            <td
                              colspan="2"
                              style="
                                padding:3px 0;
                                text-align:center;
                                color:blue;
                                font-weight:bold;
                              "
                            >
                              ${pincode}
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:2px 4px;">
                              Encircle Base:
                            </td>
                            <td style="padding:2px 4px;">
                              ${Number(encircleBase || 0).toLocaleString()}
                              (CAGR:
                              ${(Number(encircleBaseCagr || 0) * 100).toFixed(
                                1,
                              )}%)
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:2px 4px;">
                              ${channelval} Base:
                            </td>
                            <td style="padding:2px 4px;">
                              ${Number(channelBase || 0).toLocaleString()}
                              (CAGR:
                              ${(Number(channelBaseCagr || 0) * 100).toFixed(
                                1,
                              )}%)
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:2px 4px;">
                              Dormant Base:
                            </td>
                            <td style="padding:2px 4px;">
                              ${Number(dormantBase || 0).toLocaleString()}
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:2px 4px;">
                              Dormancy (%):
                            </td>
                            <td style="padding:2px 4px;">
                              ${Number(dormancyRate || 0).toFixed(1)}%
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:2px 4px;">
                              ARPC:
                            </td>
                            <td style="padding:2px 4px;">
                              ${(Number(arpc || 0) / 100000).toFixed(2)}L
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:2px 4px;">
                              Fill Rate:
                            </td>
                            <td style="padding:2px 4px;">
                              ${(Number(fillRate || 0) * 100).toFixed(1)}%
                            </td>
                          </tr>

                        </tbody>
                      </table>
                    </div>
                  `);

                  infoWindow.setPosition(e.latLng);

                  infoWindow.open(googleMapInstance);

                  setTimeout(() => {
                    const closeBtn = document.querySelector(
                      ".gm-ui-hover-effect",
                    );

                    if (closeBtn) {
                      closeBtn.style.display = "none";
                    }
                  }, 0);
                });
              });
            });
          };

          drawPolygons(geometryJson?.coordinates);
        });

        // --------------------------------------------------
        // STEP 10: Fit map to polygons
        // --------------------------------------------------
        googleMapInstance.fitBounds(overallBounds);

        // --------------------------------------------------
        // STEP 11: WAIT FOR MAP + TAKE SCREENSHOT
        // --------------------------------------------------
        await handleScreenshot(map_img, googleMapInstance);

        setShowTable(true);
      } else {
        toast.error("Data Not Available", {
          theme: "colored",
          autoClose: 2000,
        });
      }

      setLoading(false);
    } catch (err) {
      toast.error("Something went wrong!", {
        theme: "colored",
        autoClose: 2000,
      });

      setPincodeSummary([]);
      setLoading(false);
    }
  };

  const GetStoreDetails = async (chl, str) => {
    try {
      const res = await axiosInstance.get(
        `/api/fetch/store/details?channel=${chl}&storecode=${str}`,
      );
      if (res?.data?.code === "1000") {
        GetAdjusentPin(res?.data?.value);
        setMapCenter([
          {
            lat: res?.data?.value?.lat,
            lng: res?.data?.value?.longi,
          },
        ]);
        setUserLocation({
          lat: res?.data?.value?.lat,
          lng: res?.data?.value?.longi,
        });
      } else {
        toast.info("Data not found for seleted Channel & Store.", {
          theme: "colored",
          autoClose: 2000,
          position: "bottom-right",
        });
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const OnHandelGoogleMap = async () => {
    clearPolygons();
    if (!channelval) {
      toast.error("Please Select Channel", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    if (!store) {
      toast.error("Please Select Store", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    GetStoreDetails(channelval, store);
  };

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
            <div style={{ width: "70%" }}>
              <div style={{ border: "1px solid #233044" }}>
                {storeTypeData && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      background: "#233044",
                    }}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}>
                      <StoreTypeDetails storeTypeData={storeTypeData} />
                    </div>

                    <button
                      type='button'
                      style={{
                        marginRight: "8px",
                        padding: "4px 15px",
                        background: "#fff",
                        color: "#233044",
                        border: "none",
                        borderRadius: "1px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => setModalOpen(true)}>
                      Preview 👁
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div className='target_chatchment_data'>
                    <GraphAccordion
                      title='Last 12 Months Trends'
                      data={momStoreTrend}
                    />
                  </div>
                </div>
                <div ref={map_img}>
                  <DarkCatchmentGoogleView
                    setGoogleMapInstance={setGoogleMapInstance}
                    placeMarkers={mapCenter}
                    store={store}
                    userLocation={userLocation}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                width: "29.5%",
                border: "1px solid #233044",
              }}>
              <div
                style={{
                  padding: "1%",
                }}>
                <div
                  style={{
                    border: "1px solid #233044",
                    padding: "3px",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "10px",
                      flexWrap: "nowrap",
                      overflowX: "auto",
                    }}>
                    <div style={{ flex: "1", maxWidth: "25%" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          marginBottom: "3px",
                          fontWeight: "bold",
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
                          setStore(null);
                        }}
                        disabled={userLog?.role === "ADMIN"}
                      />
                    </div>
                    <div style={{ flex: "1", minWidth: "20%" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          marginBottom: "3px",
                          fontWeight: "bold",
                        }}>
                        Store
                      </div>
                      <Select
                        showSearch
                        style={{ width: "100%" }}
                        placeholder='Select Store'
                        id='select_store'
                        value={store}
                        options={storeList}
                        onChange={(value) => setStore(value)}
                      />
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <button className='apply_btn' onClick={OnHandelGoogleMap}>
                        FETCH
                      </button>
                    </div>
                  </div>
                </div>
                {pincodeSummary.length > 0 && (
                  <div>
                    <div
                      style={{
                        border: "1px solid #233044",
                        textAlign: "center",
                        fontSize: "16px",
                        padding: "5px",
                        marginTop: "5px",
                        marginBottom: "5px",
                      }}>
                      <StoreSummary
                        storeSummary={storeSummary}
                        populationList={population_list}
                        channel={channelval}
                        maxHeight='86px'
                      />
                    </div>
                    <div
                      style={{
                        border: "1px solid #233044",
                        textAlign: "center",
                        fontSize: "16px",
                        padding: "5px",
                      }}>
                      <CustomersShares custStrPerc={custStrPerc} />
                    </div>
                  </div>
                )}
                <div style={{ border: "1px solid #233044" }}>
                  <CatchmentLevelAction StoreColorSet={StoreColorSet} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {pincodeSummary.length > 0 && (
          <StoreAnlTabel
            data={pincodeSummary}
            showTable={showTable}
            setShowTable={setShowTable}
            channel={channelval}
          />
        )}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div style={FilePopStyle} className='scrollable_container'>
            <NewStoreCatchmentPdf
              close={() => setModalOpen(false)}
              storeTypeData={storeTypeData}
              channel={channelval}
              map_img={storeAnlMapImg}
              storeSummary={storeSummary}
              population_list={population_list}
              custStrPerc={custStrPerc}
              StoreColorSet={StoreColorSet}
              pincodeSummary={pincodeSummary}
            />
          </div>
        </Modal>
      </div>
    </React.Fragment>
  );
};

export default StoreCatchmentAnalysis;
