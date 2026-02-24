import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "../state/initialState";

const newCity = createSlice({
  name: "newCityInputs",
  initialState,
  reducers: {
    setNewCityInputs(state, action) {
      state.newCityInputs = action.payload;
    },
    setNewCityDecisiontext(state, action) {
      state.newCityDecisiontext = action.payload;
    },
    clearNewCityInputs(state) {
      state.newCityInputs = null;
      state.newCityDecisiontext = null;
    },
  },
});

export const { setNewCityInputs, clearNewCityInputs, setNewCityDecisiontext } =
  newCity.actions;

export default newCity.reducer;
