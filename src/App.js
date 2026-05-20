import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { routes } from "./routes";
import DashboardMain from "./Mainpages/DashboardMain";
import DarkCatchmentAnl from "./Components/Pages/DarkCatchmentAnl";
import NewCityExpansion from "./Components/Pages/NewCityExpansion";
import Login from "./Components/Pages/user/Login";
import NewCityProjection from "./Components/Pages/NewCityProjection";
import PrivateAuth from "./Components/auth/PrivateAuth";
import NewStoreProjection from "./Components/Pages/NewStoreProjection";
import HistoryPreview from "./Components/Pages/HistoryPreview";
import StoreCatchmentAnalysis from "./Components/Pages/StoreCatchmentAnalysis";
import InternetStatus from "./Components/trackOnline/InternetStatus";

const App = () => {
  const [toggle, setToggle] = useState(false);
  const toggle_open = () => setToggle(!toggle);

  useEffect(() => {
    const handleUnload = () => {
      localStorage.clear();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    const is_logged_in = localStorage.getItem("3rd_eye_auth_token") === "true";
    if (is_logged_in) {
      alert("You are already logged in on another Tab.");
      localStorage.clear();
      setTimeout(() => {
        window.location.href = routes.LOGIN;
      }, 500);
    }
  }, []);

  return (
    <React.Fragment>
      <InternetStatus />
      <Routes>
        <Route
          path={routes.LOGIN}
          index
          element={<Login toggle_open={toggle_open} toggle={toggle} />}
        />
        <Route element={<PrivateAuth />}>
          <Route
            path={routes.NEW_STORE}
            element={
              <DashboardMain toggle_open={toggle_open} toggle={toggle} />
            }
          />
          <Route
            path={routes.NEW_CITY_EXPANSION}
            element={
              <NewCityExpansion toggle_open={toggle_open} toggle={toggle} />
            }
          />
          <Route
            path={routes.NEW_STR_PROJECTION}
            element={
              <NewStoreProjection toggle_open={toggle_open} toggle={toggle} />
            }
          />
          <Route
            path={routes.DARK_CATCHMENT}
            element={
              <DarkCatchmentAnl toggle_open={toggle_open} toggle={toggle} />
            }
          />
          <Route
            path={routes.STORE_CATCHMENT_ANALYSIS}
            element={
              <StoreCatchmentAnalysis
                toggle_open={toggle_open}
                toggle={toggle}
              />
            }
          />
          <Route
            path={routes.NEW_CITY_PROJECTION}
            element={
              <NewCityProjection toggle_open={toggle_open} toggle={toggle} />
            }
          />
          <Route
            path={routes.HISTORY}
            element={
              <HistoryPreview toggle_open={toggle_open} toggle={toggle} />
            }
          />
        </Route>
      </Routes>
    </React.Fragment>
  );
};

export default App;
