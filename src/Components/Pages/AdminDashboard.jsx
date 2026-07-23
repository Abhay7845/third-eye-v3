import React, { useState } from "react";
import { useSelector } from "react-redux";
import Sidebar from "../custom/Sidebar";
import ThirdEyeHeader from "../custom/ThirdEyeHeader";

export default function AdminDashboard({ toggle_open, toggle }) {
  const [slideOut, setSlideOut] = useState(false);
  const userLog = useSelector((state) => state?.user?.user);

  return (
    <React.Fragment>
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      <div className={`main_container ${slideOut ? "slide_animation" : ""}`}>
        <ThirdEyeHeader chl={userLog?.channel} />
      </div>
    </React.Fragment>
  );
}
