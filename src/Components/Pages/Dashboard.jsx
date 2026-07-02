import React, { useEffect, useState, useRef } from "react";
import "../Styles/Dashboard.css";
import { Input, Select } from "antd";
import GoogleMapView from "../map/GoogleMapView";
import MapSidebaar from "../map/MapSidebaar";
import html2canvas from "html2canvas";
import Loader from "../custom/Loader";
import { toast } from "react-toastify";
import { FiRefreshCcw } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { axiosInstance } from "../../HostManger/API/Authorization";
import {
  clearNewStoreInputs,
  setNewStoreDecisiontext,
  setNewStoreInputs,
} from "../../redux/reducer/NewStore";
import {
  comList,
  ourBrandList,
  ourBrandMatchList,
  comMatchList,
  DRIVE_TIME_RADIUS_MAP,
  retailTypes,
  channel_list,
  // categorizeRetails,
} from "../Data/Data";
import { useNavigate } from "react-router-dom";
import { routes } from "../../routes";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import Tippy from "@tippyjs/react";
import {
  geocodeAddress,
  getColoredData,
  PolygonCentroid,
} from "../Data/PolygonCentroid";
import { setNewStoreMapImg } from "../../redux/reducer/MapImgStore";
import NewStoreDecision from "../../Mainpages/NewStoreDecision";

const storeTypes = [
  "Mall Store",
  "Standalone Store",
  "Large Format Store",
  "Airport Store",
  "High Street Store",
];

const categoryList = storeTypes.map((store) => ({
  label: store,
  value: store.toLowerCase().replace(/\s+/g, "_"),
}));

