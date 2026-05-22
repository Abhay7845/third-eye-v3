import { useEffect, useState } from "react";
import "../user/Login.css";
import Login_Image from "../../../asset/3rdeye.png";
import Mic_Icon from "../../Images/mic-icon.png";
import { useNavigate } from "react-router-dom";
import { routes } from "../../../routes";
import { toast } from "react-toastify";
import { axiosInstance } from "../../../HostManger/API/Authorization";

// ---------------------------->   REDUX ----------------------------------------->
import { useDispatch } from "react-redux";
import { logoutUser, setUser } from "../../../redux/reducer/user";
import { HOST_URL } from "../../../HostManger/API/HostUrl";
import {
  clearNewStoreInputs,
  setNewStoreDecisiontext,
} from "../../../redux/reducer/NewStore";
import {
  clearNewCityInputs,
  setNewCityDecisiontext,
} from "../../../redux/reducer/NewCity";
import WorkTypingSound from "../../custom/WorkTypingSound";

export default function Login() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const navigate = useNavigate();
  const isDevMode = window.location.hostname === "localhost";

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
            const logCred = { ...logRes, ...loginData };
            dispatch(setUser(logCred));
            setSlideOut(true);
            setTimeout(() => {
              navigate(routes.NEW_STORE);
            }, 700);
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

  const url = isDevMode ? "/api/dummy/userinfo" : "/api/userinfo";
  // const LoginByAzzure = () => {
  //   setLoading(true);
  //   ClearUserDetails();
  //   axiosInstance
  //     .get(url)
  //     .then((res) => res)
  //     .then((response) => {
  //       if (response?.data?.username) {
  //         localStorage.setItem("3rd_eye_auth_token", true);
  //         GetUserLogin(response.data);
  //       }
  //     })
  //     .catch((err) => {
  //       if (err?.response?.status === 401) {
  //         setSlideOut(true);
  //         setTimeout(() => {
  //           sessionStorage.setItem("sso_redirect_in_progress", "true");
  //           window.location.href = `${HOST_URL}/oauth2/authorization/azure`;
  //         }, 700);
  //       }
  //       setLoading(false);
  //     });
  // };

  // const LoginByAzzure = async () => {
  //   try {
  //     setLoading(true);
  //     ClearUserDetails();
  //     const response = await axiosInstance.get(url, {
  //       withCredentials: true,
  //       headers: {
  //         Accept: "application/json",
  //       },
  //     });
  //     if (response?.data?.username) {
  //       localStorage.setItem("3rd_eye_auth_token", "true");
  //       sessionStorage.removeItem("sso_redirect_in_progress");
  //       GetUserLogin(response.data);
  //     }
  //   } catch (err) {
  //     if (err?.response?.status === 401) {
  //       const redirectInProgress = sessionStorage.getItem(
  //         "sso_redirect_in_progress",
  //       );
  //       if (!redirectInProgress) {
  //         sessionStorage.setItem("sso_redirect_in_progress", "true");
  //         setSlideOut(true);
  //         setTimeout(() => {
  //           window.location.href = `${HOST_URL}/oauth2/authorization/azure`;
  //         }, 700);
  //       }
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const LoginByAzzure = async (retry = true) => {
    try {
      setLoading(true);
      ClearUserDetails();
      const response = await axiosInstance.get(url, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
        },
      });
      if (response?.data?.username) {
        localStorage.setItem("3rd_eye_auth_token", "true");
        sessionStorage.removeItem("sso_redirect_in_progress");
        GetUserLogin(response.data);
      }
    } catch (err) {
      // RETRY SAME API ONE MORE TIME
      if (err?.response?.status === 401 && retry) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return LoginByAzzure(false);
      }
      // FINAL REDIRECT TO AZURE LOGIN
      if (err?.response?.status === 401) {
        const redirectInProgress = sessionStorage.getItem(
          "sso_redirect_in_progress",
        );
        if (!redirectInProgress) {
          sessionStorage.setItem("sso_redirect_in_progress", "true");
          setSlideOut(true);
          setTimeout(() => {
            window.location.replace(`${HOST_URL}/oauth2/authorization/azure`);
          }, 700);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.removeItem("sso_redirect_in_progress");
  }, []);

  const sentence =
    "  Powerful retail analytics suite designed to help you make smarter, data-driven decisions.";
  return (
    <main className='auth-page'>
      <section className={`auth-card ${slideOut ? "slide_animation" : ""}`}>
        <div className='form_side'>
          <h2>THIRD EYE...</h2>
          <WorkTypingSound sentence={sentence} speed={60} />
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
        </div>
      </section>
    </main>
  );
}
