import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducer/user";
import newStoreReducer from "../reducer/NewStore";
import newCityReducer from "../reducer/NewCity";
import newStoreMapImg from "../reducer/MapImgStore";

export const store = configureStore({
  reducer: {
    user: userReducer,
    newStoreInputs: newStoreReducer,
    newCityInputs: newCityReducer,
    newStoreMapImg: newStoreMapImg,
  },
});
