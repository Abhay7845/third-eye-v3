import React, { useMemo } from "react";
import titan_logo from "../Images/Titan_Logo_02.png";
import { useLocation } from "react-router-dom";
import { routes } from "../../routes";
import { IoPersonSharp } from "react-icons/io5";
import { useSelector } from "react-redux";
import { GetChannelLogo } from "../Data/ChannelLogo";

const LOGIN_TIME_KEY = "3rd_eye_login_time";

const ThirdEyeHeader = ({ city, chl, cityTier }) => {
  const { pathname } = useLocation();
  const userLog = useSelector((state) => state?.user?.user);

  const logo = GetChannelLogo(chl?.toLowerCase());

  const loginTimeText = useMemo(() => {
    const rawLoginTime =
      userLog?.loginTime || sessionStorage.getItem(LOGIN_TIME_KEY);
    if (!rawLoginTime) return "--";

    const parsedDate = new Date(rawLoginTime);
    if (Number.isNaN(parsedDate.getTime())) return "--";

    const datePart = parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    const timePart = parsedDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const normalizedTimePart = timePart.replace(/\b(am|pm)\b/i, (meridiem) =>
      meridiem.toUpperCase(),
    );

    return `${datePart}, ${normalizedTimePart}`;
  }, [userLog?.loginTime]);

  const pageTitle = useMemo(() => {
    switch (pathname) {
      case routes.NEW_STORE:
        return "New Store Existing City";
      case routes.NEW_STR_PROJECTION:
        return "New Store Existing City";
      case routes.DARK_CATCHMENT:
        return "White Spaces Analysis";
      case routes.NEW_CITY_EXPANSION:
        return "New City Expansion";
      case routes.NEW_CITY_PROJECTION:
        return "New City Expansion";
      case routes.HISTORY:
        return "Projection History";
      case routes.STORE_CATCHMENT_ANALYSIS:
        return "Store Catchment Analysis";
      case routes.ADMIN_LOGIN:
        return "Admin Dashboard";
      default:
        return "Page Not Found";
    }
  }, [pathname]);

  const projection_title = useMemo(() => {
    switch (pathname) {
      case routes.NEW_STR_PROJECTION:
        return "❯ Projection";
      case routes.NEW_CITY_PROJECTION:
        return "❯ Projection";
      default:
        return "";
    }
  }, [pathname]);

  return (
    <React.Fragment>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1.5px solid #233044",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}>
          {logo ? (
            <img src={logo} height={25} alt='logo' />
          ) : (
            <IoPersonSharp size={20} />
          )}

          {pathname === routes.NEW_STR_PROJECTION ||
          pathname === routes.NEW_CITY_PROJECTION ? (
            <div
              style={{
                position: "relative",
                marginLeft: "1%",
                color: "grey",
                fontWeight: "bolder",
                fontSize: "12px",
              }}>
              {projection_title}
            </div>
          ) : null}
          <span style={{ marginLeft: "6px", color: "gray", fontSize: "12px" }}>
            Login Time: {loginTimeText}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
            width: "100%",
          }}>
          <div style={{ color: "grey" }}>{pageTitle?.toUpperCase()}</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            width: "100%",
          }}>
          {pathname === routes.NEW_STR_PROJECTION && (
            <div
              style={{
                padding: "5px",
                textAlign: "center",
                marginRight: "6px",
              }}>
              <div style={{ color: "gray", fontSize: "14px" }}>
                Target Catchment City
              </div>
              <div style={{ fontSize: "12px", marginTop: "1%" }}>
                {city}, ({cityTier})
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "4px",
              marginRight: "5px",
              color: "gray",
            }}>
            <img src={titan_logo} style={{ height: "25px" }} alt='titan_logo' />
            <b style={{ fontSize: "12px" }}>
              {userLog?.name?.toUpperCase() || "User"}
            </b>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ThirdEyeHeader;
