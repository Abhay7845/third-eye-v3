import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducer/user";
import newStoreReducer from "../reducer/NewStore";
import newCityReducer from "../reducer/NewCity";
import newStoreMapImg from "../reducer/MapImgStore";

const REDUX_STATE_KEY = "third_eye_redux_state";

const loadState = () => {
  try {
    const serializedState = localStorage.getItem(REDUX_STATE_KEY);
    if (!serializedState) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(REDUX_STATE_KEY, serializedState);
  } catch (error) {
    // Ignore storage write failures.
  }
};

export const store = configureStore({
  reducer: {
    user: userReducer,
    newStoreInputs: newStoreReducer,
    newCityInputs: newCityReducer,
    newStoreMapImg: newStoreMapImg,
  },
  preloadedState: loadState(),
});

store.subscribe(() => {
  saveState(store.getState());
});
