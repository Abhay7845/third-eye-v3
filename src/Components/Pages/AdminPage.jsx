import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DatePicker } from "antd";
import Sidebar from "../custom/Sidebar";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";
import { axiosInstance } from "../../HostManger/API/Authorization";
import Loader from "../custom/Loader";
import AdminDashboard from "../custom/AdminDashboard";

export default function AdminPage({ toggle_open, toggle }) {
  const [slideOut, setSlideOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const userLog = useSelector((state) => state?.user?.user);
  const [loginActivity, setLoginActivity] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showShadow, setShowShadow] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setShowShadow(true);
      } else {
        setShowShadow(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
            position: "sticky",
            top: "0px",
            zIndex: 1000,
            background: "#fff",
            padding: "10px 4px",
            transition: "box-shadow 0.3s ease",
            boxShadow: showShadow ? "2px 4px 10px #00000026" : "none",
            borderBottom: "1px solid #c7c3c3",
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
        <AdminDashboard data={loginActivity} />
      </div>
    </React.Fragment>
  );
}
