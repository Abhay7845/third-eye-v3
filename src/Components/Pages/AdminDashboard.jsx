import React, { useState } from "react";
import { useSelector } from "react-redux";
import { DatePicker } from "antd";
import Sidebar from "../custom/Sidebar";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import { axiosInstance } from "../../HostManger/API/Authorization";
import Loader from "../custom/Loader";

export default function AdminDashboard({ toggle_open, toggle }) {
  const [slideOut, setSlideOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const userLog = useSelector((state) => state?.user?.user);
  const [loginActivity, setLoginActivity] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const getLoginActivityData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/login/activity/range?fromDate=${fromDate}&toDate=${toDate}&email=`,
      );
      if (response.status === 200) {
        setLoginActivity(response.data);
      }
    } catch (error) {
      setLoginActivity(null);
    } finally {
      setLoading(false);
    }
  };

  console.log("loginActivity==>", loginActivity);

  return (
    <React.Fragment>
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      {loading && <Loader />}
      <div className={`main_container ${slideOut ? "slide_animation" : ""}`}>
        <ThirdEyeHeader chl={userLog?.channel} />
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "10px",
            marginRight: "5px",
          }}>
          <DatePicker
            style={{ width: "100%" }}
            placeholder='From Date'
            onChange={(_, dateString) => setFromDate(dateString || null)}
          />
          <DatePicker
            style={{ width: "100%" }}
            placeholder='To Date'
            onChange={(_, dateString) => setToDate(dateString || null)}
          />
          <button className='CButton' onClick={getLoginActivityData}>
            Next
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
