import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { routes } from "./routes";
import DashboardMain from "./Mainpages/DashboardMain";
import DarkCatchmentAnl from "./Components/Pages/DarkCatchmentAnl";
import NewCityExpansion from "./Components/Pages/NewCityExpansion";
import Login from "./Components/Pages/user/Login";
import NewCityProjection from "./Components/Pages/NewCityProjection";
import PrivateAuth from "./Components/auth/PrivateAuth";
import RoleAuth from "./Components/auth/RoleAuth";
import NewStoreProjection from "./Components/Pages/NewStoreProjection";
import HistoryPreview from "./Components/Pages/HistoryPreview";
import StoreCatchmentAnalysis from "./Components/Pages/StoreCatchmentAnalysis";
import InternetStatus from "./Components/trackOnline/InternetStatus";
import CookieBanner from "./Components/custom/CookieBanner";
import AdminPage from "./Components/Pages/AdminPage";

const App = () => {
  const [toggle, setToggle] = useState(false);
  const toggle_open = () => setToggle(!toggle);

  return (
    <React.Fragment>
      <InternetStatus />
      <CookieBanner />
      <Routes>
        <Route path='/' element={<Navigate to={routes.LOGIN} replace />} />
        <Route
          path={routes.LOGIN}
          index
          element={<Login toggle_open={toggle_open} toggle={toggle} />}
        />
        <Route element={<PrivateAuth />}>
          {/* Store-only routes */}
          <Route element={<RoleAuth allowedRole='store' />}>
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
          <Route element={<RoleAuth allowedRole='admin' />}>
            <Route
              path={routes.ADMIN_LOGIN}
              element={<AdminPage toggle_open={toggle_open} toggle={toggle} />}
            />
          </Route>
        </Route>
        <Route path='*' element={<Navigate to={routes.LOGIN} replace />} />
      </Routes>
    </React.Fragment>
  );
};

export default App;
