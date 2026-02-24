import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../custom/Sidebar";
import { Select } from "antd";
import { toast } from "react-toastify";
import { FiRefreshCcw } from "react-icons/fi";
import GoogleMapView from "../map/GoogleMapView";
import MapSidebaar from "../map/MapSidebaar";
import Loader from "../custom/Loader";
import html2canvas from "html2canvas";
import { axiosInstance } from "../../HostManger/API/Authorization";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import { useDispatch, useSelector } from "react-redux";
import { clearNewStoreInputs } from "../../redux/reducer/NewStore";
import {
  setNewCityDecisiontext,
  setNewCityInputs,
} from "../../redux/reducer/NewCity";
import { comList, ourBrandList } from "../Data/Data";
import { routes } from "../../routes";
import { useNavigate } from "react-router-dom";
import Tippy from "@tippyjs/react";
import { setNewStoreMapImg } from "../../redux/reducer/MapImgStore";
import NewCityDecision from "../../Mainpages/NewCityDecision";
import { geocodeAddress } from "../Data/PolygonCentroid";

const DRIVE_TIME_RADIUS_MAP = {
  15: 5000,
  30: 10000,
  45: 15000,
};

const NewCityExpansion = ({ toggle_open, toggle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ciyInputs = useSelector((state) => state?.newCityInputs?.newCityInputs);
  const decisionObj = useSelector(
    (state) => state?.newCityInputs?.newCityDecisiontext,
  );
  const s_radius = Object.keys(DRIVE_TIME_RADIUS_MAP).find(
    (k) => DRIVE_TIME_RADIUS_MAP[k] === ciyInputs?.radius,
  );
  const [driveTime, setDriveTime] = useState(() =>
    s_radius ? [Number(s_radius)] : [],
  );
  const userLog = useSelector((state) => state?.user?.user);
  const [loading, setLoading] = useState(false);
  const [mapLoader, setMapLoader] = useState(false);
  const [lockBtn, setLockBtn] = useState(false);
  const [defaultLoad, setDefaultLoad] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [projBtnDesabled, setProjBtnDesabled] = useState(true);
  const [channelList, setChannelList] = useState(null);
  const [channelval, setChannelval] = useState(userLog?.channel);
  const [targetCityList, setTargetCityList] = useState([]);
  const [targetCity, setTargetCity] = useState(ciyInputs?.similerStoreVal);
  const [similarCityList, setSimilarCityList] = useState([]);
  const [similarCity, setSimilarCity] = useState(ciyInputs?.targetCity);
  //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> MAP VIEW HOOKS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  const [anchorLocation, setAnchorLocation] = useState(
    ciyInputs?.anchorLocation,
  );
  const [setOfPin, setSetOfPin] = useState(ciyInputs?.setOfPin || []);
  const [simChachmentPin, setSimChachmentPin] = useState(
    ciyInputs?.similarPinCode || null,
  );
  const [pdfMarkers, setPdfMarkers] = useState({
    jewellery: ciyInputs?.pdfMarkers?.jewellery || [],
    retail: ciyInputs?.pdfMarkers?.retail || [],
  });
  const [categoryMarkers, setCategoryMarkers] = useState({
    jewellery: [],
    retail: [],
    competitor: [],
    ourBrand: [],
  });
  const [selectedCategories, setSelectedCategories] = useState({
    jewellery: false,
    retail: false,
    competitor: false,
    ourBrand: false,
  });
  const [mapsidebaar_open, setMapsidebaar_open] = useState(false);
  const [polygonLabels, setPolygonLabels] = useState([]);
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const [targetMatrix, setTargetMatrix] = useState(ciyInputs?.targetMatrix);
  const [similerMatrix, setSimilerMatrix] = useState(ciyInputs?.similerMatrix);
  const [monthOver, setMonthOver] = useState(ciyInputs?.monthOver || []);
  const [arpcVal, setArpcVal] = useState(ciyInputs?.arpcVal);
  const [dormancyTarget, setDormancyTarget] = useState(
    ciyInputs?.dormancyTarget,
  );
  const [dormancySimilar, setDormancySimilar] = useState(
    ciyInputs?.dormancySimilar,
  );

  //--------------------------------- MAP REF VARIABLE ---------------------------
  const driveTimePolygonsRef = useRef([]);
  const polygonRefs = useRef([]);
  const selectedDriveTimesRef = useRef(driveTime);
  const map_img = useRef(null);
  const radius = DRIVE_TIME_RADIUS_MAP[Math.max(...driveTime)] || 15000;

  const inputsPayload = {
    targetPinCode: channelval,
    similerStoreVal: targetCity,
    targetCity: similarCity,
    arpcVal: arpcVal,
    categoryMarkers: categoryMarkers,
    setOfPin: setOfPin,
    similarPinCode: simChachmentPin,
    pdfMarkers: pdfMarkers,
    monthOver: monthOver,
    dormancyTarget: dormancyTarget,
    dormancySimilar: dormancySimilar,
    targetMatrix: targetMatrix,
    similerMatrix: similerMatrix,
    radius: radius,
    anchorLocation: anchorLocation,
  };

  useEffect(() => {
    dispatch(clearNewStoreInputs());
  });

  const HandelResetFiled = () => {
    clearPolygons();
    setLockBtn(false);
    setTargetCity(null);
    setSimilarCity(null);
    setProjBtnDesabled(true);
    setDefaultLoad(false);
    setSimChachmentPin(null);
    setSetOfPin([]);
    setMonthOver([]);
    setDriveTime([]);
    setDormancySimilar(null);
    setSimilerMatrix(null);
    dispatch(setNewCityDecisiontext());
    dispatch(setNewCityInputs());
    setCategoryMarkers({
      jewellery: [],
      retail: [],
      competitor: [],
      ourBrand: [],
    });
    setPdfMarkers({
      jewellery: [],
      retail: [],
    });
  };

  // const check_validstion = {
  //   radius: radius,
  //   lat: anchorLocation?.lat,
  // };

  useEffect(() => {
    if (!ciyInputs?.targetCity)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAnchorLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setAnchorLocation({
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
  }, [ciyInputs?.targetCity]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      setScrolled(isScrolled);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (decisionObj?.bottom_line) {
      setProjBtnDesabled(false);
    }
  }, [decisionObj?.bottom_line]);

  const handleScreenshot = (map_img) => {
    return new Promise((resolve) => {
      if (map_img.current) {
        html2canvas(map_img.current, { useCORS: true }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          dispatch(setNewStoreMapImg(imgData));
          resolve(imgData);
        });
      } else {
        resolve(null);
      }
    });
  };

  const GetChannelList = () => {
    axiosInstance
      .get(`/api/fetch/channel/list`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          // const filteredBrands = response?.data?.value
          //   ?.map((b) => b.trim())
          //   .filter((brand) =>
          //     channel_list.some(
          //       (ch) => ch.toUpperCase() === brand.toUpperCase(),
          //     ),
          //   );
          const channelList = ["TANISHQ"].map((item) => {
            return {
              value: item?.toUpperCase(),
              label: item?.toUpperCase(),
            };
          });
          setChannelList(channelList);
        }
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    GetChannelList();
  }, [channelval]);

  const GetTargetCity = (chl, t_city) => {
    setLoading(true);
    axiosInstance
      .get(
        `/api/fetch/network/exp/target/similar/city?channel=${chl}&cityType=${t_city}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const cityList = response.data.value.filter(
            (city) => city.trim() !== "",
          );
          const targetCity = cityList?.map((item) => {
            return {
              value: item,
              label: item,
            };
          });
          setTargetCityList(targetCity);
        } else {
          toast.warn("Target City Not Availeble", {
            theme: "colored",
            autoClose: 2000,
          });
          setTargetCityList([]);
          setSimilarCityList([]);
          setSimilarCity(null);
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (channelval) {
      GetTargetCity(channelval, "TargetCity");
    }
  }, [channelval]);

  const GetSimilerCity = (chl, s_city) => {
    setLoading(true);
    axiosInstance
      .get(
        `/api/fetch/network/exp/target/similar/city?channel=${chl}&cityType=${s_city}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const targetCity = response.data.value.map((item) => {
            return {
              value: item,
              label: item,
            };
          });
          setSimilarCityList(targetCity);
        } else {
          toast.warn("Similer City Not Availeble", {
            theme: "colored",
            autoClose: 2000,
          });
          setSimilarCityList([]);
          setSimilarCity(null);
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (channelval && targetCity) {
      GetSimilerCity(channelval, "SimilarCity");
    }
  }, [channelval, targetCity]);

  const GetSimilarPincode = (similarCity) => {
    axiosInstance
      .get(`/ThirdEye/get/city/pincodes/db?city=${similarCity}`)
      .then((res) => res)
      .then((response) => {
        if (response?.data?.code === "1000") {
          const similar_city_pins = response?.data?.value.map(
            (item) => item?.pincode,
          );
          setSimChachmentPin(similar_city_pins);
        } else {
          toast.info(response?.data.value, {
            theme: "colored",
            autoClose: 2000,
            position: "bottom-right",
          });
          setSimChachmentPin(null);
        }
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (similarCity) {
      GetSimilarPincode(similarCity);
    }
  }, [similarCity]);

  const GetMonthOverMonthData = async (chl, t_city) => {
    try {
      const response = await axiosInstance.get(
        `/api/new/city/exp/mom/trends/data?channel=${chl}&city=${t_city}`,
      );
      if (response.data.code === "1000") {
        return response.data.value.map((item) => ({
          customers: item.customers,
          month: item.month,
          revenueByCustomer: parseFloat(item.revenueByCustomer),
        }));
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  const GetTargetMatrix = async (chl, t_city) => {
    try {
      const response = await axiosInstance.get(
        `/api/new/city/exp/catch/ebcb/calculation/matrics?channel=${chl}&city=${t_city}`,
      );
      if (response.data.code === "1000") {
        return response.data.value;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const GetSimilarMatrix = async (chl, s_city) => {
    try {
      const response = await axiosInstance.get(
        `/api/new/city/exp/catch/ebcb/calculation/matrics?channel=${chl}&city=${s_city}`,
      );
      if (response.data.code === "1000") {
        return response.data.value;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const GetARPC = async (chl, t_city) => {
    try {
      const response = await axiosInstance.get(
        `/api/new/city/exp/arpc?channel=${chl}&city=${t_city}`,
      );
      if (response.data.code === "1000") {
        return response.data.value[0] || 0;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  };

  const GetDormancyTarget = async (chl, city) => {
    try {
      const response = await axiosInstance.get(
        `/api/city/dormancy/details?channel=${chl}&city=${city}`,
      );
      if (response.data.code === "1000") {
        return response.data.value;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const DormancySimilar = async (chl, city) => {
    try {
      const response = await axiosInstance.get(
        `/api/city/dormancy/details?channel=${chl}&city=${city}`,
      );
      if (response.data.code === "1000") {
        return response.data.value;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<MAP RELATED FUNCTIONALITY START >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>></MAP>

  const clearPolygons = () => {
    polygonRefs.current.forEach((p) => p.setMap(null));
    polygonRefs.current = [];
    polygonLabels.forEach((l) => l.setMap(null));
    setPolygonLabels([]);
  };

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>DRIVE TIME FUNCTIONLITY IMPLEMETION >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  const handleDriveTimeSearch = async (location) => {
    const realTimeLoad = selectedDriveTimesRef.current;
    driveTimePolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    driveTimePolygonsRef.current = [];
    realTimeLoad.forEach((time) => {
      const radius = DRIVE_TIME_RADIUS_MAP[time];
      if (!radius) return;
      const circularCoords = calculateCircularPolygonCoordinates(
        location,
        radius,
      );
      const polygon = drawDriveTimePolygon(circularCoords, time);
      driveTimePolygonsRef.current.push(polygon);
    });
  };

  // ========================================= FIND DEFAULT NEAR BY AREA ================
  const DefaultAreaNearBy = (category, anchorLocation, radius) => {
    if (!googleMapInstance || !window.google?.maps) {
      return;
    }
    setLoading(true);
    const service = new window.google.maps.places.PlacesService(
      googleMapInstance,
    );
    let allMarkers = [];
    const fetchPage = (request) => {
      service.nearbySearch(request, (results, status, nextPage) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          results.forEach((place) => {
            const name = place.name?.toLowerCase() || "";
            const location = place.geometry.location;

            const match =
              (category === "jewellery" &&
                /jewellers|jewellery|jewel/.test(name)) ||
              (category === "retail" && /retailmass|retail/.test(name));

            const distance =
              window.google.maps.geometry.spherical.computeDistanceBetween(
                anchorLocation,
                location,
              );

            if (match && distance <= 15000) {
              const marker = new window.google.maps.Marker({
                position: location,
                title: place.name,
                icon: { url: "22" },
              });
              marker.setMap(null);
              allMarkers.push(marker);
            }
          });

          if (nextPage && nextPage.hasNextPage) {
            nextPage.nextPage();
          } else {
            setPdfMarkers((prev) => ({
              ...prev,
              [category]: allMarkers,
            }));
            setLoading(false);
            setDefaultLoad(true);
          }
        } else {
          setLoading(false);
        }
      });
    };

    const request = {
      location: anchorLocation,
      radius: radius,
      keyword: category,
    };
    fetchPage(request);
  };
  useEffect(() => {
    if (defaultLoad) {
      DefaultAreaNearBy("jewellery", anchorLocation, radius);
      DefaultAreaNearBy("retail", anchorLocation, radius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, anchorLocation]);

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR COMPETITOR JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const j_list = pdfMarkers?.jewellery;
  const competitorsList = j_list?.filter((marker) => {
    const title = marker?.title?.toLowerCase?.() || "";
    return comList.some((brand) => title.includes(brand.toLowerCase()));
  });

  const brandList = j_list?.filter((marker) => {
    const title = marker?.title?.toLowerCase?.() || "";
    return ourBrandList.some((brand) => title.includes(brand.toLowerCase()));
  });

  // ================================JEWELLERY CHECKLIST FUNCTIONALITY ===========================================
  const GetJewelleryMark = (checked, category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: checked,
    }));
    if (checked) {
      const newMarkers =
        pdfMarkers?.[category] || ciyInputs?.categoryMarkers?.[category] || [];
      newMarkers.forEach((m) => m.setMap(googleMapInstance));
      setCategoryMarkers((prev) => ({
        ...prev,
        [category]: newMarkers,
      }));
    } else {
      categoryMarkers?.[category].forEach((marker) => marker.setMap(null));
      setCategoryMarkers((prev) => ({
        ...prev,
        [category]: [],
      }));
    }
  };

  // ================================ RETAIL CHECK LIST FUNCTIONALITY ===========================================
  const GetRetailsMark = (checked, category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: checked,
    }));
    if (checked) {
      const newMarkers =
        pdfMarkers[category] || ciyInputs?.categoryMarkers[category] || [];
      newMarkers.forEach((m) => m.setMap(googleMapInstance));
      setCategoryMarkers((prev) => ({
        ...prev,
        [category]: newMarkers,
      }));
    } else {
      categoryMarkers[category]?.forEach((marker) => marker.setMap(null));
      setCategoryMarkers((prev) => ({
        ...prev,
        [category]: [],
      }));
    }
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR COMPETITOR JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const GetCompetitor = (checked, category) => {
    if (checked) {
      setSelectedCategories((prev) => ({
        ...prev,
        [category]: checked,
      }));
      setCategoryMarkers((prev) => ({
        ...prev,
        competitor: competitorsList,
      }));
    } else {
      setCategoryMarkers((prev) => ({
        ...prev,
        competitor: [],
      }));
      setSelectedCategories((prev) => ({
        ...prev,
        [category]: checked,
      }));
    }
  };

  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<GET OUR BRAND JEWELERS >>>>>>>>>>>>>>>>>>>>>>>>>>
  const GetOurBrand = (checked, category) => {
    if (checked) {
      setSelectedCategories((prev) => ({
        ...prev,
        [category]: checked,
      }));
      setCategoryMarkers((prev) => ({
        ...prev,
        ourBrand: brandList,
      }));
    } else {
      setCategoryMarkers((prev) => ({
        ...prev,
        ourBrand: [],
      }));
      setSelectedCategories((prev) => ({
        ...prev,
        [category]: checked,
      }));
    }
  };

  useEffect(() => {
    Object.entries(categoryMarkers).forEach(([category, markers]) => {
      markers.forEach((marker) => {
        marker.setMap(selectedCategories[category] ? googleMapInstance : null);
      });
    });
  }, [selectedCategories, categoryMarkers, googleMapInstance]);

  useEffect(() => {
    if (defaultLoad) {
      if (driveTime.length === 0 || driveTime) {
        setCategoryMarkers({
          jewellery: [],
          retail: [],
          competitor: [],
          ourBrand: [],
        });
        setSelectedCategories({
          jewellery: false,
          retail: false,
          competitor: false,
          ourBrand: false,
        });
      }
    }
  }, [driveTime, defaultLoad]);

  // --------------------------------------GENERATE MAP FUNTIONALITY------------------------------
  const SearchPichCodeArea = async () => {
    clearPolygons();
    if (!targetCity) {
      toast.error("Please Select Target City", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    if (!similarCity) {
      toast.error("Please Select Similer City", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    setLoading(true);
    if (!ciyInputs?.targetMatrix) {
      const target_matrix = await GetTargetMatrix(channelval, targetCity);
      setTargetMatrix(target_matrix);
    }
    if (!ciyInputs?.similerMatrix) {
      const similar_matrix = await GetSimilarMatrix(channelval, similarCity);
      setSimilerMatrix(similar_matrix);
    }

    if (!ciyInputs?.monthOver) {
      const get_mom_data = await GetMonthOverMonthData(channelval, targetCity);
      setMonthOver(get_mom_data);
    }

    if (!ciyInputs?.arpcVal) {
      const arpc_value = await GetARPC(channelval, targetCity);
      setArpcVal(arpc_value);
    }

    if (!ciyInputs?.dormancyTarget) {
      const dormancy_target = await GetDormancyTarget(channelval, targetCity);
      setDormancyTarget(dormancy_target);
    }

    if (!ciyInputs?.dormancySimilar) {
      const dormancy_similar = await DormancySimilar(channelval, similarCity);
      setDormancySimilar(dormancy_similar);
    }

    try {
      const response = await axiosInstance.get(
        `/ThirdEye/get/city/pincodes/db?city=${targetCity}`,
      );
      if (response.data.code === "1000") {
        const t_pincode = response?.data?.value[0];
        let t_location;
        if (!ciyInputs?.anchorLocation) {
          const geocode_address = await geocodeAddress(t_pincode?.pincode);
          if (!geocode_address) {
            setLoading(false);
            return;
          }
          t_location = {
            lat: geocode_address?.lat,
            lng: geocode_address?.lng,
          };
          setAnchorLocation(t_location);
        }
        if (!ciyInputs?.targetCity) {
          setDefaultLoad(true);
          DefaultAreaNearBy("jewellery", t_location, radius);
          DefaultAreaNearBy("retail", t_location, radius);
        }
        setLockBtn(true);
        const data = response.data.value;
        const target_city_pin = data.map((item) => item.pincode);
        setSetOfPin(target_city_pin);
        const overallBounds = new window.google.maps.LatLngBounds();
        data.forEach((dataItem) => {
          const { geometryJson } = dataItem;
          const areaBorder = "blue";
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
                  fillColor: "grey",
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
                  () => {
                    polygon.setOptions({
                      strokeColor: "blue",
                      strokeWeight: 2,
                      zIndex: 2,
                      fillOpacity: 0.5,
                    });
                  },
                );

                window.google.maps.event.addListener(
                  polygon,
                  "mouseout",
                  () => {
                    polygon.setOptions({
                      strokeColor: "blue",
                      strokeWeight: 1,
                      zIndex: 1,
                      fillOpacity: 0.4,
                    });
                  },
                );
                window.google.maps.event.addListener(
                  polygon,
                  "click",
                  async (e) => {
                    const clickedLocation = {
                      lat: e.latLng.lat(),
                      lng: e.latLng.lng(),
                    };
                    setDefaultLoad(true);
                    setAnchorLocation(clickedLocation);
                    setCategoryMarkers({
                      jewellery: [],
                      retail: [],
                      competitor: [],
                      ourBrand: [],
                    });
                    setPdfMarkers({
                      jewellery: [],
                      retail: [],
                    });
                    await handleDriveTimeSearch(clickedLocation);
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
                data.length > 100 ? currentZoom + 1 : currentZoom + 0.7,
              );
            }
            // tilesloaded ensures map is fully drawn
            window.google.maps.event.addListenerOnce(
              googleMapInstance,
              "idle",
              async () => {
                setTimeout(async () => {
                  if (!ciyInputs?.radius) {
                    await handleScreenshot(map_img);
                  }
                }, 500);
              },
            );
          },
        );
      } else {
        toast.warn(response.data.value, {
          theme: "colored",
          autoClose: 2000,
        });
      }
    } catch (err) {
      setLoading(false);
    } finally {
      setLoading(false);
      setMapLoader(false);
    }
  };

  useEffect(() => {
    if (ciyInputs?.targetCity && googleMapInstance) {
      setMapLoader(true);
      SearchPichCodeArea(ciyInputs?.targetCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciyInputs?.targetCity, googleMapInstance]);

  const calculateCircularPolygonCoordinates = (
    center,
    radius,
    numPoints = 13,
  ) => {
    const coords = [];
    const earthRadius = 6371000; // meters
    for (let i = 0; i < numPoints; i++) {
      const angle = ((i + 2) * 360) / numPoints;
      const angleRad = angle * (Math.PI / 180);

      const lat =
        center?.lat +
        (radius / earthRadius) * (180 / Math.PI) * Math.sin(angleRad);
      const lng =
        center?.lng +
        ((radius / earthRadius) * (180 / Math.PI) * Math.cos(angleRad)) /
          Math.cos((center.lat * Math.PI) / 180);
      coords.push({ lat, lng });
    }
    return coords;
  };

  const drawDriveTimePolygon = (path, time) => {
    const colorMap = {
      15: "#FF0000", // red
      30: "#00FF00", // green
      45: "#0000FF", // blue
    };

    const polygon = new window.google.maps.Polygon({
      paths: path,
      strokeColor: colorMap[time],
      strokeOpacity: 1,
      strokeWeight: 1,
      fillColor: colorMap[time],
      fillOpacity: 0.3,
      zIndex: 10,
    });
    polygon.setMap(googleMapInstance);
    return polygon;
  };

  return (
    <React.Fragment>
      {loading && <Loader />}
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      <div className={`main_container ${slideOut ? "slide_animation" : ""}`}>
        <ThirdEyeHeader chl={channelval} />
        <div className={`sticky_toolbar ${scrolled ? "scrolled" : ""}`}>
          <div className='form_container'>
            <div style={{ width: "100%" }}>
              <b>Channel</b>
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder='Select Channel'
                id='channel'
                value={channelval}
                options={channelList}
                onChange={(value) => {
                  setChannelval(value);
                  setTargetCity(null);
                  setSimilarCity(null);
                }}
                disabled={lockBtn ? true : userLog?.role === "ADMIN"}
              />
            </div>
            <div style={{ width: "100%" }}>
              <b>Target City</b>
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder='Select City'
                id='select_city'
                value={targetCity}
                options={targetCityList}
                onChange={(value) => {
                  setTargetCity(value);
                  setSimilarCity(null);
                }}
                disabled={lockBtn}
              />
            </div>
            <div style={{ width: "100%" }}>
              <b>Similar City</b>
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder='Select Store'
                id='select_store'
                value={similarCity}
                options={similarCityList}
                onChange={(value) => setSimilarCity(value)}
                disabled={lockBtn}
              />
            </div>
            <div style={{ marginTop: "19px" }}>
              <button
                type='submit'
                className={lockBtn ? "apply_btn_disabled" : "apply_btn"}
                onClick={SearchPichCodeArea}
                disabled={lockBtn}>
                GENERATE
              </button>
            </div>
            <div style={{ marginTop: "19px" }}>
              <Tippy content='Reset'>
                <button
                  type='submit'
                  style={{ padding: "5px", cursor: "pointer" }}
                  onClick={HandelResetFiled}>
                  <FiRefreshCcw />
                </button>
              </Tippy>
            </div>
          </div>
        </div>
        <MapSidebaar
          setMapsidebaar_open={setMapsidebaar_open}
          mapsidebaar_open={mapsidebaar_open}
          setDriveTime={setDriveTime}
          driveTime={driveTime}
          GetJewelleryMark={GetJewelleryMark}
          GetRetailsMark={GetRetailsMark}
          GetCompetitor={GetCompetitor}
          GetOurBrand={GetOurBrand}
          setSelectedCategories={setSelectedCategories}
          selectedCategories={selectedCategories}
          inputsPayload={inputsPayload}
          dormancyData={dormancySimilar}
          brandList={brandList}
          newStore={ciyInputs}
          competitorsList={competitorsList}
          anchorLocation={anchorLocation}
          handleDriveTimeSearch={handleDriveTimeSearch}
          setDefaultLoad={setDefaultLoad}
        />
        <GoogleMapView
          setMapsidebaar_open={setMapsidebaar_open}
          mapsidebaar_open={mapsidebaar_open}
          driveTime={driveTime}
          setGoogleMapInstance={setGoogleMapInstance}
          googleMapInstance={googleMapInstance}
          handleDriveTimeSearch={handleDriveTimeSearch}
          setAnchorLocation={setAnchorLocation}
          selectedDriveTimesRef={selectedDriveTimesRef}
          targetMatrix={targetMatrix}
          similerMatrix={similerMatrix}
          monthOver={monthOver}
          inputsPayload={inputsPayload}
          dormancyData={dormancySimilar}
          setCategoryMarkers={setCategoryMarkers}
          categoryMarkers={categoryMarkers}
          map_img={map_img}
          mapLoader={mapLoader}
          anchorLocation={anchorLocation}
          userLog={userLog}
          target_name='Target Catchment'
          similar_name='Similar Catchment'
        />
        <div
          style={{
            position: "sticky",
            bottom: 1,
            background: "#fff",
            zIndex: 1,
            paddingTop: "5px",
            paddingBottom: "5px",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginRight: "5px",
            }}>
            <button
              className={projBtnDesabled ? "apply_btn_disabled" : "CButton"}
              style={{ marginBottom: "2px" }}
              disabled={projBtnDesabled}
              onClick={() => {
                setSlideOut(true);
                dispatch(setNewCityInputs(inputsPayload));
                setTimeout(() => {
                  navigate(routes.NEW_CITY_PROJECTION);
                  setLoading(false);
                }, 700);
              }}>
              PROJECTION
            </button>
          </div>
          {monthOver.length > 0 && (
            <NewCityDecision
              targetMatrix={targetMatrix}
              similarMatrix={similerMatrix}
              dormancyTarget={dormancyTarget}
              dormancySimilar={dormancySimilar}
              userLog={userLog}
              categoryMarkers={categoryMarkers}
              inputsPayload={inputsPayload}
              btnDesabeld={setProjBtnDesabled}
              competitors={competitorsList}
              defaultLoad={defaultLoad}
              pdfMarkers={pdfMarkers}
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default NewCityExpansion;
