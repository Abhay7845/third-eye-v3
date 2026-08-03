import { useEffect, useState } from "react";
import "../user/Login.css";
import Login_Image from "../../../asset/3rdeye.png";
import Mic_Icon from "../../Images/mic-icon.png";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { routes } from "../../../routes";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../HostManger/API/Authorization";
import { loginRequest } from "../../auth/AuthConfig";

// ---------------------------->   REDUX ----------------------------------------->
import { useDispatch } from "react-redux";
import { logoutUser, setUser } from "../../../redux/reducer/user";
import {
  clearNewStoreInputs,
  setNewStoreDecisiontext,
} from "../../../redux/reducer/NewStore";
import {
  clearNewCityInputs,
  setNewCityDecisiontext,
} from "../../../redux/reducer/NewCity";
import WorkTypingSound from "../../custom/WorkTypingSound";
import packageJson from "../../../../package.json";
import {
  isAuthSessionValid,
  startAuthSession,
  getAuthRole,
  setAuthRole,
} from "../../../utils/authSession";
import LoginPopUp from "../../custom/LoginPopUp";
const VERSION = packageJson.version;
const LOGIN_TIME_KEY = "3rd_eye_login_time";

export default function Login() {
  const dispatch = useDispatch();
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const [visiblePopup, setVisiblePopup] = useState(false);

  const navigate = useNavigate();
  const isDevMode = window.location.hostname === "localhost";

  const userEmailList = [
    "iteanzabhaykumar@titan.co.in",
    "iteanzdurgesh@titan.co.in",
    "mamathadl@titan.co.in",
    "gantalalitha@titan.co.in",
    "jewelry_analyst_2@titan.co.in",
  ];

  // Redirect away immediately if already authenticated — prevents browser
  // back/forward navigating back to the login page.
  useEffect(() => {
    if (isAuthSessionValid()) {
      const role = getAuthRole();
      navigate(role === "admin" ? routes.ADMIN_LOGIN : routes.NEW_STORE, {
        replace: true,
      });
    }
  }, [navigate]);

  const ClearUserDetails = () => {
    dispatch(logoutUser());
    dispatch(clearNewStoreInputs());
    dispatch(clearNewCityInputs());
    dispatch(setNewStoreDecisiontext());
    dispatch(setNewCityDecisiontext());
  };

  const GetUserLogin = (loginData) => {
    setLoading(true);
    axiosInstance
      .get(`/api/check/login/status?mailId=${loginData.username}`)
      .then((res) => res)
      .then((response) => {
        if (response.data.code === "1000") {
          if (response.data.value.accessStatus === "1") {
            const logRes = response.data.value;
            const loginTime = new Date().toISOString();
            sessionStorage.setItem(LOGIN_TIME_KEY, loginTime);
            const logCred = { ...logRes, ...loginData, loginTime };
            dispatch(setUser(logCred));
            if (userEmailList.includes(loginData.username)) {
              setVisiblePopup(true);
            } else {
              setAuthRole("store");
              setSlideOut(true);
              setTimeout(() => {
                navigate(routes.NEW_STORE, { replace: true });
              }, 700);
            }
          } else {
            toast.error("User Not Active", {
              theme: "colored",
              autoClose: 2000,
            });
          }
        } else {
          toast.error(response.data.value, {
            theme: "colored",
            autoClose: 5000,
          });
        }
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  // const url = isDevMode ? "/api/dummy/userinfo" : "/api/userinfo";
  const url = "/api/userinfo";

  const clearApplicationCache = async () => {
    localStorage.clear();
    sessionStorage.clear();

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cache) => caches.delete(cache)));
    }
  };

  const signInAndSeedAccount = async () => {
    const loginResponse = await instance.loginPopup({
      ...loginRequest,
      prompt: "select_account",
    });

    if (loginResponse?.account) {
      instance.setActiveAccount(loginResponse.account);
      return true;
    }

    const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (account) {
      instance.setActiveAccount(account);
      return true;
    }

    return false;
  };

  const LoginByAzzure = async (retry = true) => {
    try {
      setLoading(true);
      ClearUserDetails();

      await clearApplicationCache();
      const hasAccount =
        !!instance.getActiveAccount() || instance.getAllAccounts().length > 0;
      if (!hasAccount) {
        const didSignIn = await signInAndSeedAccount();
        if (!didSignIn) {
          toast.error("Microsoft sign-in failed", {
            theme: "colored",
            autoClose: 2000,
          });
          return;
        }
      }

      const response = await axiosInstance.get(url, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
        },
      });
      if (response?.data?.username) {
        startAuthSession();
        sessionStorage.removeItem("sso_redirect_in_progress");
        GetUserLogin(response.data);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 && retry && !isDevMode) {
        const didSignIn = await signInAndSeedAccount();
        if (didSignIn) {
          return LoginByAzzure(false);
        }
      }
      if (status === 401 && retry) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return LoginByAzzure(false);
      }
      if (status === 401) return;
      // SHOW ALERT FOR ALL OTHER ERRORS
      toast.error("Something went wrong", {
        theme: "colored",
        autoClose: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const sentence =
    "  Powerful retail analytics suite designed to help you make smarter, data-driven decisions.";
  return (
    <main className='auth-page'>
      <LoginPopUp
        setVisiblePopup={setVisiblePopup}
        visiblePopup={visiblePopup}
        setSlideOut={setSlideOut}
      />
      <section className={`auth-card ${slideOut ? "slide_animation" : ""}`}>
        <div className='form_side'>
          <h2>THIRD EYE...</h2>
          <div className='typing-wrapper'>
            <WorkTypingSound sentence={sentence} speed={60} />
          </div>
          <div className='divider'>
            <span>Login with</span>
          </div>
          <button
            className='google_btn'
            onClick={LoginByAzzure}
            disabled={loading}>
            <img src={Mic_Icon} alt='Mic_Icon' />
            {loading ? "Signing in..." : "Sign in with Microsoft"}
            {loading && <span className='loader'></span>}
          </button>
        </div>
        <div className='art_side'>
          <img
            src={Login_Image}
            alt='Login_Image'
            loading='lazy'
            className='third_eye_image'
          />
          <p className='footer_text'>
            &copy; {new Date().getFullYear()} Third Eye Portal, Version:{" "}
            {VERSION}
          </p>
        </div>
      </section>
    </main>
  );
}