const Dashboard = ({ userLog, newStore, setSlideOut, dicisionData }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const s_radius = Object.keys(DRIVE_TIME_RADIUS_MAP).find(
    (k) => DRIVE_TIME_RADIUS_MAP[k] === newStore?.radius,
  );
  const [driveTime, setDriveTime] = useState(() =>
    s_radius ? [Number(s_radius)] : [],
  );
  const [defaultLoad, setDefaultLoad] = useState(false);
  const [mapsidebaar_open, setMapsidebaar_open] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapLoader, setMapLoader] = useState(false);
  const [lockBtn, setLockBtn] = useState(false);
  const [projBtnDesabled, setProjBtnDesabled] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [channelList, setChannelList] = useState([]);
  const [similerStoreList, setSimilerStoreList] = useState([]);
  const [channelval, setChannelval] = useState(userLog?.channel || "TANISHQ");
  const [targetPinCode, setTargetPinCode] = useState(
    newStore?.targetPinCode || [],
  );
  const [similerStoreVal, setSimilerStoreVal] = useState(
    newStore?.similerStoreVal,
  );
  const [simChachmentPin, setSimChachmentPin] = useState(
    newStore?.similarPinCode,
  );
  const [storeSize, setStoreSize] = useState(newStore?.storeSize || 0);
  const [storeCatgerory, setStoreCatgerory] = useState(newStore?.category);
  const [targetMatrix, setTargetMatrix] = useState(newStore?.targetMatrix);
  const [similerMatrix, setSimilerMatrix] = useState(newStore?.similerMatrix);
  const [monthOver, setMonthOver] = useState(newStore?.monthOver || []);
  const [dormancyTarget, setDormancyTarget] = useState(
    newStore?.dormancyTarget,
  );
  const [dormancySimilar, setDormancySimilar] = useState(
    newStore?.dormancySimilar,
  );
  const [priSecPin, setPriSecPin] = useState({
    primary: [],
    secondary: [],
  });

  //--------------------------------- MAP REF VARIABLE ---------------------------
  const driveTimePolygonsRef = useRef([]);
  const polygonRefs = useRef([]);
  const selectedDriveTimesRef = useRef(driveTime);
  const map_img = useRef(null);
  const hasFetchedNearBy = useRef(false);

  // <<<<<<<<<<<<<<<<<<<<<<<<<<MAP RELATED STATES <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  const [polygonLabels, setPolygonLabels] = useState([]);
  const [anchorLocation, setAnchorLocation] = useState(
    newStore?.anchorLocation,
  );
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const [pdfMarkers, setPdfMarkers] = useState({
    jewellery: newStore?.pdfMarkers?.jewellery || [],
    retail: newStore?.pdfMarkers?.retail || [],
    competitor: newStore?.pdfMarkers?.competitor || [],
    ourBrand: newStore?.pdfMarkers?.ourBrand || [],
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
  const [setOfPin, setSetOfPin] = useState(newStore?.setOfPin || []);
  const radius = DRIVE_TIME_RADIUS_MAP[Math.max(...driveTime)] || 8000;

  // FETCH SIMOLER STIRE API-----------------------------

  const inputsPayload = {
    targetPinCode: targetPinCode,
    similarPinCode: simChachmentPin,
    similerStoreVal: similerStoreVal,
    channel: channelval,
    storeSize: storeSize,
    category: storeCatgerory,
    setOfPin: setOfPin,
    primarySec: priSecPin,
    categoryMarkers: categoryMarkers,
    selectedCategories: selectedCategories,
    anchorLocation: anchorLocation,
    pdfMarkers: pdfMarkers,
    radius: radius,
    targetMatrix: targetMatrix,
    similerMatrix: similerMatrix,
    monthOver: monthOver,
    dormancyTarget: dormancyTarget,
    dormancySimilar: dormancySimilar,
  };

  const HandelResetFiled = () => {
    clearPolygons();
    setDefaultLoad(false);
    setLockBtn(false);
    setTargetPinCode([]);
    setDriveTime([]);
    setSimilerStoreVal(null);
    setSimChachmentPin(null);
    setStoreSize(null);
    setStoreCatgerory(null);
    setProjBtnDesabled(true);
    dispatch(clearNewStoreInputs());
    dispatch(setNewStoreDecisiontext());
    setMonthOver([]);
    setDormancySimilar(null);
    setSimilerMatrix(null);
    setCategoryMarkers({
      jewellery: [],
      retail: [],
      competitor: [],
      ourBrand: [],
    });
    setPdfMarkers({
      jewellery: [],
      retail: [],
      competitor: [],
      ourBrand: [],
    });
  };

  useEffect(() => {
    if (!newStore?.anchorLocation)
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
  }, [newStore?.anchorLocation]);

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
    if (dicisionData?.bottom_line) {
      setProjBtnDesabled(false);
    } else {
      setProjBtnDesabled(true);
    }
  }, [dicisionData?.bottom_line]);

  // const retails_category = categorizeRetails(pdfMarkers?.retail);
  // console.log("retails_category==>", retails_category);

  // const HandelTargetPin = (value) => {
  //   if (!value || value.length === 0) {
  //     setTargetPinCode([]);
  //     setSimilerStoreVal(null);
  //     return;
  //   }
  //   const arrayVal = value
  //     .flatMap((item) => item.split(","))
  //     .map((item) => item.trim())
  //     .filter((item) => item.length > 0);

  //   const validPins = [];
  //   const invalidPins = [];
  //   arrayVal.forEach((pin) => {
  //     if (/^\d{6}$/.test(pin)) {
  //       validPins.push(pin);
  //     } else {
  //       invalidPins.push(pin);
  //     }
  //   });
  //   const uniqueValidPins = [...new Set(validPins)];
  //   if (invalidPins.length > 0) {
  //     toast.error("Please enter valid 6-digit pincodes", {
  //       theme: "colored",
  //       autoClose: 2000,
  //     });
  //   }
  //   if (uniqueValidPins.length > 0) {
  //     setTargetPinCode(uniqueValidPins);
  //   } else {
  //     setTargetPinCode([]);
  //   }
  // };

  const HandelTargetPin = (value) => {
    if (!value || value.length === 0) {
      setTargetPinCode([]);
      setSimilerStoreVal(null);
      return;
    }
    const arrayVal = value
      .flatMap((item) => item.split(","))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const validPins = [];
    const invalidPins = [];

    arrayVal.forEach((pin) => {
      if (/^\d{6}$/.test(pin)) {
        validPins.push(pin);
      } else {
        invalidPins.push(pin);
      }
    });

    if (invalidPins.length > 0) {
      toast.error("Please enter valid 6-digit pincode", {
        theme: "colored",
        autoClose: 2000,
      });
      setTargetPinCode([]);
      return;
    }

    if (validPins.length > 1) {
      toast.error("Only one pincode is allowed", {
        theme: "colored",
        autoClose: 2000,
      });
      setTargetPinCode([validPins[0]]);
      return;
    }

    if (validPins.length === 1) {
      setTargetPinCode([validPins[0]]);
    } else {
      setTargetPinCode([]);
    }
  };

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

  const GetChannelList = (chl) => {
    axiosInstance
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
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (channelval) {
      GetChannelList(channelval);
    }
  }, [channelval]);

  const GetSimilerStore = (chl) => {
    setLoading(true);
    axiosInstance
      .get(`/api/fetch/similar/storecodes/?channel=${chl}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const similerStore = response?.data?.value
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
          setSimilerStoreList(similerStore);
        } else {
          toast.error("Similar Store Not Available", {
            theme: "colored",
            autoClose: 2000,
            position: "bottom-right",
          });
          setSimilerStoreList([]);
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (channelval) {
      GetSimilerStore(channelval);
    }
  }, [channelval]);

  const GetSimilerPincode = (chl, store, limit) => {
    setLoading(true);
    axiosInstance
      .get(
        `/api/fetch/similar/pincodes?channel=${chl}&storeCode=${store}&topN=${limit}`,
      )
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const pins = response?.data?.value.filter(
            (v) => v && v !== 0 && v !== "0",
          );
          setSimChachmentPin(pins.toString());
        } else {
          toast.error("Similar Pincodes Not Found", {
            theme: "colored",
            autoClose: 2000,
          });
          setSimChachmentPin(null);
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (channelval && similerStoreVal && setOfPin) {
      GetSimilerPincode(channelval, similerStoreVal, setOfPin.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelval, similerStoreVal, setOfPin.length]);

  const GetAdjusentPin = (t_pin) => {
    setLoading(true);
    axiosInstance
      .get(`/ThirdEye/get/adjacent/pincodes/db?pincode=${t_pin}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          const { pincode, primaryPincode, secondaryPincode } =
            response.data.value;
          const mergedPincodes = [
            pincode,
            ...primaryPincode,
            ...secondaryPincode,
          ];
          setSetOfPin(mergedPincodes);
          setPriSecPin({
            primary: primaryPincode,
            secondary: secondaryPincode,
          });
        } else {
          toast.error(`Pincodes Are Not Availbale For This Pincod ${t_pin}`, {
            theme: "colored",
            autoClose: 2000,
          });
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (targetPinCode.length === 1) {
      GetAdjusentPin(targetPinCode);
    } else {
      setSetOfPin(targetPinCode);
    }
  }, [targetPinCode]);

  const GetTargetMatrix = async (chl, t_pin) => {
    try {
      const response = await axiosInstance.get(
        `/api/catchment/calculation/matrix?channel=${chl}&catchmentpincodes=${t_pin}`,
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

  const GetSimilarMatrix = async (chl, s_pin) => {
    try {
      const response = await axiosInstance.get(
        `/api/catchment/calculation/matrix?channel=${chl}&catchmentpincodes=${s_pin}`,
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

  const GetMonthOverMonthData = async (chl, t_pin) => {
    try {
      const response = await axiosInstance.get(
        `/api/mom/trends/target/catchment?channel=${chl}&targetCatchment=${t_pin}`,
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

  const GetDormancyTarget = async (chl, t_pin) => {
    try {
      const response = await axiosInstance.get(
        `/api/dormancy/data/channel/base?channel=${chl}&catchmentPincodes=${t_pin}`,
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

  const GetDormancySimilar = async (chl, s_pin) => {
    try {
      const response = await axiosInstance.get(
        `/api/dormancy/data/channel/base?channel=${chl}&catchmentPincodes=${s_pin}`,
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

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>MAP FUNCTINALITY >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  const clearPolygons = () => {
    polygonRefs.current.forEach((p) => p.setMap(null));
    polygonRefs.current = [];
    polygonLabels.forEach((l) => l.setMap(null));
    setPolygonLabels([]);
  };

  const calculateCircularPolygonCoordinates = (
    center,
    radius,
    numPoints = 13,
  ) => {
    const coords = [];
    const earthRadius = 6371000;
    for (let i = 0; i < numPoints; i++) {
      const angle = ((i + 2) * 360) / numPoints;
      const angleRad = angle * (Math.PI / 180);

      const lat =
        center.lat +
        (radius / earthRadius) * (180 / Math.PI) * Math.sin(angleRad);
      const lng =
        center.lng +
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

  // ========================== FIND DEFAULT NEAR BY AREA ================

  const DefaultAreaNearBy = async (category, anchorLocation, radius) => {
    if (!googleMapInstance || !window.google?.maps) {
      return;
    }
    const service = new window.google.maps.places.PlacesService(
      googleMapInstance,
    );
    const keywordByCategory = {
      jewellery: ["jewellery", "jewellers", "jewel"],
      retail: retailTypes,
      competitor: comList,
      ourBrand: ourBrandList,
    };

    const keywords = keywordByCategory[category] || [category];

    const fetchByKeyword = (keyword) =>
      new Promise((resolve) => {
        const markers = [];
        const request = {
          location: anchorLocation,
          radius: radius,
          keyword,
        };

        const fetchPage = (req) => {
          service.nearbySearch(req, (results, status, nextPage) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              results.forEach((place) => {
                const location = place.geometry.location;
                const user_rating = place?.user_ratings_total;
                const rating = place?.rating;
                const distance =
                  window.google.maps.geometry.spherical.computeDistanceBetween(
                    anchorLocation,
                    location,
                  );

                if (distance <= radius) {
                  const marker = new window.google.maps.Marker({
                    position: location,
                    title: place.name,
                    user_rating: user_rating,
                    rating: rating,
                    icon: { url: "22" },
                  });
                  marker.setMap(null);
                  markers.push(marker);
                }
              });

              if (nextPage && nextPage.hasNextPage) {
                nextPage.nextPage();
              } else {
                resolve(markers);
              }
            } else {
              resolve(markers);
            }
          });
        };
        fetchPage(request);
      });

    const keywordResults = await Promise.all(keywords.map(fetchByKeyword));
    const flatMarkers = keywordResults.flat();

    // Step 1 — deduplicate by title + position key.
    const seen = new Set();
    const deduped = flatMarkers.filter((marker) => {
      const position = marker.getPosition();
      const key = `${marker.title}_${position?.lat?.()}_${position?.lng?.()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Step 2 — for competitor and ourBrand, strictly keep only places whose
    // title contains at least one keyword from the respective list.
    // This removes loosely related results that Google returns but that don't
    // actually match any of our brand names.
    // Use the match lists (core brand names) for title filtering — NOT the full
    // search phrases. Google place names are "Tanishq", not "Tanishq Jewelery".
    const filterListByCategory = {
      competitor: comMatchList,
      ourBrand: ourBrandMatchList,
    };
    const strictList = filterListByCategory[category];
    const normalizeForMatch = (value) =>
      (value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const buildKeywordVariants = (kw) => {
      const normalized = normalizeForMatch(kw);
      const trimmedGeneric = normalized
        .replace(
          /\b(jewels?|jewellers?|watches?|eyewear|sunglases|sunglasses|sarees?)\b/g,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();
      return [normalized, trimmedGeneric].filter(Boolean);
    };

    const uniqueMarkers = strictList
      ? deduped.filter((marker) => {
          const normalizedTitle = normalizeForMatch(marker.title);
          return strictList.some((kw) => {
            const variants = buildKeywordVariants(kw);
            return variants.some((v) => normalizedTitle.includes(v));
          });
        })
      : deduped;

    // Filter markers based on user_rating >= 100 and rating >= 3
    const filteredMarkers = uniqueMarkers.filter((marker) => {
      const userRating = marker.user_rating || 0;
      const rating = marker.rating || 0;
      return userRating >= 100 && rating >= 3;
    });

    setPdfMarkers((prev) => ({
      ...prev,
      [category]: filteredMarkers,
    }));
    setDefaultLoad(true);
  };

  // Reset the gate when radius or anchorLocation changes so nearby places re-fetch
  useEffect(() => {
    hasFetchedNearBy.current = false;
  }, [radius, anchorLocation]);

  useEffect(() => {
    if (!defaultLoad || hasFetchedNearBy.current) return;
    hasFetchedNearBy.current = true;
    setLoading(true);
    Promise.all([
      DefaultAreaNearBy("jewellery", anchorLocation, radius),
      DefaultAreaNearBy("retail", anchorLocation, radius),
      DefaultAreaNearBy("competitor", anchorLocation, radius),
      DefaultAreaNearBy("ourBrand", anchorLocation, radius),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultLoad, radius, anchorLocation]);

  // --------------------------------FILLTER COMPETITORS LIST --------------------------
  const competitorsList = pdfMarkers?.competitor || [];
  // --------------------------------FILLTER OUR BRAND LIST --------------------------
  const brandList = pdfMarkers?.ourBrand || [];

  // ================================JEWELLERY CHECKLIST FUNCTIONALITY ===========================================
  const GetJewelleryMark = (checked, category) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: checked,
    }));
    if (checked) {
      const JewNewMarkers =
        pdfMarkers?.[category] || newStore?.categoryMarkers?.[category];
      JewNewMarkers.forEach((m) => m.setMap(googleMapInstance));
      setCategoryMarkers((prev) => ({
        ...prev,
        [category]: JewNewMarkers,
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
      const RetNewMarkers = pdfMarkers[category] || newStore?.categoryMarkers;
      RetNewMarkers.forEach((m) => m.setMap(googleMapInstance));
      setCategoryMarkers((prev) => ({
        ...prev,
        [category]: RetNewMarkers,
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
        competitor: pdfMarkers?.competitor || [],
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
        ourBrand: pdfMarkers?.ourBrand || [],
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
    if (targetPinCode.length === 0) {
      toast.error("Please Enter Target Pincode", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    if (!similerStoreVal) {
      toast.error("Please Select Similer Store", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    if (!storeSize) {
      toast.error("Please Select Store Category", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    if (!storeCatgerory) {
      toast.error("Please Select Store Category", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    setLoading(true);
    if (!newStore?.targetMatrix) {
      const target_matrix = await GetTargetMatrix(channelval, setOfPin);
      setTargetMatrix(target_matrix);
    }
    if (!newStore?.similerMatrix) {
      const similar_matrix = await GetSimilarMatrix(
        channelval,
        simChachmentPin,
      );
      setSimilerMatrix(similar_matrix);
    }
    if (!newStore?.monthOver) {
      const get_mom_data = await GetMonthOverMonthData(channelval, setOfPin);
      setMonthOver(get_mom_data);
    }
    if (!newStore?.dormancyTarget) {
      const dormancy_target = await GetDormancyTarget(channelval, setOfPin);
      setDormancyTarget(dormancy_target);
    }
    if (!newStore?.dormancySimilar) {
      const dormancy_similar = await GetDormancySimilar(
        channelval,
        simChachmentPin,
      );
      setDormancySimilar(dormancy_similar);
    }
    let t_location;
    if (!newStore?.anchorLocation) {
      const geocode_address = await geocodeAddress(targetPinCode[0]);
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

    if (!newStore?.category) {
      hasFetchedNearBy.current = false;
      setDefaultLoad(true);
    }

    try {
      let combinedPincodes = [];
      let color_set = {};
      if (targetPinCode.length === 1) {
        const newApiRes = await axiosInstance.get(
          `/ThirdEye/get/adjacent/pincodes/db?pincode=${targetPinCode[0]}`,
        );
        const newApiData = await newApiRes.data.value;
        const { pincode, primaryPincode, secondaryPincode } = newApiData;
        combinedPincodes = [pincode, ...primaryPincode, ...secondaryPincode];
        color_set = newApiData;
        if (!combinedPincodes.length) {
          setLoading(false);
          toast.warn("No related pincodes found.", {
            theme: "colored",
            autoClose: 2000,
          });
          return;
        }
      } else {
        combinedPincodes = targetPinCode;
      }
      const polygonRes = await axiosInstance.get(
        `/ThirdEye/get/pincode/cords/db?pincodes=${combinedPincodes}`,
      );
      const data = await polygonRes.data;
      if (data.code === "1000") {
        setLockBtn(true);
        const color_data = await getColoredData(data?.value, color_set);
        const bounds = new window.google.maps.LatLngBounds();
        color_data.forEach(({ geometryJson, pincode, color }) => {
          let paths = [];
          if (geometryJson?.type === "Polygon") {
            paths = geometryJson.coordinates.map((ring) =>
              ring.map(([lng, lat]) => {
                const latLng = { lat, lng };
                bounds.extend(latLng);
                return latLng;
              }),
            );
          } else if (geometryJson?.type === "MultiPolygon") {
            paths = geometryJson.coordinates.map((polygon) =>
              polygon[0].map(([lng, lat]) => {
                const latLng = { lat, lng };
                bounds.extend(latLng);
                return latLng;
              }),
            );
          }
          const polygon = new window.google.maps.Polygon({
            paths,
            strokeColor: color,
            fillColor: color,
            fillOpacity: 0.4,
            strokeOpacity: 1,
            strokeWeight: 1,
            zIndex: 1,
          });

          polygon.setMap(googleMapInstance);
          polygonRefs.current.push(polygon);

          window.google.maps.event.addListener(polygon, "mouseover", () => {
            polygon.setOptions({
              strokeColor: color,
              strokeWeight: 2,
              zIndex: 2,
              fillOpacity: 0.5,
            });
          });

          window.google.maps.event.addListener(polygon, "mouseout", () => {
            polygon.setOptions({
              strokeColor: color,
              strokeWeight: 1,
              zIndex: 1,
              fillOpacity: 0.4,
            });
          });
          window.google.maps.event.addListener(polygon, "click", async (e) => {
            const clickedLocation = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
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
              competitor: [],
              ourBrand: [],
            });
            await handleDriveTimeSearch(clickedLocation);
          });

          const centroid = PolygonCentroid(paths[0]);
          const label = new window.google.maps.Marker({
            position: centroid,
            map: googleMapInstance,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 },
          });
          polygon.addListener("mouseover", () => {
            label.setLabel({
              text: pincode,
              fontSize: "14px",
              fontWeight: "bold",
              color: "#000",
              strokeWeight: 1,
            });
          });
          polygon.addListener("mouseout", () => {
            label.setLabel(null);
          });
          setPolygonLabels((prev) => [...prev, label]);
        });

        googleMapInstance.fitBounds(bounds);

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
            // tilesloaded ensures map is fully drawn
            window.google.maps.event.addListenerOnce(
              googleMapInstance,
              "tilesloaded",
              async () => {
                setTimeout(async () => {
                  if (!newStore?.radius) {
                    await handleScreenshot(map_img);
                  }
                }, 500);
              },
            );
          },
        );
      }
    } catch (err) {
      setLoading(false);
    } finally {
      setMapLoader(false);
      // When DefaultAreaNearBy won't be triggered (history reload), turn off loading here
      if (newStore?.category) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (newStore?.category && googleMapInstance) {
      setMapLoader(true);
      SearchPichCodeArea(newStore?.category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newStore?.category, googleMapInstance]);

  return (
    <React.Fragment>
      {loading && <Loader />}
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
                setTargetPinCode([]);
                setSimilerStoreVal(null);
                setSimChachmentPin(null);
                setStoreSize(null);
                setStoreCatgerory(null);
              }}
              disabled={lockBtn ? true : userLog?.role === "ADMIN"}
            />
          </div>
          <div style={{ width: "100%" }}>
            <b>Target Catchment</b>
            <Select
              style={{ width: "100%" }}
              mode='tags'
              placeholder='Only 1 pincode allowed'
              id='target_catchment'
              value={targetPinCode}
              onChange={(value) => HandelTargetPin(value)}
              maxTagCount={1}
              maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
              disabled={lockBtn}
            />
          </div>
          <div style={{ width: "50%" }}>
            <b>Similar Store </b>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder='Select Store'
              id='similar_store'
              value={similerStoreVal}
              options={similerStoreList}
              onChange={(value) => {
                setSimilerStoreVal(value?.toString().trim());
                setStoreSize(null);
                setStoreCatgerory(null);
              }}
              disabled={lockBtn}
            />
          </div>
          <div style={{ width: "100%" }}>
            <b>Similar Catchment</b>
            <Input
              style={{ width: "100%" }}
              placeholder='Pincode'
              id='similar_catchment'
              value={
                simChachmentPin &&
                `${simChachmentPin?.split(",").slice(0, 2)}, +${
                  simChachmentPin?.split(",").length - 2
                }`
              }
              disabled
            />
          </div>
          <div style={{ width: "100%" }}>
            <b>Store Size (sq ft)</b>
            <Input
              style={{ width: "100%" }}
              placeholder='Store Size'
              id='store_size'
              value={storeSize}
              onChange={(e) => {
                const numerVal = e.target.value.replace(/\D/g, "");
                setStoreSize(numerVal);
                setStoreCatgerory(null);
              }}
              disabled={lockBtn}
            />
          </div>
          <div style={{ width: "100%" }}>
            <b>Store Category</b>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder='Store Category'
              id='store_category'
              options={categoryList}
              value={storeCatgerory}
              onChange={(value) => setStoreCatgerory(value)}
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
        newStore={newStore}
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
          bottom: 2,
          background: "#fff",
          zIndex: 1,
          paddingTop: "1px",
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            margin: "5px",
          }}>
          <button
            className={projBtnDesabled ? " apply_btn_disabled" : "CButton"}
            style={{ marginBottom: "2px" }}
            onClick={() => {
              dispatch(setNewStoreInputs(inputsPayload));
              setSlideOut(true);
              setDefaultLoad(false);
              setTimeout(() => {
                navigate(routes.NEW_STR_PROJECTION);
                setLoading(false);
              }, 700);
            }}
            disabled={projBtnDesabled}>
            PROJECTION
          </button>
        </div>
        {monthOver.length > 0 && (
          <NewStoreDecision
            targetMatrix={targetMatrix}
            similarMatrix={similerMatrix}
            dormancyTarget={dormancyTarget}
            dormancySimilar={dormancySimilar}
            userLog={userLog}
            categoryMarkers={categoryMarkers}
            inputsPayload={inputsPayload}
            pdfMarkers={pdfMarkers}
            btnDesabeld={setProjBtnDesabled}
            competitors={competitorsList}
            defaultLoad={defaultLoad}
          />
        )}
      </div>
    </React.Fragment>
  );
};

export default Dashboard;
