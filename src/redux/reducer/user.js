import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "../state/initialState";

const user = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    logoutUser(state) {
      state.user = null;
    },
  },
});

export const { setUser, logoutUser } = user.actions;

export default user.reducer;
