import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { menuItem } from "../Data/Data";
import Tippy from "@tippyjs/react";
import { HiOutlineLogout } from "react-icons/hi";
import { routes } from "../../routes";
import { logoutUser } from "../../redux/reducer/user";
import { useDispatch } from "react-redux";
import {
  clearNewCityInputs,
  setNewCityDecisiontext,
} from "../../redux/reducer/NewCity";
import {
  clearNewStoreInputs,
  setNewStoreDecisiontext,
} from "../../redux/reducer/NewStore";
import {
  clearClientSession,
  invalidateServerSession,
} from "../../HostManger/API/sessionLogout";

const Sidebar = ({ toggle_open, toggle, setSlideOut }) => {
  const sidebarRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [movementCount, setMovementCount] = useState(0);

  const auth_token = localStorage.getItem("3rd_eye_auth_token") === "true";

  useEffect(() => {
    const handleMouseMove = () => {
      setMovementCount((prev) => prev + 1);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggle_open(false);
      }
    };
    if (toggle) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggle, toggle_open]);

  const LogOutUser = async () => {
    await invalidateServerSession();
    clearClientSession();
    dispatch(logoutUser());
    dispatch(clearNewStoreInputs());
    dispatch(clearNewCityInputs());
    dispatch(setNewStoreDecisiontext());
    dispatch(setNewCityDecisiontext());
    setSlideOut(true);
    setTimeout(() => {
      navigate(routes.LOGIN, { replace: true });
    }, 700);
  };

  const HandelClickSlid = (e, path) => {
    e.preventDefault();
    if (path === pathname) return;
    setSlideOut(true);
    setTimeout(() => {
      if (auth_token && movementCount > 0) {
        navigate(path);
      } else {
        navigate(routes.LOGIN);
      }
    }, 700);
  };

  return (
    <div
      style={{ width: toggle ? "250px" : "60px" }}
      className='sidebar'
      ref={sidebarRef}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
        }}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 18px",
            }}>
            <FaBars
              onClick={toggle_open}
              style={{ cursor: "pointer" }}
              size={22}
            />
            {toggle && (
              <div style={{ flex: 1, textAlign: "center", fontWeight: "bold" }}>
                THIRD EYE
              </div>
            )}
          </div>
          {menuItem.map((item, i) => (
            <div key={i}>
              {toggle ? (
                <NavLink
                  to={(auth_token && item?.path) || routes.LOGIN}
                  onClick={(e) => HandelClickSlid(e, item.path)}
                  className={
                    item.path === pathname ? "active_tab" : "link_active"
                  }>
                  <div className='icon'>{item.icon}</div>
                  <div style={{ display: toggle ? "block" : "none" }}>
                    {item.name}
                  </div>
                </NavLink>
              ) : (
                <Tippy content={<span>{item.name}</span>} placement='right'>
                  <NavLink
                    key={i}
                    to={(auth_token && item?.path) || routes.LOGIN}
                    onClick={(e) => HandelClickSlid(e, item.path)}
                    className={
                      item.path === pathname ? "active_tab" : "link_active"
                    }>
                    <div className='icon'>{item.icon}</div>
                    <div style={{ display: toggle ? "block" : "none" }}>
                      {item.name}
                    </div>
                  </NavLink>
                </Tippy>
              )}
            </div>
          ))}
        </div>
        <div>
          {toggle ? (
            <button className='log_out_btn' onClick={LogOutUser}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                }}>
                <span>LOG OUT</span>
                <HiOutlineLogout size={17} />
              </div>
            </button>
          ) : (
            <Tippy content={<span>LOG OUT</span>} placement='right'>
              <button className='log_out_btn' onClick={LogOutUser}>
                <HiOutlineLogout size={22} />
              </button>
            </Tippy>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
