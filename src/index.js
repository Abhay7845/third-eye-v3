import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./App.css";
import "tippy.js/dist/tippy.css";
import "../src/Components/Styles/pdfCss/AndDesign/AntDesign.css";
import App from "./App";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";
import "react-super-responsive-table/dist/SuperResponsiveTableStyle.css";
import { LoadScript } from "@react-google-maps/api";
import { GOOGLE_MAP_LIBRARIES } from "./Components/Data/Data";
import { MsalProvider } from "@azure/msal-react";
import { initializeMsal, msalInstance } from "./Components/auth/AuthConfig";
import { store } from "../src/redux/store/store";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import AppLoader from "./Components/custom/AppLoader";

const root = ReactDOM.createRoot(document.getElementById("root"));

const prod_key = process.env.REACT_APP_GOOGLE_KEY_PROD;
const uat_key = process.env.REACT_APP_GOOGLE_KEY_UAT;
const GoogleKey = process.env.NODE_ENV === "development" ? uat_key : prod_key;

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <LoadScript
        googleMapsApiKey={GoogleKey}
        libraries={GOOGLE_MAP_LIBRARIES}
        loadingElement={<AppLoader />}>
        <MsalProvider instance={msalInstance}>
          <Provider store={store}>
            <BrowserRouter>
              <ToastContainer />
              <App />
            </BrowserRouter>
          </Provider>
        </MsalProvider>
      </LoadScript>
    </React.StrictMode>,
  );
};

initializeMsal()
  .then(renderApp)
  .catch(() => {
    renderApp();
  });

reportWebVitals();
