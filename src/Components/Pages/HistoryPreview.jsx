import React, { useEffect, useState } from "react";
import Sidebar from "../custom/Sidebar";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import { useDispatch, useSelector } from "react-redux";
import { Select, DatePicker } from "antd";
import InfinitTableLoad from "../custom/InfinitTableLoad";
import { axiosInstance } from "../../HostManger/API/Authorization";
import Loader from "../custom/Loader";
import moment from "moment";
import { toast } from "react-toastify";
import { clearNewStoreInputs } from "../../redux/reducer/NewStore";
import { clearNewCityInputs } from "../../redux/reducer/NewCity";

const scr_typeList = [
  { value: "new_store", label: "New Store Projection" },
  { value: "new_city", label: "New City Projection" },
];

const str_heading = [
  "SL No.",
  "Heistory Id",
  "Date",
  "Target Pin Code",
  "Similar Store Code",
  "Preview",
];

const city_heading = [
  "SL No.",
  "Heistory Id",
  "Date",
  "Target City",
  "Similar City",
  "Preview",
];

const normalizeHistoryId = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const HistoryPreview = ({ toggle_open, toggle }) => {
  const dispatch = useDispatch();
  const userLog = useSelector((state) => state?.user?.user);
  const [loading, setLoading] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const [scrType, setScrType] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [allHistoryData, setAllHistoryData] = useState([]);
  const [hisUniqueId, setHisUniqueId] = useState(null);
  const [heading, setHeading] = useState([]);

  console.log("historyData==>", historyData);
  const GetUserHistory = (scrType) => {
    const hisPayload = {
      userName: userLog?.name,
      channel: userLog?.channel,
      screenType: scrType,
      historyId: "",
    };
    setLoading(true);
    axiosInstance
      .post("/api/fetch/history/for/user", hisPayload)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          setHistoryData(response.data.value);
          setAllHistoryData(response.data.value);
          setHisUniqueId(null);
          setFromDate(null);
          setToDate(null);
        } else {
          toast.error("History Data Not Available For Your ID", {
            theme: "colored",
            autoClose: 1000,
          });
          setHistoryData([]);
          setAllHistoryData([]);
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  useEffect(() => {
    if (scrType) {
      GetUserHistory(scrType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrType]);

  const uniqueId = Array.from(
    new Set(allHistoryData.map((item) => normalizeHistoryId(item?.historyId))),
  )
    .filter(Boolean)
    .map((id) => ({
      value: id,
      label: id,
    }));

  const handelFilter = () => {
    if (!fromDate) {
      toast.error("Please Select From Date", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }
    if (!toDate) {
      toast.error("Please Select To Date", {
        theme: "colored",
        autoClose: 2000,
        position: "bottom-right",
      });
      return;
    }

    const selectedId = normalizeHistoryId(hisUniqueId);
    const result = allHistoryData.filter((item) => {
      const itemDate = moment(item.date, "YYYY-MM-DD");
      const matchesDate =
        itemDate.isSame(fromDate, "day") ||
        itemDate.isSame(toDate, "day") ||
        (itemDate.isAfter(fromDate, "day") && itemDate.isBefore(toDate, "day"));
      const matchesId = selectedId
        ? normalizeHistoryId(item?.historyId) === selectedId
        : true;
      return matchesDate && matchesId;
    });
    setHistoryData(result);
  };

  // const SendMailConfirmation = (historyId) => {
  //   axiosInstance
  //     .get(
  //       `/api/confirmation/mail?mailId=${userLog?.mailId}&userName=${userLog?.name}&historyId=${historyId}`
  //     )
  //     .then((res) => res)
  //     .then((response) => {
  //       setLoading(false);
  //     })
  //     .catch((err) => setLoading(false));
  // };

  useEffect(() => {
    dispatch(clearNewStoreInputs());
    dispatch(clearNewCityInputs());
  });

  const ResetValues = () => {
    setScrType(null);
    setFromDate(null);
    setToDate(null);
    setHisUniqueId(null);
    setHeading([]);
    setHistoryData([]);
    setAllHistoryData([]);
  };

  return (
    <React.Fragment>
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      {loading && <Loader />}
      <div className={`main_container ${slideOut ? "slide_animation" : ""}`}>
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 2,
            paddingBottom: "8px",
          }}>
          <ThirdEyeHeader chl={userLog?.channel} />
          <div
            style={{
              display: "flex",
              gap: "5px",
              marginTop: "10px",
              marginRight: "5px",
            }}>
            <Select
              style={{
                width: allHistoryData.length > 0 ? "40%" : "100%",
                border: "1px solid black",
                borderRadius: "5px",
              }}
              placeholder='Select Screen Type'
              id='select_screen_type'
              value={scrType}
              options={scr_typeList}
              onChange={(value) => {
                setScrType(value);
                setFromDate(null);
                setToDate(null);
                setHisUniqueId(null);
                if (value === "new_store") {
                  setHeading(str_heading);
                } else {
                  setHeading(city_heading);
                }
              }}
            />
            {allHistoryData.length > 0 && (
              <div style={{ display: "flex", gap: "5px", width: "100%" }}>
                <DatePicker
                  style={{
                    width: "100%",
                    border: "1px solid black",
                    borderRadius: "5px",
                  }}
                  onChange={(_, dateString) => {
                    if (!dateString) {
                      setFromDate(null);
                      setHistoryData(allHistoryData);
                    } else {
                      setFromDate(dateString);
                    }
                  }}
                  placeholder='From Date'
                  id='from_date'
                />
                <DatePicker
                  style={{
                    width: "100%",
                    border: "1px solid black",
                    borderRadius: "5px",
                  }}
                  onChange={(_, dateString) => {
                    if (!dateString) {
                      setToDate(null);
                      setHistoryData(allHistoryData);
                    } else {
                      setToDate(dateString);
                    }
                  }}
                  placeholder='To Date'
                  id='to_id'
                />
                <Select
                  showSearch
                  allowClear
                  style={{
                    width: "100%",
                    border: "1px solid black",
                    borderRadius: "5px",
                  }}
                  placeholder='Search By Unique Id'
                  id='search_unique_id'
                  value={hisUniqueId ?? undefined}
                  options={uniqueId}
                  onChange={(value) => {
                    setHisUniqueId(value || null);
                    if (!value) {
                      setHistoryData(allHistoryData);
                      return;
                    }
                    const selectedId = normalizeHistoryId(value);
                    const filteredById = allHistoryData.filter(
                      (item) =>
                        normalizeHistoryId(item?.historyId) === selectedId,
                    );
                    setHistoryData(filteredById);
                  }}
                />
                <button className='CButton' onClick={handelFilter}>
                  Next
                </button>
                <button style={{ cursor: "pointer" }} onClick={ResetValues}>
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
        {allHistoryData.length > 0 && (
          <InfinitTableLoad data={historyData} header={heading} />
        )}
      </div>
    </React.Fragment>
  );
};

export default HistoryPreview;
