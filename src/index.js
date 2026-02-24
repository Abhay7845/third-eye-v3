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
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./Components/auth/AuthConfig";
import { store } from "../src/redux/store/store";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";

const root = ReactDOM.createRoot(document.getElementById("root"));
const GoogleKey = process.env.REACT_APP_GOOGLE_KEY;
const msalInstance = new PublicClientApplication(msalConfig);
root.render(
  <React.StrictMode>
    <LoadScript googleMapsApiKey={GoogleKey} libraries={GOOGLE_MAP_LIBRARIES}>
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

reportWebVitals();
