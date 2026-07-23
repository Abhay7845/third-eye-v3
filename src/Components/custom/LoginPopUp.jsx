import React from "react";
import "../Styles/LoginPopUp.css";
import { routes } from "../../routes";
import { useNavigate } from "react-router-dom";
import { setAuthRole } from "../../utils/authSession";

const LoginPopUp = ({ setVisiblePopup, visiblePopup, setSlideOut }) => {
  const navigate = useNavigate();

  const HandelPannelLogin = (route, role) => {
    setAuthRole(role);
    setVisiblePopup(false);
    setSlideOut(true);
    setTimeout(() => {
      navigate(route, { replace: true });
    }, 700);
  };

  return (
    <React.Fragment>
      {visiblePopup && (
        <div className='overlay'>
          <div className='popup'>
            <div
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "-5%",
              }}>
              <h2>Select Panel</h2>
              <button
                className='popup-close'
                onClick={() => setVisiblePopup(false)}
                aria-label='Close'
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}>
                &times;
              </button>
            </div>
            <div className='box-container'>
              <div className='panel-box store-box'>
                <h2>Store</h2>
                <p>Manage store operations</p>
                <button
                  onClick={() => HandelPannelLogin(routes.NEW_STORE, "store")}>
                  Store &rarr;
                </button>
              </div>

              <div className='panel-box admin-box'>
                <h2>Admin</h2>
                <p>Manage administration</p>
                <button
                  onClick={() =>
                    HandelPannelLogin(routes.ADMIN_LOGIN, "admin")
                  }>
                  Admin &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default LoginPopUp;
