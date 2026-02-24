import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "../state/initialState";

const newStore = createSlice({
  name: "newStoreInputs",
  initialState,
  reducers: {
    setNewStoreInputs(state, action) {
      state.newStoreInputs = action.payload;
    },
    setChatchmentData(state, action) {
      state.chatchmentData = action.payload;
    },
    setNewStoreDecisiontext(state, action) {
      state.newStoreDecisiontext = action.payload;
    },
    clearNewStoreInputs(state) {
      state.newStoreInputs = null;
      state.newStoreDecisiontext = null;
    },
  },
});

export const {
  setNewStoreInputs,
  clearNewStoreInputs,
  setChatchmentData,
  setNewStoreDecisiontext,
} = newStore.actions;

export default newStore.reducer;
