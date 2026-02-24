import React, { useState, useEffect } from "react";
import Sidebar from "../Components/custom/Sidebar";
import Dashboard from "../Components/Pages/Dashboard";
import { useSelector, useDispatch } from "react-redux";
import { clearNewCityInputs } from "../redux/reducer/NewCity";

const DashboardMain = ({ toggle_open, toggle }) => {
  const dispatch = useDispatch();
  const [slideOut, setSlideOut] = useState(false);
  const userLog = useSelector((state) => state?.user?.user);
  const newStoreInputs = useSelector(
    (state) => state?.newStoreInputs?.newStoreInputs,
  );

  const dicisionData = useSelector(
    (state) => state?.newStoreInputs?.newStoreDecisiontext,
  );
  useEffect(() => {
    dispatch(clearNewCityInputs());
  });

  return (
    <React.Fragment>
      <Sidebar
        toggle_open={toggle_open}
        toggle={toggle}
        setSlideOut={setSlideOut}
      />
      <div className={`main_container ${slideOut ? "slide_animation" : ""}`}>
        <Dashboard
          userLog={userLog}
          newStore={newStoreInputs}
          slideOut={slideOut}
          setSlideOut={setSlideOut}
          dicisionData={dicisionData}
        />
      </div>
    </React.Fragment>
  );
};

export default DashboardMain;
