import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "../state/initialState";

const mamImpSotre = createSlice({
  name: "newStoreMapImg",
  initialState,
  reducers: {
    setNewStoreMapImg(state, action) {
      state.newStoreMapImg = action.payload;
    },
  },
});

export const { setNewStoreMapImg } = mamImpSotre.actions;

export default mamImpSotre.reducer;
